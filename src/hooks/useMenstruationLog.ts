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

  // Toggle menstruation for a specific date
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
        toast({
          title: 'Menstruação registrada 🩸',
          description: `Dia ${date.getDate()} marcado como menstruação.`,
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
