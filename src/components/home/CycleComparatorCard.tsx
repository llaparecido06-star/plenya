import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Sparkles, Heart, Zap, Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCycleComparator } from '@/hooks/useCycleComparator';
import { translateSymptom } from '@/lib/symptomTranslations';

const CycleComparatorCard: React.FC = () => {
  const { t } = useTranslation();
  const { currentCycle, previousCycles, comparison, loading, hasData } = useCycleComparator();
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="px-4">
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!hasData) {
    return null;
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4" />;
      case 'down': return <TrendingDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable', isStressInverted = false) => {
    // For stress, "up" is bad and "down" is good
    if (isStressInverted) {
      switch (trend) {
        case 'up': return 'text-destructive';
        case 'down': return 'text-green-500';
        default: return 'text-muted-foreground';
      }
    }
    switch (trend) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const formatDiff = (diff: number) => {
    if (diff > 0) return `+${diff}`;
    return diff.toString();
  };

  return (
    <div className="px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-primary" />
                {t('cycle_comparator.title', 'Comparador de Ciclos')}
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                {t('cycle_comparator.ai_insights', 'IA')}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Comparison Summary */}
            {comparison && (
              <div className="grid grid-cols-3 gap-3">
                {/* Mood */}
                <div className="bg-background/50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Heart className="w-4 h-4 text-pink-500" />
                    <span className={`text-sm font-medium ${getTrendColor(comparison.moodTrend)}`}>
                      {getTrendIcon(comparison.moodTrend)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('cycle_comparator.mood', 'Humor')}</p>
                  <p className={`text-sm font-semibold ${getTrendColor(comparison.moodTrend)}`}>
                    {formatDiff(comparison.moodDiff)}
                  </p>
                </div>

                {/* Energy */}
                <div className="bg-background/50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className={`text-sm font-medium ${getTrendColor(comparison.energyTrend)}`}>
                      {getTrendIcon(comparison.energyTrend)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('cycle_comparator.energy', 'Energia')}</p>
                  <p className={`text-sm font-semibold ${getTrendColor(comparison.energyTrend)}`}>
                    {formatDiff(comparison.energyDiff)}
                  </p>
                </div>

                {/* Stress */}
                <div className="bg-background/50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Brain className="w-4 h-4 text-purple-500" />
                    <span className={`text-sm font-medium ${getTrendColor(comparison.stressTrend, true)}`}>
                      {getTrendIcon(comparison.stressTrend)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('cycle_comparator.stress', 'Estresse')}</p>
                  <p className={`text-sm font-semibold ${getTrendColor(comparison.stressTrend, true)}`}>
                    {formatDiff(comparison.stressDiff)}
                  </p>
                </div>
              </div>
            )}

            {/* Current vs Previous Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-primary">{currentCycle?.label}</span>
                <span className="text-muted-foreground">
                  {t('cycle_comparator.avg_scores', 'Médias')}: 
                  <span className="ml-1">😊 {currentCycle?.avgMood}</span>
                  <span className="ml-2">⚡ {currentCycle?.avgEnergy}</span>
                </span>
              </div>
              
              {previousCycles.slice(0, 1).map((cycle) => (
                <div key={cycle.cycleNumber} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{cycle.label}</span>
                  <span className="text-muted-foreground">
                    {t('cycle_comparator.avg_scores', 'Médias')}: 
                    <span className="ml-1">😊 {cycle.avgMood}</span>
                    <span className="ml-2">⚡ {cycle.avgEnergy}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Expand/Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full text-xs"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  {t('cycle_comparator.hide_details', 'Ocultar detalhes')}
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  {t('cycle_comparator.show_details', 'Ver detalhes por dia')}
                </>
              )}
            </Button>

            {/* Expanded Details */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 pt-2 border-t border-border/50">
                    {/* Day-by-Day Comparison */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        {t('cycle_comparator.day_comparison', 'Comparação por Dia')}
                      </p>
                      
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: Math.min(14, currentCycle?.days.length || 0) }, (_, i) => {
                          const currentDay = currentCycle?.days.find(d => d.day === i + 1);
                          const prevDay = previousCycles[0]?.days.find(d => d.day === i + 1);
                          
                          const moodDiff = (currentDay?.mood || 0) - (prevDay?.mood || 0);
                          
                          let bgColor = 'bg-muted';
                          if (currentDay?.mood) {
                            if (moodDiff > 0) bgColor = 'bg-green-500/30';
                            else if (moodDiff < 0) bgColor = 'bg-red-500/30';
                            else bgColor = 'bg-primary/20';
                          }
                          
                          return (
                            <div
                              key={i}
                              className={`aspect-square rounded flex items-center justify-center text-xs ${bgColor}`}
                              title={`Dia ${i + 1}: Humor ${currentDay?.mood || '-'}`}
                            >
                              {i + 1}
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded bg-green-500/30" />
                          {t('cycle_comparator.better', 'Melhor')}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded bg-red-500/30" />
                          {t('cycle_comparator.worse', 'Pior')}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded bg-primary/20" />
                          {t('cycle_comparator.same', 'Igual')}
                        </span>
                      </div>
                    </div>

                    {/* Top Symptoms Comparison */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        {t('cycle_comparator.top_symptoms', 'Sintomas Mais Frequentes')}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-medium text-primary min-w-16">
                            {currentCycle?.label}:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {currentCycle?.topSymptoms.length ? (
                              currentCycle.topSymptoms.map((s) => (
                                <Badge key={s} variant="secondary" className="text-xs">
                                  {translateSymptom(s)}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {t('cycle_comparator.no_symptoms', 'Nenhum registrado')}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {previousCycles.slice(0, 1).map((cycle) => (
                          <div key={cycle.cycleNumber} className="flex items-start gap-2">
                            <span className="text-xs text-muted-foreground min-w-16">
                              {cycle.label}:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {cycle.topSymptoms.length ? (
                                cycle.topSymptoms.map((s) => (
                                  <Badge key={s} variant="outline" className="text-xs">
                                    {translateSymptom(s)}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  {t('cycle_comparator.no_symptoms', 'Nenhum registrado')}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CycleComparatorCard;
