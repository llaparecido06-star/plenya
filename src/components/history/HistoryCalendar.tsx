import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Droplets, Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSelectedDate } from '@/contexts/SelectedDateContext';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { useCycle } from '@/contexts/CycleContext';
import { useLifePhase } from '@/hooks/useLifePhase';
import { useMenstruationLog } from '@/hooks/useMenstruationLog';
import { format, isSameDay } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface HistoryCalendarProps {
  onClose?: () => void;
}

const HistoryCalendar: React.FC<HistoryCalendarProps> = ({ onClose }) => {
  const { selectedDate, setSelectedDate, isToday, goToToday } = useSelectedDate();
  const { datesWithData } = useHistoricalData();
  const { getPredictedPeriodDates, cycleLength, lastPeriodStart } = useCycle();
  const { isTryingToConceive, lifePhase } = useLifePhase();
  const { user } = useAuth();
  const { menstruationDates, toggleMenstruation, isMenstruating, emergencyContraceptionDates } = useMenstruationLog();
  
  const [viewMonth, setViewMonth] = useState(new Date(selectedDate));
  const [intimacyDates, setIntimacyDates] = useState<string[]>([]);
  const [newlyAddedDates, setNewlyAddedDates] = useState<string[]>([]);
  const [menstruationDialogOpen, setMenstruationDialogOpen] = useState(false);
  const [selectedDayForMenstruation, setSelectedDayForMenstruation] = useState<Date | null>(null);
  
  // Use ref to track previous dates for comparison without causing re-renders
  const previousDatesRef = React.useRef<string[]>([]);
  // Fetch intimacy log dates
  const fetchIntimacyDates = React.useCallback(async (isRefresh = false) => {
    if (!user) return;
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const { data, error } = await supabase
      .from('intimacy_logs')
      .select('log_date, sensation_physical')
      .eq('user_id', user.id)
      .gte('log_date', sixtyDaysAgo.toISOString().split('T')[0]);
    
    if (!error && data) {
      // Only include dates that have actual intimacy activity
      const datesWithActivity = data
        .filter(log => log.sensation_physical && log.sensation_physical.length > 0)
        .map(log => log.log_date);
      
      // Track newly added dates for animation
      if (isRefresh) {
        const newDates = datesWithActivity.filter(d => !previousDatesRef.current.includes(d));
        if (newDates.length > 0) {
          setNewlyAddedDates(newDates);
          // Clear animation after 2 seconds
          setTimeout(() => setNewlyAddedDates([]), 2000);
        }
      }
      
      previousDatesRef.current = datesWithActivity;
      setIntimacyDates(datesWithActivity);
    }
  }, [user]);

  // Initial fetch
  React.useEffect(() => {
    fetchIntimacyDates();
  }, [user]); // Only depend on user, not fetchIntimacyDates

  // Listen for intimacy log saves to refresh calendar
  React.useEffect(() => {
    const handleIntimacySaved = () => {
      // Small delay to ensure DB has saved
      setTimeout(() => {
        fetchIntimacyDates(true);
      }, 100);
    };
    
    window.addEventListener('intimacy-log-saved', handleIntimacySaved);
    return () => {
      window.removeEventListener('intimacy-log-saved', handleIntimacySaved);
    };
  }, [fetchIntimacyDates]);

  // Get predicted period dates for the current view (only for non-menopause users)
  // Adjust for emergency contraception (+7 days)
  const predictedPeriodDates = useMemo(() => {
    if (lifePhase === 'menopause') return []; // No predictions for menopause
    
    let dates = getPredictedPeriodDates(6); // 6 months ahead
    
    // If there's a recent emergency contraception, shift predictions by +7 days
    if (emergencyContraceptionDates.length > 0) {
      const sorted = [...emergencyContraceptionDates].sort((a, b) => 
        new Date(b).getTime() - new Date(a).getTime()
      );
      const mostRecentEC = new Date(sorted[0]);
      const today = new Date();
      const daysSinceEC = Math.floor((today.getTime() - mostRecentEC.getTime()) / (1000 * 60 * 60 * 24));
      
      // Only apply adjustment if EC was within last 30 days
      if (daysSinceEC <= 30) {
        dates = dates.map(d => {
          const newDate = new Date(d);
          newDate.setDate(newDate.getDate() + 7);
          return newDate;
        });
      }
    }
    
    return dates;
  }, [getPredictedPeriodDates, lifePhase, emergencyContraceptionDates]);

  // Calculate fertile window dates for trying to conceive users
  const fertileWindowDates = useMemo(() => {
    if (!isTryingToConceive || !lastPeriodStart || lifePhase !== 'menstruating') return [];
    
    const dates: Date[] = [];
    const ovulationDay = cycleLength - 14;
    const fertileStart = ovulationDay - 4;
    const fertileEnd = ovulationDay + 1;
    
    // Calculate fertile days for next 3 cycles
    for (let cycle = 0; cycle < 3; cycle++) {
      const cycleStartOffset = cycle * cycleLength;
      for (let day = fertileStart; day <= fertileEnd; day++) {
        const fertileDate = new Date(lastPeriodStart);
        fertileDate.setDate(lastPeriodStart.getDate() + cycleStartOffset + day - 1);
        dates.push(fertileDate);
      }
    }
    
    return dates;
  }, [isTryingToConceive, lastPeriodStart, cycleLength, lifePhase]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];
    
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const days = getDaysInMonth(viewMonth);

  const goToPreviousMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  // Long press to toggle menstruation (for past days only) - BLOCKED for pregnant users
  const handleDayLongPress = (day: number) => {
    // Block menstruation logging for pregnant users
    if (lifePhase === 'pregnant') {
      return;
    }
    
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Only allow past days
    if (date < today) {
      setSelectedDayForMenstruation(date);
      setMenstruationDialogOpen(true);
    }
  };

  const handleMenstruationConfirm = async () => {
    if (selectedDayForMenstruation) {
      await toggleMenstruation(selectedDayForMenstruation);
    }
    setMenstruationDialogOpen(false);
    setSelectedDayForMenstruation(null);
  };

  const isManualMenstruation = (day: number): boolean => {
    const dateStr = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return menstruationDates.includes(dateStr);
  };

  const isDateWithData = (day: number): boolean => {
    const dateStr = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return datesWithData.includes(dateStr);
  };

  const hasIntimacyLog = (day: number): boolean => {
    const dateStr = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return intimacyDates.includes(dateStr);
  };

  const isNewlyAddedIntimacy = (day: number): boolean => {
    const dateStr = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return newlyAddedDates.includes(dateStr);
  };

  const isPredictedPeriod = (day: number): boolean => {
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    return predictedPeriodDates.some(periodDate => isSameDay(periodDate, date));
  };

  const isFertileDay = (day: number): boolean => {
    if (!isTryingToConceive) return false;
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    return fertileWindowDates.some(fertileDate => isSameDay(fertileDate, date));
  };

  const isSelectedDay = (day: number): boolean => {
    return (
      day === selectedDate.getDate() &&
      viewMonth.getMonth() === selectedDate.getMonth() &&
      viewMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isTodayDay = (day: number): boolean => {
    const today = new Date();
    return (
      day === today.getDate() &&
      viewMonth.getMonth() === today.getMonth() &&
      viewMonth.getFullYear() === today.getFullYear()
    );
  };

  const isFutureDay = (day: number): boolean => {
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  return (
    <motion.div
      className="glass-card p-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold text-foreground min-w-[140px] text-center">
            {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </span>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {!isToday && (
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoje
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs text-muted-foreground font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          let pressTimer: NodeJS.Timeout | null = null;
          
          return (
            <div key={index} className="aspect-square flex items-center justify-center">
              {day !== null && (
                <button
                  onClick={() => !isFutureDay(day) && handleDayClick(day)}
                  onMouseDown={() => {
                    pressTimer = setTimeout(() => handleDayLongPress(day), 500);
                  }}
                  onMouseUp={() => {
                    if (pressTimer) clearTimeout(pressTimer);
                  }}
                  onMouseLeave={() => {
                    if (pressTimer) clearTimeout(pressTimer);
                  }}
                  onTouchStart={() => {
                    pressTimer = setTimeout(() => handleDayLongPress(day), 500);
                  }}
                  onTouchEnd={() => {
                    if (pressTimer) clearTimeout(pressTimer);
                  }}
                  disabled={false}
                  className={`
                    relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium
                    transition-all duration-200
                    ${isSelectedDay(day) 
                      ? 'bg-primary text-primary-foreground' 
                      : isManualMenstruation(day)
                        ? 'bg-red-500 text-white'
                        : isTodayDay(day)
                          ? 'bg-primary/20 text-primary'
                          : isFertileDay(day) && !isFutureDay(day)
                            ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                            : isFertileDay(day) && isFutureDay(day)
                              ? 'bg-amber-500/10 text-amber-500/70 border border-amber-500/20'
                              : isPredictedPeriod(day) && isFutureDay(day)
                                ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                                : isFutureDay(day)
                                  ? 'text-muted-foreground/40'
                                  : 'text-foreground hover:bg-muted'
                    }
                  `}
                >
                  {day}
                  {/* Manual menstruation indicator */}
                  {isManualMenstruation(day) && !isSelectedDay(day) && (
                    <Droplets className="absolute -top-0.5 -right-0.5 w-3 h-3 text-white" />
                  )}
                  {/* Fertile day indicator - golden star for trying to conceive */}
                  {isFertileDay(day) && !isSelectedDay(day) && !isManualMenstruation(day) && (
                    <Star 
                      className="absolute -top-0.5 -right-0.5 w-3 h-3 text-amber-500" 
                      fill="currentColor"
                    />
                  )}
                  {/* Predicted period indicator */}
                  {isPredictedPeriod(day) && isFutureDay(day) && !isSelectedDay(day) && !isFertileDay(day) && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
                  )}
                  {/* Intimacy log indicator - purple heart with animation */}
                  {hasIntimacyLog(day) && !isSelectedDay(day) && !isFutureDay(day) && !isFertileDay(day) && !isManualMenstruation(day) && (
                    <motion.span 
                      className="absolute -top-0.5 -right-0.5 text-purple-500"
                      initial={isNewlyAddedIntimacy(day) ? { scale: 0, opacity: 0 } : false}
                      animate={isNewlyAddedIntimacy(day) ? { 
                        scale: [0, 1.3, 1], 
                        opacity: 1 
                      } : {}}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      <Heart 
                        className={`w-3 h-3 ${isNewlyAddedIntimacy(day) ? 'animate-pulse' : ''}`} 
                        fill="currentColor" 
                      />
                    </motion.span>
                  )}
                  {/* Data indicator dot */}
                  {isDateWithData(day) && !isSelectedDay(day) && !isFutureDay(day) && !hasIntimacyLog(day) && !isFertileDay(day) && !isManualMenstruation(day) && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>Registro</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
            <Droplets className="w-2.5 h-2.5 text-white" />
          </div>
          <span>Menstruação</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Heart className="w-3 h-3 text-purple-500" fill="currentColor" />
          <span>Intimidade</span>
        </div>
        {isTryingToConceive && (
          <div className="flex items-center gap-1.5">
            <Star className="w-3 h-3 text-amber-500" fill="currentColor" />
            <span>Fértil</span>
          </div>
        )}
        {lifePhase !== 'menopause' && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <Droplets className="w-2.5 h-2.5 text-red-500" />
            </div>
            <span>Previsão</span>
          </div>
        )}
      </div>
      
      {/* Tip for long press - hide for pregnant users */}
      {lifePhase !== 'pregnant' && (
        <p className="text-xs text-center text-muted-foreground mt-2">
          💡 Segure um dia passado para marcar menstruação
        </p>
      )}

      {/* Menstruation Toggle Dialog */}
      <AlertDialog open={menstruationDialogOpen} onOpenChange={setMenstruationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-red-500" />
              {selectedDayForMenstruation && isMenstruating(selectedDayForMenstruation) 
                ? 'Remover Menstruação' 
                : 'Registrar Menstruação'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedDayForMenstruation && (
                <>
                  Dia {selectedDayForMenstruation.getDate()} de {MONTHS[selectedDayForMenstruation.getMonth()]}
                  <br />
                  {isMenstruating(selectedDayForMenstruation)
                    ? 'Deseja remover este dia como menstruação?'
                    : 'Deseja marcar este dia como menstruação?'}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleMenstruationConfirm}
              className="bg-red-500 hover:bg-red-600"
            >
              {selectedDayForMenstruation && isMenstruating(selectedDayForMenstruation) 
                ? 'Remover' 
                : 'Marcar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default HistoryCalendar;
