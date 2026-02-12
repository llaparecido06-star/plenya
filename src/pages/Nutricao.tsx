import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import MacroRings from '@/components/nutrition/MacroRings';
import MacroGoalEditor from '@/components/nutrition/MacroGoalEditor';
import HormonalSuggestion from '@/components/nutrition/HormonalSuggestion';
import AddMealDrawer from '@/components/nutrition/AddMealDrawer';
import MealScanner from '@/components/nutrition/MealScanner';
import RecentMealsHistory from '@/components/nutrition/RecentMealsHistory';
import MonthlySummaryCard from '@/components/nutrition/MonthlySummaryCard';
import ChefIACard from '@/components/nutrition/ChefIACard';
import TutorialOverlay from '@/components/tutorial/TutorialOverlay';
import { nutritionTutorialSteps } from '@/components/tutorial/tutorialSteps';
import { motion } from 'framer-motion';
import { useNutrition } from '@/hooks/useNutrition';
import { useProfile } from '@/hooks/useProfile';

const Nutricao: React.FC = () => {
  const { totals } = useNutrition();
  const { macro_protein_goal, macro_carbs_goal, macro_fat_goal } = useProfile();

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

      {/* Chef IA Premium Card */}
      <div className="px-4 -mt-2 mb-4">
        <ChefIACard />
      </div>

      <div className="px-4">
        <motion.div
          className="glass-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Macros do Dia</h3>
            <MacroGoalEditor />
          </div>
          <MacroRings
            protein={{ current: totals.protein, goal: macro_protein_goal }}
            carbs={{ current: totals.carbs, goal: macro_carbs_goal }}
            fat={{ current: totals.fat, goal: macro_fat_goal }}
          />
        </motion.div>
      </div>

      <div className="mt-6">
        <HormonalSuggestion />
      </div>

      <div className="px-4 mt-6">
        <AddMealDrawer />
      </div>

      {/* Monthly Summary */}
      <div className="mt-6">
        <MonthlySummaryCard />
      </div>

      {/* Recent Meals with Mood Correlation */}
      <div className="mt-6">
        <RecentMealsHistory />
      </div>

      {/* Floating AI Scanner Button */}
      <MealScanner />

      {/* Tutorial Overlay */}
      <TutorialOverlay tutorialKey="nutrition" steps={nutritionTutorialSteps} />
    </PageLayout>
  );
};

export default Nutricao;
