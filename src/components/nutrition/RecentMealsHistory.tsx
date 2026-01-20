import React from 'react';
import { motion } from 'framer-motion';
import { History, Smile, Frown, Meh, Zap, ZapOff } from 'lucide-react';
import { useRecentMealsWithMood } from '@/hooks/useRecentMealsWithMood';
import { Skeleton } from '@/components/ui/skeleton';

const MEAL_TYPE_EMOJI: Record<string, string> = {
  cafe: '☕',
  almoco: '🍽️',
  jantar: '🌙',
  lanche: '🍎',
};

const RecentMealsHistory: React.FC = () => {
  const { mealsWithMood, loading } = useRecentMealsWithMood();

  const getMoodIcon = (mood: number | null) => {
    if (mood === null) return null;
    if (mood <= 3) return <Frown className="w-4 h-4 text-menstrual" />;
    if (mood <= 6) return <Meh className="w-4 h-4 text-lutea" />;
    return <Smile className="w-4 h-4 text-folicular" />;
  };

  const getEnergyIcon = (energy: number | null) => {
    if (energy === null) return null;
    if (energy <= 4) return <ZapOff className="w-4 h-4 text-muted-foreground" />;
    return <Zap className="w-4 h-4 text-ovulatoria" />;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
    
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <motion.div
        className="glass-card p-4 mx-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </motion.div>
    );
  }

  if (mealsWithMood.length === 0) {
    return null;
  }

  // Group meals by date
  const groupedMeals = mealsWithMood.reduce((acc, meal) => {
    if (!acc[meal.intake_date]) {
      acc[meal.intake_date] = [];
    }
    acc[meal.intake_date].push(meal);
    return acc;
  }, {} as Record<string, typeof mealsWithMood>);

  return (
    <motion.div
      className="glass-card p-4 mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">Histórico Recente</h3>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedMeals).map(([date, dateMeals]) => (
          <div key={date}>
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              {formatDate(date)}
            </p>
            <div className="space-y-2">
              {dateMeals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{MEAL_TYPE_EMOJI[meal.meal_type] || '🍴'}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {meal.meal_name || meal.meal_type}
                      </p>
                      {meal.calories && (
                        <p className="text-xs text-muted-foreground">{meal.calories} kcal</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getMoodIcon(meal.mood)}
                    {getEnergyIcon(meal.energy)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        😊 = humor do dia | ⚡ = energia do dia
      </p>
    </motion.div>
  );
};

export default RecentMealsHistory;
