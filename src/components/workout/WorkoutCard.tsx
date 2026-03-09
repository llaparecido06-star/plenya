import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Wind, Clock, ChevronDown, Check, Loader2, Timer, Shuffle, Moon, Info, Sparkles, Zap } from 'lucide-react';
import { useCycle, CyclePhase } from '@/contexts/CycleContext';
import { useLifePhase } from '@/hooks/useLifePhase';
import { useWorkouts } from '@/hooks/useWorkouts';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ExerciseDetailDrawer from './ExerciseDetailDrawer';
import RestTimerModal from './RestTimerModal';
import { useProfile } from '@/hooks/useProfile';
import { useAIBrain } from '@/hooks/useAIBrain';
import { useAuth } from '@/contexts/AuthContext';
import PremiumGate from '@/components/subscription/PremiumGate';
import { useTranslation } from 'react-i18next';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  completed: boolean[];
  weight?: number;
  actualReps?: number;
  observation?: string;
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

// Exercise alternatives for swap feature
const exerciseAlternatives: Record<string, string[]> = {
  'Agachamento com salto': ['Agachamento búlgaro', 'Leg Press', 'Afundo com salto'],
  'Flexão': ['Supino com halteres', 'Flexão diamante', 'Flexão inclinada'],
  'Burpees': ['Jumping jacks', 'High knees', 'Squat jumps'],
  'Prancha': ['Prancha lateral', 'Dead bug', 'Bird dog'],
  'Levantamento terra': ['Stiff', 'Romanian deadlift', 'Hip thrust'],
  'Supino': ['Crucifixo', 'Push-up com peso', 'Floor press'],
};

// Activity level intensity key mapping
const activityIntensityKeys: Record<string, string> = {
  sedentary: 'workout.activity_sedentary',
  light: 'workout.activity_light',
  moderate: 'workout.activity_moderate',
  intense: 'workout.activity_intense',
};

