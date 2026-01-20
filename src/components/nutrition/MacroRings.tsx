import React from 'react';
import { motion } from 'framer-motion';

interface MacroData {
  name: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
}

interface MacroRingsProps {
  protein: { current: number; goal: number };
  carbs: { current: number; goal: number };
  fat: { current: number; goal: number };
}

const MacroRings: React.FC<MacroRingsProps> = ({ protein, carbs, fat }) => {
  const macros: MacroData[] = [
    { name: 'Proteína', current: protein.current, goal: protein.goal, unit: 'g', color: '#E07A5F' },
    { name: 'Carboidrato', current: carbs.current, goal: carbs.goal, unit: 'g', color: '#81B29A' },
    { name: 'Gordura', current: fat.current, goal: fat.goal, unit: 'g', color: '#F4A261' },
  ];

  const size = 100;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  return (
    <div className="flex justify-around items-center py-4">
      {macros.map((macro, index) => {
        const progress = Math.min((macro.current / macro.goal) * 100, 100);
        const strokeDashoffset = circumference - (progress / 100) * circumference;

        return (
          <motion.div
            key={macro.name}
            className="flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="macro-ring">
              <svg width={size} height={size}>
                {/* Background circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <motion.circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={macro.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 + index * 0.1 }}
                  className="progress-ring"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-foreground">{macro.current}</span>
                <span className="text-xs text-muted-foreground">/{macro.goal}{macro.unit}</span>
              </div>
            </div>
            <span className="text-sm font-medium text-muted-foreground mt-2">
              {macro.name}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

export default MacroRings;
