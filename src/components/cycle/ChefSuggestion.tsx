import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCycle, CyclePhase } from '@/contexts/CycleContext';
import PremiumGate from '@/components/subscription/PremiumGate';

interface PhaseSuggestion {
  title: string;
  subtitle: string;
  emoji: string;
  gradient: string;
  bgImage: string;
}

const phaseSuggestions: Record<CyclePhase, PhaseSuggestion> = {
  menstrual: {
    title: 'Chocolate 70% Cacau',
    subtitle: 'Conforto e magnésio para você',
    emoji: '🍫',
    gradient: 'from-rose-500/80 to-rose-700/80',
    bgImage: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400&h=200&fit=crop',
  },
  folicular: {
    title: 'Salada de Frutas Frescas',
    subtitle: 'Energia leve para hoje',
    emoji: '🍓',
    gradient: 'from-emerald-500/80 to-teal-600/80',
    bgImage: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=200&fit=crop',
  },
  ovulatoria: {
    title: 'Bowl de Açaí Energético',
    subtitle: 'Potência máxima para seu dia',
    emoji: '🫐',
    gradient: 'from-orange-500/80 to-amber-600/80',
    bgImage: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=200&fit=crop',
  },
  lutea: {
    title: 'Mingau de Aveia Quentinho',
    subtitle: 'Para acalmar a TPM',
    emoji: '🥣',
    gradient: 'from-purple-500/80 to-indigo-600/80',
    bgImage: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400&h=200&fit=crop',
  },
};

const ChefSuggestion: React.FC = () => {
  const navigate = useNavigate();
  const { currentPhase } = useCycle();
  const suggestion = phaseSuggestions[currentPhase];

  return (
    <PremiumGate feature="Sugestão do Chef" mode="inline">
    <motion.div
      className="mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <ChefHat className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Sugestão do Chef Hormonal
        </span>
      </div>
      
      <motion.button
        onClick={() => navigate('/nutricao')}
        className="w-full relative overflow-hidden rounded-2xl h-28 group"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
          style={{ backgroundImage: `url(${suggestion.bgImage})` }}
        />
        
        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-r ${suggestion.gradient}`} />
        
        {/* Content */}
        <div className="relative z-10 h-full flex items-center justify-between px-5">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{suggestion.emoji}</span>
            <div className="text-left">
              <h3 className="text-lg font-bold text-white">{suggestion.title}</h3>
              <p className="text-sm text-white/80">{suggestion.subtitle}</p>
            </div>
          </div>
          
          <motion.div
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
            whileHover={{ x: 5 }}
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </motion.div>
        </div>
      </motion.button>
    </motion.div>
    </PremiumGate>
  );
};

export default ChefSuggestion;
