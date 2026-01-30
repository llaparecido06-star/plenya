import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Droplets } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCycle } from '@/contexts/CycleContext';
import QuickMenstruationButton from './QuickMenstruationButton';

const NextPeriodCard: React.FC = () => {
  const { lastPeriodStart, cycleLength, cycleDay } = useCycle();

  // Calculate next period date
  const getNextPeriodDate = (): Date | null => {
    if (!lastPeriodStart) return null;
    
    // Calculate how many complete cycles have passed
    const today = new Date();
    const daysSinceLastPeriod = differenceInDays(today, lastPeriodStart);
    const cyclesPassed = Math.floor(daysSinceLastPeriod / cycleLength);
    
    // Next period is at the start of the next cycle
    const nextPeriod = addDays(lastPeriodStart, (cyclesPassed + 1) * cycleLength);
    
    return nextPeriod;
  };

  const nextPeriodDate = getNextPeriodDate();
  
  if (!nextPeriodDate) return null;

  const daysUntilPeriod = differenceInDays(nextPeriodDate, new Date());
  const periodEndDate = addDays(nextPeriodDate, 4);
  
  // Determine urgency level
  const getUrgencyClass = () => {
    if (daysUntilPeriod <= 2) return 'bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30';
    if (daysUntilPeriod <= 5) return 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30';
    return 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20';
  };

  const getIconClass = () => {
    if (daysUntilPeriod <= 2) return 'text-red-500';
    if (daysUntilPeriod <= 5) return 'text-amber-500';
    return 'text-primary';
  };

  const getMessage = () => {
    if (daysUntilPeriod <= 0) return 'Sua menstruação pode começar hoje!';
    if (daysUntilPeriod === 1) return 'Sua menstruação está prevista para amanhã';
    if (daysUntilPeriod <= 3) return 'Prepare-se! Sua menstruação está chegando';
    if (daysUntilPeriod <= 7) return 'Sua próxima menstruação está próxima';
    return 'Previsão da próxima menstruação';
  };

  return (
    <motion.div
      className={`mx-4 p-4 rounded-2xl border ${getUrgencyClass()}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-background/50 ${getIconClass()}`}>
          <Droplets className="w-6 h-6" />
        </div>
        
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{getMessage()}</p>
          <div className="flex items-center gap-2 mt-1">
            <CalendarDays className={`w-4 h-4 ${getIconClass()}`} />
            <span className="font-semibold text-foreground">
              {format(nextPeriodDate, "dd 'de' MMMM", { locale: ptBR })}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className={`text-2xl font-bold ${getIconClass()}`}>
            {daysUntilPeriod <= 0 ? 'Hoje' : daysUntilPeriod}
          </span>
          {daysUntilPeriod > 0 && (
            <p className="text-xs text-muted-foreground">
              {daysUntilPeriod === 1 ? 'dia' : 'dias'}
            </p>
          )}
        </div>
      </div>

      {/* Quick Menstruation Button - Inline and discrete */}
      <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
        <QuickMenstruationButton />
        
        {/* Period duration hint */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span>
            Término: ~{format(periodEndDate, "dd/MM", { locale: ptBR })}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default NextPeriodCard;
