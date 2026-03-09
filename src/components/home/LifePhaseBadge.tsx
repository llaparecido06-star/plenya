import React from 'react';
import { motion } from 'framer-motion';
import { useLifePhase } from '@/hooks/useLifePhase';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

const LifePhaseBadge: React.FC = () => {
  const { t } = useTranslation();
  const { lifePhase, pregnancyWeeks, postpartumWeeks, age } = useLifePhase();

  if (!lifePhase) return null;

  const config: Record<string, { emoji: string; labelKey: string; detail?: string; className: string }> = {
    menstruating: {
      emoji: '🌙',
      labelKey: 'life_phase.menstruating',
      className: 'bg-primary/15 text-primary border-primary/30',
    },
    pregnant: {
      emoji: '🤰',
      labelKey: 'life_phase.pregnant',
      detail: pregnancyWeeks !== null ? t('life_phase_badge.week', { weeks: pregnancyWeeks }) : undefined,
      className: 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30',
    },
    postpartum: {
      emoji: '🌸',
      labelKey: 'life_phase.postpartum',
      detail: postpartumWeeks !== null ? t('life_phase_badge.week', { weeks: postpartumWeeks }) : undefined,
      className: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    },
    menopause: {
      emoji: '💜',
      labelKey: 'life_phase.menopause',
      detail: age ? t('life_phase_badge.age', { age }) : undefined,
      className: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
    },
  };

  const current = config[lifePhase];
  if (!current) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <Badge
        variant="outline"
        className={`${current.className} px-3 py-1.5 text-xs font-medium gap-1.5 rounded-full`}
      >
        <span>{current.emoji}</span>
        <span>{t(current.labelKey)}</span>
        {current.detail && (
          <span className="opacity-75">· {current.detail}</span>
        )}
      </Badge>
    </motion.div>
  );
};

export default LifePhaseBadge;
