import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { toLocalDateString } from '@/lib/dateUtils';

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

export const useIntimacyLog = (selectedDate?: Date) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingLog, setExistingLog] = useState<IntimacyLogData | null>(null);
  const [yesterdayRiskDetected, setYesterdayRiskDetected] = useState(false);

  const targetDate = selectedDate ? toLocalDateString(selectedDate) : toLocalDateString(new Date());
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadLogs = async () => {
      setLoading(true);
      try {
        // Load log for target date
        const { data: targetData, error: targetError } = await supabase
          .from('intimacy_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('log_date', targetDate)
          .maybeSingle();

        if (targetError) throw targetError;

        if (targetData) {
          setExistingLog({
            libido: targetData.libido || 2,
            fluid_type: targetData.fluid_type,
            sensation_emotional: targetData.sensation_emotional || [],
            sensation_physical: targetData.sensation_physical || [],
            symptoms: targetData.symptoms || [],
            activity_type: targetData.activity_type as 'solo' | 'partner' | null,
            is_protected: targetData.is_protected,
            pleasure_rating: targetData.pleasure_rating,
          });
        } else {
          setExistingLog(null);
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
  }, [user, targetDate, yesterday]);

  const saveLog = useCallback(async (data: IntimacyLogData, logDate?: Date) => {
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logada para salvar.',
        variant: 'destructive',
      });
      return false;
    }

    const dateToSave = logDate ? toLocalDateString(logDate) : targetDate;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('intimacy_logs')
        .upsert({
          user_id: user.id,
          log_date: dateToSave,
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
  }, [user, targetDate, toast]);

  return {
    existingLog,
    loading,
    saving,
    saveLog,
    isAuthenticated: !!user,
    yesterdayRiskDetected,
  };
};