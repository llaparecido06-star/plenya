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
import { AlertTriangle } from 'lucide-react';

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
    return t('body.subtitle', { phase: phaseInfo.name });
  };

  return (
    <PageLayout>
      <div className="hero-gradient pt-12 pb-6 px-4">
        <motion.h1
          className="text-2xl font-bold text-foreground mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {t('body.title')}
        </motion.h1>
        <p className="text-muted-foreground">{getSubtitle()}</p>
      </div>

      {/* Menopause safety tip */}
      {isMenopause && (
        <motion.div
          className="mx-4 mb-4 p-4 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">💜</span>
            <div>
              <p className="text-sm font-medium text-violet-800 dark:text-violet-200">{t('body.menopause_tip_title')}</p>
              <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">{t('body.menopause_tip_desc')}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Pregnancy safety alert */}
      {isPregnant && (
        <motion.div
          className="mx-4 mb-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{t('pregnancy.workout_safety_title')}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{t('pregnancy.workout_safety_desc')}</p>
            </div>
          </div>
        </motion.div>
      )}

      <LastWorkoutCard />

      <div className="mt-4">
        <WorkoutCard />
      </div>

      <div className="mt-4 px-4">
        <MonthlyWorkoutSummary />
      </div>

      <div className="mt-4 px-4">
        <WorkoutHistoryCalendar />
      </div>

      <GymLogFAB />
      <TutorialOverlay tutorialKey="body" steps={bodyTutorialSteps} />
    </PageLayout>
  );
};

export default Corpo;
