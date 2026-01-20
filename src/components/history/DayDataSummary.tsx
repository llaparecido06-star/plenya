import React from 'react';
import { motion } from 'framer-motion';
import { 
  CalendarDays, 
  Smile, 
  Frown, 
  Meh, 
  Zap, 
  Dumbbell, 
  Check, 
  X,
  Utensils,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSelectedDate } from '@/contexts/SelectedDateContext';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { Skeleton } from '@/components/ui/skeleton';

const MEAL_TYPE_LABELS: Record<string, string> = {
  cafe: '☕ Café',
  almoco: '🍽️ Almoço',
  jantar: '🌙 Jantar',
  lanche: '🍎 Lanche',
};

const DayDataSummary: React.FC = () => {
  const { selectedDate, isToday, goToToday } = useSelectedDate();
  const { dailyLog, meals, workout, loading } = useHistoricalData();

  const formatDisplayDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    };
    return date.toLocaleDateString('pt-BR', options);
  };

  const getMoodIcon = (mood: number | null) => {
    if (mood === null) return <Meh className="w-5 h-5 text-muted-foreground" />;
    if (mood <= 3) return <Frown className="w-5 h-5 text-menstrual" />;
    if (mood <= 6) return <Meh className="w-5 h-5 text-lutea" />;
    return <Smile className="w-5 h-5 text-folicular" />;
  };

  const getEnergyLabel = (energy: number | null): string => {
    if (energy === null) return 'Sem registro';
    if (energy <= 3) return 'Baixa';
    if (energy <= 6) return 'Moderada';
    return 'Alta';
  };

  if (loading) {
    return (
      <motion.div
        className="glass-card p-4 mx-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </motion.div>
    );
  }

  const hasAnyData = dailyLog || meals.length > 0 || workout;

  return (
    <motion.div
      className="glass-card p-4 mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground capitalize">
              {isToday ? 'Hoje' : formatDisplayDate(selectedDate)}
            </h3>
            {!isToday && (
              <p className="text-xs text-muted-foreground">Visualizando histórico</p>
            )}
          </div>
        </div>
        {!isToday && (
          <Button variant="ghost" size="sm" onClick={goToToday}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar para Hoje
          </Button>
        )}
      </div>

      {!hasAnyData ? (
        <div className="text-center py-8 text-muted-foreground">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum registro encontrado para este dia</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mood & Energy */}
          {dailyLog && (dailyLog.mood !== null || dailyLog.energy !== null) && (
            <div className="flex gap-4">
              {dailyLog.mood !== null && (
                <div className="flex-1 bg-muted/50 rounded-xl p-3 flex items-center gap-3">
                  {getMoodIcon(dailyLog.mood)}
                  <div>
                    <p className="text-xs text-muted-foreground">Humor</p>
                    <p className="font-medium text-foreground">{dailyLog.mood}/10</p>
                  </div>
                </div>
              )}
              {dailyLog.energy !== null && (
                <div className="flex-1 bg-muted/50 rounded-xl p-3 flex items-center gap-3">
                  <Zap className="w-5 h-5 text-ovulatoria" />
                  <div>
                    <p className="text-xs text-muted-foreground">Energia</p>
                    <p className="font-medium text-foreground">{getEnergyLabel(dailyLog.energy)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Symptoms */}
          {dailyLog?.symptoms && dailyLog.symptoms.length > 0 && (
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-2">Sintomas</p>
              <div className="flex flex-wrap gap-2">
                {dailyLog.symptoms.map((symptom, i) => (
                  <span 
                    key={i} 
                    className="text-xs bg-background px-2 py-1 rounded-full text-foreground"
                  >
                    {symptom}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Workout */}
          {workout && (
            <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${workout.completed ? 'bg-folicular/20' : 'bg-muted'}`}>
                <Dumbbell className={`w-5 h-5 ${workout.completed ? 'text-folicular' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{workout.workout_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{workout.workout_type}</p>
              </div>
              <div className={`flex items-center gap-1 text-sm ${workout.completed ? 'text-folicular' : 'text-muted-foreground'}`}>
                {workout.completed ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                {workout.completed ? 'Concluído' : 'Pendente'}
              </div>
            </div>
          )}

          {/* Meals */}
          {meals.length > 0 && (
            <div className="bg-muted/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-3">
                <Utensils className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground">Refeições</p>
              </div>
              <div className="space-y-2">
                {meals.map((meal) => (
                  <div 
                    key={meal.id} 
                    className="flex items-center justify-between bg-background rounded-lg px-3 py-2"
                  >
                    <div>
                      <span className="text-sm font-medium text-foreground">
                        {meal.meal_name || MEAL_TYPE_LABELS[meal.meal_type] || meal.meal_type}
                      </span>
                      {meal.meal_name && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {MEAL_TYPE_LABELS[meal.meal_type]}
                        </span>
                      )}
                    </div>
                    {meal.calories && (
                      <span className="text-xs text-muted-foreground">{meal.calories} kcal</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default DayDataSummary;
