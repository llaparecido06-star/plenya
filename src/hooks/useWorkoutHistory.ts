import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type WorkoutType = Database['public']['Enums']['workout_type'];

interface WorkoutSummary {
  id: string;
  workout_date: string;
  workout_name: string;
  workout_type: WorkoutType;
  completed: boolean;
  duration_minutes: number | null;
  exercises_count: number;
}

export const useWorkoutHistory = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [workoutDates, setWorkoutDates] = useState<string[]>([]);

  const fetchWorkouts = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const { data, error } = await supabase
        .from('workouts')
        .select('id, workout_date, workout_name, workout_type, completed, duration_minutes, exercises')
        .eq('user_id', user.id)
        .gte('workout_date', sixtyDaysAgo.toISOString().split('T')[0])
        .order('workout_date', { ascending: false });

      if (error) throw error;

      const summaries: WorkoutSummary[] = (data || []).map(w => ({
        id: w.id,
        workout_date: w.workout_date,
        workout_name: w.workout_name,
        workout_type: w.workout_type,
        completed: w.completed || false,
        duration_minutes: w.duration_minutes,
        exercises_count: Array.isArray(w.exercises) ? w.exercises.length : 0,
      }));

      setWorkouts(summaries);
      setWorkoutDates(summaries.map(w => w.workout_date));
    } catch (error) {
      console.error('Error fetching workout history:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  // Listen for workout saves to refresh
  useEffect(() => {
    const handleWorkoutSaved = () => {
      setTimeout(() => fetchWorkouts(), 100);
    };

    window.addEventListener('workout-saved', handleWorkoutSaved);
    return () => window.removeEventListener('workout-saved', handleWorkoutSaved);
  }, [fetchWorkouts]);

  const getWorkoutForDate = (dateStr: string): WorkoutSummary | undefined => {
    return workouts.find(w => w.workout_date === dateStr);
  };

  const getWorkoutStats = () => {
    const completedCount = workouts.filter(w => w.completed).length;
    const totalDuration = workouts.reduce((acc, w) => acc + (w.duration_minutes || 0), 0);
    const totalExercises = workouts.reduce((acc, w) => acc + w.exercises_count, 0);
    
    // Calculate streak
    let streak = 0;
    const today = new Date();
    const sortedDates = [...new Set(workoutDates)].sort().reverse();
    
    for (let i = 0; i < sortedDates.length; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const checkStr = checkDate.toISOString().split('T')[0];
      
      if (sortedDates.includes(checkStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return {
      totalWorkouts: workouts.length,
      completedCount,
      totalDuration,
      totalExercises,
      streak,
    };
  };

  return {
    workouts,
    workoutDates,
    loading,
    getWorkoutForDate,
    getWorkoutStats,
    refetch: fetchWorkouts,
  };
};
