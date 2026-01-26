import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Camera, Mic, Keyboard, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useCycle } from '@/contexts/CycleContext';
import { useProfile } from '@/hooks/useProfile';

// Diet-specific restrictions
const dietRestrictions: Record<string, string[]> = {
  vegan: ['carne', 'frango', 'peixe', 'ovos', 'leite', 'queijo', 'manteiga', 'mel', 'iogurte'],
  vegetarian: ['carne', 'frango', 'peixe', 'bacon', 'linguiça'],
  lactose_free: ['leite', 'queijo', 'manteiga', 'iogurte', 'creme de leite', 'requeijão'],
  low_carb: ['pão', 'arroz', 'macarrão', 'batata', 'açúcar', 'farinha'],
};

// Diet-aware recipe alternatives
const getRecipeForDiet = (phase: string, dietType: string | null) => {
  const baseRecipes = {
    menstrual: {
      name: 'Omelete Anti-Inflamatória',
      description: 'Rica em ferro e anti-inflamatórios para aliviar cólicas',
      ingredients: ['2 ovos', 'Espinafre fresco', 'Cúrcuma em pó', 'Azeite de oliva', 'Sal rosa'],
      instructions: [
        'Bata os ovos com uma pitada de cúrcuma',
        'Refogue o espinafre no azeite',
        'Adicione os ovos e cozinhe em fogo baixo',
        'Dobre ao meio e sirva',
      ],
      time: '10 min',
      benefits: ['🩸 Rico em Ferro', '🔥 Anti-inflamatório', '💪 Proteína'],
    },
    folicular: {
      name: 'Bowl Energizante',
      description: 'Carboidratos complexos para energia sustentada',
      ingredients: ['Quinoa', 'Frango grelhado', 'Abacate', 'Grão de bico', 'Limão'],
      instructions: [
        'Cozinhe a quinoa conforme instruções',
        'Grelhe o frango temperado',
        'Monte o bowl com todos os ingredientes',
        'Finalize com limão espremido',
      ],
      time: '25 min',
      benefits: ['⚡ Energia', '🥗 Fibras', '🧠 Foco'],
    },
    ovulatoria: {
      name: 'Salada Glow',
      description: 'Antioxidantes para pele radiante e vitalidade',
      ingredients: ['Mix de folhas', 'Salmão', 'Sementes de chia', 'Frutas vermelhas', 'Azeite'],
      instructions: [
        'Grelhe o salmão com ervas',
        'Monte a base com folhas frescas',
        'Adicione as frutas e sementes',
        'Finalize com azeite extra virgem',
      ],
      time: '20 min',
      benefits: ['✨ Antioxidantes', '🐟 Ômega-3', '💅 Pele'],
    },
    lutea: {
      name: 'Smoothie Calmante',
      description: 'Magnésio e triptofano para equilibrar o humor',
      ingredients: ['Banana', 'Cacau em pó', 'Leite de amêndoas', 'Manteiga de amendoim', 'Mel'],
      instructions: [
        'Congele a banana previamente',
        'Bata todos os ingredientes no liquidificador',
        'Ajuste a consistência com mais leite se necessário',
        'Sirva gelado com cacau por cima',
      ],
      time: '5 min',
      benefits: ['🧘 Relaxante', '🍫 Magnésio', '😴 Triptofano'],
    },
  };

  // Vegan alternatives
  const veganRecipes = {
    menstrual: {
      name: 'Tofu Refogado com Espinafre',
      description: 'Rico em ferro vegetal e anti-inflamatórios',
      ingredients: ['200g tofu firme', 'Espinafre fresco', 'Cúrcuma em pó', 'Azeite de oliva', 'Limão'],
      instructions: [
        'Corte o tofu em cubos e tempere com cúrcuma',
        'Doure o tofu no azeite até ficar crocante',
        'Adicione o espinafre e refogue rapidamente',
        'Finalize com limão espremido',
      ],
      time: '15 min',
      benefits: ['🩸 Rico em Ferro', '🔥 Anti-inflamatório', '🌱 100% Vegano'],
    },
    folicular: {
      name: 'Bowl Vegano Proteico',
      description: 'Energia e proteína vegetal para sua fase ativa',
      ingredients: ['Quinoa', 'Grão de bico assado', 'Abacate', 'Edamame', 'Tahine'],
      instructions: [
        'Cozinhe a quinoa conforme instruções',
        'Asse o grão de bico com especiarias',
        'Monte o bowl com todos os ingredientes',
        'Finalize com tahine e limão',
      ],
      time: '25 min',
      benefits: ['⚡ Energia', '💪 Proteína vegetal', '🧠 Foco'],
    },
    ovulatoria: {
      name: 'Salada Rainbow Vegana',
      description: 'Antioxidantes coloridos para brilhar',
      ingredients: ['Mix de folhas', 'Beterraba ralada', 'Cenoura', 'Sementes de girassol', 'Azeite'],
      instructions: [
        'Rale a beterraba e a cenoura',
        'Monte a base com folhas frescas',
        'Adicione os legumes e sementes',
        'Finalize com azeite e vinagre balsâmico',
      ],
      time: '15 min',
      benefits: ['✨ Antioxidantes', '🌈 Vitaminas', '💅 Pele'],
    },
    lutea: {
      name: 'Smoothie Vegano Calmante',
      description: 'Magnésio e conforto sem ingredientes animais',
      ingredients: ['Banana', 'Cacau em pó', 'Leite de coco', 'Pasta de amendoim', 'Tâmaras'],
      instructions: [
        'Congele a banana previamente',
        'Bata todos os ingredientes no liquidificador',
        'Ajuste a consistência com mais leite se necessário',
        'Sirva gelado com cacau por cima',
      ],
      time: '5 min',
      benefits: ['🧘 Relaxante', '🍫 Magnésio', '🌱 100% Vegano'],
    },
  };

  // Vegetarian alternatives (no meat/fish)
  const vegetarianRecipes = {
    ...baseRecipes,
    folicular: {
      name: 'Bowl Vegetariano',
      description: 'Proteína de leguminosas para energia sustentada',
      ingredients: ['Quinoa', 'Ovo poché', 'Abacate', 'Grão de bico', 'Limão'],
      instructions: [
        'Cozinhe a quinoa conforme instruções',
        'Prepare o ovo poché',
        'Monte o bowl com todos os ingredientes',
        'Finalize com limão espremido',
      ],
      time: '25 min',
      benefits: ['⚡ Energia', '🥗 Fibras', '🥚 Proteína'],
    },
    ovulatoria: {
      name: 'Salada Caprese Glow',
      description: 'Antioxidantes do tomate e proteína do queijo',
      ingredients: ['Tomate', 'Mozzarella de búfala', 'Manjericão', 'Sementes de chia', 'Azeite'],
      instructions: [
        'Fatie o tomate e a mozzarella',
        'Intercale as fatias com folhas de manjericão',
        'Adicione as sementes de chia',
        'Finalize com azeite e flor de sal',
      ],
      time: '10 min',
      benefits: ['✨ Antioxidantes', '🧀 Cálcio', '💅 Pele'],
    },
  };

  // Low carb alternatives
  const lowCarbRecipes = {
    ...baseRecipes,
    folicular: {
      name: 'Bowl Low Carb Proteico',
      description: 'Alta proteína sem carboidratos extras',
      ingredients: ['Couve-flor ralada', 'Frango grelhado', 'Abacate', 'Ovos', 'Azeite'],
      instructions: [
        'Refogue a couve-flor ralada (arroz de couve-flor)',
        'Grelhe o frango temperado',
        'Monte o bowl com ovo cozido',
        'Finalize com abacate e azeite',
      ],
      time: '25 min',
      benefits: ['⚡ Energia', '💪 Proteína', '🥑 Low Carb'],
    },
  };

  // Lactose-free alternatives
  const lactoseFreeRecipes = {
    ...baseRecipes,
    lutea: {
      name: 'Smoothie Sem Lactose',
      description: 'Magnésio e conforto sem laticínios',
      ingredients: ['Banana', 'Cacau em pó', 'Leite de coco', 'Manteiga de amendoim', 'Mel'],
      instructions: [
        'Congele a banana previamente',
        'Bata todos os ingredientes no liquidificador',
        'Ajuste a consistência com mais leite se necessário',
        'Sirva gelado com cacau por cima',
      ],
      time: '5 min',
      benefits: ['🧘 Relaxante', '🍫 Magnésio', '🥛 Sem Lactose'],
    },
  };

  // Select recipe based on diet
  switch (dietType) {
    case 'vegan':
      return veganRecipes[phase as keyof typeof veganRecipes] || baseRecipes[phase as keyof typeof baseRecipes];
    case 'vegetarian':
      return vegetarianRecipes[phase as keyof typeof vegetarianRecipes] || baseRecipes[phase as keyof typeof baseRecipes];
    case 'low_carb':
      return lowCarbRecipes[phase as keyof typeof lowCarbRecipes] || baseRecipes[phase as keyof typeof baseRecipes];
    case 'lactose_free':
      return lactoseFreeRecipes[phase as keyof typeof lactoseFreeRecipes] || baseRecipes[phase as keyof typeof baseRecipes];
    default:
      return baseRecipes[phase as keyof typeof baseRecipes];
  }
};

