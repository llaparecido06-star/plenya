import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Battery, Zap, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDailyLog } from '@/hooks/useDailyLog';

const stressLabels = [
  { value: 1, emoji: '😌', text: 'Tranquila' },
  { value: 2, emoji: '😐', text: 'Leve tensão' },
  { value: 3, emoji: '😓', text: 'Moderado' },
  { value: 4, emoji: '😰', text: 'Elevado' },
  { value: 5, emoji: '🤯', text: 'Muito alto' },
];

const energyLabels = [
  { value: 1, emoji: '😴', text: 'Esgotada' },
  { value: 2, emoji: '🥱', text: 'Baixa' },
  { value: 3, emoji: '😐', text: 'Neutra' },
  { value: 4, emoji: '😊', text: 'Boa' },
  { value: 5, emoji: '⚡', text: 'Energizada' },
];

const EmotionalCheckin: React.FC = () => {
  const { data, loading, saving, saveLog, isAuthenticated } = useDailyLog();
  const [stress, setStress] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [saved, setSaved] = useState(false);

  // Load saved values
  useEffect(() => {
    if (data.stress !== null) setStress(data.stress);
    if (data.energy !== null) setEnergy(data.energy);
  }, [data.stress, data.energy]);

  const handleSave = async () => {
    const success = await saveLog({
      stress: Math.round(stress),
      energy: Math.round(energy),
    });
    
    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const stressInfo = stressLabels.find(l => l.value === stress) || stressLabels[2];
  const energyInfo = energyLabels.find(l => l.value === energy) || energyLabels[2];

  if (loading) {
    return (
      <div className="glass-card p-5 mx-4 flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      className="glass-card p-5 mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="font-semibold text-foreground mb-6">Check-in Emocional</h3>

      <div className="space-y-8">
        {/* Stress selector */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-100">
                <Battery className="w-4 h-4 text-rose-600" />
              </div>
              <span className="font-medium text-foreground">Nível de Estresse</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{stressInfo.emoji}</span>
              <span className="text-sm text-muted-foreground">{stressInfo.text}</span>
            </div>
          </div>
          <div className="flex justify-between gap-2">
            {stressLabels.map((label) => (
              <button
                key={label.value}
                onClick={() => setStress(label.value)}
                className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  stress === label.value
                    ? 'bg-rose-100 scale-105'
                    : 'opacity-50 hover:opacity-100 hover:bg-secondary/50'
                }`}
              >
                <span className="text-xl">{label.emoji}</span>
                <span className="text-[10px] text-muted-foreground">{label.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Energy selector */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100">
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              <span className="font-medium text-foreground">Nível de Energia</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{energyInfo.emoji}</span>
              <span className="text-sm text-muted-foreground">{energyInfo.text}</span>
            </div>
          </div>
          <div className="flex justify-between gap-2">
            {energyLabels.map((label) => (
              <button
                key={label.value}
                onClick={() => setEnergy(label.value)}
                className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  energy === label.value
                    ? 'bg-amber-100 scale-105'
                    : 'opacity-50 hover:opacity-100 hover:bg-secondary/50'
                }`}
              >
                <span className="text-xl">{label.emoji}</span>
                <span className="text-[10px] text-muted-foreground">{label.value}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button
        onClick={handleSave}
        className="w-full mt-6 phase-gradient text-white"
        disabled={saved || saving || !isAuthenticated}
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
          'Salvar Check-in'
        )}
      </Button>
    </motion.div>
  );
};

export default EmotionalCheckin;
