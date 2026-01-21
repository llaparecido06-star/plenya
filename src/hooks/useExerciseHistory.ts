import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ExerciseRecord {
  weight?: number;
  date: string;
}

export const useExerciseHistory = () => {
  const { user } = useAuth();
  const [cache, setCache] = useState<Record<string, ExerciseRecord | null>>({});

  const getLastWeight = useCallback(async (exerciseName: string): Promise<ExerciseRecord | null> => {
    if (!user) return null;

    // Check cache first
    if (cache[exerciseName] !== undefined) {
      return cache[exerciseName];
    }

    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('exercises, workout_date')
        .eq('user_id', user.id)
        .order('workout_date', { ascending: false })
        .limit(30);

      if (error) throw error;

      // Find the most recent workout with this exercise that has a weight
      for (const workout of data || []) {
        const exercises = workout.exercises as any[];
        if (!exercises) continue;
        
        const exercise = exercises.find(
          (ex: any) => ex.name === exerciseName && ex.weight
        );
        
        if (exercise) {
          const record = {
            weight: exercise.weight,
            date: workout.workout_date,
          };
          setCache(prev => ({ ...prev, [exerciseName]: record }));
          return record;
        }
      }

      setCache(prev => ({ ...prev, [exerciseName]: null }));
      return null;
    } catch (error) {
      console.error('Error fetching exercise history:', error);
      return null;
    }
  }, [user, cache]);

  return { getLastWeight };
};
