import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Smile, Scale, Loader2, Check, Stethoscope } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useMedication } from '@/hooks/useMedication';
import { useCycle, CyclePhase } from '@/contexts/CycleContext';
import { useLifePhase } from '@/hooks/useLifePhase';
import MedicationEffectBadge from '@/components/profile/MedicationEffectBadge';
import IntimacyLog from './IntimacyLog';

interface LogType {
  id: string;
  icon: React.ElementType;
  label: string;
  color: string;
}

const logTypes: LogType[] = [
  { id: 'symptom', icon: Stethoscope, label: 'Sintoma', color: 'bg-rose-100 text-rose-600' },
  { id: 'mood', icon: Smile, label: 'Humor', color: 'bg-amber-100 text-amber-600' },
  { id: 'weight', icon: Scale, label: 'Peso', color: 'bg-blue-100 text-blue-600' },
];

// Base symptoms list for menstruating users
const baseSymptoms = [
  'Cólica', 'Dor de cabeça', 'Inchaço', 'Fadiga', 
  'Sensibilidade', 'Acne', 'Náusea', 'Insônia', 'Irritabilidade', 'Espinhas'
];

// Pregnancy-specific symptoms
const pregnancySymptoms = [
  'Náusea', 'Azia', 'Inchaço', 'Dor nas costas', 'Insônia', 'Fadiga',
  'Cólica', 'Dor de cabeça', 'Tontura', 'Desejos', 'Constipação',
  'Ansiedade', 'Contrações', 'Falta de ar'
];

// Pregnancy symptoms prioritized by trimester
const trimesterSymptomPriority: Record<number, string[]> = {
  1: ['Náusea', 'Fadiga', 'Tontura', 'Desejos'],
  2: ['Azia', 'Dor nas costas', 'Inchaço', 'Constipação'],
  3: ['Contrações', 'Falta de ar', 'Insônia', 'Dor nas costas'],
};

// Symptoms prioritized by phase - these will appear first
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

const QuickLog: React.FC = () => {
  const { data, loading, saving, saveLog, isAuthenticated } = useDailyLog();
  const { medicationName } = useMedication();
  const { currentPhase } = useCycle();
  const { lifePhase, pregnancyWeeks } = useLifePhase();
  const isPregnant = lifePhase === 'pregnant';
  const trimester = pregnancyWeeks ? (pregnancyWeeks <= 12 ? 1 : pregnancyWeeks <= 27 ? 2 : 3) : 1;

  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<number>(2);
  const [weight, setWeight] = useState<number[]>([60]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Sort symptoms based on current phase or trimester
  const sortedSymptoms = useMemo(() => {
    if (isPregnant) {
      const prioritySymptoms = trimesterSymptomPriority[trimester] || [];
      const prioritySet = new Set(prioritySymptoms);
      const priority = prioritySymptoms.filter(s => pregnancySymptoms.includes(s));
      const rest = pregnancySymptoms.filter(s => !prioritySet.has(s));
      return [...priority, ...rest];
    }
    
    const prioritySymptoms = phaseSymptomPriority[currentPhase] || [];
    const prioritySet = new Set(prioritySymptoms);
    const priority = prioritySymptoms.filter(s => baseSymptoms.includes(s));
    const rest = baseSymptoms.filter(s => !prioritySet.has(s));
    return [...priority, ...rest];
  }, [currentPhase, isPregnant, trimester]);

  // Load saved values
  useEffect(() => {
    if (data.symptoms.length > 0) setSelectedSymptoms(data.symptoms);
    if (data.mood !== null) setSelectedMood(data.mood - 1); // Convert 1-5 to 0-4 index
    if (data.weight !== null) setWeight([data.weight]);
  }, [data]);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSave = async () => {
    let success = false;
    
    switch (selectedLog) {
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
        setDrawerOpen(false);
      }, 1500);
    }
  };

  const renderLogContent = () => {
    switch (selectedLog) {
      case 'symptom':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione os sintomas que você está sentindo hoje
            </p>
          <div className="flex flex-wrap gap-2">
              {sortedSymptoms.map((symptom, index) => {
                const isPriority = phaseSymptomPriority[currentPhase]?.includes(symptom);
                return (
                  <div key={symptom} className="flex flex-col items-start gap-1">
                    <button
                      onClick={() => toggleSymptom(symptom)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedSymptoms.includes(symptom)
                          ? 'bg-primary text-primary-foreground'
                          : isPriority 
                            ? 'bg-phase-secondary/50 text-foreground ring-1 ring-phase-primary/30 hover:bg-phase-secondary/70'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {isPriority && index < 3 && '⚡ '}{symptom}
                    </button>
                    {selectedSymptoms.includes(symptom) && (
                      <MedicationEffectBadge
                        medicationName={medicationName}
                        symptom={symptom}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'mood':
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Como você está se sentindo hoje?
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
          </div>
        );
      case 'weight':
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Registre seu peso de hoje
            </p>
            <div className="text-center">
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
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="px-4 flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      className="px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      {/* Pregnancy risk alert - only shows if there's a risk */}
      <IntimacyLog showAlert={true} alertOnly={true} />
      
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
        REGISTRO RÁPIDO
      </h3>
      <div className="grid grid-cols-4 gap-3 pb-24">
        {logTypes.map((log, index) => {
          const Icon = log.icon;
          return (
            <Drawer key={log.id} open={drawerOpen && selectedLog === log.id} onOpenChange={(open) => {
              setDrawerOpen(open);
              if (open) setSelectedLog(log.id);
            }}>
              <DrawerTrigger asChild>
                <motion.button
                  onClick={() => setSelectedLog(log.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl glass-card hover:shadow-soft transition-all`}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <div className={`p-3 rounded-xl ${log.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-foreground text-center">{log.label}</span>
                </motion.button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${log.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    Registrar {log.label}
                  </DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-8">
                  {renderLogContent()}
                  <Button 
                    className="w-full mt-6 phase-gradient text-white"
                    onClick={handleSave}
                    disabled={saving || saved || !isAuthenticated}
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </span>
                    ) : saved ? (
                      <span className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Salvo!
                      </span>
                    ) : !isAuthenticated ? (
                      'Faça login para salvar'
                    ) : (
                      'Salvar Registro'
                    )}
                  </Button>
                </div>
              </DrawerContent>
            </Drawer>
          );
        })}
        
        {/* Intimacy Log Button - 4th column */}
        <IntimacyLog />
      </div>
    </motion.div>
  );
};

export default QuickLog;
