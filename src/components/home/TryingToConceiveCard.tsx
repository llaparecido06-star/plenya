import React from 'react';
import { motion } from 'framer-motion';
import { Star, Sparkles, Heart } from 'lucide-react';
import { useCycle } from '@/contexts/CycleContext';

const TryingToConceiveCard: React.FC = () => {
  const { cycleDay, cycleLength, hasDUM, isLate } = useCycle();

  // Don't show fertile window when no DUM registered or period is late
  // Fertile predictions are unreliable in these states
  if (!hasDUM || isLate) return null;

  // Calculate fertile window (typically days 10-16 of a 28-day cycle)
  // Adjusted based on actual cycle length
  const ovulationDay = cycleLength - 14;
  const fertileStart = ovulationDay - 4;
  const fertileEnd = ovulationDay + 1;
  const isInFertileWindow = cycleDay >= fertileStart && cycleDay <= fertileEnd;
  const isOvulationDay = cycleDay === ovulationDay;

  // Days until fertile window or days remaining in it
  const daysUntilFertile = fertileStart - cycleDay;
  const daysRemainingFertile = fertileEnd - cycleDay;

  if (isInFertileWindow) {
    return (
      <motion.div
        className="mx-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="relative overflow-hidden glass-card p-5 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-2 border-amber-500/30">
          {/* Sparkle effects */}
          <motion.div
            className="absolute top-2 right-2"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <Star className="w-5 h-5 text-amber-500" fill="currentColor" />
          </motion.div>
          <motion.div
            className="absolute bottom-3 right-8"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
          </motion.div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
              <span className="text-4xl">✨</span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-amber-600">
                  {isOvulationDay ? '🌟 Dia da Ovulação!' : 'Janela Fértil Aberta'}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {isOvulationDay 
                  ? 'Momento de maior fertilidade do ciclo'
                  : `${daysRemainingFertile + 1} dias de oportunidade`}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i}
                    className={`w-4 h-4 ${i <= daysRemainingFertile ? 'text-amber-500' : 'text-muted'}`}
                    fill={i <= daysRemainingFertile ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Action hint */}
          <div className="mt-4 p-3 bg-amber-500/10 rounded-xl">
            <p className="text-sm text-amber-700 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Registre relações no QuickLog para histórico
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Not in fertile window
  if (daysUntilFertile > 0 && daysUntilFertile <= 7) {
    return (
      <motion.div
        className="mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="glass-card p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Star className="w-7 h-7 text-primary" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Próxima Janela Fértil</h3>
              <p className="text-sm text-muted-foreground">
                Em <span className="font-bold text-primary">{daysUntilFertile}</span> dias
              </p>
            </div>

            <div className="text-right">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i}
                    className="w-3 h-3 text-muted"
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Prepare-se</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default TryingToConceiveCard;
