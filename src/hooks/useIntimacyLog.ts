import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface IntimacyLogData {
  libido: number;
  fluid_type: string | null;
  sensation_emotional: string[];
  sensation_physical: string[];
  symptoms: string[];
  activity_type: 'solo' | 'partner' | null;
  is_protected: boolean | null;
  pleasure_rating: number | null;
}

export const useIntimacyLog = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingLog, setExistingLog] = useState<IntimacyLogData | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadTodayLog = async () => {
      try {
        const { data, error } = await supabase
          .from('intimacy_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('log_date', today)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setExistingLog({
            libido: data.libido || 2,
            fluid_type: data.fluid_type,
            sensation_emotional: data.sensation_emotional || [],
            sensation_physical: data.sensation_physical || [],
            symptoms: data.symptoms || [],
            activity_type: data.activity_type as 'solo' | 'partner' | null,
            is_protected: data.is_protected,
            pleasure_rating: data.pleasure_rating,
          });
        }
      } catch (error) {
        console.error('Error loading intimacy log:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTodayLog();
  }, [user, today]);

  const saveLog = useCallback(async (data: IntimacyLogData) => {
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logada para salvar.',
        variant: 'destructive',
      });
      return false;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('intimacy_logs')
        .upsert({
          user_id: user.id,
          log_date: today,
          libido: data.libido,
          fluid_type: data.fluid_type,
          sensation_emotional: data.sensation_emotional,
          sensation_physical: data.sensation_physical,
          symptoms: data.symptoms,
          activity_type: data.activity_type,
          is_protected: data.is_protected,
          pleasure_rating: data.pleasure_rating,
        }, {
          onConflict: 'user_id,log_date'
        });

      if (error) throw error;

      setExistingLog(data);
      toast({
        title: 'Diário íntimo atualizado! 💜',
        description: 'Seus dados foram salvos com segurança.',
      });
      return true;
    } catch (error) {
      console.error('Error saving intimacy log:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o diário.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, today, toast]);

  return {
    existingLog,
    loading,
    saving,
    saveLog,
    isAuthenticated: !!user,
  };
};
