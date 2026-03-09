import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Baby, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLifePhase } from '@/hooks/useLifePhase';
import { useTranslation } from 'react-i18next';

const PostpartumWeeksCard: React.FC = () => {
  const { t } = useTranslation();
  const { postpartumWeeks } = useLifePhase();

  if (postpartumWeeks === null) return null;

  const getPhaseInfo = () => {
    if (postpartumWeeks <= 1) return { emoji: '🤱', phase: t('postpartum.phase_initial', 'Recuperação inicial'), color: 'from-rose-500/20 to-pink-500/20' };
    if (postpartumWeeks <= 6) return { emoji: '💜', phase: t('postpartum.phase_early', 'Puerpério imediato'), color: 'from-violet-500/20 to-purple-500/20' };
    if (postpartumWeeks <= 12) return { emoji: '🌸', phase: t('postpartum.phase_mid', 'Adaptação'), color: 'from-pink-500/20 to-rose-500/20' };
    return { emoji: '🌺', phase: t('postpartum.phase_late', 'Recuperação avançada'), color: 'from-amber-500/20 to-orange-500/20' };
  };

  const { emoji, phase, color } = getPhaseInfo();

  return (
    <div className="px-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={`bg-gradient-to-r ${color} border-border/50 overflow-hidden`}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{emoji}</div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('postpartum.title', 'Pós-Parto')}</p>
                <p className="text-2xl font-bold text-foreground">
                  {t('postpartum.weeks_count', 'Semana {{weeks}}', { weeks: postpartumWeeks })}
                </p>
                <p className="text-sm text-muted-foreground">{phase}</p>
              </div>
              <div className="flex flex-col items-center gap-1 opacity-60">
                <Baby className="w-5 h-5 text-foreground" />
                <Calendar className="w-4 h-4 text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PostpartumWeeksCard;
