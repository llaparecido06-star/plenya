import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSelectedDate } from '@/contexts/SelectedDateContext';

interface DailyLog {
  id: string;
  log_date: string;
  mood: number | null;
  energy: number | null;
  stress: number | null;
  symptoms: string[] | null;
  weight: number | null;
  cycle_phase: string | null;
}

interface MealEntry {
  id: string;
  meal_type: string;
  meal_name: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  intake_date: string;
}

interface WorkoutEntry {
  id: string;
  workout_type: string;
  workout_name: string;
  completed: boolean | null;
  duration_minutes: number | null;
  workout_date: string;
}

interface HistoricalDataResult {
  dailyLog: DailyLog | null;
  meals: MealEntry[];
  workout: WorkoutEntry | null;
  loading: boolean;
  datesWithData: string[];
  refreshData: () => Promise<void>;
}

export const useHistoricalData = (): HistoricalDataResult => {
  const { user } = useAuth();
  const { selectedDate, formatDate } = useSelectedDate();
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [workout, setWorkout] = useState<WorkoutEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [datesWithData, setDatesWithData] = useState<string[]>([]);

  const dateStr = formatDate(selectedDate);

  // Fetch all dates that have data (for calendar highlighting)
  const fetchDatesWithData = useCallback(async () => {
    if (!user) return;

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 60);

      const [logsResult, mealsResult, workoutsResult] = await Promise.all([
        supabase
          .from('daily_logs')
          .select('log_date')
          .eq('user_id', user.id)
          .gte('log_date', thirtyDaysAgo.toISOString().split('T')[0]),
        supabase
          .from('nutrition_intake')
          .select('intake_date')
          .eq('user_id', user.id)
          .gte('intake_date', thirtyDaysAgo.toISOString().split('T')[0]),
        supabase
          .from('workouts')
          .select('workout_date')
          .eq('user_id', user.id)
          .gte('workout_date', thirtyDaysAgo.toISOString().split('T')[0]),
      ]);

      const allDates = new Set<string>();
      
      logsResult.data?.forEach((log) => allDates.add(log.log_date));
      mealsResult.data?.forEach((meal) => allDates.add(meal.intake_date));
      workoutsResult.data?.forEach((workout) => allDates.add(workout.workout_date));

      setDatesWithData(Array.from(allDates));
    } catch (error) {
      console.error('[HistoricalData] Error fetching dates with data:', error);
    }
  }, [user]);

  // Fetch data for selected date
  const fetchDataForDate = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [logResult, mealsResult, workoutResult] = await Promise.all([
        supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('log_date', dateStr)
          .maybeSingle(),
        supabase
          .from('nutrition_intake')
          .select('*')
          .eq('user_id', user.id)
          .eq('intake_date', dateStr)
          .order('created_at', { ascending: true }),
        supabase
          .from('workouts')
          .select('*')
          .eq('user_id', user.id)
          .eq('workout_date', dateStr)
          .maybeSingle(),
      ]);

      if (logResult.error) console.error('[HistoricalData] Log error:', logResult.error);
      if (mealsResult.error) console.error('[HistoricalData] Meals error:', mealsResult.error);
      if (workoutResult.error) console.error('[HistoricalData] Workout error:', workoutResult.error);

      setDailyLog(logResult.data);
      setMeals(mealsResult.data || []);
      setWorkout(workoutResult.data);
    } catch (error) {
      console.error('[HistoricalData] Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, dateStr]);

  const refreshData = useCallback(async () => {
    await Promise.all([fetchDataForDate(), fetchDatesWithData()]);
  }, [fetchDataForDate, fetchDatesWithData]);

  useEffect(() => {
    fetchDataForDate();
  }, [fetchDataForDate]);

  useEffect(() => {
    fetchDatesWithData();
  }, [fetchDatesWithData]);

  return {
    dailyLog,
    meals,
    workout,
    loading,
    datesWithData,
    refreshData,
  };
};
