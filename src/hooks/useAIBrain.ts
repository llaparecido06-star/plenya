import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type AIMode = 'chat' | 'trainer' | 'nutrition_scanner' | 'chef';

interface ChatPayload {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  life_phase: 'menstruating' | 'pregnant' | 'menopause' | null;
  pregnancy_weeks?: number | null;
  phase_name?: string;
}

interface TrainerPayload {
  energy_level: number;
  phase: string;
  cycle_day?: number;
  goal: string | null;
  injuries?: string[];
  fitness_level?: string;
}

interface NutritionScannerPayload {
  image: string;
  phase: string;
  diet_type?: string;
}

interface ChefPayload {
  phase: string;
  cycle_day?: number;
  ingredients?: string;
  image?: string;
  diet_type?: string;
}

interface TrainerResponse {
  title: string;
  duration: string;
  intensity: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    observation?: string;
  }>;
}

interface NutritionScannerResponse {
  meal_name: string;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  advice: string;
}

interface ChefResponse {
  recipes: Array<{
    name: string;
    description: string;
    ingredients: string[];
    instructions: string[];
    hormonal_benefit: string;
  }>;
}

export const useAIBrain = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const callAI = useCallback(async <T>(mode: AIMode, payload: ChatPayload | TrainerPayload | NutritionScannerPayload | ChefPayload): Promise<T | null> => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('plenya-ai-brain', {
        body: { mode, payload },
      });

      if (error) {
        console.error('AI Brain error:', error);
        toast({
          variant: 'destructive',
          title: 'Erro na IA',
          description: error.message || 'Não foi possível processar sua solicitação.',
        });
        return null;
      }

      if (data?.error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: data.error,
        });
        return null;
      }

      return data as T;
    } catch (err) {
      console.error('AI Brain exception:', err);
      toast({
        variant: 'destructive',
        title: 'Erro de conexão',
        description: 'Não foi possível conectar ao servidor.',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const chat = useCallback(async (payload: ChatPayload): Promise<string | null> => {
    const result = await callAI<{ response: string }>('chat', payload);
    return result?.response || null;
  }, [callAI]);

  const generateWorkout = useCallback(async (payload: TrainerPayload): Promise<TrainerResponse | null> => {
    return callAI<TrainerResponse>('trainer', payload);
  }, [callAI]);

  const scanMeal = useCallback(async (payload: NutritionScannerPayload): Promise<NutritionScannerResponse | null> => {
    return callAI<NutritionScannerResponse>('nutrition_scanner', payload);
  }, [callAI]);

  const getRecipes = useCallback(async (payload: ChefPayload): Promise<ChefResponse | null> => {
    return callAI<ChefResponse>('chef', payload);
  }, [callAI]);

  return {
    loading,
    chat,
    generateWorkout,
    scanMeal,
    getRecipes,
  };
};
