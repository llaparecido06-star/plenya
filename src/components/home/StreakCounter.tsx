import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakCounterProps {
  streak?: number;
}

const StreakCounter: React.FC<StreakCounterProps> = ({ streak = 3 }) => {
  return (
    <motion.div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
    >
      <Flame className="w-4 h-4 text-orange-500" />
      <span className="text-sm font-semibold text-orange-600">{streak} Dias</span>
    </motion.div>
  );
};

export default StreakCounter;
