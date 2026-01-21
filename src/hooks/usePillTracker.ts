import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PillLogData {
  taken_at: string | null;
  skipped: boolean;
}

export const usePillTracker = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [todayLog, setTodayLog] = useState<PillLogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [streak, setStreak] = useState(0);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch today's pill log and calculate streak
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch today's log
        const { data: log, error } = await supabase
          .from('pill_logs')
          .select('taken_at, skipped')
          .eq('user_id', user.id)
          .eq('log_date', today)
          .maybeSingle();

        if (error) {
          console.error('Error fetching pill log:', error);
        } else if (log) {
          setTodayLog({
            taken_at: log.taken_at as string | null,
            skipped: log.skipped as boolean,
          });
        }

        // Calculate streak (consecutive days taken)
        const { data: logs, error: streakError } = await supabase
          .from('pill_logs')
          .select('log_date, taken_at, skipped')
          .eq('user_id', user.id)
          .order('log_date', { ascending: false })
          .limit(30);

        if (!streakError && logs) {
          let currentStreak = 0;
          const sortedLogs = logs as { log_date: string; taken_at: string | null; skipped: boolean }[];
          
          for (const l of sortedLogs) {
            if (l.taken_at && !l.skipped) {
              currentStreak++;
            } else {
              break;
            }
          }
          setStreak(currentStreak);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, today]);

  // Mark pill as taken
  const markAsTaken = useCallback(async () => {
    if (!user) return false;

    setSaving(true);

    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('pill_logs')
        .upsert({
          user_id: user.id,
          log_date: today,
          taken_at: now,
          skipped: false,
        }, {
          onConflict: 'user_id,log_date',
        });

      if (error) {
        console.error('Error marking pill as taken:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível registrar.',
          variant: 'destructive',
        });
        return false;
      }

      setTodayLog({ taken_at: now, skipped: false });
      setStreak(prev => prev + 1);

      toast({
        title: 'Protegida! ✅',
        description: 'Pílula do dia registrada.',
      });

      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, today, toast]);

  // Mark pill as skipped
  const markAsSkipped = useCallback(async () => {
    if (!user) return false;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('pill_logs')
        .upsert({
          user_id: user.id,
          log_date: today,
          taken_at: null,
          skipped: true,
        }, {
          onConflict: 'user_id,log_date',
        });

      if (error) {
        console.error('Error marking pill as skipped:', error);
        return false;
      }

      setTodayLog({ taken_at: null, skipped: true });
      setStreak(0);

      toast({
        title: 'Pílula pulada',
        description: 'Lembre-se de tomar amanhã!',
        variant: 'destructive',
      });

      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, today, toast]);

  // Undo today's log
  const undoLog = useCallback(async () => {
    if (!user) return false;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('pill_logs')
        .delete()
        .eq('user_id', user.id)
        .eq('log_date', today);

      if (error) {
        console.error('Error undoing pill log:', error);
        return false;
      }

      setTodayLog(null);
      
      toast({
        title: 'Registro removido',
        description: 'Você pode registrar novamente.',
      });

      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, today, toast]);

  return {
    todayLog,
    hasTakenToday: todayLog?.taken_at !== null && !todayLog?.skipped,
    hasSkippedToday: todayLog?.skipped === true,
    streak,
    loading,
    saving,
    markAsTaken,
    markAsSkipped,
    undoLog,
    isAuthenticated: !!user,
  };
};
