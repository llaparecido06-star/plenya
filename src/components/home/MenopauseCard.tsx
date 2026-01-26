import React from 'react';
import { motion } from 'framer-motion';
import { Thermometer, Moon, Brain, Heart, Leaf } from 'lucide-react';

interface MenopauseCardProps {
  age?: number | null;
}

const MenopauseCard: React.FC<MenopauseCardProps> = ({ age }) => {
  // Common menopause symptoms to track
  const quickSymptoms = [
    { id: 'hot_flash', label: 'Calor', icon: Thermometer, color: 'text-red-500' },
    { id: 'insomnia', label: 'Insônia', icon: Moon, color: 'text-indigo-500' },
    { id: 'brain_fog', label: 'Névoa Mental', icon: Brain, color: 'text-purple-500' },
    { id: 'mood_swing', label: 'Humor', icon: Heart, color: 'text-pink-500' },
  ];

  return (
    <motion.div
      className="mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="glass-card p-5 bg-gradient-to-br from-leaf-green/5 to-sage-green/10 border-leaf-green/20">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-leaf-green/20 to-sage-green/20 flex items-center justify-center">
              <Leaf className="w-7 h-7 text-leaf-green" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Bem-estar Climatérico</h3>
              <p className="text-sm text-muted-foreground">
                {age ? `${age} anos de sabedoria` : 'Seu corpo, seu tempo'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Symptom Logging */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-3">Registrar sintoma rápido:</p>
          <div className="grid grid-cols-4 gap-2">
            {quickSymptoms.map((symptom) => {
              const Icon = symptom.icon;
              return (
                <button
                  key={symptom.id}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl bg-background/50 hover:bg-background transition-colors"
                >
                  <Icon className={`w-5 h-5 ${symptom.color}`} />
                  <span className="text-xs text-muted-foreground">{symptom.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Daily Tip */}
        <div className="p-3 bg-leaf-green/10 rounded-xl">
          <p className="text-sm text-leaf-green">
            💚 Dica: Alimentos ricos em fitoestrógenos (soja, linhaça) podem ajudar no equilíbrio
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default MenopauseCard;
