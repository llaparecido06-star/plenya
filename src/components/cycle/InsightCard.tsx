import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useCycle } from '@/contexts/CycleContext';

const InsightCard: React.FC = () => {
  const { getPhaseInfo, currentPhase } = useCycle();
  const phaseInfo = getPhaseInfo();

  const energyLabels = {
    baixa: 'Energia Baixa',
    crescente: 'Energia Crescente',
    alta: 'Energia Alta',
    decrescente: 'Energia Decrescente',
  };

  const energyColors = {
    baixa: 'bg-menstrual/20 text-menstrual',
    crescente: 'bg-folicular/20 text-folicular',
    alta: 'bg-ovulatoria/20 text-ovulatoria',
    decrescente: 'bg-lutea/20 text-lutea',
  };

  return (
    <motion.div
      className="glass-card p-5 mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl phase-gradient">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-foreground">Insight do Dia</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${energyColors[phaseInfo.energyLevel]}`}>
              {energyLabels[phaseInfo.energyLevel]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {phaseInfo.insight}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default InsightCard;
