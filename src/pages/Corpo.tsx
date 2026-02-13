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
import { useTranslation } from 'react-i18next';

const Corpo: React.FC = () => {
  const { t } = useTranslation();
  const { getPhaseInfo } = useCycle();
  const phaseInfo = getPhaseInfo();

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
        <p className="text-muted-foreground">
          {t('body.subtitle', { phase: phaseInfo.name })}
        </p>
      </div>

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
