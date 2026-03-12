import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import WorkoutCard from '@/components/workout/WorkoutCard';
import GymLogFAB from '@/components/workout/GymLogFAB';
import LastWorkoutCard from '@/components/workout/LastWorkoutCard';
import WorkoutHistoryCalendar from '@/components/workout/WorkoutHistoryCalendar';
import MonthlyWorkoutSummary from '@/components/workout/MonthlyWorkoutSummary';
import TutorialOverlay from '@/components/tutorial/TutorialOverlay';
import { bodyTutorialSteps } from '@/components/tutorial/tutorialSteps';
import { motion } from 'framer-motion';
import { useCycle } from '@/contexts/CycleContext';
import { useLifePhase } from '@/hooks/useLifePhase';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Dumbbell } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const Corpo: React.FC = () => {
  const { t } = useTranslation();
  const { getPhaseInfo } = useCycle();
  const { lifePhase, pregnancyWeeks } = useLifePhase();
  const phaseInfo = getPhaseInfo();
  const isPregnant = lifePhase === 'pregnant';
  const isMenopause = lifePhase === 'menopause';
  const isPostpartum = lifePhase === 'postpartum';

  const getSubtitle = () => {
    if (isPregnant) {
      if (!pregnancyWeeks) return t('pregnancy.workout_subtitle');
      if (pregnancyWeeks < 13) return t('pregnancy.workout_trimester_1');
      if (pregnancyWeeks < 27) return t('pregnancy.workout_trimester_2');
      return t('pregnancy.workout_trimester_3');
    }
    if (isMenopause) return t('body.subtitle_menopause');
    if (isPostpartum) return t('body.subtitle_postpartum', 'Exercícios suaves para sua recuperação');
    return t('body.subtitle', { phase: phaseInfo.name });
  };

  return (
    <PageLayout>
      <div className="px-5 pt-10 pb-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-1"
        >
          <div className="p-2 rounded-xl bg-primary/10">
            <Dumbbell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('body.title')}</h1>
            <p className="text-sm text-muted-foreground">{getSubtitle()}</p>
          </div>
        </motion.div>
      </div>

      <motion.div className="space-y-3" initial="initial" animate="animate" transition={{ staggerChildren: 0.06 }}>
        {/* Safety tips */}
        {isMenopause && (
          <motion.div variants={fadeUp} className="mx-4 p-3.5 bg-primary/5 border border-primary/10 rounded-2xl">
            <div className="flex items-start gap-3">
              <span className="text-lg">💜</span>
              <div>
                <p className="text-sm font-medium text-foreground">{t('body.menopause_tip_title')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('body.menopause_tip_desc')}</p>
              </div>
            </div>
          </motion.div>
        )}

        {isPregnant && (
          <motion.div variants={fadeUp} className="mx-4 p-3.5 bg-primary/5 border border-primary/10 rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">{t('pregnancy.workout_safety_title')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('pregnancy.workout_safety_desc')}</p>
              </div>
            </div>
          </motion.div>
        )}

        {isPostpartum && (
          <motion.div variants={fadeUp} className="mx-4 p-3.5 bg-primary/5 border border-primary/10 rounded-2xl">
            <div className="flex items-start gap-3">
              <span className="text-lg">🌸</span>
              <div>
                <p className="text-sm font-medium text-foreground">{t('body.postpartum_tip_title')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('body.postpartum_tip_desc')}</p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div variants={fadeUp}><LastWorkoutCard /></motion.div>
        <motion.div variants={fadeUp} className="mt-3"><WorkoutCard /></motion.div>
        <motion.div variants={fadeUp} className="mt-3 px-4"><MonthlyWorkoutSummary /></motion.div>
        <motion.div variants={fadeUp} className="mt-3 px-4"><WorkoutHistoryCalendar /></motion.div>
      </motion.div>

      <GymLogFAB />
      <TutorialOverlay tutorialKey="body" steps={bodyTutorialSteps} />
    </PageLayout>
  );
};

export default Corpo;
