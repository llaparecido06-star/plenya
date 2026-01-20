import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import MacroRings from '@/components/nutrition/MacroRings';
import HormonalSuggestion from '@/components/nutrition/HormonalSuggestion';
import AddMealDrawer from '@/components/nutrition/AddMealDrawer';
import MealScanner from '@/components/nutrition/MealScanner';
import RecentMealsHistory from '@/components/nutrition/RecentMealsHistory';
import { motion } from 'framer-motion';

const Nutricao: React.FC = () => {
  return (
    <PageLayout>
      <div className="hero-gradient pt-12 pb-6 px-4">
        <motion.h1
          className="text-2xl font-bold text-foreground mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Nutrição
        </motion.h1>
        <p className="text-muted-foreground">Acompanhe sua alimentação</p>
      </div>

      <div className="px-4 -mt-2">
        <motion.div
          className="glass-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="font-semibold text-foreground mb-2">Macros do Dia</h3>
          <MacroRings
            protein={{ current: 65, goal: 120 }}
            carbs={{ current: 180, goal: 250 }}
            fat={{ current: 45, goal: 70 }}
          />
        </motion.div>
      </div>

      <div className="mt-6">
        <HormonalSuggestion />
      </div>

      <div className="px-4 mt-6">
        <AddMealDrawer />
      </div>

      {/* Recent Meals with Mood Correlation */}
      <div className="mt-6">
        <RecentMealsHistory />
      </div>

      {/* Floating AI Scanner Button */}
      <MealScanner />
    </PageLayout>
  );
};

export default Nutricao;
