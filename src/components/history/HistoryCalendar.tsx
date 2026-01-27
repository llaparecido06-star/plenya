import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Droplets, Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSelectedDate } from '@/contexts/SelectedDateContext';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { useCycle } from '@/contexts/CycleContext';
import { useLifePhase } from '@/hooks/useLifePhase';
import { format, isSameDay } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
  
  const [viewMonth, setViewMonth] = useState(new Date(selectedDate));
  const [intimacyDates, setIntimacyDates] = useState<string[]>([]);
  const [newlyAddedDates, setNewlyAddedDates] = useState<string[]>([]);
  
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
  const predictedPeriodDates = useMemo(() => {
    if (lifePhase === 'menopause') return []; // No predictions for menopause
    return getPredictedPeriodDates(6); // 6 months ahead
  }, [getPredictedPeriodDates, lifePhase]);

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
      onClose?.();
    }
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
        {days.map((day, index) => (
          <div key={index} className="aspect-square flex items-center justify-center">
            {day !== null && (
              <button
                onClick={() => !isFutureDay(day) && handleDayClick(day)}
                disabled={false} // Allow clicking future days to see prediction
                className={`
                  relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium
                  transition-all duration-200
                  ${isSelectedDay(day) 
                    ? 'bg-primary text-primary-foreground' 
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
                {/* Fertile day indicator - golden star for trying to conceive */}
                {isFertileDay(day) && !isSelectedDay(day) && (
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
                {hasIntimacyLog(day) && !isSelectedDay(day) && !isFutureDay(day) && !isFertileDay(day) && (
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
                {isDateWithData(day) && !isSelectedDay(day) && !isFutureDay(day) && !hasIntimacyLog(day) && !isFertileDay(day) && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>Registro</span>
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
    </motion.div>
  );
};

export default HistoryCalendar;
