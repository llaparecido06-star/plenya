import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCycle, CyclePhase } from '@/contexts/CycleContext';
import { useSelectedDate } from '@/contexts/SelectedDateContext';
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
  const { currentPhase, cycleLength, lastPeriodStart, getPhaseByDay } = useCycle();
  const { selectedDate, isToday } = useSelectedDate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workout, setWorkout] = useState<WorkoutData | null>(null);

  const dateString = selectedDate.toISOString().split('T')[0];
  
  // Calculate the phase for the selected date
  const getPhaseForDate = useCallback((date: Date): CyclePhase => {
    if (!lastPeriodStart) return currentPhase;
    
    const lastPeriod = new Date(lastPeriodStart);
    const diffTime = date.getTime() - lastPeriod.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const dayOfCycle = ((diffDays % cycleLength) + cycleLength) % cycleLength + 1;
    
    return getPhaseByDay(dayOfCycle);
  }, [lastPeriodStart, cycleLength, currentPhase, getPhaseByDay]);

  const workoutPhase = getPhaseForDate(selectedDate);
  const workoutType = phaseToWorkoutType[workoutPhase];

  // Load workout for selected date
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadWorkout = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('workouts')
          .select('*')
          .eq('user_id', user.id)
          .eq('workout_date', dateString)
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
        } else {
          setWorkout(null);
        }
      } catch (error) {
        console.error('Error loading workout:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkout();
  }, [user, dateString]); // Now depends on dateString (from selectedDate)

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

    if (!isToday) {
      toast({
        title: 'Histórico',
        description: 'Você só pode editar o treino de hoje.',
        variant: 'destructive',
      });
      return false;
    }

    setSaving(true);
    try {
      const allCompleted = exercises.every(ex => ex.completed.every(Boolean));
      const today = new Date().toISOString().split('T')[0];

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
  }, [user, workout, workoutType, toast, isToday]);

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
    workoutPhase,
    isToday,
  };
};
