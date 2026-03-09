import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Droplets, Dumbbell, Heart, Moon, Sparkles, UtensilsCrossed } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCycle } from '@/contexts/CycleContext';
import { useTranslation } from 'react-i18next';

const PMSPredictionCard: React.FC = () => {
  const { t } = useTranslation();
  const { cycleDay, cycleLength, hasDUM, isLate } = useCycle();

  const pmsData = useMemo(() => {
    if (!hasDUM || isLate) return null;

    // PMS window: last 7 days of the cycle (days cycleLength-6 to cycleLength)
    const pmsStartDay = cycleLength - 6;
    const daysUntilPMS = pmsStartDay - cycleDay;
    const daysUntilPeriod = cycleLength - cycleDay;
    const isInPMS = cycleDay >= pmsStartDay && cycleDay <= cycleLength;
    const isApproaching = daysUntilPMS > 0 && daysUntilPMS <= 3;
    const pmsDay = isInPMS ? cycleDay - pmsStartDay + 1 : 0;

    return { daysUntilPMS, daysUntilPeriod, isInPMS, isApproaching, pmsDay };
  }, [cycleDay, cycleLength, hasDUM, isLate]);

  if (!pmsData || (!pmsData.isInPMS && !pmsData.isApproaching)) return null;

  const { isInPMS, isApproaching, daysUntilPMS, daysUntilPeriod, pmsDay } = pmsData;

  // Intensity based on how close to menstruation
  const intensity = isInPMS
    ? daysUntilPeriod <= 2 ? 'high' : daysUntilPeriod <= 4 ? 'medium' : 'low'
    : 'approaching';

  const intensityConfig = {
    approaching: {
      gradient: 'from-amber-500/10 to-orange-500/10',
      border: 'border-amber-500/20',
      badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
      emoji: '⚡',
    },
    low: {
      gradient: 'from-orange-500/10 to-rose-500/10',
      border: 'border-orange-500/20',
      badge: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
      emoji: '🌊',
    },
    medium: {
      gradient: 'from-rose-500/10 to-pink-500/10',
      border: 'border-rose-500/20',
      badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
      emoji: '🔥',
    },
    high: {
      gradient: 'from-red-500/15 to-rose-500/15',
      border: 'border-red-500/20',
      badge: 'bg-red-500/15 text-red-700 dark:text-red-300',
      emoji: '🌋',
    },
  };

  const config = intensityConfig[intensity];

  // Tips based on intensity
  const tips = useMemo(() => {
    if (isApproaching) {
      return [
        { icon: UtensilsCrossed, text: t('pms.tip_approaching_food'), color: 'text-amber-600' },
        { icon: Dumbbell, text: t('pms.tip_approaching_exercise'), color: 'text-amber-600' },
      ];
    }
    if (intensity === 'low') {
      return [
        { icon: UtensilsCrossed, text: t('pms.tip_low_food'), color: 'text-orange-600' },
        { icon: Dumbbell, text: t('pms.tip_low_exercise'), color: 'text-orange-600' },
        { icon: Droplets, text: t('pms.tip_low_selfcare'), color: 'text-orange-600' },
      ];
    }
    if (intensity === 'medium') {
      return [
        { icon: UtensilsCrossed, text: t('pms.tip_medium_food'), color: 'text-rose-600' },
        { icon: Moon, text: t('pms.tip_medium_sleep'), color: 'text-rose-600' },
        { icon: Heart, text: t('pms.tip_medium_selfcare'), color: 'text-rose-600' },
      ];
    }
    return [
      { icon: UtensilsCrossed, text: t('pms.tip_high_food'), color: 'text-red-600' },
      { icon: Moon, text: t('pms.tip_high_rest'), color: 'text-red-600' },
      { icon: Heart, text: t('pms.tip_high_selfcare'), color: 'text-red-600' },
    ];
  }, [intensity, isApproaching, t]);

  return (
    <div className="px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className={`bg-gradient-to-br ${config.gradient} ${config.border} border overflow-hidden`}>
          <CardContent className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{config.emoji}</span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {isInPMS ? t('pms.title_active') : t('pms.title_approaching')}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isInPMS
                      ? t('pms.subtitle_active', { day: pmsDay, daysLeft: daysUntilPeriod })
                      : t('pms.subtitle_approaching', { days: daysUntilPMS })}
                  </p>
                </div>
              </div>
              <Badge className={`${config.badge} border-0 text-[10px]`}>
                {isInPMS
                  ? t(`pms.intensity_${intensity}`)
                  : t('pms.badge_soon')}
              </Badge>
            </div>

            {/* Progress bar for PMS window */}
            {isInPMS && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{t('pms.pms_start')}</span>
                  <span>{t('pms.menstruation')}</span>
                </div>
                <div className="h-1.5 bg-background/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(pmsDay / 7) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {t('pms.tips_title')}
              </p>
              {tips.map((tip, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-2"
                >
                  <tip.icon className={`w-3.5 h-3.5 mt-0.5 ${tip.color} shrink-0`} />
                  <p className="text-xs text-foreground/80">{tip.text}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PMSPredictionCard;
