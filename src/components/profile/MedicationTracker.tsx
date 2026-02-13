import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Pill, Calendar, Clock, CalendarCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useMedication } from '@/hooks/useMedication';
import MedicationSearch from './MedicationSearch';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseLocalDate, toLocalDateString } from '@/lib/dateUtils';

const MedicationTracker: React.FC = () => {
  const {
    medicationName,
    medicationType,
    medicationLastTaken,
    medicationFrequencyDays,
    loading,
    saving,
    saveMedication,
    saveLastTaken,
    saveFrequency,
  } = useMedication();

  const [frequencyInput, setFrequencyInput] = useState(
    medicationFrequencyDays?.toString() || '30'
  );

  // Update local state when data loads
  React.useEffect(() => {
    if (medicationFrequencyDays) {
      setFrequencyInput(medicationFrequencyDays.toString());
    }
  }, [medicationFrequencyDays]);

  if (loading) return null;

  // Calculate next medication date
  const nextDate = medicationLastTaken && medicationFrequencyDays
    ? addDays(parseLocalDate(medicationLastTaken), medicationFrequencyDays)
    : null;

  const daysUntilNext = nextDate
    ? differenceInDays(nextDate, new Date())
    : null;

  const isUrgent = daysUntilNext !== null && daysUntilNext <= 3;
  const isOverdue = daysUntilNext !== null && daysUntilNext < 0;

  const handleMarkToday = async () => {
    const today = toLocalDateString(new Date());
    await saveLastTaken(today);
  };

  const handleFrequencyBlur = () => {
    const days = parseInt(frequencyInput);
    if (!isNaN(days) && days > 0) {
      saveFrequency(days);
    }
  };

  return (
    <motion.div
      className="glass-card p-5 space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
    >
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        💊 Medicamento / Contraceptivo Oral
      </h3>

      {/* Medication Search */}
      <MedicationSearch
        value={medicationName}
        medicationType={medicationType}
        onChange={saveMedication}
      />

      {/* Only show tracking when medication is selected */}
      {medicationName && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4 pt-2"
        >
          {/* Next medication badge */}
          {nextDate && (
            <div className={`p-3 rounded-xl flex items-center gap-3 ${
              isOverdue
                ? 'bg-destructive/10 border border-destructive/30'
                : isUrgent
                  ? 'bg-orange-500/10 border border-orange-500/30'
                  : 'bg-primary/5 border border-primary/20'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isOverdue
                  ? 'bg-destructive/20'
                  : isUrgent
                    ? 'bg-orange-500/20'
                    : 'bg-primary/10'
              }`}>
                <Calendar className={`w-5 h-5 ${
                  isOverdue
                    ? 'text-destructive'
                    : isUrgent
                      ? 'text-orange-500'
                      : 'text-primary'
                }`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Próxima dose</p>
                <p className={`text-xs ${
                  isOverdue
                    ? 'text-destructive font-semibold'
                    : isUrgent
                      ? 'text-orange-600 font-semibold'
                      : 'text-muted-foreground'
                }`}>
                  {isOverdue
                    ? `Atrasado há ${Math.abs(daysUntilNext!)} dia${Math.abs(daysUntilNext!) !== 1 ? 's' : ''}!`
                    : format(nextDate, "d 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`text-sm font-bold ${
                  isOverdue
                    ? 'border-destructive/50 text-destructive'
                    : isUrgent
                      ? 'border-orange-500/50 text-orange-600'
                      : 'border-primary/50 text-primary'
                }`}
              >
                {isOverdue ? '⚠️' : `${daysUntilNext}d`}
              </Badge>
            </div>
          )}

          {/* Last taken + frequency */}
          <div className="space-y-3">
            {/* Register last taken */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-primary" />
                Última dose tomada
              </label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {medicationLastTaken ? (
                        format(parseLocalDate(medicationLastTaken), 'dd/MM/yyyy', { locale: ptBR })
                      ) : (
                        <span className="text-muted-foreground">Selecione a data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 bg-card pointer-events-auto" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={medicationLastTaken ? parseLocalDate(medicationLastTaken) : undefined}
                      onSelect={(date) => {
                        if (date) saveLastTaken(toLocalDateString(date));
                      }}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  variant="secondary"
                  onClick={handleMarkToday}
                  disabled={saving}
                  className="whitespace-nowrap"
                >
                  Hoje
                </Button>
              </div>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                Frequência (a cada quantos dias?)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={frequencyInput}
                  onChange={(e) => setFrequencyInput(e.target.value)}
                  onBlur={handleFrequencyBlur}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">dias</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MedicationTracker;
