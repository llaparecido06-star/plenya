import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Dumbbell, Flame, Calendar, Trophy, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkoutHistory } from '@/hooks/useWorkoutHistory';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const workoutTypeLabels: Record<string, { label: string; color: string }> = {
  hiit: { label: 'HIIT', color: 'bg-orange-500' },
  forca: { label: 'Força', color: 'bg-blue-500' },
  yoga: { label: 'Yoga', color: 'bg-purple-500' },
  mobilidade: { label: 'Mobilidade', color: 'bg-teal-500' },
  cardio: { label: 'Cardio', color: 'bg-pink-500' },
};

const WorkoutHistoryCalendar: React.FC = () => {
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const { workoutDates, getWorkoutForDate, getWorkoutStats, loading } = useWorkoutHistory();

  const stats = getWorkoutStats();

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

  const hasWorkout = (day: number): boolean => {
    const dateStr = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return workoutDates.includes(dateStr);
  };

  const getWorkoutType = (day: number): string | null => {
    const dateStr = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const workout = getWorkoutForDate(dateStr);
    return workout?.workout_type || null;
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

  const handleDayClick = (day: number) => {
    if (!isFutureDay(day) && hasWorkout(day)) {
      const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
      setSelectedDay(selectedDay && isSameDay(selectedDay, date) ? null : date);
    }
  };

  const selectedWorkout = selectedDay 
    ? getWorkoutForDate(selectedDay.toISOString().split('T')[0]) 
    : null;

  if (loading) {
    return (
      <div className="glass-card p-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/2 mb-4" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="glass-card p-4 space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center p-2 bg-primary/10 rounded-lg">
          <Dumbbell className="w-4 h-4 mx-auto text-primary mb-1" />
          <p className="text-lg font-bold text-foreground">{stats.totalWorkouts}</p>
          <p className="text-xs text-muted-foreground">Treinos</p>
        </div>
        <div className="text-center p-2 bg-orange-500/10 rounded-lg">
          <Flame className="w-4 h-4 mx-auto text-orange-500 mb-1" />
          <p className="text-lg font-bold text-foreground">{stats.streak}</p>
          <p className="text-xs text-muted-foreground">Sequência</p>
        </div>
        <div className="text-center p-2 bg-blue-500/10 rounded-lg">
          <Clock className="w-4 h-4 mx-auto text-blue-500 mb-1" />
          <p className="text-lg font-bold text-foreground">{stats.totalDuration}</p>
          <p className="text-xs text-muted-foreground">Minutos</p>
        </div>
        <div className="text-center p-2 bg-green-500/10 rounded-lg">
          <Trophy className="w-4 h-4 mx-auto text-green-500 mb-1" />
          <p className="text-lg font-bold text-foreground">{stats.completedCount}</p>
          <p className="text-xs text-muted-foreground">Completos</p>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">Histórico</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            {MONTHS[viewMonth.getMonth()].slice(0, 3)} {viewMonth.getFullYear()}
          </span>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs text-muted-foreground font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const workout = day ? hasWorkout(day) : false;
          const workoutType = day ? getWorkoutType(day) : null;
          const typeInfo = workoutType ? workoutTypeLabels[workoutType] : null;
          
          return (
            <div key={index} className="aspect-square flex items-center justify-center">
              {day !== null && (
                <button
                  onClick={() => handleDayClick(day)}
                  disabled={isFutureDay(day)}
                  className={`
                    relative w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    transition-all duration-200
                    ${workout 
                      ? `${typeInfo?.color || 'bg-primary'} text-white shadow-md`
                      : isTodayDay(day)
                        ? 'bg-primary/20 text-primary ring-2 ring-primary/30'
                        : isFutureDay(day)
                          ? 'text-muted-foreground/40'
                          : 'text-muted-foreground hover:bg-muted'
                    }
                    ${selectedDay && isSameDay(selectedDay, new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day)) 
                      ? 'ring-2 ring-foreground' 
                      : ''
                    }
                  `}
                >
                  {day}
                  {workout && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-white rounded-full flex items-center justify-center">
                      <Dumbbell className="w-1.5 h-1.5 text-primary" />
                    </span>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Workout Details */}
      <AnimatePresence>
        {selectedWorkout && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-muted/50 rounded-xl space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs text-white ${workoutTypeLabels[selectedWorkout.workout_type]?.color || 'bg-primary'}`}>
                  {workoutTypeLabels[selectedWorkout.workout_type]?.label || selectedWorkout.workout_type}
                </span>
                <span className="font-medium text-foreground">{selectedWorkout.workout_name}</span>
              </div>
              {selectedWorkout.completed && (
                <Trophy className="w-4 h-4 text-green-500" />
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{format(new Date(selectedWorkout.workout_date), "dd 'de' MMMM", { locale: ptBR })}</span>
              {selectedWorkout.duration_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {selectedWorkout.duration_minutes} min
                </span>
              )}
              <span className="flex items-center gap-1">
                <Dumbbell className="w-3 h-3" />
                {selectedWorkout.exercises_count} exercícios
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
        {Object.entries(workoutTypeLabels).map(([key, { label, color }]) => (
          <div key={key} className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            {label}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default WorkoutHistoryCalendar;
