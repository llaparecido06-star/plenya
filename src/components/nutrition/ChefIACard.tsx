import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumGate from '@/components/subscription/PremiumGate';
import { ChefHat, Camera, Keyboard, Loader2, Sparkles, ArrowLeft, Send, Leaf, History, Star, Trash2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useCycle } from '@/contexts/CycleContext';
import { useProfile } from '@/hooks/useProfile';
import { useLifePhase } from '@/hooks/useLifePhase';
import { useAIBrain } from '@/hooks/useAIBrain';
import { useRecipeHistory, SavedRecipe } from '@/hooks/useRecipeHistory';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Recipe {
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  hormonal_benefit: string;
}

type ViewMode = 'select' | 'text' | 'photo' | 'history';

const ChefIACard: React.FC = () => {
  const { currentPhase } = useCycle();
  const { diet_type } = useProfile();
  const { lifePhase, pregnancyWeeks } = useLifePhase();
  const { getRecipes, loading: aiLoading } = useAIBrain();
  const { recipes: savedRecipes, favorites, loading: historyLoading, saveRecipe, toggleFavorite, deleteRecipe } = useRecipeHistory();
  const { toast } = useToast();
  
  const [showDialog, setShowDialog] = useState(false);
  const [inputMode, setInputMode] = useState<ViewMode>('select');
  const [ingredients, setIngredients] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedSavedRecipe, setSelectedSavedRecipe] = useState<SavedRecipe | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const getDietLabel = (dietType: string | null): string | null => {
    const labels: Record<string, string> = {
      vegan: 'Vegano',
      vegetarian: 'Vegetariano',
      lactose_free: 'Sem Lactose',
      low_carb: 'Low Carb',
      omnivore: 'Onívoro',
    };
    return dietType ? labels[dietType] || null : null;
  };

  const recipePhase = lifePhase === 'pregnant' ? 'gestante' : lifePhase === 'postpartum' ? 'pos_parto' : lifePhase === 'menopause' ? 'menopausa' : currentPhase;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateRecipes = async () => {
    const result = await getRecipes({
      phase: recipePhase,
      ingredients: inputMode === 'text' ? ingredients : undefined,
      image: inputMode === 'photo' ? imagePreview || undefined : undefined,
      diet_type: diet_type || undefined,
    });

    if (result && result.recipes && result.recipes.length > 0) {
      setRecipes(result.recipes);
      toast({
        title: 'Receitas geradas! 🍳',
        description: `${result.recipes.length} receitas personalizadas para você`,
      });
    }
  };

  const handleGenerateQuickRecipes = async () => {
    setInputMode('select');
    const result = await getRecipes({
      phase: recipePhase,
      diet_type: diet_type || undefined,
    });

    if (result && result.recipes && result.recipes.length > 0) {
      setRecipes(result.recipes);
    }
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    const saved = await saveRecipe({
      name: recipe.name,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      hormonal_benefit: recipe.hormonal_benefit,
      cycle_phase: recipePhase,
      diet_type: diet_type || undefined,
    });

    if (saved) {
      setSelectedRecipe(null);
    }
  };

  const resetState = () => {
    setInputMode('select');
    setIngredients('');
    setImagePreview(null);
    setRecipes([]);
    setSelectedRecipe(null);
    setSelectedSavedRecipe(null);
    setShowFavoritesOnly(false);
  };

  const handleBack = () => {
    if (selectedSavedRecipe) {
      setSelectedSavedRecipe(null);
    } else if (selectedRecipe) {
      setSelectedRecipe(null);
    } else if (recipes.length > 0) {
      setRecipes([]);
    } else {
      setInputMode('select');
      setImagePreview(null);
    }
  };

  const displayedHistory = showFavoritesOnly ? favorites : savedRecipes;

  return (
    <PremiumGate feature="Malu Chef" mode="inline">
      <motion.button
        id="chef-ia-card"
        onClick={() => { setShowDialog(true); resetState(); }}
        className="w-full glass-card p-4 text-left hover:shadow-soft transition-all"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Malu Chef</h3>
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-xs font-medium text-amber-600">
                Manu
              </span>
              {favorites.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-xs font-medium text-yellow-600 dark:text-yellow-400">
                  ⭐ {favorites.length}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {diet_type && getDietLabel(diet_type) 
                ? `Receitas ${getDietLabel(diet_type)}s personalizadas` 
                : 'O que tem na sua geladeira?'}
            </p>
          </div>
          <Sparkles className="w-5 h-5 text-amber-500" />
        </div>
      </motion.button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {(inputMode !== 'select' || recipes.length > 0 || selectedRecipe || selectedSavedRecipe) && (
                <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <DialogTitle className="flex items-center gap-2 flex-1">
                <ChefHat className="w-5 h-5 text-amber-500" />
                {inputMode === 'history' ? 'Minhas Receitas' : 'Malu Chef'}
                {diet_type && getDietLabel(diet_type) && inputMode !== 'history' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-normal">
                    {getDietLabel(diet_type)}
                  </span>
                )}
              </DialogTitle>
            </div>
            <DialogDescription>
              {inputMode === 'history'
                ? `${displayedHistory.length} receita${displayedHistory.length !== 1 ? 's' : ''} salva${displayedHistory.length !== 1 ? 's' : ''}`
                : lifePhase === 'pregnant'
                ? `Receitas seguras para gestantes (semana ${pregnancyWeeks || '?'})!`
                : lifePhase === 'postpartum'
                ? 'Receitas nutritivas para o pós-parto e amamentação!'
                : lifePhase === 'menopause'
                ? 'Receitas ricas em fitoestrógenos e cálcio!'
                : `Receitas personalizadas para a fase ${recipePhase}!`}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {aiLoading || historyLoading ? (
              <motion.div
                key="loading"
                className="flex flex-col items-center justify-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <ChefHat className="w-8 h-8 text-white" />
                  </div>
                </motion.div>
                <p className="text-muted-foreground mt-4">
                  {aiLoading ? 'Malu está preparando suas receitas...' : 'Carregando receitas...'}
                </p>
              </motion.div>
            ) : selectedSavedRecipe ? (
              <motion.div
                key="saved-recipe-detail"
                className="space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-foreground text-lg">{selectedSavedRecipe.recipe_name}</h4>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleFavorite(selectedSavedRecipe.id)}
                      >
                        <Star className={`w-4 h-4 ${selectedSavedRecipe.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={async () => {
                          await deleteRecipe(selectedSavedRecipe.id);
                          setSelectedSavedRecipe(null);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {selectedSavedRecipe.recipe_description && (
                    <p className="text-sm text-muted-foreground">{selectedSavedRecipe.recipe_description}</p>
                  )}
                  {selectedSavedRecipe.hormonal_benefit && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Leaf className="w-4 h-4 text-green-500" />
                      <span className="text-green-700 dark:text-green-400">{selectedSavedRecipe.hormonal_benefit}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Salva em {format(new Date(selectedSavedRecipe.created_at), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>

                <div>
                  <h5 className="font-medium text-foreground mb-2">📝 Ingredientes</h5>
                  <ul className="space-y-1">
                    {selectedSavedRecipe.ingredients.map((ing, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-foreground mb-2">👩‍🍳 Modo de Preparo</h5>
                  <ol className="space-y-2">
                    {selectedSavedRecipe.instructions.map((step, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="font-semibold text-primary flex-shrink-0">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </motion.div>
            ) : inputMode === 'history' ? (
              <motion.div
                key="history"
                className="space-y-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Filter Tabs */}
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={showFavoritesOnly ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => setShowFavoritesOnly(false)}
                    className="flex-1"
                  >
                    <BookOpen className="w-4 h-4 mr-1" />
                    Todas ({savedRecipes.length})
                  </Button>
                  <Button
                    variant={showFavoritesOnly ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowFavoritesOnly(true)}
                    className="flex-1"
                  >
                    <Star className="w-4 h-4 mr-1" />
                    Favoritas ({favorites.length})
                  </Button>
                </div>

                {displayedHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                      {showFavoritesOnly ? (
                        <Star className="w-8 h-8 text-muted-foreground" />
                      ) : (
                        <BookOpen className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      {showFavoritesOnly ? 'Nenhuma receita favorita ainda' : 'Nenhuma receita salva ainda'}
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setInputMode('select')}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Gerar Novas Receitas
                    </Button>
                  </div>
                ) : (
                  displayedHistory.map((recipe, idx) => (
                    <motion.button
                      key={recipe.id}
                      onClick={() => setSelectedSavedRecipe(recipe)}
                      className="w-full p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 text-left hover:shadow-md transition-all"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground">{recipe.recipe_name}</h4>
                            {recipe.is_favorite && (
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            )}
                          </div>
                          {recipe.recipe_description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{recipe.recipe_description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(recipe.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            {recipe.cycle_phase && ` • Fase ${recipe.cycle_phase}`}
                          </p>
                        </div>
                        <ChefHat className="w-5 h-5 text-amber-500 flex-shrink-0 ml-2" />
                      </div>
                    </motion.button>
                  ))
                )}
              </motion.div>
            ) : selectedRecipe ? (
              <motion.div
                key="recipe-detail"
                className="space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50">
                  <h4 className="font-semibold text-foreground text-lg mb-2">{selectedRecipe.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedRecipe.description}</p>
                  {selectedRecipe.hormonal_benefit && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Leaf className="w-4 h-4 text-green-500" />
                      <span className="text-green-700 dark:text-green-400">{selectedRecipe.hormonal_benefit}</span>
                    </div>
                  )}
                </div>

                <div>
                  <h5 className="font-medium text-foreground mb-2">📝 Ingredientes</h5>
                  <ul className="space-y-1">
                    {selectedRecipe.ingredients.map((ing, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-foreground mb-2">👩‍🍳 Modo de Preparo</h5>
                  <ol className="space-y-2">
                    {selectedRecipe.instructions.map((step, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="font-semibold text-primary flex-shrink-0">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
                  onClick={() => handleSaveRecipe(selectedRecipe)}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Salvar no Meu Histórico
                </Button>
              </motion.div>
            ) : recipes.length > 0 ? (
              <motion.div
                key="recipes-list"
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <p className="text-sm text-muted-foreground text-center mb-2">
                  {recipes.length} receitas geradas para você:
                </p>
                {recipes.map((recipe, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => setSelectedRecipe(recipe)}
                    className="w-full p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 text-left hover:shadow-md transition-all"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{recipe.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">{recipe.description}</p>
                      </div>
                      <ChefHat className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    </div>
                    {recipe.hormonal_benefit && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                        <Leaf className="w-3 h-3" />
                        {recipe.hormonal_benefit}
                      </div>
                    )}
                  </motion.button>
                ))}

                <Button className="w-full mt-4" variant="outline" onClick={resetState}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Novas Receitas
                </Button>
              </motion.div>
            ) : inputMode === 'text' ? (
              <motion.div
                key="text-input"
                className="space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    O que você tem na geladeira?
                  </label>
                  <Textarea
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    placeholder="Ex: frango, brócolis, arroz, limão, alho..."
                    className="min-h-[100px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Liste os ingredientes separados por vírgula
                  </p>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
                  onClick={handleGenerateRecipes}
                  disabled={!ingredients.trim() || aiLoading}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Gerar Receitas
                </Button>
              </motion.div>
            ) : inputMode === 'photo' ? (
              <motion.div
                key="photo-input"
                className="space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {imagePreview ? (
                  <>
                    <div className="w-full h-48 rounded-xl overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Geladeira"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button 
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
                      onClick={handleGenerateRecipes}
                      disabled={aiLoading}
                    >
                      <ChefHat className="w-4 h-4 mr-2" />
                      Criar Receitas com Esses Ingredientes
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setImagePreview(null)}
                    >
                      Tirar Outra Foto
                    </Button>
                  </>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center bg-secondary/30">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20">
                        <Camera className="w-8 h-8 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Tire uma foto da geladeira</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          A IA vai identificar os ingredientes
                        </p>
                      </div>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium">
                          <Camera className="w-4 h-4" />
                          Tirar Foto
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="select-mode"
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* History Button */}
                {savedRecipes.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-between"
                    onClick={() => setInputMode('history')}
                  >
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-amber-500" />
                      <span>Minhas Receitas Salvas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">{savedRecipes.length}</span>
                      {favorites.length > 0 && (
                        <span className="flex items-center gap-1 text-yellow-500 text-sm">
                          <Star className="w-3 h-3 fill-current" />
                          {favorites.length}
                        </span>
                      )}
                    </div>
                  </Button>
                )}

                <p className="text-sm text-center text-muted-foreground mb-4">
                  Escolha como deseja informar seus ingredientes:
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="flex flex-col h-28 gap-2 hover:border-amber-500/50"
                    onClick={() => setInputMode('photo')}
                  >
                    <div className="p-3 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20">
                      <Camera className="w-6 h-6 text-amber-500" />
                    </div>
                    <span className="text-sm">Foto da Geladeira</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col h-28 gap-2 hover:border-amber-500/50"
                    onClick={() => setInputMode('text')}
                  >
                    <div className="p-3 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20">
                      <Keyboard className="w-6 h-6 text-amber-500" />
                    </div>
                    <span className="text-sm">Digitar Ingredientes</span>
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">ou</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
                  onClick={handleGenerateQuickRecipes}
                  disabled={aiLoading}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Sugerir Receitas para Minha Fase
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Receitas otimizadas para a fase {recipePhase} do seu ciclo
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </PremiumGate>
  );
};

export default ChefIACard;