const ChefIACard: React.FC = () => {
  const { currentPhase } = useCycle();
  const { diet_type } = useProfile();
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRecipe, setShowRecipe] = useState(false);

  const recipe = getRecipeForDiet(currentPhase, diet_type);

  // Get diet label for display
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

  const handleInputMethod = (method: string) => {
    setLoading(true);
    // Simulate AI processing
    setTimeout(() => {
      setLoading(false);
      setShowRecipe(true);
    }, 2000);
  };

  const resetState = () => {
    setShowRecipe(false);
    setLoading(false);
  };

  return (
    <>
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
              <h3 className="font-semibold text-foreground">Chef IA</h3>
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-xs font-medium text-amber-600">
                Premium
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {diet_type && getDietLabel(diet_type) 
                ? `Receitas ${getDietLabel(diet_type)}s para você` 
                : 'O que tem na sua geladeira?'}
            </p>
          </div>
          <Sparkles className="w-5 h-5 text-amber-500" />
        </div>
      </motion.button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-amber-500" />
              Chef IA
              {diet_type && getDietLabel(diet_type) && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-normal">
                  {getDietLabel(diet_type)}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {diet_type 
                ? `Receitas personalizadas para sua dieta ${getDietLabel(diet_type)?.toLowerCase()} e fase do ciclo!`
                : 'Me conte o que você tem na geladeira e vou criar uma receita personalizada para sua fase!'}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <motion.div
              className="flex flex-col items-center justify-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
              <p className="text-muted-foreground">Criando receita personalizada...</p>
              {diet_type && (
                <p className="text-xs text-muted-foreground mt-2">
                  Respeitando sua dieta {getDietLabel(diet_type)?.toLowerCase()}
                </p>
              )}
            </motion.div>
          ) : showRecipe ? (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-foreground">{recipe.name}</h4>
                  <span className="text-xs text-muted-foreground">⏱️ {recipe.time}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{recipe.description}</p>
                <div className="flex gap-2 flex-wrap">
                  {recipe.benefits.map((benefit, i) => (
                    <span key={i} className="px-2 py-1 rounded-full bg-white/80 dark:bg-black/20 text-xs">
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-medium text-foreground mb-2">📝 Ingredientes</h5>
                <ul className="space-y-1">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h5 className="font-medium text-foreground mb-2">👩‍🍳 Modo de Preparo</h5>
                <ol className="space-y-2">
                  {recipe.instructions.map((step, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="font-semibold text-primary">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <Button className="w-full" variant="outline" onClick={resetState}>
                Gerar Nova Receita
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-center text-muted-foreground mb-4">
                Escolha como deseja informar seus ingredientes:
              </p>
              
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="flex flex-col h-24 gap-2"
                  onClick={() => handleInputMethod('photo')}
                >
                  <Camera className="w-6 h-6 text-primary" />
                  <span className="text-xs">Foto</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col h-24 gap-2"
                  onClick={() => handleInputMethod('voice')}
                >
                  <Mic className="w-6 h-6 text-primary" />
                  <span className="text-xs">Voz</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col h-24 gap-2"
                  onClick={() => handleInputMethod('text')}
                >
                  <Keyboard className="w-6 h-6 text-primary" />
                  <span className="text-xs">Digitar</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChefIACard;
