import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface SavedRecipe {
  id: string;
  recipe_name: string;
  recipe_description: string | null;
  ingredients: string[];
  instructions: string[];
  hormonal_benefit: string | null;
  cycle_phase: string | null;
  diet_type: string | null;
  is_favorite: boolean;
  created_at: string;
}

interface RecipeToSave {
  name: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  hormonal_benefit?: string;
  cycle_phase?: string;
  diet_type?: string;
}

export const useRecipeHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [favorites, setFavorites] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecipes = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('recipe_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const typedRecipes = (data || []) as SavedRecipe[];
      setRecipes(typedRecipes);
      setFavorites(typedRecipes.filter(r => r.is_favorite));
    } catch (error) {
      console.error('Error fetching recipe history:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const saveRecipe = async (recipe: RecipeToSave): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('recipe_history')
        .insert({
          user_id: user.id,
          recipe_name: recipe.name,
          recipe_description: recipe.description || null,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          hormonal_benefit: recipe.hormonal_benefit || null,
          cycle_phase: recipe.cycle_phase || null,
          diet_type: recipe.diet_type || null,
        });

      if (error) throw error;

      toast({
        title: 'Receita salva! 📖',
        description: `"${recipe.name}" foi adicionada ao seu histórico.`,
      });

      fetchRecipes();
      return true;
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a receita.',
      });
      return false;
    }
  };

  const toggleFavorite = async (recipeId: string): Promise<boolean> => {
    if (!user) return false;

    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return false;

    try {
      const { error } = await supabase
        .from('recipe_history')
        .update({ is_favorite: !recipe.is_favorite })
        .eq('id', recipeId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: recipe.is_favorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos! ⭐',
        description: recipe.recipe_name,
      });

      fetchRecipes();
      return true;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  };

  const deleteRecipe = async (recipeId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('recipe_history')
        .delete()
        .eq('id', recipeId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Receita removida',
        description: 'A receita foi excluída do histórico.',
      });

      fetchRecipes();
      return true;
    } catch (error) {
      console.error('Error deleting recipe:', error);
      return false;
    }
  };

  return {
    recipes,
    favorites,
    loading,
    saveRecipe,
    toggleFavorite,
    deleteRecipe,
    refetch: fetchRecipes,
  };
};
