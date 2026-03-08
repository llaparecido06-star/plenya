import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toLocalDateString } from '@/lib/dateUtils';

interface KickLog {
  id: string;
  log_date: string;
  kick_count: number;
  duration_seconds: number | null;
  notes: string | null;
}

export const useKickCounter = () => {
  const { user } = useAuth();
  const [todayLog, setTodayLog] = useState<KickLog | null>(null);
  const [history, setHistory] = useState<KickLog[]>([]);
  const [loading, setLoading] = useState(true);

  const today = toLocalDateString(new Date());

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from('kick_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .limit(30);

      if (data) {
        setHistory(data as KickLog[]);
        setTodayLog((data as KickLog[]).find(d => d.log_date === today) || null);
      }
    } finally {
      setLoading(false);
    }
  }, [user, today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addKick = async () => {
    if (!user) return;
    if (todayLog) {
      const { data } = await supabase
        .from('kick_logs')
        .update({ kick_count: todayLog.kick_count + 1 })
        .eq('id', todayLog.id)
        .select()
        .single();
      if (data) setTodayLog(data as KickLog);
    } else {
      const { data } = await supabase
        .from('kick_logs')
        .insert({ user_id: user.id, log_date: today, kick_count: 1 })
        .select()
        .single();
      if (data) setTodayLog(data as KickLog);
    }
    fetchData();
  };

  return { todayLog, history, loading, addKick };
};
