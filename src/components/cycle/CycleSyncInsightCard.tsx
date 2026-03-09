import React from 'react';
import { motion } from 'framer-motion';
import { Battery, BatteryLow, BatteryMedium, BatteryFull, Sparkles } from 'lucide-react';
import { useCycle, CyclePhase } from '@/contexts/CycleContext';
import { useLifePhase } from '@/hooks/useLifePhase';
import { useTranslation } from 'react-i18next';

interface PhaseInsight {
  emoji: string;
  batteryLabel: string;
  batteryLevel: 'low' | 'charging' | 'full' | 'sensitive';
  superpower: string;
  message: string;
  color: string;
  bgColor: string;
}

// Default menstruating phase insights
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

// Postpartum-adapted labels
const postpartumInsight: PhaseInsight = {
  emoji: '💜',
  batteryLabel: 'Bateria Social: Adaptando',
  batteryLevel: 'charging',
  superpower: 'Resiliência',
  message: 'Seu superpoder agora é a Resiliência. Cada dia é uma conquista. Esteja presente e cuide de si.',
  color: 'text-primary',
  bgColor: 'bg-primary/10',
};

// Menopause-adapted labels
const menopauseInsight: PhaseInsight = {
  emoji: '🌿',
  batteryLabel: 'Equilíbrio Hormonal',
  batteryLevel: 'charging',
  superpower: 'Vitalidade Prateada',
  message: 'Seu superpoder é a Vitalidade Prateada. Sabedoria e autocuidado são sua força.',
  color: 'text-leaf-green',
  bgColor: 'bg-leaf-green/10',
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
  const { lifePhase } = useLifePhase();
  
  // For postpartum and menopause, show adapted cards
  if (lifePhase === 'postpartum') {
    return <InsightDisplay insight={postpartumInsight} />;
  }
  
  if (lifePhase === 'menopause') {
    return <InsightDisplay insight={menopauseInsight} />;
  }
  
  // Don't show if no DUM or if late (show late card instead) for menstruating
  if (!hasDUM || isLate) return null;
  
  const insight = phaseInsights[currentPhase];

  return <InsightDisplay insight={insight} cycleDay={cycleDay} phase={currentPhase} />;
};

const InsightDisplay: React.FC<{ insight: PhaseInsight; cycleDay?: number; phase?: CyclePhase }> = ({ insight, cycleDay, phase }) => {
  return (
    <motion.div
      className={`glass-card p-4 mx-4 mt-4 ${insight.bgColor} border-l-4`}
      style={phase ? { borderLeftColor: `hsl(var(--${phase}))` } : { borderLeftColor: 'hsl(var(--primary))' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl ${insight.bgColor}`}>
          <BatteryIcon level={insight.batteryLevel} className={`w-6 h-6 ${insight.color}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{insight.emoji}</span>
              <span className={`text-sm font-semibold ${insight.color}`}>
                {insight.batteryLabel}
              </span>
            </div>
            {cycleDay !== undefined && (
              <span className="text-xs text-muted-foreground">Dia {cycleDay}</span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className={`w-4 h-4 ${insight.color}`} />
            <span className="text-xs font-medium text-muted-foreground">
              Superpoder: <span className={`font-semibold ${insight.color}`}>{insight.superpower}</span>
            </span>
          </div>
          
          <p className="text-sm text-foreground/80 leading-relaxed">
            {insight.message}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default CycleSyncInsightCard;
