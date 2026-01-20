import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCycle } from '@/contexts/CycleContext';

interface CycleComparison {
  previousLog: {
    date: string;
    mood: number | null;
    energy: number | null;
    stress: number | null;
    symptoms: string[] | null;
  } | null;
  previousMeals: {
    meal_name: string | null;
    meal_type: string;
  }[];
  previousWorkout: {
    workout_name: string;
    workout_type: string;
    completed: boolean | null;
  } | null;
  insight: string | null;
}

export const useCycleInsights = () => {
  const { user } = useAuth();
  const { currentPhase } = useCycle();
  const [comparison, setComparison] = useState<CycleComparison>({
    previousLog: null,
    previousMeals: [],
    previousWorkout: null,
    insight: null,
  });
  const [loading, setLoading] = useState(true);

  const generateInsight = useCallback((
    prevLog: CycleComparison['previousLog'],
    prevMeals: CycleComparison['previousMeals']
  ): string | null => {
    if (!prevLog) return null;

    const parts: string[] = [];

    // Energy insight
    if (prevLog.energy !== null) {
      const energyLabel = prevLog.energy <= 3 ? 'baixa' : prevLog.energy <= 6 ? 'moderada' : 'alta';
      parts.push(`energia ${energyLabel}`);
    }

    // Mood insight
    if (prevLog.mood !== null) {
      const moodLabel = prevLog.mood <= 3 ? 'mais introspectivo' : prevLog.mood <= 6 ? 'equilibrado' : 'muito positivo';
      parts.push(`humor ${moodLabel}`);
    }

    // Meal insight
    if (prevMeals.length > 0 && prevMeals[0].meal_name) {
      parts.push(`você comeu "${prevMeals[0].meal_name}"`);
    }

    if (parts.length === 0) return null;

    return `Na mesma fase do ciclo passado, você registrou ${parts.join(' e ')}.`;
  }, []);

  const fetchComparison = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Calculate date 28 days ago (typical cycle length)
      const today = new Date();
      const previousCycleDate = new Date(today);
      previousCycleDate.setDate(previousCycleDate.getDate() - 28);
      const prevDateStr = previousCycleDate.toISOString().split('T')[0];

      const [logResult, mealsResult, workoutResult] = await Promise.all([
        supabase
          .from('daily_logs')
          .select('log_date, mood, energy, stress, symptoms')
          .eq('user_id', user.id)
          .eq('log_date', prevDateStr)
          .maybeSingle(),
        supabase
          .from('nutrition_intake')
          .select('meal_name, meal_type')
          .eq('user_id', user.id)
          .eq('intake_date', prevDateStr)
          .limit(3),
        supabase
          .from('workouts')
          .select('workout_name, workout_type, completed')
          .eq('user_id', user.id)
          .eq('workout_date', prevDateStr)
          .maybeSingle(),
      ]);

      const prevLog = logResult.data ? {
        date: logResult.data.log_date,
        mood: logResult.data.mood,
        energy: logResult.data.energy,
        stress: logResult.data.stress,
        symptoms: logResult.data.symptoms,
      } : null;

      const prevMeals = mealsResult.data || [];
      const prevWorkout = workoutResult.data;

      const insight = generateInsight(prevLog, prevMeals);

      setComparison({
        previousLog: prevLog,
        previousMeals: prevMeals,
        previousWorkout: prevWorkout,
        insight,
      });
    } catch (error) {
      console.error('[CycleInsights] Error fetching comparison:', error);
    } finally {
      setLoading(false);
    }
  }, [user, generateInsight]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison, currentPhase]);

  return {
    comparison,
    loading,
    refresh: fetchComparison,
  };
};
