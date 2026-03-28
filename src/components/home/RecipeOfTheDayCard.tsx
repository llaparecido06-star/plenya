import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Leaf, Star, RefreshCw, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRecipeHistory, SavedRecipe } from '@/hooks/useRecipeHistory';
import { useCycle } from '@/contexts/CycleContext';
import { useAIBrain } from '@/hooks/useAIBrain';
import { useProfile } from '@/hooks/useProfile';
import { useLifePhase } from '@/hooks/useLifePhase';
import { useNavigate } from 'react-router-dom';

const RecipeOfTheDayCard: React.FC = () => {
  const { favorites, loading: historyLoading } = useRecipeHistory();
  const { currentPhase } = useCycle();
  const { getRecipes, loading: aiLoading } = useAIBrain();
  const { diet_type } = useProfile();
  const { lifePhase } = useLifePhase();
  const navigate = useNavigate();
  
  const [todayRecipe, setTodayRecipe] = useState<SavedRecipe | null>(null);
  const [generatedRecipe, setGeneratedRecipe] = useState<{
    name: string;
    description: string;
    hormonal_benefit?: string;
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Select a recipe of the day from favorites based on current phase or trimester
  useEffect(() => {
    if (favorites.length > 0) {
      const isPregnant = lifePhase === 'pregnant';
      
      // For pregnant users, match any favorite; for others, match by phase
      let source = favorites;
      if (!isPregnant) {
        const phaseMatch = favorites.filter(r => r.cycle_phase === currentPhase);
        if (phaseMatch.length > 0) source = phaseMatch;
      }
      
      // Use today's date as seed for consistent daily selection
      const today = new Date().toDateString();
      const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const index = seed % source.length;
      
      setTodayRecipe(source[index]);
    }
  }, [favorites, currentPhase, lifePhase]);

  const handleGenerateQuick = async () => {
    setIsGenerating(true);
    const isPregnant = lifePhase === 'pregnant';
    const recipePhase = isPregnant ? 'folicular' : currentPhase;
    
    const result = await getRecipes({
      phase: recipePhase,
      diet_type: diet_type || undefined,
    });

    if (result?.recipes?.[0]) {
      setGeneratedRecipe({
        name: result.recipes[0].name,
        description: result.recipes[0].description,
        hormonal_benefit: result.recipes[0].hormonal_benefit,
      });
    }
    setIsGenerating(false);
  };

  const handleGoToNutrition = () => {
    navigate('/nutricao');
  };

  // Show nothing while loading
  if (historyLoading) {
    return null;
  }

  // If user has no favorites, show a prompt to generate
  if (favorites.length === 0 && !generatedRecipe) {
    return (
      <motion.div
        className="px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/20">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Receita do Dia</h3>
              <p className="text-xs text-muted-foreground">
                Personalize sua alimentação
              </p>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">
            Descubra receitas adaptadas à sua fase do ciclo e salve suas favoritas!
          </p>
          
          <Button
            onClick={handleGenerateQuick}
            disabled={aiLoading || isGenerating}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Sugestão do Dia
              </>
            )}
          </Button>
        </div>
      </motion.div>
    );
  }

  // Show generated recipe if available
  if (generatedRecipe) {
    return (
      <motion.div
        className="px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="glass-card p-4 border-l-4 border-amber-500">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-500/20">
                <ChefHat className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Sugestão do Dia</p>
                <h4 className="font-semibold text-foreground">{generatedRecipe.name}</h4>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {generatedRecipe.description}
          </p>
          
          {generatedRecipe.hormonal_benefit && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 mb-3">
              <Leaf className="w-3 h-3" />
              {generatedRecipe.hormonal_benefit}
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleGoToNutrition}
          >
            Ver mais com a Malu
          </Button>
        </div>
      </motion.div>
    );
  }

  // Show favorite recipe of the day
  if (todayRecipe) {
    return (
      <motion.div
        className="px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.button
          className="w-full glass-card p-4 text-left border-l-4 border-amber-500"
          onClick={() => setShowDetails(!showDetails)}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/20">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-xs text-muted-foreground font-medium">Receita do Dia</p>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                </div>
                <h4 className="font-semibold text-foreground truncate">{todayRecipe.recipe_name}</h4>
              </div>
            </div>
            <div className="flex-shrink-0 ml-2">
              {showDetails ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </div>

          {todayRecipe.hormonal_benefit && !showDetails && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 mt-2 ml-14">
              <Leaf className="w-3 h-3" />
              <span className="line-clamp-1">{todayRecipe.hormonal_benefit}</span>
            </div>
          )}
        </motion.button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card mt-2 p-4 space-y-3">
                {todayRecipe.recipe_description && (
                  <p className="text-sm text-muted-foreground">
                    {todayRecipe.recipe_description}
                  </p>
                )}

                {todayRecipe.hormonal_benefit && (
                  <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-green-50 dark:bg-green-950/30">
                    <Leaf className="w-4 h-4 text-green-500" />
                    <span className="text-green-700 dark:text-green-400">
                      {todayRecipe.hormonal_benefit}
                    </span>
                  </div>
                )}

                <div>
                  <h5 className="font-medium text-foreground mb-2 text-sm">📝 Ingredientes</h5>
                  <ul className="space-y-1">
                    {todayRecipe.ingredients.slice(0, 5).map((ing, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                        {ing}
                      </li>
                    ))}
                    {todayRecipe.ingredients.length > 5 && (
                      <li className="text-xs text-primary">
                        +{todayRecipe.ingredients.length - 5} mais...
                      </li>
                    )}
                  </ul>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGoToNutrition();
                  }}
                >
                  Ver receita completa com a Malu
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return null;
};

export default RecipeOfTheDayCard;
