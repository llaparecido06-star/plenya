import React from 'react';
import { motion } from 'framer-motion';
import { Baby, Flower2, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLifePhase } from '@/hooks/useLifePhase';

const LifePhaseBreathingCard: React.FC = () => {
  const { t } = useTranslation();
  const { lifePhase, pregnancyWeeks, postpartumWeeks } = useLifePhase();

  if (lifePhase === 'pregnant') {
    const trimester = pregnancyWeeks ? (pregnancyWeeks <= 12 ? 1 : pregnancyWeeks <= 27 ? 2 : 3) : 1;
    const tips = [
      { key: 'mind.preg_meditation_1', emoji: '🧘' },
      { key: 'mind.preg_meditation_2', emoji: '🌊' },
      { key: trimester === 3 ? 'mind.preg_meditation_birth' : 'mind.preg_meditation_3', emoji: trimester === 3 ? '👶' : '💜' },
    ];

    return (
      <motion.div
        className="glass-card p-5 bg-gradient-to-br from-pink-500/5 to-rose-500/10 border-pink-500/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center">
            <Baby className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">{t('mind.preg_mental_title')}</h3>
            <p className="text-xs text-muted-foreground">{t('mind.preg_mental_subtitle')}</p>
          </div>
        </div>
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 bg-card/50 rounded-xl">
              <span className="text-lg">{tip.emoji}</span>
              <p className="text-xs text-foreground/80">{t(tip.key)}</p>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (lifePhase === 'menopause') {
    const tips = [
      { key: 'mind.meno_meditation_1', emoji: '🌸' },
      { key: 'mind.meno_meditation_2', emoji: '❄️' },
      { key: 'mind.meno_meditation_3', emoji: '🌙' },
    ];

    return (
      <motion.div
        className="glass-card p-5 bg-gradient-to-br from-violet-500/5 to-purple-500/10 border-violet-500/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
            <Flower2 className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">{t('mind.meno_mental_title')}</h3>
            <p className="text-xs text-muted-foreground">{t('mind.meno_mental_subtitle')}</p>
          </div>
        </div>
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 bg-card/50 rounded-xl">
              <span className="text-lg">{tip.emoji}</span>
              <p className="text-xs text-foreground/80">{t(tip.key)}</p>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (lifePhase === 'postpartum') {
    const isEarly = postpartumWeeks !== null && postpartumWeeks !== undefined && postpartumWeeks < 6;
    const tips = [
      { key: 'mind.post_meditation_1', emoji: '🌸' },
      { key: isEarly ? 'mind.post_meditation_2_early' : 'mind.post_meditation_2', emoji: '💤' },
      { key: 'mind.post_meditation_3', emoji: '💜' },
    ];

    return (
      <motion.div
        className="glass-card p-5 bg-gradient-to-br from-rose-500/5 to-pink-500/10 border-rose-500/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center">
            <Heart className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">{t('mind.post_mental_title')}</h3>
            <p className="text-xs text-muted-foreground">{t('mind.post_mental_subtitle')}</p>
          </div>
        </div>
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 bg-card/50 rounded-xl">
              <span className="text-lg">{tip.emoji}</span>
              <p className="text-xs text-foreground/80">{t(tip.key)}</p>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return null;
};

export default LifePhaseBreathingCard;
