import React from 'react';
import { motion } from 'framer-motion';
import { Baby, Heart, Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface PregnancyWeeksCardProps {
  weeks: number;
  pregnancyStartDate: Date;
}

const getBabyFruitKey = (weeks: number): { key: string; emoji: string } => {
  if (weeks < 4) return { key: 'pregnancy.fruit_seed', emoji: '🌱' };
  if (weeks < 8) return { key: 'pregnancy.fruit_blueberry', emoji: '🫐' };
  if (weeks < 12) return { key: 'pregnancy.fruit_strawberry', emoji: '🍓' };
  if (weeks < 16) return { key: 'pregnancy.fruit_lemon', emoji: '🍋' };
  if (weeks < 20) return { key: 'pregnancy.fruit_banana', emoji: '🍌' };
  if (weeks < 24) return { key: 'pregnancy.fruit_papaya', emoji: '🥭' };
  if (weeks < 28) return { key: 'pregnancy.fruit_eggplant', emoji: '🍆' };
  if (weeks < 32) return { key: 'pregnancy.fruit_coconut', emoji: '🥥' };
  if (weeks < 36) return { key: 'pregnancy.fruit_pineapple', emoji: '🍍' };
  return { key: 'pregnancy.fruit_watermelon', emoji: '🍉' };
};

const getDateLocale = (lang: string) => {
  if (lang.startsWith('en')) return enUS;
  if (lang.startsWith('es')) return es;
  return ptBR;
};

const PregnancyWeeksCard: React.FC<PregnancyWeeksCardProps> = ({ weeks, pregnancyStartDate }) => {
  const { t, i18n } = useTranslation();
  const dateLocale = getDateLocale(i18n.language);

  const daysPregnant = Math.floor((Date.now() - pregnancyStartDate.getTime()) / (24 * 60 * 60 * 1000));
  const daysRemaining = Math.max(0, 280 - daysPregnant);
  const expectedDate = addDays(pregnancyStartDate, 280);
  const trimester = weeks < 13 ? 1 : weeks < 27 ? 2 : 3;
  const progressPercent = Math.min(100, (daysPregnant / 280) * 100);

  const trimesterInfo = {
    1: { labelKey: 'pregnancy.trimester_1', color: 'from-terracotta to-burnt-pink', tipKey: 'pregnancy.tip_trimester_1' },
    2: { labelKey: 'pregnancy.trimester_2', color: 'from-leaf-green to-sage-green', tipKey: 'pregnancy.tip_trimester_2' },
    3: { labelKey: 'pregnancy.trimester_3', color: 'from-primary to-terracotta', tipKey: 'pregnancy.tip_trimester_3' },
  }[trimester]!;

  const babyFruit = getBabyFruitKey(weeks);

  return (
    <motion.div className="mx-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="glass-card p-5 bg-gradient-to-br from-terracotta/5 to-burnt-pink/10 border-terracotta/20">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-terracotta/20 to-burnt-pink/20 flex items-center justify-center">
              <span className="text-3xl">🤰</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{t('pregnancy.your_pregnancy')}</h3>
              <p className="text-sm text-muted-foreground">{t(trimesterInfo.labelKey)}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-terracotta">{weeks}</span>
            <p className="text-xs text-muted-foreground">{t('pregnancy.weeks')}</p>
          </div>
        </div>

        <motion.div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl border border-amber-200/50 dark:border-amber-800/50" initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
          <p className="text-center text-sm text-amber-800 dark:text-amber-200">
            <span className="text-2xl mr-2">{babyFruit.emoji}</span>
            {t('pregnancy.baby_size', { fruit: t(babyFruit.key) })}
          </p>
        </motion.div>

        <div className="mb-4">
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <motion.div className={`h-full bg-gradient-to-r ${trimesterInfo.color} rounded-full`} initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>0</span><span>13</span><span>27</span><span>40</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-background/50 rounded-xl">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">{t('pregnancy.due_date')}</span>
            </div>
            <p className="font-semibold text-foreground">
              {format(expectedDate, "dd MMM", { locale: dateLocale })}
            </p>
          </div>
          <div className="p-3 bg-background/50 rounded-xl">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Heart className="w-4 h-4" />
              <span className="text-xs">{t('pregnancy.days_remaining')}</span>
            </div>
            <p className="font-semibold text-foreground">
              {daysRemaining} {t('pregnancy.days')}
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-terracotta/10 rounded-xl">
          <p className="text-sm text-terracotta">
            <Baby className="w-4 h-4 inline mr-2" />
            {t(trimesterInfo.tipKey)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default PregnancyWeeksCard;
