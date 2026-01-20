import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Sparkles } from 'lucide-react';
import { useCycle, CyclePhase } from '@/contexts/CycleContext';

interface PhaseSuggestion {
  title: string;
  description: string;
  foods: string[];
  nutrients: string[];
}

const phaseSuggestions: Record<CyclePhase, PhaseSuggestion> = {
  menstrual: {
    title: 'Reposição & Conforto',
    description: 'Foco em alimentos ricos em ferro para repor as perdas e conforto.',
    foods: ['Espinafre', 'Carne vermelha', 'Chocolate amargo', 'Lentilha'],
    nutrients: ['Ferro', 'Vitamina C', 'Magnésio'],
  },
  folicular: {
    title: 'Energia & Renovação',
    description: 'Priorize alimentos que suportam a produção de estrogênio.',
    foods: ['Abacate', 'Ovos', 'Salmão', 'Sementes de linhaça'],
    nutrients: ['Vitamina E', 'Ômega 3', 'Zinco'],
  },
  ovulatoria: {
    title: 'Performance & Vitalidade',
    description: 'Maximize sua energia com alimentos antioxidantes.',
    foods: ['Frutas vermelhas', 'Vegetais crucíferos', 'Quinoa', 'Amêndoas'],
    nutrients: ['Antioxidantes', 'Fibras', 'Proteína'],
  },
  lutea: {
    title: 'Equilíbrio & Saciedade',
    description: 'Alimentos que ajudam a estabilizar o humor e reduzir a TPM.',
    foods: ['Banana', 'Batata doce', 'Grão-de-bico', 'Castanhas'],
    nutrients: ['Magnésio', 'Vitamina B6', 'Triptofano'],
  },
};

const HormonalSuggestion: React.FC = () => {
  const { currentPhase, getPhaseInfo } = useCycle();
  const suggestion = phaseSuggestions[currentPhase];
  const phaseInfo = getPhaseInfo();

  return (
    <motion.div
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
      <p className="text-sm text-muted-foreground mb-4">{suggestion.description}</p>

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
