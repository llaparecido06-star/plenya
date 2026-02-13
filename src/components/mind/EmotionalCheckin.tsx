import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Battery, Zap, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useTranslation } from 'react-i18next';

const EmotionalCheckin: React.FC = () => {
  const { t } = useTranslation();
  const { data, loading, saving, saveLog, isAuthenticated } = useDailyLog();
  const [stress, setStress] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [saved, setSaved] = useState(false);

  const stressLabels = [
    { value: 1, emoji: '😌', textKey: 'mind.stress_calm' },
    { value: 2, emoji: '😐', textKey: 'mind.stress_light' },
    { value: 3, emoji: '😓', textKey: 'mind.stress_moderate' },
    { value: 4, emoji: '😰', textKey: 'mind.stress_high' },
    { value: 5, emoji: '🤯', textKey: 'mind.stress_very_high' },
  ];

  const energyLabels = [
    { value: 1, emoji: '😴', textKey: 'mind.energy_exhausted' },
    { value: 2, emoji: '🥱', textKey: 'mind.energy_low' },
    { value: 3, emoji: '😐', textKey: 'mind.energy_neutral' },
    { value: 4, emoji: '😊', textKey: 'mind.energy_good' },
    { value: 5, emoji: '⚡', textKey: 'mind.energy_high' },
  ];

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
      id="emotional-checkin"
      className="glass-card p-5 mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="font-semibold text-foreground mb-6">{t('mind.emotional_checkin')}</h3>

      <div className="space-y-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-100">
                <Battery className="w-4 h-4 text-rose-600" />
              </div>
              <span className="font-medium text-foreground">{t('mind.stress_level')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{stressInfo.emoji}</span>
              <span className="text-sm text-muted-foreground">{t(stressInfo.textKey)}</span>
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

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100">
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              <span className="font-medium text-foreground">{t('mind.energy_level')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{energyInfo.emoji}</span>
              <span className="text-sm text-muted-foreground">{t(energyInfo.textKey)}</span>
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
            {t('mind.saving')}
          </span>
        ) : saved ? (
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            {t('mind.saved')}
          </span>
        ) : !isAuthenticated ? (
          t('mind.login_to_save')
        ) : (
          t('mind.save_checkin')
        )}
      </Button>
    </motion.div>
  );
};

export default EmotionalCheckin;