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
import { useLifePhase } from '@/hooks/useLifePhase';
import { useTranslation } from 'react-i18next';
import { Apple } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const Nutricao: React.FC = () => {
  const { t } = useTranslation();
  const { totals } = useNutrition();
  const { macro_protein_goal, macro_carbs_goal, macro_fat_goal } = useProfile();
  const { lifePhase } = useLifePhase();
  const isPregnant = lifePhase === 'pregnant';
  const isMenopause = lifePhase === 'menopause';

  const getSubtitle = () => {
    if (isPregnant) return t('nutrition.subtitle_pregnant');
    if (isMenopause) return t('nutrition.subtitle_menopause');
    if (lifePhase === 'postpartum') return t('nutrition.subtitle_postpartum', 'Nutrição para recuperação e amamentação');
    return t('nutrition.subtitle');
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
            <Apple className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('nutrition.title')}</h1>
            <p className="text-sm text-muted-foreground">{getSubtitle()}</p>
          </div>
        </motion.div>
      </div>

      <motion.div className="space-y-4 pb-6" initial="initial" animate="animate" transition={{ staggerChildren: 0.06 }}>
        <motion.div variants={fadeUp} className="px-4">
          <ChefIACard />
        </motion.div>

        <motion.div variants={fadeUp} className="px-4">
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground text-sm">{t('nutrition.macros_today')}</h3>
              <MacroGoalEditor />
            </div>
            <MacroRings
              protein={{ current: totals.protein, goal: macro_protein_goal }}
              carbs={{ current: totals.carbs, goal: macro_carbs_goal }}
              fat={{ current: totals.fat, goal: macro_fat_goal }}
            />
          </div>
        </motion.div>

        <motion.div variants={fadeUp}><HormonalSuggestion /></motion.div>
        <motion.div variants={fadeUp} className="px-4"><AddMealDrawer /></motion.div>
        <motion.div variants={fadeUp}><MonthlySummaryCard /></motion.div>
        <motion.div variants={fadeUp}><RecentMealsHistory /></motion.div>
      </motion.div>

      <MealScanner />
      <TutorialOverlay tutorialKey="nutrition" steps={nutritionTutorialSteps} />
    </PageLayout>
  );
};

export default Nutricao;
