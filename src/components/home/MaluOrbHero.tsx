import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useCycle, CyclePhase } from '@/contexts/CycleContext';

const phaseInsights: Record<CyclePhase, {
  insight: string;
  season: string;
  emoji: string;
  orbColors: string;
  glowColor: string;
}> = {
  menstrual: {
    insight: 'A Malu notou que seu corpo pede recolhimento. É tempo de focar no essencial.',
    season: 'Inverno Interior',
    emoji: '🌙',
    orbColors: 'from-violet-500 via-purple-600 to-indigo-700',
    glowColor: 'bg-violet-500/20',
  },
  folicular: {
    insight: 'Sua energia está subindo! A Malu sugere aproveitar esse pico para iniciar novos projetos.',
    season: 'Primavera Interior',
    emoji: '🌱',
    orbColors: 'from-emerald-400 via-teal-500 to-cyan-600',
    glowColor: 'bg-emerald-500/20',
  },
  ovulatoria: {
    insight: 'Você está no seu ápice magnético! A Malu recomenda focar em conexões e comunicação hoje.',
    season: 'Verão Interior',
    emoji: '☀️',
    orbColors: 'from-amber-400 via-orange-500 to-rose-500',
    glowColor: 'bg-amber-500/20',
  },
  lutea: {
    insight: 'Seu corpo está desacelerando. A Malu lembra: produtividade agora é sobre organização, não exaustão.',
    season: 'Outono Interior',
    emoji: '🍂',
    orbColors: 'from-orange-500 via-amber-600 to-yellow-700',
    glowColor: 'bg-orange-500/20',
  },
};

const MaluOrbHero: React.FC = () => {
  const { currentPhase, cycleDay, hasDUM } = useCycle();
  const data = phaseInsights[currentPhase];

  if (!hasDUM) return null;

  return (
    <motion.div
      className="relative rounded-3xl overflow-hidden p-6 mb-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Background glow */}
      <div className={`absolute inset-0 ${data.glowColor} blur-3xl -z-10`} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 -z-10" />

      <div className="flex items-start gap-4">
        {/* Pulsating Orb */}
        <motion.div
          className={`relative flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br ${data.orbColors} flex items-center justify-center shadow-lg`}
          animate={{
            scale: [1, 1.06, 1],
            boxShadow: [
              '0 0 20px rgba(139, 92, 246, 0.3)',
              '0 0 40px rgba(139, 92, 246, 0.5)',
              '0 0 20px rgba(139, 92, 246, 0.3)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="w-6 h-6 text-white" />
          {/* Orbiting dot */}
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-white/80"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            style={{ top: -1, left: '50%', transformOrigin: '0 33px' }}
          />
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{data.emoji}</span>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">{data.season}</span>
            <span className="text-xs text-muted-foreground">· Dia {cycleDay}</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{data.insight}</p>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Insight da Malu IA
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default MaluOrbHero;
