import React from 'react';
import { motion } from 'framer-motion';
import { Baby, Heart, Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PregnancyWeeksCardProps {
  weeks: number;
  pregnancyStartDate: Date;
}

// Baby fruit comparison map
const getBabyFruit = (weeks: number): { fruit: string; emoji: string } => {
  if (weeks < 4) return { fruit: 'uma semente de papoula', emoji: '🌱' };
  if (weeks < 8) return { fruit: 'um mirtilo', emoji: '🫐' };
  if (weeks < 12) return { fruit: 'um morango', emoji: '🍓' };
  if (weeks < 16) return { fruit: 'um limão', emoji: '🍋' };
  if (weeks < 20) return { fruit: 'uma banana', emoji: '🍌' };
  if (weeks < 24) return { fruit: 'um mamão', emoji: '🥭' };
  if (weeks < 28) return { fruit: 'uma berinjela', emoji: '🍆' };
  if (weeks < 32) return { fruit: 'um coco', emoji: '🥥' };
  if (weeks < 36) return { fruit: 'um abacaxi', emoji: '🍍' };
  return { fruit: 'uma melancia', emoji: '🍉' };
};

const PregnancyWeeksCard: React.FC<PregnancyWeeksCardProps> = ({ weeks, pregnancyStartDate }) => {
  // Calculate days remaining (40 weeks = 280 days)
  const daysPregnant = Math.floor((Date.now() - pregnancyStartDate.getTime()) / (24 * 60 * 60 * 1000));
  const daysRemaining = Math.max(0, 280 - daysPregnant);
  const expectedDate = addDays(pregnancyStartDate, 280);
  const trimester = weeks < 13 ? 1 : weeks < 27 ? 2 : 3;
  const progressPercent = Math.min(100, (daysPregnant / 280) * 100);

  // Get trimester info
  const trimesterInfo = {
    1: { label: '1º Trimestre', color: 'from-terracotta to-burnt-pink', tip: 'Formação dos órgãos' },
    2: { label: '2º Trimestre', color: 'from-leaf-green to-sage-green', tip: 'Crescimento acelerado' },
    3: { label: '3º Trimestre', color: 'from-primary to-terracotta', tip: 'Preparação para o parto' },
  }[trimester];

  // Get baby fruit comparison
  const babyFruit = getBabyFruit(weeks);

  return (
    <motion.div
      className="mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="glass-card p-5 bg-gradient-to-br from-terracotta/5 to-burnt-pink/10 border-terracotta/20">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-terracotta/20 to-burnt-pink/20 flex items-center justify-center">
              <span className="text-3xl">🤰</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Sua Gestação</h3>
              <p className="text-sm text-muted-foreground">{trimesterInfo.label}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-terracotta">{weeks}</span>
            <p className="text-xs text-muted-foreground">semanas</p>
          </div>
        </div>

        {/* Baby Fruit Comparison */}
        <motion.div 
          className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl border border-amber-200/50 dark:border-amber-800/50"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-center text-sm text-amber-800 dark:text-amber-200">
            <span className="text-2xl mr-2">{babyFruit.emoji}</span>
            Seu bebê é do tamanho de <strong>{babyFruit.fruit}</strong>!
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${trimesterInfo.color} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>0</span>
            <span>13</span>
            <span>27</span>
            <span>40</span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-background/50 rounded-xl">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">Data Prevista</span>
            </div>
            <p className="font-semibold text-foreground">
              {format(expectedDate, "dd 'de' MMM", { locale: ptBR })}
            </p>
          </div>
          <div className="p-3 bg-background/50 rounded-xl">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Heart className="w-4 h-4" />
              <span className="text-xs">Faltam</span>
            </div>
            <p className="font-semibold text-foreground">
              {daysRemaining} dias
            </p>
          </div>
        </div>

        {/* Trimester Tip */}
        <div className="mt-4 p-3 bg-terracotta/10 rounded-xl">
          <p className="text-sm text-terracotta">
            <Baby className="w-4 h-4 inline mr-2" />
            {trimesterInfo.tip}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default PregnancyWeeksCard;
