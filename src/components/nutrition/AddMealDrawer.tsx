import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Coffee, Sun, Moon, Apple, Plus, Check, Loader2, Sparkles } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNutrition } from '@/hooks/useNutrition';
import { useAIBrain } from '@/hooks/useAIBrain';
import { useCycle } from '@/contexts/CycleContext';
import { useProfile } from '@/hooks/useProfile';
import type { Database } from '@/integrations/supabase/types';

type MealType = Database['public']['Enums']['meal_type'];

interface MealPreset {
  id: MealType;
  name: string;
  icon: React.ElementType;
  suggestions: string[];
}

const mealPresets: MealPreset[] = [
  {
    id: 'cafe',
    name: 'Café da Manhã',
    icon: Coffee,
    suggestions: ['Ovos mexidos', 'Aveia com frutas', 'Iogurte com granola', 'Tapioca'],
  },
  {
    id: 'almoco',
    name: 'Almoço',
    icon: Sun,
    suggestions: ['Frango grelhado', 'Arroz integral', 'Salada verde', 'Legumes'],
  },
  {
    id: 'jantar',
    name: 'Jantar',
    icon: Moon,
    suggestions: ['Salmão', 'Sopa de legumes', 'Omelete', 'Salada Caesar'],
  },
  {
    id: 'lanche',
    name: 'Lanche',
    icon: Apple,
    suggestions: ['Castanhas', 'Frutas', 'Iogurte', 'Barra de proteína'],
  },
];

const AddMealDrawer: React.FC = () => {
  const { addMeal, saving, isAuthenticated } = useNutrition();
  const { estimateMacros, loading: aiLoading } = useAIBrain();
  const { currentPhase } = useCycle();
  const { diet_type } = useProfile();
  const [selectedMeal, setSelectedMeal] = useState<MealType | null>(null);
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
  const [customFood, setCustomFood] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [estimatedMacros, setEstimatedMacros] = useState<{ calories: number; protein: number; carbs: number; fat: number } | null>(null);
  const [estimating, setEstimating] = useState(false);

  const toggleFood = (food: string) => {
    setSelectedFoods(prev =>
      prev.includes(food)
        ? prev.filter(f => f !== food)
        : [...prev, food]
    );
    setEstimatedMacros(null);
  };

  const addCustomFood = () => {
    if (customFood.trim()) {
      setSelectedFoods(prev => [...prev, customFood.trim()]);
      setCustomFood('');
      setEstimatedMacros(null);
    }
  };

  const handleEstimateMacros = async () => {
    if (selectedFoods.length === 0) return;
    setEstimating(true);
    
    const result = await estimateMacros({
      foods: selectedFoods.join(', '),
      phase: currentPhase,
      diet_type: diet_type || undefined,
    });

    if (result?.macros) {
      setEstimatedMacros(result.macros);
    }
    setEstimating(false);
  };

  const handleSave = async () => {
    if (!selectedMeal || selectedFoods.length === 0) return;

    const mealName = selectedFoods.join(', ');
    const success = await addMeal(selectedMeal, mealName, estimatedMacros ? {
      calories: estimatedMacros.calories,
      protein: estimatedMacros.protein,
      carbs: estimatedMacros.carbs,
      fat: estimatedMacros.fat,
    } : undefined);
    
    if (success) {
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setDrawerOpen(false);
        setSelectedMeal(null);
        setSelectedFoods([]);
        setEstimatedMacros(null);
      }, 1500);
    }
  };

  const currentPreset = mealPresets.find(m => m.id === selectedMeal);

  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerTrigger asChild>
        <motion.button
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl phase-gradient text-white font-semibold shadow-glow"
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-5 h-5" />
          Adicionar Refeição
        </motion.button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Adicionar Refeição</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8 overflow-y-auto">
          {!selectedMeal ? (
            <div className="grid grid-cols-2 gap-3">
              {mealPresets.map((meal) => {
                const Icon = meal.icon;
                return (
                  <button
                    key={meal.id}
                    onClick={() => setSelectedMeal(meal.id)}
                    className="flex flex-col items-center gap-3 p-6 rounded-2xl glass-card hover:shadow-soft transition-all"
                  >
                    <div className="p-3 rounded-xl phase-gradient">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-medium text-foreground">{meal.name}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => {
                  setSelectedMeal(null);
                  setSelectedFoods([]);
                  setEstimatedMacros(null);
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Voltar
              </button>

              <div className="flex items-center gap-2 mb-4">
                {currentPreset && (
                  <>
                    <div className="p-2 rounded-xl phase-gradient">
                      <currentPreset.icon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground">{currentPreset.name}</h3>
                  </>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-3">Sugestões rápidas</p>
                <div className="flex flex-wrap gap-2">
                  {currentPreset?.suggestions.map((food) => (
                    <button
                      key={food}
                      onClick={() => toggleFood(food)}
                      className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedFoods.includes(food)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {selectedFoods.includes(food) && <Check className="w-3 h-3" />}
                      {food}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar outro alimento..."
                  value={customFood}
                  onChange={(e) => setCustomFood(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomFood()}
                />
                <Button onClick={addCustomFood} size="icon" variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {selectedFoods.length > 0 && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Selecionados:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedFoods.map((food) => (
                        <span
                          key={food}
                          className="px-3 py-1 bg-phase-secondary/50 text-phase-primary rounded-full text-sm"
                        >
                          {food}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* AI Macro Estimation */}
                  {!estimatedMacros && (
                    <Button
                      variant="outline"
                      className="w-full border-primary/30 text-primary"
                      onClick={handleEstimateMacros}
                      disabled={estimating || aiLoading}
                    >
                      {estimating || aiLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Calculando macros...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Calcular macros com IA
                        </span>
                      )}
                    </Button>
                  )}

                  {estimatedMacros && (
                    <motion.div
                      className="grid grid-cols-4 gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="text-center">
                        <p className="text-lg font-bold text-primary">{estimatedMacros.calories}</p>
                        <p className="text-xs text-muted-foreground">kcal</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-terracotta">{estimatedMacros.protein}g</p>
                        <p className="text-xs text-muted-foreground">Proteína</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-leaf-green">{estimatedMacros.carbs}g</p>
                        <p className="text-xs text-muted-foreground">Carbs</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-amber-500">{estimatedMacros.fat}g</p>
                        <p className="text-xs text-muted-foreground">Gordura</p>
                      </div>
                    </motion.div>
                  )}
                </>
              )}

              <Button 
                className="w-full phase-gradient text-white mt-4"
                onClick={handleSave}
                disabled={saving || saved || !isAuthenticated || selectedFoods.length === 0}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </span>
                ) : saved ? (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Salvo!
                  </span>
                ) : !isAuthenticated ? (
                  'Faça login para salvar'
                ) : (
                  `Salvar Refeição${estimatedMacros ? ' com Macros' : ''}`
                )}
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AddMealDrawer;
