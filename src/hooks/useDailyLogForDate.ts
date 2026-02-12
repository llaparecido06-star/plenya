import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCycle } from '@/contexts/CycleContext';
import { useToast } from '@/hooks/use-toast';
import { toLocalDateString } from '@/lib/dateUtils';

interface DailyLogData {
  symptoms: string[];
  mood: number | null;
  energy: number | null;
  stress: number | null;
  weight: number | null;
}

export const useDailyLogForDate = (date: Date) => {
  const { user } = useAuth();
  const { getPhaseByDay, lastPeriodStart } = useCycle();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<DailyLogData>({
    symptoms: [],
    mood: null,
    energy: null,
    stress: null,
    weight: null,
  });

  const dateStr = toLocalDateString(date);

  // Calculate cycle phase for the given date
  const getPhaseForDate = useCallback(() => {
    if (!lastPeriodStart) return 'folicular' as const;
    const diffDays = Math.floor((date.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const day = Math.max(1, diffDays);
    return getPhaseByDay(day);
  }, [date, lastPeriodStart, getPhaseByDay]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadLog = async () => {
      setLoading(true);
      try {
        const { data: log, error } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('log_date', dateStr)
          .maybeSingle();

        if (error) throw error;

        if (log) {
          setData({
            symptoms: log.symptoms || [],
            mood: log.mood,
            energy: log.energy,
            stress: log.stress,
            weight: log.weight ? Number(log.weight) : null,
          });
        } else {
          setData({ symptoms: [], mood: null, energy: null, stress: null, weight: null });
        }
      } catch (error) {
        console.error('Error loading daily log for date:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLog();
  }, [user, dateStr]);

  const saveLog = useCallback(async (updates: Partial<DailyLogData>) => {
    if (!user) return false;

    setSaving(true);
    try {
      const newData = { ...data, ...updates };
      const phase = getPhaseForDate();

      const { error } = await supabase
        .from('daily_logs')
        .upsert({
          user_id: user.id,
          log_date: dateStr,
          cycle_phase: phase,
          symptoms: newData.symptoms,
          mood: newData.mood,
          energy: newData.energy,
          stress: newData.stress,
          weight: newData.weight,
        }, {
          onConflict: 'user_id,log_date',
        });

      if (error) throw error;

      setData(newData);
      toast({ title: 'Salvo! ✨', description: 'Registro salvo com sucesso.' });
      return true;
    } catch (error: any) {
      toast({ title: 'Erro', description: error?.message || 'Não foi possível salvar.', variant: 'destructive' });
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, data, dateStr, getPhaseForDate, toast]);

  return { data, loading, saving, saveLog, isAuthenticated: !!user };
};
