import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type MealType = Database['public']['Enums']['meal_type'];

interface MealEntry {
  id: string;
  meal_type: MealType;
  meal_name: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const useNutrition = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [totals, setTotals] = useState<NutritionTotals>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  const today = new Date().toISOString().split('T')[0];

  // Calculate totals from meals
  useEffect(() => {
    const newTotals = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    setTotals(newTotals);
  }, [meals]);

  // Load today's meals on mount
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadTodayMeals = async () => {
      try {
        const { data, error } = await supabase
          .from('nutrition_intake')
          .select('*')
          .eq('user_id', user.id)
          .eq('intake_date', today)
          .order('created_at', { ascending: true });

        if (error) throw error;

        setMeals(data || []);
      } catch (error) {
        console.error('Error loading meals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTodayMeals();
  }, [user, today]);

  const addMeal = useCallback(async (
    mealType: MealType,
    mealName: string,
    nutrition?: { calories?: number; protein?: number; carbs?: number; fat?: number }
  ) => {
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logada para registrar refeições.',
        variant: 'destructive',
      });
      return false;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('nutrition_intake')
        .insert({
          user_id: user.id,
          intake_date: today,
          meal_type: mealType,
          meal_name: mealName,
          calories: nutrition?.calories || 0,
          protein: nutrition?.protein || 0,
          carbs: nutrition?.carbs || 0,
          fat: nutrition?.fat || 0,
        })
        .select()
        .single();

      if (error) throw error;

      setMeals(prev => [...prev, data]);
      toast({
        title: 'Refeição registrada! 🍽️',
        description: `${mealName} foi adicionado com sucesso.`,
      });
      return true;
    } catch (error) {
      console.error('Error adding meal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar a refeição.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, today, toast]);

  const deleteMeal = useCallback(async (mealId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('nutrition_intake')
        .delete()
        .eq('id', mealId)
        .eq('user_id', user.id);

      if (error) throw error;

      setMeals(prev => prev.filter(m => m.id !== mealId));
      return true;
    } catch (error) {
      console.error('Error deleting meal:', error);
      return false;
    }
  }, [user]);

  return {
    meals,
    totals,
    loading,
    saving,
    addMeal,
    deleteMeal,
    isAuthenticated: !!user,
  };
};
