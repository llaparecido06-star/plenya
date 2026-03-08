import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, ChevronDown, ChevronUp, Check, Baby } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLifePhase } from '@/hooks/useLifePhase';
import { Checkbox } from '@/components/ui/checkbox';

interface BirthPlanItem {
  id: string;
  category: string;
  labelKey: string;
  options: { id: string; labelKey: string }[];
}

const birthPlanCategories: BirthPlanItem[] = [
  {
    id: 'birth_type',
    category: 'pregnancy.bp_birth_type',
    labelKey: 'pregnancy.bp_birth_type',
    options: [
      { id: 'natural', labelKey: 'pregnancy.bp_natural' },
      { id: 'cesarean', labelKey: 'pregnancy.bp_cesarean' },
      { id: 'water', labelKey: 'pregnancy.bp_water_birth' },
      { id: 'home', labelKey: 'pregnancy.bp_home_birth' },
    ],
  },
  {
    id: 'anesthesia',
    category: 'pregnancy.bp_anesthesia',
    labelKey: 'pregnancy.bp_anesthesia',
    options: [
      { id: 'epidural', labelKey: 'pregnancy.bp_epidural' },
      { id: 'no_anesthesia', labelKey: 'pregnancy.bp_no_anesthesia' },
      { id: 'decide_later', labelKey: 'pregnancy.bp_decide_later' },
    ],
  },
  {
    id: 'companion',
    category: 'pregnancy.bp_companion',
    labelKey: 'pregnancy.bp_companion',
    options: [
      { id: 'partner', labelKey: 'pregnancy.bp_partner' },
      { id: 'doula', labelKey: 'pregnancy.bp_doula' },
      { id: 'family', labelKey: 'pregnancy.bp_family_member' },
    ],
  },
  {
    id: 'preferences',
    category: 'pregnancy.bp_preferences',
    labelKey: 'pregnancy.bp_preferences',
    options: [
      { id: 'skin_to_skin', labelKey: 'pregnancy.bp_skin_to_skin' },
      { id: 'delayed_cord', labelKey: 'pregnancy.bp_delayed_cord' },
      { id: 'breastfeed_first', labelKey: 'pregnancy.bp_breastfeed_first' },
      { id: 'low_light', labelKey: 'pregnancy.bp_low_light' },
      { id: 'music', labelKey: 'pregnancy.bp_music' },
    ],
  },
];

const STORAGE_KEY = 'plenya_birth_plan';

const BirthPlanCard: React.FC = () => {
  const { t } = useTranslation();
  const { lifePhase, pregnancyWeeks } = useLifePhase();
  const [expanded, setExpanded] = useState(false);
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  // Only show for 3rd trimester (28+ weeks)
  const isThirdTrimester = lifePhase === 'pregnant' && pregnancyWeeks !== null && pregnancyWeeks >= 28;

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setSelections(JSON.parse(saved)); } catch {}
    }
  }, []);

  const toggleOption = (categoryId: string, optionId: string) => {
    setSelections(prev => {
      const current = prev[categoryId] || [];
      const updated = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId];
      const next = { ...prev, [categoryId]: updated };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const totalOptions = birthPlanCategories.reduce((sum, c) => sum + c.options.length, 0);
  const totalSelected = Object.values(selections).reduce((sum, arr) => sum + arr.length, 0);
  const progressPercent = totalOptions > 0 ? (totalSelected / totalOptions) * 100 : 0;

  if (!isThirdTrimester) return null;

  return (
    <motion.div
      className="mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.button
        className="w-full glass-card p-5 text-left border-l-4 border-pink-500"
        onClick={() => setExpanded(!expanded)}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{t('pregnancy.bp_title')}</h3>
              <p className="text-xs text-muted-foreground">{t('pregnancy.bp_subtitle')}</p>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{t('pregnancy.bp_progress')}</span>
            <span>{totalSelected}/{totalOptions}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card mt-2 p-4 space-y-5">
              {birthPlanCategories.map((category) => (
                <div key={category.id}>
                  <h4 className="text-sm font-semibold text-foreground mb-2">
                    {t(category.labelKey)}
                  </h4>
                  <div className="space-y-2">
                    {category.options.map((option) => {
                      const isChecked = (selections[category.id] || []).includes(option.id);
                      return (
                        <button
                          key={option.id}
                          onClick={() => toggleOption(category.id, option.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                            isChecked
                              ? 'bg-primary/10 border border-primary/20'
                              : 'bg-secondary/50 border border-transparent hover:bg-secondary'
                          }`}
                        >
                          <Checkbox checked={isChecked} className="pointer-events-none" />
                          <span className={`text-sm ${isChecked ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                            {t(option.labelKey)}
                          </span>
                          {isChecked && <Check className="w-4 h-4 text-primary ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2 p-3 bg-pink-50 dark:bg-pink-950/30 rounded-xl">
                <Baby className="w-4 h-4 text-pink-500 flex-shrink-0" />
                <p className="text-xs text-pink-700 dark:text-pink-400">
                  {t('pregnancy.bp_disclaimer')}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BirthPlanCard;
