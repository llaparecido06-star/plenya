import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MealWithMood {
  id: string;
  meal_name: string | null;
  meal_type: string;
  intake_date: string;
  calories: number | null;
  mood: number | null;
  energy: number | null;
}

export const useRecentMealsWithMood = () => {
  const { user } = useAuth();
  const [mealsWithMood, setMealsWithMood] = useState<MealWithMood[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentMeals = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch recent meals (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: meals, error: mealsError } = await supabase
        .from('nutrition_intake')
        .select('id, meal_name, meal_type, intake_date, calories')
        .eq('user_id', user.id)
        .gte('intake_date', sevenDaysAgo.toISOString().split('T')[0])
        .order('intake_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

      if (mealsError) {
        console.error('[RecentMeals] Error fetching meals:', mealsError);
        setLoading(false);
        return;
      }

      if (!meals || meals.length === 0) {
        setMealsWithMood([]);
        setLoading(false);
        return;
      }

      // Get unique dates from meals
      const uniqueDates = [...new Set(meals.map((m) => m.intake_date))];

      // Fetch daily logs for those dates
      const { data: logs, error: logsError } = await supabase
        .from('daily_logs')
        .select('log_date, mood, energy')
        .eq('user_id', user.id)
        .in('log_date', uniqueDates);

      if (logsError) {
        console.error('[RecentMeals] Error fetching logs:', logsError);
      }

      // Create a map of date -> mood/energy
      const logMap = new Map<string, { mood: number | null; energy: number | null }>();
      logs?.forEach((log) => {
        logMap.set(log.log_date, { mood: log.mood, energy: log.energy });
      });

      // Combine meals with mood data
      const combined: MealWithMood[] = meals.map((meal) => ({
        ...meal,
        mood: logMap.get(meal.intake_date)?.mood ?? null,
        energy: logMap.get(meal.intake_date)?.energy ?? null,
      }));

      setMealsWithMood(combined);
    } catch (error) {
      console.error('[RecentMeals] Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecentMeals();
  }, [fetchRecentMeals]);

  return {
    mealsWithMood,
    loading,
    refresh: fetchRecentMeals,
  };
};
