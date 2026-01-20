import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Droplets } from 'lucide-react';

const WaterTracker: React.FC = () => {
  const [glasses, setGlasses] = useState<boolean[]>([false, false, false, false, false]);
  
  // Load from localStorage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`water-${today}`);
    if (saved) {
      setGlasses(JSON.parse(saved));
    }
  }, []);

  const toggleGlass = (index: number) => {
    const newGlasses = [...glasses];
    // If clicking an empty glass, fill all up to and including it
    // If clicking a filled glass, empty all from it onwards
    if (!glasses[index]) {
      for (let i = 0; i <= index; i++) {
        newGlasses[i] = true;
      }
    } else {
      for (let i = index; i < glasses.length; i++) {
        newGlasses[i] = false;
      }
    }
    setGlasses(newGlasses);
    
    // Save to localStorage
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`water-${today}`, JSON.stringify(newGlasses));
  };

  const filledCount = glasses.filter(Boolean).length;

  return (
    <motion.div
      className="glass-card p-4 mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-500" />
          <span className="font-medium text-foreground">Hidratação</span>
        </div>
        <span className="text-sm text-muted-foreground">{filledCount}/5 copos</span>
      </div>
      
      <div className="flex justify-between gap-2">
        {glasses.map((filled, index) => (
          <motion.button
            key={index}
            onClick={() => toggleGlass(index)}
            className={`flex-1 aspect-square rounded-xl flex items-center justify-center transition-all ${
              filled 
                ? 'bg-gradient-to-b from-blue-400 to-blue-600 shadow-lg shadow-blue-500/30' 
                : 'bg-secondary/50 hover:bg-secondary'
            }`}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Droplets className={`w-6 h-6 ${filled ? 'text-white' : 'text-muted-foreground/50'}`} />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default WaterTracker;
