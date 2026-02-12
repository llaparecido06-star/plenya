import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const UpgradeBanner: React.FC = () => {
  const { subscribed } = useAuth();
  const navigate = useNavigate();

  if (subscribed) return null;

  return (
    <motion.div
      className="mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <motion.button
        onClick={() => navigate('/perfil')}
        className="w-full relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base">Desbloqueie o Premium</h3>
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-xs text-white/80 mt-0.5">
              Chef IA, Relatório Médico, Chat ilimitado e mais
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-white/80" />
        </div>
      </motion.button>
    </motion.div>
  );
};

export default UpgradeBanner;
