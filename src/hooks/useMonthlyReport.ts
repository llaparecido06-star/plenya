import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCycle } from '@/contexts/CycleContext';
import { subDays, format, differenceInDays } from 'date-fns';

interface MonthlyReport {
  summary: string;
  patterns: string[];
  correlations: string[];
  recommendations: string[];
  nextCycleTip: string;
  wellnessScore: number;
}

interface SavedReport {
  id: string;
  report_date: string;
  cycle_start_date: string;
  cycle_end_date: string;
  wellness_score: number;
  summary: string;
  patterns: string[];
  correlations: string[];
  recommendations: string[];
  next_cycle_tip: string | null;
  avg_mood: number | null;
  avg_energy: number | null;
  avg_stress: number | null;
  top_symptoms: string[];
  total_logs: number;
  period_days: number;
  created_at: string;
}

export const useMonthlyReport = () => {
  const { user } = useAuth();
  const { cycleLength, lastPeriodStart, cycleDay } = useCycle();
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load saved reports history
  const loadSavedReports = useCallback(async () => {
    if (!user) return;
    
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('monthly_reports' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('report_date', { ascending: false })
        .limit(6);

      if (error) throw error;
      setSavedReports((data as any[]) || []);
    } catch (err) {
      console.error('Error loading saved reports:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    loadSavedReports();
  }, [loadSavedReports]);

  const generateReport = useCallback(async () => {
    if (!user || !lastPeriodStart) return;

    setLoading(true);
    try {
      // Fetch last cycle's daily logs
      const cycleStart = format(lastPeriodStart, 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data: logs } = await supabase
        .from('daily_logs')
        .select('log_date, mood, energy, stress, symptoms')
        .eq('user_id', user.id)
        .gte('log_date', cycleStart)
        .lte('log_date', today)
        .order('log_date', { ascending: true });

      const { data: menstruation } = await supabase
        .from('menstruation_logs')
        .select('log_date, is_menstruating')
        .eq('user_id', user.id)
        .gte('log_date', cycleStart)
        .eq('is_menstruating', true);

      if (!logs || logs.length === 0) {
        setLoading(false);
        return;
      }

      // Compute averages
      const moodVals = logs.filter(l => l.mood).map(l => l.mood!);
      const energyVals = logs.filter(l => l.energy).map(l => l.energy!);
      const stressVals = logs.filter(l => l.stress).map(l => l.stress!);
      const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      const allSymptoms: string[] = logs.flatMap(l => l.symptoms || []);
      const symptomCounts: Record<string, number> = {};
      allSymptoms.forEach(s => { symptomCounts[s] = (symptomCounts[s] || 0) + 1; });
      const topSymptoms = Object.entries(symptomCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([s]) => s);

      const payload = {
        cycle_day: cycleDay,
        cycle_length: cycleLength,
        phase: 'lutea',
        avg_mood: Math.round(avg(moodVals) * 10) / 10,
        avg_energy: Math.round(avg(energyVals) * 10) / 10,
        avg_stress: Math.round(avg(stressVals) * 10) / 10,
        top_symptoms: topSymptoms,
        total_logs: logs.length,
        period_days: menstruation?.length || 0,
      };

      const { data, error } = await supabase.functions.invoke('plenya-ai-brain', {
        body: { mode: 'monthly_report', payload, language: 'pt' },
      });

      if (error) throw error;

      if (data?.report) {
        const newReport = data.report;
        setReport(newReport);
        setGenerated(true);

        // Save report to database
        const cycleEndDate = new Date(lastPeriodStart);
        cycleEndDate.setDate(cycleEndDate.getDate() + cycleLength - 1);

        await supabase.from('monthly_reports' as any).insert({
          user_id: user.id,
          report_date: today,
          cycle_start_date: cycleStart,
          cycle_end_date: format(cycleEndDate, 'yyyy-MM-dd'),
          wellness_score: newReport.wellnessScore,
          summary: newReport.summary,
          patterns: newReport.patterns,
          correlations: newReport.correlations,
          recommendations: newReport.recommendations,
          next_cycle_tip: newReport.nextCycleTip,
          avg_mood: payload.avg_mood,
          avg_energy: payload.avg_energy,
          avg_stress: payload.avg_stress,
          top_symptoms: topSymptoms,
          total_logs: logs.length,
          period_days: menstruation?.length || 0,
        } as any);

        // Reload history
        await loadSavedReports();
      }
    } catch (err) {
      console.error('Error generating monthly report:', err);
    } finally {
      setLoading(false);
    }
  }, [user, cycleLength, lastPeriodStart, cycleDay, loadSavedReports]);

  const deleteReport = useCallback(async (reportId: string) => {
    try {
      await supabase.from('monthly_reports' as any).delete().eq('id', reportId);
      await loadSavedReports();
    } catch (err) {
      console.error('Error deleting report:', err);
    }
  }, [loadSavedReports]);

  return { 
    report, 
    loading, 
    generated, 
    generateReport, 
    savedReports, 
    loadingHistory,
    deleteReport,
    refreshHistory: loadSavedReports
  };
};
