import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Sparkles } from 'lucide-react';
import { useCycle, CyclePhase } from '@/contexts/CycleContext';
import { useProfile } from '@/hooks/useProfile';

interface PhaseSuggestion {
  title: string;
  description: string;
  foods: string[];
  nutrients: string[];
}

// Base suggestions per phase with dietary alternatives
const phaseSuggestionsBase: Record<CyclePhase, {
  title: string;
  description: string;
  nutrients: string[];
  foods: {
    default: string[];
    vegetarian: string[];
    vegan: string[];
    low_carb: string[];
    lactose_free: string[];
  };
}> = {
  menstrual: {
    title: 'Reposição & Conforto',
    description: 'Foco em alimentos ricos em ferro para repor as perdas e conforto.',
    nutrients: ['Ferro', 'Vitamina C', 'Magnésio'],
    foods: {
      default: ['Espinafre', 'Carne vermelha', 'Chocolate amargo', 'Lentilha'],
      vegetarian: ['Espinafre', 'Lentilha', 'Chocolate amargo', 'Feijão preto', 'Beterraba'],
      vegan: ['Espinafre', 'Lentilha', 'Chocolate amargo 70%', 'Grão-de-bico', 'Quinoa'],
      low_carb: ['Espinafre', 'Carne vermelha', 'Chocolate amargo 85%', 'Fígado'],
      lactose_free: ['Espinafre', 'Carne vermelha', 'Chocolate amargo', 'Lentilha'],
    },
  },
  folicular: {
    title: 'Energia & Renovação',
    description: 'Priorize alimentos que suportam a produção de estrogênio.',
    nutrients: ['Vitamina E', 'Ômega 3', 'Zinco'],
    foods: {
      default: ['Abacate', 'Ovos', 'Salmão', 'Sementes de linhaça'],
      vegetarian: ['Abacate', 'Ovos', 'Sementes de linhaça', 'Nozes', 'Tofu'],
      vegan: ['Abacate', 'Sementes de linhaça', 'Nozes', 'Tofu', 'Sementes de chia'],
      low_carb: ['Abacate', 'Ovos', 'Salmão', 'Azeite de oliva'],
      lactose_free: ['Abacate', 'Ovos', 'Salmão', 'Sementes de linhaça'],
    },
  },
  ovulatoria: {
    title: 'Performance & Vitalidade',
    description: 'Maximize sua energia com alimentos antioxidantes.',
    nutrients: ['Antioxidantes', 'Fibras', 'Proteína'],
    foods: {
      default: ['Frutas vermelhas', 'Vegetais crucíferos', 'Quinoa', 'Amêndoas'],
      vegetarian: ['Frutas vermelhas', 'Brócolis', 'Quinoa', 'Amêndoas', 'Lentilha'],
      vegan: ['Frutas vermelhas', 'Couve-flor', 'Quinoa', 'Amêndoas', 'Edamame'],
      low_carb: ['Frutas vermelhas', 'Brócolis', 'Amêndoas', 'Couve-flor'],
      lactose_free: ['Frutas vermelhas', 'Vegetais crucíferos', 'Quinoa', 'Amêndoas'],
    },
  },
  lutea: {
    title: 'Equilíbrio & Saciedade',
    description: 'Alimentos que ajudam a estabilizar o humor e reduzir a TPM.',
    nutrients: ['Magnésio', 'Vitamina B6', 'Triptofano'],
    foods: {
      default: ['Banana', 'Batata doce', 'Grão-de-bico', 'Castanhas'],
      vegetarian: ['Banana', 'Batata doce', 'Grão-de-bico', 'Castanhas', 'Queijo'],
      vegan: ['Banana', 'Batata doce', 'Grão-de-bico', 'Castanhas', 'Sementes de abóbora'],
      low_carb: ['Abacate', 'Castanhas', 'Chocolate amargo 85%', 'Ovos'],
      lactose_free: ['Banana', 'Batata doce', 'Grão-de-bico', 'Castanhas'],
    },
  },
};

const HormonalSuggestion: React.FC = () => {
  const { currentPhase, getPhaseInfo } = useCycle();
  const { diet_type } = useProfile();
  const phaseInfo = getPhaseInfo();

  const suggestion = useMemo((): PhaseSuggestion => {
    const base = phaseSuggestionsBase[currentPhase];
    
    // Map diet_type to the correct key
    const dietKey = (diet_type as keyof typeof base.foods) || 'default';
    const foods = base.foods[dietKey] || base.foods.default;

    return {
      title: base.title,
      description: base.description,
      nutrients: base.nutrients,
      foods,
    };
  }, [currentPhase, diet_type]);

  return (
    <motion.div
      id="hormonal-suggestion"
      className="glass-card p-5 mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-xl phase-gradient">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Sugestão Hormonal</h3>
          <p className="text-xs text-muted-foreground">Fase {phaseInfo.name}</p>
        </div>
      </div>

      <h4 className="text-lg font-semibold text-primary mb-2">{suggestion.title}</h4>
      <p className="text-sm text-foreground/70 mb-4">{suggestion.description}</p>

      <div className="space-y-3">
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Alimentos Recomendados
          </span>
          <div className="flex flex-wrap gap-2 mt-2">
            {suggestion.foods.map((food) => (
              <span
                key={food}
                className="px-3 py-1 bg-phase-secondary/30 text-phase-primary rounded-full text-sm font-medium"
              >
                {food}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Nutrientes Chave
          </span>
          <div className="flex flex-wrap gap-2 mt-2">
            {suggestion.nutrients.map((nutrient) => (
              <span
                key={nutrient}
                className="flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
              >
                <Leaf className="w-3 h-3" />
                {nutrient}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HormonalSuggestion;
