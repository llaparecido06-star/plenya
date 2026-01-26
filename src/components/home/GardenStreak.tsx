import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, Leaf, Flower2, TreeDeciduous } from 'lucide-react';

interface GardenStreakProps {
  streak?: number;
}

const GardenStreak: React.FC<GardenStreakProps> = ({ streak = 0 }) => {
  // Determine growth stage based on streak
  const getGrowthStage = () => {
    if (streak < 3) return { icon: Sprout, label: 'Semente', color: 'text-amber-600' };
    if (streak < 7) return { icon: Sprout, label: 'Broto', color: 'text-lime-600' };
    if (streak < 14) return { icon: Leaf, label: 'Planta', color: 'text-green-600' };
    if (streak < 30) return { icon: TreeDeciduous, label: 'Árvore', color: 'text-emerald-600' };
    return { icon: Flower2, label: 'Flor', color: 'text-pink-500' };
  };

  const stage = getGrowthStage();
  const Icon = stage.icon;

  return (
    <motion.div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-leaf-green/10 to-leaf-green/5 border border-leaf-green/20"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
    >
      <motion.div
        animate={{ 
          y: [0, -2, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Icon className={`w-4 h-4 ${stage.color}`} />
      </motion.div>
      <span className="text-sm font-medium text-leaf-green">
        {streak} dia{streak !== 1 ? 's' : ''} cultivado{streak !== 1 ? 's' : ''}
      </span>
    </motion.div>
  );
};

export default GardenStreak;
