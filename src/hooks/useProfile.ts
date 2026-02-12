import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  goal: string | null;
  diet_type: string | null;
  fitness_level: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  life_phase: string | null;
  pregnancy_start_date: string | null;
  is_trying_to_conceive: boolean;
  macro_protein_goal: number;
  macro_carbs_goal: number;
  macro_fat_goal: number;
  macro_calories_goal: number;
}

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<ProfileData>({
    goal: null,
    diet_type: null,
    fitness_level: null,
    full_name: null,
    date_of_birth: null,
    life_phase: null,
    pregnancy_start_date: null,
    is_trying_to_conceive: false,
    macro_protein_goal: 120,
    macro_carbs_goal: 250,
    macro_fat_goal: 70,
    macro_calories_goal: 2000,
  });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('goal, diet_type, fitness_level, full_name, date_of_birth, life_phase, pregnancy_start_date, is_trying_to_conceive, macro_protein_goal, macro_carbs_goal, macro_fat_goal, macro_calories_goal')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (profile) {
        setData({
          goal: profile.goal,
          diet_type: profile.diet_type,
          fitness_level: profile.fitness_level,
          full_name: profile.full_name,
          date_of_birth: profile.date_of_birth,
          life_phase: profile.life_phase,
          pregnancy_start_date: profile.pregnancy_start_date,
          is_trying_to_conceive: profile.is_trying_to_conceive ?? false,
          macro_protein_goal: profile.macro_protein_goal ?? 120,
          macro_carbs_goal: profile.macro_carbs_goal ?? 250,
          macro_fat_goal: profile.macro_fat_goal ?? 70,
          macro_calories_goal: profile.macro_calories_goal ?? 2000,
        });
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile, refreshKey]);

  const refetch = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Parse goals from comma-separated string to array
  const goals = data.goal ? data.goal.split(',').filter(Boolean) : [];

  return {
    ...data,
    goals,
    loading,
    refetch,
  };
};
