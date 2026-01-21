import React from 'react';
import { motion } from 'framer-motion';
import { Pill, Lightbulb } from 'lucide-react';
import { getMedicationEffectWarning } from '@/data/contraceptives';

interface MedicationEffectBadgeProps {
  medicationName: string | null;
  symptom: string;
  className?: string;
}

const MedicationEffectBadge: React.FC<MedicationEffectBadgeProps> = ({
  medicationName,
  symptom,
  className = '',
}) => {
  if (!medicationName) return null;

  const warning = getMedicationEffectWarning(medicationName, symptom);

  if (!warning) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-medium ${className}`}
    >
      <Lightbulb className="w-3 h-3" />
      <span>{warning}</span>
    </motion.div>
  );
};

export default MedicationEffectBadge;
