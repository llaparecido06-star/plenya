import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { toLocalDateString } from '@/lib/dateUtils';

interface MenstruationEntry {
  log_date: string;
  is_menstruating: boolean;
  emergency_contraception: boolean;
}

export const useMenstruationLog = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [menstruationDates, setMenstruationDates] = useState<string[]>([]);
  const [emergencyContraceptionDates, setEmergencyContraceptionDates] = useState<string[]>([]);

  // Fetch all menstruation logs
  const fetchLogs = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data, error } = await supabase
        .from('menstruation_logs')
        .select('log_date, is_menstruating, emergency_contraception')
        .eq('user_id', user.id)
        .gte('log_date', toLocalDateString(threeMonthsAgo));

      if (error) throw error;

      if (data) {
        const mensDates = data
          .filter(entry => entry.is_menstruating)
          .map(entry => entry.log_date);
        setMenstruationDates(mensDates);

        const ecDates = data
          .filter(entry => entry.emergency_contraception)
          .map(entry => entry.log_date);
        setEmergencyContraceptionDates(ecDates);
      }
    } catch (error) {
      console.error('Error fetching menstruation logs:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Sync DUM based on manual menstruation logs
  // Finds the first day of the most recent menstruation period
  const syncDUMFromManualLogs = useCallback(async (newDateStr?: string) => {
    if (!user) return;

    try {
      // Get all menstruation dates including the new one
      const allDates = newDateStr 
        ? [...menstruationDates, newDateStr].sort()
        : [...menstruationDates].sort();

      if (allDates.length === 0) return;

      // Find the most recent continuous period (group consecutive days)
      const sortedDatesDesc = allDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      
      // Start from the most recent date and find the first day of that period
      let currentPeriodStart = sortedDatesDesc[0];
      let currentDate = new Date(sortedDatesDesc[0]);

      for (let i = 1; i < sortedDatesDesc.length; i++) {
        const prevDate = new Date(sortedDatesDesc[i]);
        const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // If consecutive (within 1 day), update the period start
        if (diffDays <= 1) {
          currentPeriodStart = sortedDatesDesc[i];
          currentDate = prevDate;
        } else {
          // Gap found, stop looking
          break;
        }
      }

      // Update profile with new DUM
      const { error } = await supabase
        .from('profiles')
        .update({ last_period_start: currentPeriodStart })
        .eq('user_id', user.id);

      if (error) throw error;

      // Dispatch event to refresh cycle context
      window.dispatchEvent(new CustomEvent('dum-synced', { detail: { date: currentPeriodStart } }));
      
      console.log('[MenstruationLog] DUM synced to:', currentPeriodStart);
    } catch (error) {
      console.error('Error syncing DUM:', error);
    }
  }, [user, menstruationDates]);
  const toggleMenstruation = useCallback(async (date: Date): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logada para registrar.',
        variant: 'destructive',
      });
      return false;
    }

    const dateStr = toLocalDateString(date);
    const isCurrentlyMenstruating = menstruationDates.includes(dateStr);

    try {
      if (isCurrentlyMenstruating) {
        // Remove the entry
        const { error } = await supabase
          .from('menstruation_logs')
          .delete()
          .eq('user_id', user.id)
          .eq('log_date', dateStr);

        if (error) throw error;

        setMenstruationDates(prev => prev.filter(d => d !== dateStr));
        toast({
          title: 'Menstruação removida',
          description: `Dia ${date.getDate()} desmarcado.`,
        });
      } else {
        // Add entry
        const { error } = await supabase
          .from('menstruation_logs')
          .upsert({
            user_id: user.id,
            log_date: dateStr,
            is_menstruating: true,
            emergency_contraception: false,
          }, {
            onConflict: 'user_id,log_date'
          });

        if (error) throw error;

        setMenstruationDates(prev => [...prev, dateStr]);
        
        // Sync DUM - update profile with the earliest menstruation date in current period
        await syncDUMFromManualLogs(dateStr);
        
        toast({
          title: 'Menstruação registrada 🩸',
          description: `Dia ${date.getDate()} marcado. DUM sincronizada automaticamente.`,
        });
      }

      // Dispatch event to refresh calendar
      window.dispatchEvent(new CustomEvent('menstruation-log-updated'));
      return true;
    } catch (error) {
      console.error('Error toggling menstruation:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o registro.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, menstruationDates, toast]);

  // Log emergency contraception (morning after pill)
  const logEmergencyContraception = useCallback(async (date: Date): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logada para registrar.',
        variant: 'destructive',
      });
      return false;
    }

    const dateStr = toLocalDateString(date);

    try {
      const { error } = await supabase
        .from('menstruation_logs')
        .upsert({
          user_id: user.id,
          log_date: dateStr,
          is_menstruating: false,
          emergency_contraception: true,
        }, {
          onConflict: 'user_id,log_date'
        });

      if (error) throw error;

      setEmergencyContraceptionDates(prev => 
        prev.includes(dateStr) ? prev : [...prev, dateStr]
      );

      toast({
        title: 'Pílula do Dia Seguinte registrada 💊',
        description: 'A previsão da próxima menstruação foi ajustada (+7 dias).',
      });

      // Dispatch event to refresh predictions
      window.dispatchEvent(new CustomEvent('emergency-contraception-logged'));
      return true;
    } catch (error) {
      console.error('Error logging emergency contraception:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  // Check if a date is marked as menstruation
  const isMenstruating = useCallback((date: Date): boolean => {
    const dateStr = toLocalDateString(date);
    return menstruationDates.includes(dateStr);
  }, [menstruationDates]);

  // Get the most recent emergency contraception date for prediction adjustment
  const getMostRecentEmergencyContraception = useCallback((): Date | null => {
    if (emergencyContraceptionDates.length === 0) return null;
    
    const sorted = [...emergencyContraceptionDates].sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
    
    return new Date(sorted[0]);
  }, [emergencyContraceptionDates]);

  return {
    loading,
    menstruationDates,
    emergencyContraceptionDates,
    toggleMenstruation,
    logEmergencyContraception,
    isMenstruating,
    getMostRecentEmergencyContraception,
    refetch: fetchLogs,
  };
};
