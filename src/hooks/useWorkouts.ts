import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCycle, CyclePhase } from '@/contexts/CycleContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type WorkoutType = Database['public']['Enums']['workout_type'];

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  completed: boolean[];
  weight?: number;
  actualReps?: number;
}

interface WorkoutData {
  id: string | null;
  workout_type: WorkoutType;
  workout_name: string;
  exercises: Exercise[];
  completed: boolean;
  duration_minutes: number | null;
}

const phaseToWorkoutType: Record<CyclePhase, WorkoutType> = {
  menstrual: 'yoga',
  folicular: 'hiit',
  ovulatoria: 'forca',
  lutea: 'mobilidade',
};

export const useWorkouts = () => {
  const { user } = useAuth();
  const { currentPhase } = useCycle();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workout, setWorkout] = useState<WorkoutData | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const workoutType = phaseToWorkoutType[currentPhase];

  // Load today's workout on mount
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadTodayWorkout = async () => {
      try {
        const { data, error } = await supabase
          .from('workouts')
          .select('*')
          .eq('user_id', user.id)
          .eq('workout_date', today)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setWorkout({
            id: data.id,
            workout_type: data.workout_type,
            workout_name: data.workout_name,
            exercises: (data.exercises as unknown as Exercise[]) || [],
            completed: data.completed || false,
            duration_minutes: data.duration_minutes,
          });
        }
      } catch (error) {
        console.error('Error loading workout:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTodayWorkout();
  }, [user, today]);

  const saveExercises = useCallback(async (
    workoutName: string,
    exercises: Exercise[],
    durationMinutes?: number
  ) => {
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logada para salvar treinos.',
        variant: 'destructive',
      });
      return false;
    }

    setSaving(true);
    try {
      const allCompleted = exercises.every(ex => ex.completed.every(Boolean));

      if (workout?.id) {
        // Update existing workout
        const { error } = await supabase
          .from('workouts')
          .update({
            exercises: exercises as unknown as Database['public']['Tables']['workouts']['Update']['exercises'],
            completed: allCompleted,
            duration_minutes: durationMinutes || null,
          })
          .eq('id', workout.id);

        if (error) throw error;

        setWorkout(prev => prev ? {
          ...prev,
          exercises,
          completed: allCompleted,
          duration_minutes: durationMinutes || null,
        } : null);
      } else {
        // Create new workout
        const { data, error } = await supabase
          .from('workouts')
          .insert({
            user_id: user.id,
            workout_date: today,
            workout_type: workoutType,
            workout_name: workoutName,
            exercises: exercises as unknown as Database['public']['Tables']['workouts']['Insert']['exercises'],
            completed: allCompleted,
            duration_minutes: durationMinutes || null,
          })
          .select()
          .single();

        if (error) throw error;

        setWorkout({
          id: data.id,
          workout_type: data.workout_type,
          workout_name: data.workout_name,
          exercises: (data.exercises as unknown as Exercise[]) || exercises,
          completed: data.completed || false,
          duration_minutes: data.duration_minutes,
        });
      }

      return true;
    } catch (error) {
      console.error('Error saving workout:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o treino.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, workout, today, workoutType, toast]);

  const completeExercise = useCallback(async (
    workoutName: string,
    exerciseId: string,
    exercises: Exercise[],
    weight?: number,
    actualReps?: number
  ) => {
    const updatedExercises = exercises.map(ex =>
      ex.id === exerciseId
        ? {
            ...ex,
            completed: ex.completed.map(() => true),
            weight,
            actualReps,
          }
        : ex
    );

    const saved = await saveExercises(workoutName, updatedExercises);
    if (saved) {
      toast({
        title: 'Exercício concluído! 💪',
        description: 'Seu progresso foi salvo.',
      });
    }
    return saved;
  }, [saveExercises, toast]);

  return {
    workout,
    loading,
    saving,
    saveExercises,
    completeExercise,
    isAuthenticated: !!user,
  };
};
