import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import WorkoutCard from '@/components/workout/WorkoutCard';
import { motion } from 'framer-motion';
import { useCycle } from '@/contexts/CycleContext';

const Corpo: React.FC = () => {
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
          Corpo
        </motion.h1>
        <p className="text-muted-foreground">
          Treino ideal para a fase {phaseInfo.name}
        </p>
      </div>

      <div className="mt-4">
        <WorkoutCard />
      </div>
    </PageLayout>
  );
};

export default Corpo;
