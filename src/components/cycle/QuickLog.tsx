import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Smile, Scale, Loader2, Check } from 'lucide-react';
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

interface LogType {
  id: string;
  icon: React.ElementType;
  label: string;
  color: string;
}

const logTypes: LogType[] = [
  { id: 'symptom', icon: Heart, label: 'Sintoma', color: 'bg-rose-100 text-rose-600' },
  { id: 'mood', icon: Smile, label: 'Humor', color: 'bg-amber-100 text-amber-600' },
  { id: 'weight', icon: Scale, label: 'Peso', color: 'bg-blue-100 text-blue-600' },
];

const symptoms = [
  'Cólica', 'Dor de cabeça', 'Inchaço', 'Fadiga', 
  'Sensibilidade', 'Acne', 'Náusea', 'Insônia'
];

const moods = [
  { emoji: '😢', label: 'Triste', value: 1 },
  { emoji: '😔', label: 'Baixa', value: 2 },
  { emoji: '😐', label: 'Neutra', value: 3 },
  { emoji: '😊', label: 'Bem', value: 4 },
  { emoji: '🤩', label: 'Ótima', value: 5 },
];

const QuickLog: React.FC = () => {
  const { data, loading, saving, saveLog, isAuthenticated } = useDailyLog();
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<number>(2);
  const [weight, setWeight] = useState<number[]>([60]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saved, setSaved] = useState(false);

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
              {symptoms.map(symptom => (
                <button
                  key={symptom}
                  onClick={() => toggleSymptom(symptom)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedSymptoms.includes(symptom)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {symptom}
                </button>
              ))}
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
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
        REGISTRO RÁPIDO
      </h3>
      <div className="flex gap-3">
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
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl glass-card hover:shadow-soft transition-all`}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <div className={`p-3 rounded-xl ${log.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{log.label}</span>
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
      </div>
    </motion.div>
  );
};

export default QuickLog;
