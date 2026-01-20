import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Smile, Scale } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

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
  { emoji: '😢', label: 'Triste' },
  { emoji: '😔', label: 'Baixa' },
  { emoji: '😐', label: 'Neutra' },
  { emoji: '😊', label: 'Bem' },
  { emoji: '🤩', label: 'Ótima' },
];

const QuickLog: React.FC = () => {
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<number>(2);
  const [weight, setWeight] = useState<number[]>([60]);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
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
              <span className="text-5xl font-bold text-foreground">{weight[0]}</span>
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
            <Drawer key={log.id}>
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
                  <Button className="w-full mt-6 phase-gradient text-white">
                    Salvar Registro
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
