import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronDown, ChevronUp, Check, Baby } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLifePhase } from '@/hooks/useLifePhase';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface RegistryItem {
  id: string;
  labelKey: string;
}

interface RegistryCategory {
  id: string;
  labelKey: string;
  emoji: string;
  items: RegistryItem[];
}

const registryCategories: RegistryCategory[] = [
  {
    id: 'clothes',
    labelKey: 'pregnancy.reg_clothes',
    emoji: '👶',
    items: [
      { id: 'bodies', labelKey: 'pregnancy.reg_bodies' },
      { id: 'pajamas', labelKey: 'pregnancy.reg_pajamas' },
      { id: 'socks', labelKey: 'pregnancy.reg_socks' },
      { id: 'hats', labelKey: 'pregnancy.reg_hats' },
      { id: 'blanket', labelKey: 'pregnancy.reg_blanket' },
      { id: 'swaddle', labelKey: 'pregnancy.reg_swaddle' },
    ],
  },
  {
    id: 'hygiene',
    labelKey: 'pregnancy.reg_hygiene',
    emoji: '🧴',
    items: [
      { id: 'diapers', labelKey: 'pregnancy.reg_diapers' },
      { id: 'wipes', labelKey: 'pregnancy.reg_wipes' },
      { id: 'bathtub', labelKey: 'pregnancy.reg_bathtub' },
      { id: 'shampoo', labelKey: 'pregnancy.reg_shampoo' },
      { id: 'cream', labelKey: 'pregnancy.reg_cream' },
      { id: 'thermometer', labelKey: 'pregnancy.reg_thermometer' },
    ],
  },
  {
    id: 'nursery',
    labelKey: 'pregnancy.reg_nursery',
    emoji: '🛏️',
    items: [
      { id: 'crib', labelKey: 'pregnancy.reg_crib' },
      { id: 'mattress', labelKey: 'pregnancy.reg_mattress' },
      { id: 'sheets', labelKey: 'pregnancy.reg_sheets' },
      { id: 'mobile', labelKey: 'pregnancy.reg_mobile' },
      { id: 'nightlight', labelKey: 'pregnancy.reg_nightlight' },
    ],
  },
  {
    id: 'stroller',
    labelKey: 'pregnancy.reg_stroller_cat',
    emoji: '🚗',
    items: [
      { id: 'stroller_item', labelKey: 'pregnancy.reg_stroller' },
      { id: 'car_seat', labelKey: 'pregnancy.reg_car_seat' },
      { id: 'diaper_bag', labelKey: 'pregnancy.reg_diaper_bag' },
      { id: 'carrier', labelKey: 'pregnancy.reg_carrier' },
    ],
  },
  {
    id: 'feeding',
    labelKey: 'pregnancy.reg_feeding',
    emoji: '🍼',
    items: [
      { id: 'bottles', labelKey: 'pregnancy.reg_bottles' },
      { id: 'breast_pump', labelKey: 'pregnancy.reg_breast_pump' },
      { id: 'nursing_pillow', labelKey: 'pregnancy.reg_nursing_pillow' },
      { id: 'sterilizer', labelKey: 'pregnancy.reg_sterilizer' },
      { id: 'bibs', labelKey: 'pregnancy.reg_bibs' },
    ],
  },
];

const STORAGE_KEY = 'plenya_baby_registry';

const BabyRegistryCard: React.FC = () => {
  const { t } = useTranslation();
  const { lifePhase } = useLifePhase();
  const [expanded, setExpanded] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const isPregnant = lifePhase === 'pregnant';

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setChecked(JSON.parse(saved)); } catch {}
    }
  }, []);

  const toggleItem = (itemId: string) => {
    setChecked(prev => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const totalItems = registryCategories.reduce((sum, c) => sum + c.items.length, 0);
  const totalChecked = Object.values(checked).filter(Boolean).length;
  const progressPercent = totalItems > 0 ? (totalChecked / totalItems) * 100 : 0;

  const getCategoryProgress = (category: RegistryCategory) => {
    const done = category.items.filter(i => checked[i.id]).length;
    return { done, total: category.items.length };
  };

  if (!isPregnant) return null;

  return (
    <motion.div
      className="mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.button
        className="w-full glass-card p-5 text-left border-l-4 border-violet-500"
        onClick={() => setExpanded(!expanded)}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{t('pregnancy.reg_title')}</h3>
              <p className="text-xs text-muted-foreground">{t('pregnancy.reg_subtitle')}</p>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        {/* Progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{totalChecked}/{totalItems} {t('pregnancy.reg_items_done')}</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full"
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
            <div className="glass-card mt-2 p-4 space-y-2">
              {registryCategories.map((category) => {
                const { done, total } = getCategoryProgress(category);
                const isOpen = expandedCategory === category.id;
                return (
                  <div key={category.id}>
                    <button
                      onClick={() => setExpandedCategory(isOpen ? null : category.id)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{category.emoji}</span>
                        <span className="text-sm font-medium text-foreground">{t(category.labelKey)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={done === total ? 'default' : 'secondary'} className="text-xs">
                          {done}/{total}
                        </Badge>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 pt-2 space-y-1.5">
                            {category.items.map((item) => {
                              const isChecked = !!checked[item.id];
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => toggleItem(item.id)}
                                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left ${
                                    isChecked
                                      ? 'bg-primary/5 line-through'
                                      : 'hover:bg-secondary/50'
                                  }`}
                                >
                                  <Checkbox checked={isChecked} className="pointer-events-none" />
                                  <span className={`text-sm ${isChecked ? 'text-muted-foreground' : 'text-foreground'}`}>
                                    {t(item.labelKey)}
                                  </span>
                                  {isChecked && <Check className="w-3.5 h-3.5 text-primary ml-auto" />}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BabyRegistryCard;
