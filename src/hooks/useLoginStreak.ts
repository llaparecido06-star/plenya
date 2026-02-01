import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, differenceInDays, parseISO } from 'date-fns';

interface LoginStreakData {
  streak: number;
  totalDays: number;
  loading: boolean;
}

export const useLoginStreak = (): LoginStreakData => {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [loading, setLoading] = useState(true);

  const registerLogin = useCallback(async () => {
    if (!user) return;

    const today = format(new Date(), 'yyyy-MM-dd');

    try {
      // Try to insert today's login (will fail silently if already exists due to UNIQUE constraint)
      await supabase
        .from('login_streaks')
        .upsert(
          { user_id: user.id, login_date: today },
          { onConflict: 'user_id,login_date', ignoreDuplicates: true }
        );
    } catch (err) {
      console.error('Error registering login:', err);
    }
  }, [user]);

  const calculateStreak = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get all login dates for the user, ordered by date descending
      const { data: logins, error } = await supabase
        .from('login_streaks')
        .select('login_date')
        .eq('user_id', user.id)
        .order('login_date', { ascending: false });

      if (error) {
        console.error('Error fetching login streaks:', error);
        setLoading(false);
        return;
      }

      if (!logins || logins.length === 0) {
        setStreak(0);
        setTotalDays(0);
        setLoading(false);
        return;
      }

      // Set total days
      setTotalDays(logins.length);

      // Calculate consecutive streak from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let currentStreak = 0;
      let checkDate = today;

      for (let i = 0; i < logins.length; i++) {
        const loginDate = parseISO(logins[i].login_date);
        loginDate.setHours(0, 0, 0, 0);
        
        const daysDiff = differenceInDays(checkDate, loginDate);

        if (daysDiff === 0) {
          // This login matches the expected date
          currentStreak++;
          checkDate = subDays(checkDate, 1);
        } else if (daysDiff === 1 && i === 0) {
          // First login is yesterday, still count as streak start
          checkDate = loginDate;
          currentStreak++;
          checkDate = subDays(checkDate, 1);
        } else {
          // Gap in streak, stop counting
          break;
        }
      }

      setStreak(currentStreak);
    } catch (err) {
      console.error('Error calculating streak:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const init = async () => {
      await registerLogin();
      await calculateStreak();
    };

    if (user) {
      init();
    } else {
      setLoading(false);
    }
  }, [user, registerLogin, calculateStreak]);

  return { streak, totalDays, loading };
};
