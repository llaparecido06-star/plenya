import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowLeft,
  Stethoscope,
  Scale,
  Heart,
  Loader2,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useSelectedDate } from '@/contexts/SelectedDateContext';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { useDailyLogForDate } from '@/hooks/useDailyLogForDate';
import { useCycle, CyclePhase } from '@/contexts/CycleContext';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';


const MEAL_TYPE_LABELS: Record<string, string> = {
  cafe: '☕ Café',
  almoco: '🍽️ Almoço',
  jantar: '🌙 Jantar',
  lanche: '🍎 Lanche',
};

const baseSymptoms = [
  'Cólica', 'Dor de cabeça', 'Inchaço', 'Fadiga', 
  'Sensibilidade', 'Acne', 'Náusea', 'Insônia', 'Irritabilidade', 'Espinhas'
];

const phaseSymptomPriority: Record<CyclePhase, string[]> = {
  menstrual: ['Cólica', 'Fadiga', 'Dor de cabeça', 'Náusea'],
  folicular: ['Acne', 'Sensibilidade'],
  ovulatoria: ['Inchaço', 'Sensibilidade'],
  lutea: ['Irritabilidade', 'Inchaço', 'Espinhas', 'Dor de cabeça', 'Fadiga'],
};

const moods = [
  { emoji: '😢', label: 'Triste', value: 1 },
  { emoji: '😔', label: 'Baixa', value: 2 },
  { emoji: '😐', label: 'Neutra', value: 3 },
  { emoji: '😊', label: 'Bem', value: 4 },
  { emoji: '🤩', label: 'Ótima', value: 5 },
];

