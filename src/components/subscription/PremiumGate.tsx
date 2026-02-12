import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface PremiumGateProps {
  children: React.ReactNode;
  feature?: string;
  /** inline = subtle lock overlay on top of children, banner = full replacement */
  mode?: 'inline' | 'banner';
}

const PremiumGate: React.FC<PremiumGateProps> = ({ children, feature, mode = 'inline' }) => {
  const { subscribed } = useAuth();
  const navigate = useNavigate();

  if (subscribed) return <>{children}</>;

  if (mode === 'banner') {
    return (
      <motion.div
        className="glass-card p-5 text-center space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <Crown className="w-7 h-7 text-white" />
        </div>
        <h3 className="font-bold text-foreground text-lg">Recurso Premium</h3>
        <p className="text-sm text-muted-foreground">
          {feature
            ? `${feature} é exclusivo para assinantes Premium.`
            : 'Este recurso é exclusivo para assinantes Premium.'}
        </p>
        <Button
          onClick={() => navigate('/planos')}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Ver Planos
        </Button>
      </motion.div>
    );
  }

  // Inline mode: show children with lock overlay
  return (
    <div className="relative">
      <div className="pointer-events-none opacity-40 blur-[1px] select-none">
        {children}
      </div>
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-foreground">Premium</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3 text-center px-4">
          {feature || 'Recurso exclusivo'}
        </p>
        <Button
          size="sm"
          onClick={() => navigate('/planos')}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        >
          <Crown className="w-3.5 h-3.5 mr-1.5" />
          Assinar
        </Button>
      </motion.div>
    </div>
  );
};

export default PremiumGate;
