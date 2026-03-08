import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Check, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface BagItem {
  id: string;
  labelKey: string;
}

interface BagCategory {
  id: string;
  labelKey: string;
  emoji: string;
  items: BagItem[];
}

const categories: BagCategory[] = [
  {
    id: 'documents', labelKey: 'pregnancy.hb_documents', emoji: '📄',
    items: [
      { id: 'id_card', labelKey: 'pregnancy.hb_id' },
      { id: 'health_card', labelKey: 'pregnancy.hb_health_card' },
      { id: 'birth_plan_copy', labelKey: 'pregnancy.hb_birth_plan' },
      { id: 'prenatal_exams', labelKey: 'pregnancy.hb_exams' },
    ]
  },
  {
    id: 'mom', labelKey: 'pregnancy.hb_mom', emoji: '👩',
    items: [
      { id: 'robe', labelKey: 'pregnancy.hb_robe' },
      { id: 'slippers', labelKey: 'pregnancy.hb_slippers' },
      { id: 'nursing_bra', labelKey: 'pregnancy.hb_nursing_bra' },
      { id: 'underwear', labelKey: 'pregnancy.hb_underwear' },
      { id: 'toiletries', labelKey: 'pregnancy.hb_toiletries' },
      { id: 'phone_charger', labelKey: 'pregnancy.hb_charger' },
    ]
  },
  {
    id: 'baby', labelKey: 'pregnancy.hb_baby', emoji: '👶',
    items: [
      { id: 'baby_clothes', labelKey: 'pregnancy.hb_baby_clothes' },
      { id: 'baby_blanket', labelKey: 'pregnancy.hb_baby_blanket' },
      { id: 'diapers_nb', labelKey: 'pregnancy.hb_diapers' },
      { id: 'baby_hat', labelKey: 'pregnancy.hb_baby_hat' },
      { id: 'car_seat_ready', labelKey: 'pregnancy.hb_car_seat' },
    ]
  },
];

const HospitalBagCard: React.FC = () => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [checked, setChecked] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('plenya_hospital_bag') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('plenya_hospital_bag', JSON.stringify(checked));
  }, [checked]);

  const toggle = (id: string) => {
    setChecked(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const progress = (checked.length / totalItems) * 100;

  return (
    <motion.div
      className="mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="glass-card p-5 bg-gradient-to-br from-blue-500/5 to-indigo-500/10 border-blue-500/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground">{t('pregnancy.hb_title')}</h3>
            <p className="text-sm text-muted-foreground">
              {checked.length}/{totalItems} {t('pregnancy.hb_items_ready')}
            </p>
          </div>
        </div>

        <Progress value={progress} className="h-2 mb-4" />

        {/* Summary when collapsed */}
        {!expanded && (
          <div className="flex gap-2 mb-3">
            {categories.map(cat => {
              const catChecked = cat.items.filter(i => checked.includes(i.id)).length;
              const allDone = catChecked === cat.items.length;
              return (
                <div
                  key={cat.id}
                  className={`flex-1 p-2 rounded-xl text-center text-xs ${
                    allDone ? 'bg-primary/10 text-primary' : 'bg-card/50 text-muted-foreground'
                  }`}
                >
                  <span className="block text-lg mb-0.5">{cat.emoji}</span>
                  {catChecked}/{cat.items.length}
                </div>
              );
            })}
          </div>
        )}

        {/* Expanded detail */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 overflow-hidden"
            >
              {categories.map(cat => (
                <div key={cat.id}>
                  <p className="text-sm font-semibold text-foreground mb-2">
                    {cat.emoji} {t(cat.labelKey)}
                  </p>
                  <div className="space-y-1.5">
                    {cat.items.map(item => (
                      <motion.button
                        key={item.id}
                        onClick={() => toggle(item.id)}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                          checked.includes(item.id)
                            ? 'bg-primary/10 line-through text-muted-foreground'
                            : 'bg-card hover:bg-muted'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                          checked.includes(item.id) ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                        }`}>
                          {checked.includes(item.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span className="text-sm">{t(item.labelKey)}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 text-muted-foreground"
        >
          {expanded ? (
            <><ChevronUp className="w-4 h-4 mr-1" /> {t('pregnancy.hb_collapse')}</>
          ) : (
            <><ChevronDown className="w-4 h-4 mr-1" /> {t('pregnancy.hb_expand')}</>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default HospitalBagCard;
