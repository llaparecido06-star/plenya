import React from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const exercises = [
  { emoji: '🚶‍♀️', key: 'menopause.ex_walking', benefit: 'menopause.ex_walking_b' },
  { emoji: '🧘', key: 'menopause.ex_yoga', benefit: 'menopause.ex_yoga_b' },
  { emoji: '💪', key: 'menopause.ex_strength', benefit: 'menopause.ex_strength_b' },
  { emoji: '🏊', key: 'menopause.ex_swimming', benefit: 'menopause.ex_swimming_b' },
];

const MenopauseExerciseCard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="glass-card p-5 bg-gradient-to-br from-emerald-500/5 to-teal-500/10 border-emerald-500/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
          <Dumbbell className="w-6 h-6 text-emerald-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-foreground">{t('menopause.ex_title')}</h3>
          <p className="text-xs text-muted-foreground">{t('menopause.ex_subtitle')}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {exercises.map((ex) => (
          <div key={ex.key} className="flex items-start gap-3 p-2.5 bg-card/50 rounded-xl">
            <span className="text-xl">{ex.emoji}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{t(ex.key)}</p>
              <p className="text-xs text-muted-foreground">{t(ex.benefit)}</p>
            </div>
          </div>
        ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/corpo')}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors text-sm font-medium"
      >
        {t('menopause.ex_generate')}
        <ArrowRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
};

export default MenopauseExerciseCard;
