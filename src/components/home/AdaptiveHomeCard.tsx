import React from 'react';
import { motion } from 'framer-motion';
import { Check, AlertTriangle, Calendar, Pill } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useHomeStatus } from '@/hooks/useHomeStatus';
import { usePillTracker } from '@/hooks/usePillTracker';
import { Button } from '@/components/ui/button';

const AdaptiveHomeCard: React.FC = () => {
  const homeStatus = useHomeStatus();
  const { todayLog, markAsTaken, markAsSkipped, loading: isLoading } = usePillTracker();

  if (!homeStatus) return null;

  // PILL SCENARIO - Big checkbox
  if (homeStatus.type === 'pill') {
    const isTaken = todayLog?.taken_at !== null;
    const isSkipped = todayLog?.skipped === true;
    const hasTakenAction = isTaken || isSkipped;

    return (
      <motion.div
        className="mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={cn(
          "glass-card p-5 transition-all duration-300",
          hasTakenAction && !isSkipped && "ring-2 ring-leaf-green bg-leaf-green/5"
        )}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Pill className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Tomou seu {homeStatus.brand || 'anticoncepcional'} hoje?
                </h3>
                {homeStatus.reminderTime && (
                  <p className="text-sm text-muted-foreground">
                    Lembrete às {homeStatus.reminderTime}
                  </p>
                )}
              </div>
            </div>
          </div>

          {!hasTakenAction ? (
            <div className="flex gap-3">
              <Button
                onClick={markAsTaken}
                disabled={isLoading}
                className="flex-1 h-14 text-lg phase-gradient text-white gap-2"
              >
                <Check className="w-6 h-6" />
                Tomei!
              </Button>
              <Button
                onClick={markAsSkipped}
                disabled={isLoading}
                variant="outline"
                className="h-14 px-4"
              >
                Pular
              </Button>
            </div>
          ) : (
            <div className={cn(
              "flex items-center justify-center gap-3 py-4 rounded-xl",
              isSkipped ? "bg-muted" : "bg-leaf-green/10"
            )}>
              {isSkipped ? (
                <span className="text-muted-foreground">Pulado hoje</span>
              ) : (
                <>
                  <Check className="w-6 h-6 text-leaf-green" />
                  <span className="font-semibold text-leaf-green">
                    Tomado às {todayLog?.taken_at ? format(new Date(todayLog.taken_at), 'HH:mm') : '--:--'}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // INJECTION/RING/PATCH SCENARIO - Countdown card
  if (homeStatus.type === 'injection' || homeStatus.type === 'ring_patch') {
    const daysLeft = homeStatus.daysUntilNext ?? 0;
    const isUrgent = homeStatus.isUrgent;

    return (
      <motion.div
        className="mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={cn(
          "glass-card p-5 transition-all duration-300",
          isUrgent && "ring-2 ring-destructive bg-destructive/5"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center",
              isUrgent ? "bg-destructive/20" : "bg-primary/10"
            )}>
              {isUrgent ? (
                <AlertTriangle className="w-8 h-8 text-destructive" />
              ) : (
                <Calendar className="w-8 h-8 text-primary" />
              )}
            </div>
            
            <div className="flex-1">
              {isUrgent ? (
                <>
                  <p className="text-sm font-medium text-destructive mb-1">
                    ⚠️ {homeStatus.label} vence em breve!
                  </p>
                  <p className="text-2xl font-bold text-destructive">
                    {daysLeft === 0 ? 'HOJE!' : `${daysLeft} dia${daysLeft > 1 ? 's' : ''}`}
                  </p>
                  <p className="text-sm text-muted-foreground">Prepare-se</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-1">
                    Próxima {homeStatus.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    Faltam {daysLeft} dias
                  </p>
                  {homeStatus.nextDate && (
                    <p className="text-sm text-muted-foreground">
                      {format(homeStatus.nextDate, "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {homeStatus.brand && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">{homeStatus.brand}</span>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // LONG DURATION (DIU/Implant) - Already handled by DeviceExpirationCard
  // NATURAL - Already handled by CycleWheel
  return null;
};

export default AdaptiveHomeCard;
