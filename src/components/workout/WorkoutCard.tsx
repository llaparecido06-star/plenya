import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Wind, Clock, ChevronDown, Check } from 'lucide-react';
import { useCycle, CyclePhase } from '@/contexts/CycleContext';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  completed: boolean[];
}

interface WorkoutPlan {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  duration: string;
  intensity: string;
  style: string;
  exercises: Exercise[];
}

const workoutPlans: Record<CyclePhase, WorkoutPlan> = {
  menstrual: {
    title: 'Movimento Suave',
    subtitle: 'Honre seu corpo com gentileza',
    icon: Wind,
    duration: '20 min',
    intensity: 'Baixa',
    style: 'workout-card-calm',
    exercises: [
      { id: '1', name: 'Caminhada leve', sets: 1, reps: '10 min', completed: [false] },
      { id: '2', name: 'Alongamento de quadril', sets: 2, reps: '30 seg', completed: [false, false] },
      { id: '3', name: 'Respiração diafragmática', sets: 3, reps: '1 min', completed: [false, false, false] },
      { id: '4', name: 'Postura do bebê (yoga)', sets: 2, reps: '1 min', completed: [false, false] },
    ],
  },
  folicular: {
    title: 'HIIT & Força',
    subtitle: 'Energia em ascensão - hora de intensificar!',
    icon: Flame,
    duration: '45 min',
    intensity: 'Alta',
    style: 'workout-card-energetic',
    exercises: [
      { id: '1', name: 'Agachamento com salto', sets: 4, reps: '12 reps', completed: [false, false, false, false] },
      { id: '2', name: 'Flexão', sets: 3, reps: '15 reps', completed: [false, false, false] },
      { id: '3', name: 'Burpees', sets: 3, reps: '10 reps', completed: [false, false, false] },
      { id: '4', name: 'Prancha', sets: 3, reps: '45 seg', completed: [false, false, false] },
      { id: '5', name: 'Mountain climbers', sets: 3, reps: '20 reps', completed: [false, false, false] },
    ],
  },
  ovulatoria: {
    title: 'Performance Total',
    subtitle: 'Você está no auge - dê tudo de si!',
    icon: Flame,
    duration: '50 min',
    intensity: 'Máxima',
    style: 'workout-card-energetic',
    exercises: [
      { id: '1', name: 'Levantamento terra', sets: 4, reps: '8 reps', completed: [false, false, false, false] },
      { id: '2', name: 'Supino', sets: 4, reps: '10 reps', completed: [false, false, false, false] },
      { id: '3', name: 'Remada curvada', sets: 3, reps: '12 reps', completed: [false, false, false] },
      { id: '4', name: 'Desenvolvimento', sets: 3, reps: '10 reps', completed: [false, false, false] },
      { id: '5', name: 'Cardio HIIT', sets: 1, reps: '15 min', completed: [false] },
    ],
  },
  lutea: {
    title: 'Yoga & Mobilidade',
    subtitle: 'Desacelere e cuide-se',
    icon: Wind,
    duration: '35 min',
    intensity: 'Moderada',
    style: 'workout-card-calm',
    exercises: [
      { id: '1', name: 'Saudação ao sol', sets: 3, reps: '5 ciclos', completed: [false, false, false] },
      { id: '2', name: 'Postura do cachorro olhando para baixo', sets: 2, reps: '1 min', completed: [false, false] },
      { id: '3', name: 'Postura da pomba', sets: 2, reps: '1 min cada lado', completed: [false, false] },
      { id: '4', name: 'Torção sentada', sets: 2, reps: '45 seg cada lado', completed: [false, false] },
      { id: '5', name: 'Savasana', sets: 1, reps: '5 min', completed: [false] },
    ],
  },
};

const WorkoutCard: React.FC = () => {
  const { currentPhase } = useCycle();
  const [isExpanded, setIsExpanded] = useState(false);
  const [exercises, setExercises] = useState(workoutPlans[currentPhase].exercises);

  const workout = workoutPlans[currentPhase];
  const Icon = workout.icon;

  const toggleSet = (exerciseId: string, setIndex: number) => {
    setExercises(prev =>
      prev.map(ex =>
        ex.id === exerciseId
          ? {
              ...ex,
              completed: ex.completed.map((c, i) => (i === setIndex ? !c : c)),
            }
          : ex
      )
    );
  };

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets, 0);
  const completedSets = exercises.reduce(
    (acc, ex) => acc + ex.completed.filter(Boolean).length,
    0
  );
  const progress = (completedSets / totalSets) * 100;

  return (
    <motion.div
      className={`rounded-3xl p-5 mx-4 ${workout.style} transition-all`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl phase-gradient shadow-glow">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">{workout.title}</h3>
            <p className="text-sm text-muted-foreground">{workout.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          {workout.duration}
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Flame className="w-4 h-4" />
          {workout.intensity}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium text-foreground">
            {completedSets}/{totalSets} sets
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full phase-gradient"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-primary"
      >
        {isExpanded ? 'Ocultar exercícios' : 'Ver exercícios'}
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-4 border-t border-border/50">
              {exercises.map((exercise, exerciseIndex) => (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: exerciseIndex * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-card/50"
                >
                  <div>
                    <p className="font-medium text-foreground">{exercise.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {exercise.sets} sets × {exercise.reps}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {exercise.completed.map((isCompleted, setIndex) => (
                      <button
                        key={setIndex}
                        onClick={() => toggleSet(exercise.id, setIndex)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-medium">{setIndex + 1}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WorkoutCard;