const DayDataSummary: React.FC = () => {
  const { selectedDate, isToday, goToToday } = useSelectedDate();
  const { dailyLog, meals, workout, loading } = useHistoricalData();
  const { data: logData, saving, saveLog, isAuthenticated } = useDailyLogForDate(selectedDate);
  const { currentPhase } = useCycle();

  const [openDrawer, setOpenDrawer] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<number>(2);
  const [weight, setWeight] = useState<number[]>([60]);
  const [saved, setSaved] = useState(false);

  // Sync state when logData loads
  useEffect(() => {
    if (logData.symptoms.length > 0) setSelectedSymptoms(logData.symptoms);
    if (logData.mood !== null) setSelectedMood(logData.mood - 1);
    if (logData.weight !== null) setWeight([logData.weight]);
  }, [logData]);

  const sortedSymptoms = useMemo(() => {
    const prioritySymptoms = phaseSymptomPriority[currentPhase] || [];
    const prioritySet = new Set(prioritySymptoms);
    const priority = prioritySymptoms.filter(s => baseSymptoms.includes(s));
    const rest = baseSymptoms.filter(s => !prioritySet.has(s));
    return [...priority, ...rest];
  }, [currentPhase]);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const handleSave = async (type: string) => {
    let success = false;
    switch (type) {
      case 'symptom':
        success = await saveLog({ symptoms: selectedSymptoms });
        break;
      case 'mood':
        success = await saveLog({ mood: moods[selectedMood].value });
        break;
      case 'weight':
        success = await saveLog({ weight: weight[0] });
        break;
    }
    if (success) {
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setOpenDrawer(null);
      }, 1200);
    }
  };

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
        </div>
      </motion.div>
    );
  }

  const hasAnyData = dailyLog || meals.length > 0 || workout;

  const quickActions = [
    { id: 'symptom', icon: Stethoscope, label: 'Sintoma', color: 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400' },
    { id: 'mood', icon: Smile, label: 'Humor', color: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400' },
    { id: 'weight', icon: Scale, label: 'Peso', color: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400' },
    { id: 'intimacy', icon: Heart, label: 'Sexo', color: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400' },
  ];

  return (
    <>
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
              Hoje
            </Button>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {quickActions.map((action) => (
              <motion.button
                key={action.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (action.id === 'intimacy') {
                    // Dispatch event to open the intimacy log drawer
                    window.dispatchEvent(new CustomEvent('open-intimacy-log'));
                  } else {
                    setOpenDrawer(action.id);
                  }
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
              >
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-medium text-foreground">{action.label}</span>
              </motion.button>
          ))}
        </div>

        {!hasAnyData ? (
          <div className="text-center py-6 text-muted-foreground">
            <Plus className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum registro neste dia</p>
            <p className="text-xs mt-1">Use os botões acima para registrar</p>
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

            {/* Weight */}
            {dailyLog?.weight !== null && dailyLog?.weight !== undefined && (
              <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-3">
                <Scale className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Peso</p>
                  <p className="font-medium text-foreground">{Number(dailyLog.weight).toFixed(1)} kg</p>
                </div>
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

      {/* Symptom Drawer */}
      <Drawer open={openDrawer === 'symptom'} onOpenChange={(open) => !open && setOpenDrawer(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                <Stethoscope className="w-4 h-4" />
              </div>
              Registrar Sintomas
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8">
            <p className="text-sm text-muted-foreground mb-4">
              Selecione os sintomas deste dia
            </p>
            <div className="flex flex-wrap gap-2">
              {sortedSymptoms.map((symptom) => {
                const isPriority = phaseSymptomPriority[currentPhase]?.includes(symptom);
                return (
                  <button
                    key={symptom}
                    onClick={() => toggleSymptom(symptom)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedSymptoms.includes(symptom)
                        ? 'bg-primary text-primary-foreground'
                        : isPriority
                          ? 'bg-secondary/70 text-foreground ring-1 ring-primary/20'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {symptom}
                  </button>
                );
              })}
            </div>
            <Button
              className="w-full mt-6 phase-gradient text-white"
              onClick={() => handleSave('symptom')}
              disabled={saving || saved || !isAuthenticated}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Check className="w-4 h-4 mr-1" /> Salvo!</> : 'Salvar'}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Mood Drawer */}
      <Drawer open={openDrawer === 'mood'} onOpenChange={(open) => !open && setOpenDrawer(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <Smile className="w-4 h-4" />
              </div>
              Registrar Humor
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8">
            <p className="text-sm text-muted-foreground mb-6">
              Como você estava neste dia?
            </p>
            <div className="flex justify-between items-center px-2">
              {moods.map((mood, index) => (
                <button
                  key={mood.label}
                  onClick={() => setSelectedMood(index)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                    selectedMood === index
                      ? 'bg-primary/10 scale-110'
                      : 'opacity-50 hover:opacity-100'
                  }`}
                >
                  <span className="text-3xl">{mood.emoji}</span>
                  <span className="text-xs text-muted-foreground">{mood.label}</span>
                </button>
              ))}
            </div>
            <Button
              className="w-full mt-6 phase-gradient text-white"
              onClick={() => handleSave('mood')}
              disabled={saving || saved || !isAuthenticated}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Check className="w-4 h-4 mr-1" /> Salvo!</> : 'Salvar'}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Weight Drawer */}
      <Drawer open={openDrawer === 'weight'} onOpenChange={(open) => !open && setOpenDrawer(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <Scale className="w-4 h-4" />
              </div>
              Registrar Peso
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8">
            <p className="text-sm text-muted-foreground mb-6">
              Registre o peso deste dia
            </p>
            <div className="text-center mb-6">
              <span className="text-5xl font-bold text-foreground">{weight[0].toFixed(1)}</span>
              <span className="text-2xl text-muted-foreground ml-1">kg</span>
            </div>
            <Slider
              value={weight}
              onValueChange={setWeight}
              min={40}
              max={120}
              step={0.1}
              className="w-full"
            />
            <Button
              className="w-full mt-6 phase-gradient text-white"
              onClick={() => handleSave('weight')}
              disabled={saving || saved || !isAuthenticated}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Check className="w-4 h-4 mr-1" /> Salvo!</> : 'Salvar'}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default DayDataSummary;
