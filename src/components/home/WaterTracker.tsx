import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Droplets } from 'lucide-react';
import { useLifePhase } from '@/hooks/useLifePhase';
import { useTranslation } from 'react-i18next';

const WaterTracker: React.FC = () => {
  const { lifePhase } = useLifePhase();
  const { t } = useTranslation();

  // Adaptive goals: pregnant 2.3L (~9 glasses), menopause 1.8L (~7 glasses), default 2L (~8 glasses)
  const getGlassCount = () => {
    if (lifePhase === 'pregnant') return 9;
    if (lifePhase === 'postpartum') return 10; // Breastfeeding needs more
    if (lifePhase === 'menopause') return 7;
    return 8;
  };

  const getLiterGoal = () => {
    if (lifePhase === 'pregnant') return '2.3L';
    if (lifePhase === 'postpartum') return '2.7L';
    if (lifePhase === 'menopause') return '1.8L';
    return '2L';
  };

  const getHint = () => {
    if (lifePhase === 'pregnant') return t('water.hint_pregnant', 'Gestantes precisam de mais hidratação 💧');
    if (lifePhase === 'postpartum') return t('water.hint_postpartum', 'Amamentação exige hidratação extra 🤱');
    if (lifePhase === 'menopause') return t('water.hint_menopause', 'Hidratação ajuda com ondas de calor 💜');
    return '';
  };

  const totalGlasses = getGlassCount();
  const [glasses, setGlasses] = useState<boolean[]>(Array(totalGlasses).fill(false));
  
  // Load from localStorage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`water-${today}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      const adapted = Array(totalGlasses).fill(false).map((_, i) => parsed[i] ?? false);
      setGlasses(adapted);
    } else {
      setGlasses(Array(totalGlasses).fill(false));
    }
  }, [totalGlasses]);

  const toggleGlass = (index: number) => {
    const newGlasses = [...glasses];
    if (!glasses[index]) {
      for (let i = 0; i <= index; i++) {
        newGlasses[i] = true;
      }
    } else {
      for (let i = index; i < glasses.length; i++) {
        newGlasses[i] = false;
      }
    }
    setGlasses(newGlasses);
    
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`water-${today}`, JSON.stringify(newGlasses));
  };

  const filledCount = glasses.filter(Boolean).length;
  const hint = getHint();

  return (
    <motion.div
      className="glass-card p-4 mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex flex-col items-center mb-3">
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-500" />
          <span className="font-medium text-foreground">{t('water.title', 'Hidratação')}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {filledCount}/{totalGlasses} {t('water.glasses', 'copos')} ({getLiterGoal()})
        </span>
        {hint && <span className="text-xs text-muted-foreground mt-0.5">{hint}</span>}
      </div>
      
      <div className="flex justify-center gap-2 flex-wrap">
        {glasses.map((filled, index) => (
          <motion.button
            key={index}
            onClick={() => toggleGlass(index)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              filled 
                ? 'bg-gradient-to-b from-blue-400 to-blue-600 shadow-lg shadow-blue-500/30' 
                : 'bg-secondary/50 hover:bg-secondary'
            }`}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Droplets className={`w-5 h-5 ${filled ? 'text-white' : 'text-muted-foreground/50'}`} />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default WaterTracker;