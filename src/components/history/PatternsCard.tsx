import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, RefreshCw } from 'lucide-react';
import { useCycleInsights } from '@/hooks/useCycleInsights';
import { useCycle } from '@/contexts/CycleContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const PatternsCard: React.FC = () => {
  const { comparison, loading, refresh } = useCycleInsights();
  const { currentPhase, getPhaseInfo } = useCycle();
  const phaseInfo = getPhaseInfo();

  if (loading) {
    return (
      <motion.div
        className="glass-card p-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Skeleton className="h-6 w-40 mb-3" />
        <Skeleton className="h-20 w-full" />
      </motion.div>
    );
  }

  const hasData = comparison.previousLog || comparison.previousMeals.length > 0 || comparison.previousWorkout;

  return (
    <motion.div
      className="glass-card p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl phase-gradient">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Meus Padrões</h3>
            <p className="text-xs text-muted-foreground">Comparação com ciclo anterior</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={refresh}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {!hasData ? (
        <div className="text-center py-6 text-muted-foreground">
          <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            Ainda não temos dados do ciclo passado para comparar.
          </p>
          <p className="text-xs mt-1">
            Continue registrando para ver seus padrões!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Main Insight */}
          {comparison.insight && (
            <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Insight da fase {phaseInfo.name}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {comparison.insight}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Previous workout */}
          {comparison.previousWorkout && (
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Treino do ciclo passado</p>
              <p className="text-sm font-medium text-foreground">
                {comparison.previousWorkout.workout_name}
                {comparison.previousWorkout.completed && (
                  <span className="text-folicular ml-2">✓ Concluído</span>
                )}
              </p>
            </div>
          )}

          {/* Previous meals */}
          {comparison.previousMeals.length > 0 && (
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-2">Refeições do ciclo passado</p>
              <div className="flex flex-wrap gap-2">
                {comparison.previousMeals.map((meal, i) => (
                  <span 
                    key={i}
                    className="text-xs bg-background px-2 py-1 rounded-full text-foreground"
                  >
                    {meal.meal_name || meal.meal_type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Energy & Mood comparison */}
          {comparison.previousLog && (
            <div className="flex gap-3">
              {comparison.previousLog.energy !== null && (
                <div className="flex-1 bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Energia</p>
                  <p className="text-lg font-bold text-foreground">
                    {comparison.previousLog.energy}/10
                  </p>
                </div>
              )}
              {comparison.previousLog.mood !== null && (
                <div className="flex-1 bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Humor</p>
                  <p className="text-lg font-bold text-foreground">
                    {comparison.previousLog.mood}/10
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default PatternsCard;
