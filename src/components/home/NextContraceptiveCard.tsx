import React from 'react';
import { motion } from 'framer-motion';
import { Syringe, Circle, Square, Clock, AlertTriangle } from 'lucide-react';
import { useContraceptive } from '@/hooks/useContraceptive';
import { getMethodById } from '@/data/contraceptiveMethods';
import { format, addDays, addWeeks, addMonths, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContraceptiveReminderInfo {
  nextDate: Date;
  daysRemaining: number;
  label: string;
  icon: React.ElementType;
  frequency: string;
}

const getContraceptiveReminder = (
  type: string | null,
  details: Record<string, any> | null
): ContraceptiveReminderInfo | null => {
  if (!type || !details) return null;

  const lastDate = details.lastApplicationDate 
    ? parseISO(details.lastApplicationDate) 
    : null;

  if (!lastDate) return null;

  let nextDate: Date;
  let label: string;
  let icon: React.ElementType;
  let frequency: string;

  switch (type) {
    case 'injection':
      const injectionFreq = details.frequency || 'monthly';
      if (injectionFreq === 'quarterly') {
        nextDate = addMonths(lastDate, 3);
        frequency = 'Trimestral';
      } else {
        nextDate = addMonths(lastDate, 1);
        frequency = 'Mensal';
      }
      label = 'Próxima Injeção';
      icon = Syringe;
      break;

    case 'ring':
      nextDate = addWeeks(lastDate, 3); // Ring is changed after 3 weeks
      label = 'Trocar Anel';
      icon = Circle;
      frequency = 'A cada 3 semanas';
      break;

    case 'patch':
      nextDate = addWeeks(lastDate, 1); // Patch is changed weekly
      label = 'Trocar Adesivo';
      icon = Square;
      frequency = 'Semanal';
      break;

    default:
      return null;
  }

  const daysRemaining = differenceInDays(nextDate, new Date());

  return {
    nextDate,
    daysRemaining,
    label,
    icon,
    frequency,
  };
};

const NextContraceptiveCard: React.FC = () => {
  const { contraceptive_type, contraceptive_details, loading } = useContraceptive();

  if (loading) return null;

  const reminder = getContraceptiveReminder(contraceptive_type, contraceptive_details);

  if (!reminder) return null;

  const method = getMethodById(contraceptive_type || '');
  const Icon = reminder.icon;
  const isUrgent = reminder.daysRemaining <= 2;
  const isOverdue = reminder.daysRemaining < 0;

  return (
    <motion.div
      className={`glass-card p-4 mx-4 ${
        isOverdue 
          ? 'border-destructive/50 bg-destructive/5' 
          : isUrgent 
            ? 'border-orange-500/50 bg-orange-500/5' 
            : ''
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          isOverdue 
            ? 'bg-destructive/20' 
            : isUrgent 
              ? 'bg-orange-500/20' 
              : 'bg-primary/10'
        }`}>
          {isOverdue || isUrgent ? (
            <AlertTriangle className={`w-6 h-6 ${isOverdue ? 'text-destructive' : 'text-orange-500'}`} />
          ) : (
            <Icon className="w-6 h-6 text-primary" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{method?.icon}</span>
            <h4 className="font-semibold text-foreground">{reminder.label}</h4>
          </div>
          <p className={`text-sm ${
            isOverdue 
              ? 'text-destructive font-medium' 
              : isUrgent 
                ? 'text-orange-600 font-medium' 
                : 'text-muted-foreground'
          }`}>
            {isOverdue 
              ? `Atrasado há ${Math.abs(reminder.daysRemaining)} dia${Math.abs(reminder.daysRemaining) !== 1 ? 's' : ''}!` 
              : isUrgent 
                ? `Em ${reminder.daysRemaining} dia${reminder.daysRemaining !== 1 ? 's' : ''}!` 
                : format(reminder.nextDate, "d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>

        {/* Days Counter */}
        <div className={`text-center px-3 py-2 rounded-lg ${
          isOverdue 
            ? 'bg-destructive/20' 
            : isUrgent 
              ? 'bg-orange-500/20' 
              : 'bg-muted'
        }`}>
          <span className={`text-xl font-bold ${
            isOverdue 
              ? 'text-destructive' 
              : isUrgent 
                ? 'text-orange-600' 
                : 'text-foreground'
          }`}>
            {isOverdue ? '!' : reminder.daysRemaining}
          </span>
          <p className="text-xs text-muted-foreground">
            {isOverdue ? 'atrasado' : 'dias'}
          </p>
        </div>
      </div>

      {/* Frequency badge */}
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" />
        <span>{reminder.frequency}</span>
      </div>
    </motion.div>
  );
};

export default NextContraceptiveCard;
