import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCycle } from '@/contexts/CycleContext';

export interface CycleDataPoint {
  cycleDay: number;
  mood: number | null;
  energy: number | null;
  stress: number | null;
  symptoms: string[];
  cycleIndex: number; // 0 = current, 1 = previous, etc.
}

export const useCycleSymptomMap = (cyclesCount = 3) => {
  const { user } = useAuth();
  const { cycleLength, lastPeriodStart } = useCycle();
  const [data, setData] = useState<CycleDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [symptomFrequency, setSymptomFrequency] = useState<Record<string, number>>({});

  const fetchData = useCallback(async () => {
    if (!user || !lastPeriodStart) return;
    setLoading(true);

    try {
      const totalDays = cycleLength * cyclesCount;
      const startDate = new Date(lastPeriodStart);
      startDate.setDate(startDate.getDate() - (totalDays - cycleLength));

      const { data: logs, error } = await supabase
        .from('daily_logs')
        .select('log_date, mood, energy, stress, symptoms, cycle_phase')
        .eq('user_id', user.id)
        .gte('log_date', startDate.toISOString().split('T')[0])
        .order('log_date', { ascending: true });

      if (error) throw error;

      const dumDate = new Date(lastPeriodStart);
      const points: CycleDataPoint[] = [];
      const freqMap: Record<string, number> = {};

      for (const log of logs || []) {
        const logDate = new Date(log.log_date);
        const diffDays = Math.floor((logDate.getTime() - dumDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate which cycle this belongs to and the day within that cycle
        const cycleDay = ((diffDays % cycleLength) + cycleLength) % cycleLength + 1;
        const cycleIndex = Math.floor(-diffDays / cycleLength);

        if (cycleIndex >= 0 && cycleIndex < cyclesCount && cycleDay >= 1 && cycleDay <= cycleLength) {
          points.push({
            cycleDay,
            mood: log.mood,
            energy: log.energy,
            stress: log.stress,
            symptoms: log.symptoms || [],
            cycleIndex,
          });

          // Count symptom frequency
          (log.symptoms || []).forEach((s: string) => {
            freqMap[s] = (freqMap[s] || 0) + 1;
          });
        }
      }

      setData(points);
      setSymptomFrequency(freqMap);
    } catch (e) {
      console.error('Error fetching cycle symptom map:', e);
    } finally {
      setLoading(false);
    }
  }, [user, lastPeriodStart, cycleLength, cyclesCount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Aggregate data by cycle day (average across cycles)
  const aggregatedByDay = Array.from({ length: cycleLength }, (_, i) => {
    const day = i + 1;
    const dayPoints = data.filter(p => p.cycleDay === day);
    const avg = (arr: (number | null)[]) => {
      const valid = arr.filter((v): v is number => v !== null);
      return valid.length > 0 ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10 : null;
    };

    return {
      day,
      mood: avg(dayPoints.map(p => p.mood)),
      energy: avg(dayPoints.map(p => p.energy)),
      stress: avg(dayPoints.map(p => p.stress)),
      dataPoints: dayPoints.length,
    };
  });

  // Top symptoms
  const topSymptoms = Object.entries(symptomFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  return { data, aggregatedByDay, topSymptoms, loading, cycleLength };
};
