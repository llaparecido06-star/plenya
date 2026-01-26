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
  const [yesterdayRiskDetected, setYesterdayRiskDetected] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadLogs = async () => {
      try {
        // Load today's log
        const { data: todayData, error: todayError } = await supabase
          .from('intimacy_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('log_date', today)
          .maybeSingle();

        if (todayError) throw todayError;

        if (todayData) {
          setExistingLog({
            libido: todayData.libido || 2,
            fluid_type: todayData.fluid_type,
            sensation_emotional: todayData.sensation_emotional || [],
            sensation_physical: todayData.sensation_physical || [],
            symptoms: todayData.symptoms || [],
            activity_type: todayData.activity_type as 'solo' | 'partner' | null,
            is_protected: todayData.is_protected,
            pleasure_rating: todayData.pleasure_rating,
          });
        }

        // Check yesterday's log for risk detection
        const { data: yesterdayData, error: yesterdayError } = await supabase
          .from('intimacy_logs')
          .select('sensation_physical, is_protected')
          .eq('user_id', user.id)
          .eq('log_date', yesterday)
          .maybeSingle();

        if (!yesterdayError && yesterdayData) {
          const physicalTags = yesterdayData.sensation_physical || [];
          const wasUnprotected = physicalTags.includes('unprotected') || 
                                 physicalTags.includes('withdrawal');
          const hadPenetrativeActivity = physicalTags.includes('vaginal');
          
          // Check if user was in fertile window yesterday (approximation)
          // This would need cycle context, but we approximate based on is_protected flag
          if (wasUnprotected && hadPenetrativeActivity && !yesterdayData.is_protected) {
            setYesterdayRiskDetected(true);
          }
        }
      } catch (error) {
        console.error('Error loading intimacy log:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [user, today, yesterday]);

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
    yesterdayRiskDetected,
  };
};