const WorkoutCard: React.FC = () => {
  const { t } = useTranslation();
  const { workout: savedWorkout, loading, saving, saveExercises, completeExercise, workoutPhase, isToday } = useWorkouts();
  const { fitness_level, goals } = useProfile();
  const { subscribed } = useAuth();
  const { lifePhase, pregnancyWeeks } = useLifePhase();
  const { toast } = useToast();
  const { generateWorkout, loading: aiLoading } = useAIBrain();
  const [isExpanded, setIsExpanded] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [hasWorkout, setHasWorkout] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [aiWorkout, setAiWorkout] = useState<{ title: string; duration: string; intensity: string } | null>(null);
  const [energyLevel, setEnergyLevel] = useState(3);

  const defaultPlan = workoutPlans[workoutPhase];
  const Icon = aiWorkout ? Sparkles : defaultPlan.icon;
  const intensityTip = fitness_level && activityIntensityKeys[fitness_level] ? t(activityIntensityKeys[fitness_level]) : null;

  // Load saved exercises or use defaults for the phase
  useEffect(() => {
    if (savedWorkout?.exercises && savedWorkout.exercises.length > 0) {
      setExercises(savedWorkout.exercises);
      setHasWorkout(true);
      if (savedWorkout.workout_name?.includes('IA')) {
        setAiWorkout({
          title: savedWorkout.workout_name,
          duration: `${savedWorkout.duration_minutes || 30} min`,
          intensity: 'Personalizado',
        });
      }
    } else {
      setExercises([]);
      setHasWorkout(false);
      setAiWorkout(null);
    }
  }, [savedWorkout, workoutPhase]);

  const { postpartumWeeks } = useLifePhase();

  const handleGenerateAIWorkout = async () => {
    const goalText = goals.length > 0 ? goals.join(', ') : null;
    
    const result = await generateWorkout({
      energy_level: energyLevel,
      phase: workoutPhase,
      goal: goalText,
      fitness_level: fitness_level || 'moderate',
      life_phase: lifePhase || undefined,
      pregnancy_weeks: pregnancyWeeks || undefined,
      postpartum_weeks: postpartumWeeks || undefined,
    });

    if (result) {
      const aiExercises: Exercise[] = result.exercises.map((ex, idx) => ({
        id: `ai-${idx + 1}`,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        completed: Array(ex.sets).fill(false),
        observation: ex.observation,
      }));

      setExercises(aiExercises);
      setAiWorkout({
        title: result.title,
        duration: result.duration,
        intensity: result.intensity,
      });
      setIsExpanded(true);
      setHasWorkout(true);

      // Auto-save AI workout
      if (isToday) {
        await saveExercises(`${result.title} (IA)`, aiExercises);
      }

      toast({
        title: t('workout.workout_generated'),
        description: `${result.title} - ${result.duration}`,
      });
    }
  };

  const toggleSet = async (exerciseId: string, setIndex: number) => {
    if (!isToday) return;
    
    const updatedExercises = exercises.map(ex =>
      ex.id === exerciseId
        ? {
            ...ex,
            completed: ex.completed.map((c, i) => (i === setIndex ? !c : c)),
          }
        : ex
    );
    setExercises(updatedExercises);
    
    // Auto-save after toggling
    await saveExercises(defaultPlan.title, updatedExercises);
  };

  const handleExerciseClick = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsDrawerOpen(true);
  };

  const handleExerciseComplete = async (exerciseId: string, weight?: number, reps?: number) => {
    await completeExercise(defaultPlan.title, exerciseId, exercises, weight, reps);
    
    // Update local state
    setExercises(prev =>
      prev.map(ex =>
        ex.id === exerciseId
          ? { ...ex, completed: ex.completed.map(() => true), weight, actualReps: reps }
          : ex
      )
    );
    setIsDrawerOpen(false);
  };

  const handleSwapExercise = async (exerciseId: string, exerciseName: string) => {
    const alternatives = exerciseAlternatives[exerciseName];
    if (!alternatives || alternatives.length === 0) {
      toast({
        title: t('workout.no_alternatives'),
        description: t('workout.no_alternatives_desc'),
      });
      return;
    }

    toast({
      title: t('workout.finding_alternative'),
      description: t('workout.finding_alternative_desc'),
    });

    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 800));

    const randomAlternative = alternatives[Math.floor(Math.random() * alternatives.length)];
    
    const updatedExercises = exercises.map(ex =>
      ex.id === exerciseId
        ? { ...ex, name: randomAlternative }
        : ex
    );
    
    setExercises(updatedExercises);
    
    if (isToday) {
      await saveExercises(defaultPlan.title, updatedExercises);
    }

    toast({
      title: t('workout.exercise_swapped'),
      description: t('workout.now_doing', { name: randomAlternative }),
    });
  };

  const totalSets = exercises.length > 0 ? exercises.reduce((acc, ex) => acc + ex.sets, 0) : 0;
  const completedSets = exercises.length > 0 ? exercises.reduce(
    (acc, ex) => acc + ex.completed.filter(Boolean).length,
    0
  ) : 0;
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  if (loading) {
    return (
      <div className="rounded-3xl p-5 mx-4 glass-card flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Show rest day message if no workout and viewing history
  if (!isToday && !savedWorkout) {
    return (
      <motion.div
        className="rounded-3xl p-5 mx-4 glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-secondary">
            <Moon className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">{t('workout.rest_day')}</h3>
            <p className="text-sm text-muted-foreground">{t('workout.no_workout_recorded')}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          {t('workout.planned_workout')} <span className="font-medium text-foreground">{defaultPlan.title}</span>
        </p>
      </motion.div>
    );
  }

  // Show generate workout CTA when no workout exists for today
  if (isToday && !hasWorkout) {
    return (
      <motion.div
        className="rounded-3xl p-5 mx-4 glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl phase-gradient shadow-glow">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">{t('workout.workout_of_day')}</h3>
            <p className="text-sm text-muted-foreground">
              {lifePhase === 'pregnant' ? t('workout.phase_info_pregnant') :
               lifePhase === 'postpartum' ? t('workout.phase_info_postpartum') :
               lifePhase === 'menopause' ? t('workout.phase_info_menopause') :
               t('workout.phase_info', { title: defaultPlan.title.toLowerCase(), intensity: defaultPlan.intensity })}
            </p>
            </p>
          </div>
        </div>

        <PremiumGate feature={t('workout.generate_feature')} mode="banner">
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">{t('workout.energy_today')}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setEnergyLevel(level)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      energyLevel >= level
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleGenerateAIWorkout}
              disabled={aiLoading}
              className="w-full bg-gradient-to-r from-primary to-terracotta text-white hover:opacity-90"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('workout.generating')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t('workout.generate_workout')}
                </>
              )}
            </Button>
          </div>
        </PremiumGate>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        id="workout-card"
        className={`rounded-3xl p-5 mx-4 ${aiWorkout ? 'glass-card border-2 border-primary/30' : defaultPlan.style} transition-all`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        layout
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${aiWorkout ? 'bg-gradient-to-br from-primary to-terracotta' : 'phase-gradient'} shadow-glow`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {aiWorkout ? aiWorkout.title : defaultPlan.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {aiWorkout ? t('workout.ai_personalized') : defaultPlan.subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(saving || aiLoading) && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
            {/* Rest Timer Button */}
            <Button
              id="rest-timer-button"
              variant="ghost"
              size="icon"
              onClick={() => setShowRestTimer(true)}
              className="h-9 w-9"
            >
              <Timer className="w-4 h-4 text-primary" />
            </Button>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {aiWorkout ? aiWorkout.duration : defaultPlan.duration}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Flame className="w-4 h-4" />
            {aiWorkout ? aiWorkout.intensity : defaultPlan.intensity}
          </div>
        </div>

        {/* AI Workout Generator */}
        {isToday && !aiWorkout && (
          <motion.div 
            className="mb-4 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-terracotta/10 border border-primary/20"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">{t('workout.energy_today')}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setEnergyLevel(level)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      energyLevel >= level
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleGenerateAIWorkout}
              disabled={aiLoading}
              className="w-full bg-gradient-to-r from-primary to-terracotta text-white hover:opacity-90"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('workout.generating')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t('workout.generate_workout')}
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Activity level tip */}
        {intensityTip && (
          <div className="mb-4 p-2 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-2">
            <Info className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground">{intensityTip}</p>
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">{t('workout.progress')}</span>
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
          {isExpanded ? t('workout.hide_exercises') : t('workout.show_exercises')}
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
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-card/50 hover:bg-card/80 transition-colors"
                  >
                    <button
                      onClick={() => handleExerciseClick(exercise)}
                      className="flex-1 text-left"
                    >
                      <p className="font-medium text-foreground">{exercise.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {exercise.sets} sets × {exercise.reps}
                        {exercise.weight && ` • ${exercise.weight}kg`}
                      </p>
                    </button>
                    
                    <div className="flex items-center gap-2">
                      {/* Swap button */}
                      {isToday && exerciseAlternatives[exercise.name] && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSwapExercise(exercise.id, exercise.name);
                          }}
                          className="p-2 rounded-full hover:bg-secondary/80 transition-colors"
                          title={t('workout.swap_exercise')}
                        >
                          <Shuffle className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )}
                      
                      {/* Set buttons */}
                      <div className="flex gap-1.5">
                        {exercise.completed.map((isCompleted, setIndex) => (
                          <button
                            key={setIndex}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSet(exercise.id, setIndex);
                            }}
                            disabled={!isToday}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            } ${!isToday ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isCompleted ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <span className="text-xs font-medium">{setIndex + 1}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <ExerciseDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        exercise={selectedExercise}
        onComplete={handleExerciseComplete}
        readOnly={!isToday}
      />

      <RestTimerModal
        isOpen={showRestTimer}
        onClose={() => setShowRestTimer(false)}
      />
    </>
  );
};

export default WorkoutCard;
