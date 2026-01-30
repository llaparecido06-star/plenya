import React from 'react';
import { motion } from 'framer-motion';
import { Battery, BatteryLow, BatteryMedium, BatteryFull, Sparkles } from 'lucide-react';
import { useCycle, CyclePhase } from '@/contexts/CycleContext';

interface PhaseInsight {
  emoji: string;
  batteryLabel: string;
  batteryLevel: 'low' | 'charging' | 'full' | 'sensitive';
  superpower: string;
  message: string;
  color: string;
  bgColor: string;
}

const phaseInsights: Record<CyclePhase, PhaseInsight> = {
  menstrual: {
    emoji: '🔋',
    batteryLabel: 'Bateria Social: Baixa',
    batteryLevel: 'low',
    superpower: 'Intuição',
    message: 'Seu superpoder hoje é a Intuição. Respeite seu descanso e ouça seu corpo.',
    color: 'text-menstrual',
    bgColor: 'bg-menstrual/10',
  },
  folicular: {
    emoji: '🚀',
    batteryLabel: 'Bateria Social: Recarregando',
    batteryLevel: 'charging',
    superpower: 'Criatividade',
    message: 'Ótimo momento para iniciar projetos e aprender coisas novas. Sua energia está subindo!',
    color: 'text-folicular',
    bgColor: 'bg-folicular/10',
  },
  ovulatoria: {
    emoji: '🔥',
    batteryLabel: 'Bateria Social: Máxima',
    batteryLevel: 'full',
    superpower: 'Magnetismo',
    message: 'Você está magnética! Hora de ter conversas difíceis, apresentações ou sair.',
    color: 'text-ovulatoria',
    bgColor: 'bg-ovulatoria/10',
  },
  lutea: {
    emoji: '🛡️',
    batteryLabel: 'Bateria Social: Sensível',
    batteryLevel: 'sensitive',
    superpower: 'Foco & Detalhismo',
    message: 'O foco e o detalhismo aumentam, mas a paciência diminui. Hora de organizar e finalizar.',
    color: 'text-lutea',
    bgColor: 'bg-lutea/10',
  },
};

const BatteryIcon: React.FC<{ level: PhaseInsight['batteryLevel']; className?: string }> = ({ level, className }) => {
  switch (level) {
    case 'low':
      return <BatteryLow className={className} />;
    case 'charging':
      return <BatteryMedium className={className} />;
    case 'full':
      return <BatteryFull className={className} />;
    case 'sensitive':
      return <Battery className={className} />;
    default:
      return <Battery className={className} />;
  }
};

const CycleSyncInsightCard: React.FC = () => {
  const { currentPhase, cycleDay, hasDUM, isLate } = useCycle();
  
  // Don't show if no DUM or if late (show late card instead)
  if (!hasDUM || isLate) return null;
  
  const insight = phaseInsights[currentPhase];

  return (
    <motion.div
      className={`glass-card p-4 mx-4 mt-4 ${insight.bgColor} border-l-4`}
      style={{ borderLeftColor: `hsl(var(--${currentPhase}))` }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-start gap-3">
        {/* Battery indicator */}
        <div className={`p-2 rounded-xl ${insight.bgColor}`}>
          <BatteryIcon level={insight.batteryLevel} className={`w-6 h-6 ${insight.color}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Header with battery status */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{insight.emoji}</span>
              <span className={`text-sm font-semibold ${insight.color}`}>
                {insight.batteryLabel}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">Dia {cycleDay}</span>
          </div>
          
          {/* Superpower badge */}
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className={`w-4 h-4 ${insight.color}`} />
            <span className="text-xs font-medium text-muted-foreground">
              Superpoder: <span className={`font-semibold ${insight.color}`}>{insight.superpower}</span>
            </span>
          </div>
          
          {/* Insight message */}
          <p className="text-sm text-foreground/80 leading-relaxed">
            {insight.message}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default CycleSyncInsightCard;
