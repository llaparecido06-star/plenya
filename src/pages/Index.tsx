import React from 'react';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import CycleWheel from '@/components/cycle/CycleWheel';
import InsightCard from '@/components/cycle/InsightCard';
import QuickLog from '@/components/cycle/QuickLog';
import ChefSuggestion from '@/components/cycle/ChefSuggestion';
import { useCycle } from '@/contexts/CycleContext';

const Index: React.FC = () => {
  const { getPhaseInfo } = useCycle();
  const phaseInfo = getPhaseInfo();

  return (
    <PageLayout>
      <div className="hero-gradient pt-12 pb-6">
        <motion.div
          className="text-center mb-6 px-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-foreground">Ciclos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Seu assistente de vida sincronizado
          </p>
        </motion.div>

        <CycleWheel />
      </div>

      <div className="space-y-6 mt-6">
        <ChefSuggestion />
        <InsightCard />
        <QuickLog />
      </div>
    </PageLayout>
  );
};

export default Index;
