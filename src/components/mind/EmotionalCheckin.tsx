import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Battery, Zap, Check } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

const EmotionalCheckin: React.FC = () => {
  const [stress, setStress] = useState([50]);
  const [energy, setEnergy] = useState([50]);
  const [saved, setSaved] = useState(false);

  const getStressLabel = (value: number) => {
    if (value < 25) return { text: 'Tranquila', emoji: '😌' };
    if (value < 50) return { text: 'Leve tensão', emoji: '😐' };
    if (value < 75) return { text: 'Moderado', emoji: '😓' };
    return { text: 'Elevado', emoji: '😰' };
  };

  const getEnergyLabel = (value: number) => {
    if (value < 25) return { text: 'Esgotada', emoji: '😴' };
    if (value < 50) return { text: 'Baixa', emoji: '🥱' };
    if (value < 75) return { text: 'Boa', emoji: '😊' };
    return { text: 'Energizada', emoji: '⚡' };
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const stressInfo = getStressLabel(stress[0]);
  const energyInfo = getEnergyLabel(energy[0]);

  return (
    <motion.div
      className="glass-card p-5 mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="font-semibold text-foreground mb-6">Check-in Emocional</h3>

      <div className="space-y-8">
        {/* Stress slider */}
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
          <Slider
            value={stress}
            onValueChange={setStress}
            max={100}
            step={1}
            className="[&_[role=slider]]:bg-rose-500 [&_[role=slider]]:border-rose-500"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Relaxada</span>
            <span>Estressada</span>
          </div>
        </div>

        {/* Energy slider */}
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
          <Slider
            value={energy}
            onValueChange={setEnergy}
            max={100}
            step={1}
            className="[&_[role=slider]]:bg-amber-500 [&_[role=slider]]:border-amber-500"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Esgotada</span>
            <span>Energizada</span>
          </div>
        </div>
      </div>

      <Button
        onClick={handleSave}
        className="w-full mt-6 phase-gradient text-white"
        disabled={saved}
      >
        {saved ? (
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            Salvo!
          </span>
        ) : (
          'Salvar Check-in'
        )}
      </Button>
    </motion.div>
  );
};

export default EmotionalCheckin;
