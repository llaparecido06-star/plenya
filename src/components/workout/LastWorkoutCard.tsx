import React from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Clock, ChevronRight } from 'lucide-react';
import { format, isYesterday, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useWorkouts } from '@/hooks/useWorkouts';

const LastWorkoutCard: React.FC = () => {
  const { workout, loading: isLoading } = useWorkouts();

  const lastWorkout = workout;

  if (isLoading) {
    return (
      <div className="mx-4 mb-4">
        <div className="glass-card p-4 animate-pulse">
          <div className="h-12 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!lastWorkout) {
    return (
      <motion.div 
        className="mx-4 mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="glass-card p-4 flex items-center gap-3 text-muted-foreground">
          <Dumbbell className="w-5 h-5" />
          <span>Nenhum treino registrado ainda</span>
        </div>
      </motion.div>
    );
  }

  const exercises = (lastWorkout?.exercises as any[]) || [];

  const getDateLabel = () => {
    return 'Hoje';
  };

  return (
    <motion.div 
      className="mx-4 mb-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                Último Treino: {getDateLabel()}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{exercises.length} exercício{exercises.length !== 1 ? 's' : ''}</span>
                {lastWorkout.duration_minutes && (
                  <>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{lastWorkout.duration_minutes} min</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
    </motion.div>
  );
};

export default LastWorkoutCard;
