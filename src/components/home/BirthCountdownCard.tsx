import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Timer, PartyPopper, Baby, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLifePhase } from '@/hooks/useLifePhase';
import { useNotifications } from '@/hooks/useNotifications';

interface Milestone {
  days: number;
  emoji: string;
  labelKey: string;
}

const milestones: Milestone[] = [
  { days: 200, emoji: '🌟', labelKey: 'pregnancy.milestone_200' },
  { days: 150, emoji: '💪', labelKey: 'pregnancy.milestone_150' },
  { days: 100, emoji: '🎯', labelKey: 'pregnancy.milestone_100' },
  { days: 50, emoji: '🎉', labelKey: 'pregnancy.milestone_50' },
  { days: 30, emoji: '🤰', labelKey: 'pregnancy.milestone_30' },
  { days: 14, emoji: '💝', labelKey: 'pregnancy.milestone_14' },
  { days: 7, emoji: '🍼', labelKey: 'pregnancy.milestone_7' },
];

const BirthCountdownCard: React.FC = () => {
  const { t } = useTranslation();
  const { pregnancyStartDate, pregnancyWeeks } = useLifePhase();
  const { permission, showNotification } = useNotifications();

  const daysPregnant = pregnancyStartDate
    ? Math.floor((Date.now() - pregnancyStartDate.getTime()) / 86400000)
    : 0;
  const totalDays = 280;
  const daysRemaining = Math.max(0, totalDays - daysPregnant);
  const progressPercent = Math.min(100, (daysPregnant / totalDays) * 100);

  // Find next and passed milestones
  const passedMilestones = milestones.filter(m => daysRemaining <= m.days);
  const nextMilestone = milestones.filter(m => daysRemaining > m.days).sort((a, b) => b.days - a.days)[0];
  const currentMilestone = passedMilestones.length > 0 ? passedMilestones[passedMilestones.length - 1] : null;

  // Milestone notification trigger
  useEffect(() => {
    if (permission !== 'granted' || !pregnancyStartDate) return;
    
    const notifiedKey = `plenya_milestone_notified`;
    const notified = JSON.parse(localStorage.getItem(notifiedKey) || '[]') as number[];
    
    for (const milestone of milestones) {
      if (daysRemaining <= milestone.days && daysRemaining >= milestone.days - 1 && !notified.includes(milestone.days)) {
        showNotification(
          `${milestone.emoji} ${t(milestone.labelKey)}!`,
          t('pregnancy.milestone_notification', { days: daysRemaining }),
          `milestone-${milestone.days}`
        );
        notified.push(milestone.days);
        localStorage.setItem(notifiedKey, JSON.stringify(notified));
      }
    }
  }, [daysRemaining, permission, showNotification, t, pregnancyStartDate]);

  if (!pregnancyStartDate || pregnancyWeeks === null) return null;

  return (
    <motion.div
      className="mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="glass-card p-5 border-primary/20 overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Timer className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground">{t('pregnancy.countdown_title')}</h3>
            <p className="text-xs text-muted-foreground">{t('pregnancy.countdown_subtitle')}</p>
          </div>
        </div>

        {/* Big countdown number */}
        <div className="text-center my-4">
          <motion.span
            className="text-6xl font-black text-primary"
            key={daysRemaining}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            {daysRemaining}
          </motion.span>
          <p className="text-sm text-muted-foreground mt-1">{t('pregnancy.days_to_go')}</p>
        </div>

        {/* Progress bar with milestone markers */}
        <div className="relative mb-6">
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-terracotta to-burnt-pink rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </div>
          {/* Milestone dots on the progress bar */}
          {milestones.map((m) => {
            const position = ((totalDays - m.days) / totalDays) * 100;
            const isPassed = daysRemaining <= m.days;
            return (
              <div
                key={m.days}
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `${Math.min(98, position)}%` }}
              >
                <div
                  className={`w-3 h-3 rounded-full border-2 transition-all ${
                    isPassed
                      ? 'bg-primary border-primary scale-125'
                      : 'bg-background border-muted-foreground/30'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Milestones timeline */}
        <div className="space-y-2">
          {currentMilestone && (
            <motion.div
              className="flex items-center gap-3 p-3 bg-primary/10 rounded-xl"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <span className="text-2xl">{currentMilestone.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-primary">{t(currentMilestone.labelKey)}</p>
                <p className="text-xs text-muted-foreground">{t('pregnancy.milestone_reached')}</p>
              </div>
              <PartyPopper className="w-4 h-4 text-primary" />
            </motion.div>
          )}

          {nextMilestone && (
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
              <span className="text-xl opacity-50">{nextMilestone.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">{t(nextMilestone.labelKey)}</p>
                <p className="text-xs text-muted-foreground">
                  {t('pregnancy.milestone_in_days', { days: daysRemaining - nextMilestone.days })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default BirthCountdownCard;
