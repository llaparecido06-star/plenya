import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCycle } from '@/contexts/CycleContext';
import { useToast } from '@/hooks/use-toast';

interface DailyLogData {
  symptoms: string[];
  mood: number | null;
  energy: number | null;
  stress: number | null;
  weight: number | null;
}

export const useDailyLog = () => {
  const { user } = useAuth();
  const { currentPhase } = useCycle();
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

  const today = new Date().toISOString().split('T')[0];

  // Load today's log on mount
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadTodayLog = async () => {
      try {
        const { data: log, error } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('log_date', today)
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
        }
      } catch (error) {
        console.error('Error loading daily log:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTodayLog();
  }, [user, today]);

  const saveLog = useCallback(async (updates: Partial<DailyLogData>) => {
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logada para salvar registros.',
        variant: 'destructive',
      });
      return false;
    }

    setSaving(true);
    try {
      const newData = { ...data, ...updates };
      
      const { error } = await supabase
        .from('daily_logs')
        .upsert({
          user_id: user.id,
          log_date: today,
          cycle_phase: currentPhase,
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
      toast({
        title: 'Salvo! ✨',
        description: 'Seu registro foi salvo com sucesso.',
      });
      return true;
    } catch (error) {
      console.error('Error saving daily log:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o registro.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, data, today, currentPhase, toast]);

  return {
    data,
    loading,
    saving,
    saveLog,
    isAuthenticated: !!user,
  };
};
