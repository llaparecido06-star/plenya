import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Sparkles, Brain, Utensils, Dumbbell, Heart, Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

const freeFeatures = [
  { icon: '📅', label: 'Calendário menstrual' },
  { icon: '😊', label: 'Registro de humor' },
  { icon: '❤️', label: 'Log de intimidade' },
  { icon: '🔔', label: 'Lembretes básicos' },
  { icon: '🥗', label: '1 Dica de Nutrição' },
  { icon: '💪', label: '1 Treino por fase' },
];

const premiumFeatures = [
  { icon: Brain, label: 'Psicóloga Manu IA ilimitada', highlight: true },
  { icon: Utensils, label: 'Cardápios completos por fase' },
  { icon: Dumbbell, label: 'Treinos personalizados ilimitados' },
  { icon: Heart, label: 'Correlação cruzada de dados' },
  { icon: Sparkles, label: 'Relatório médico mensal' },
  { icon: Zap, label: 'Manu Chef com foto da geladeira' },
];

const PaywallModal: React.FC<PaywallModalProps> = ({ open, onClose, feature }) => {
  const navigate = useNavigate();

  const handleSubscribe = () => {
    onClose();
    navigate('/planos');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-lg bg-card rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-6 pb-4">
              <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              <div className="text-center">
                <motion.div
                  className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Crown className="w-7 h-7 text-white" />
                </motion.div>
                <h2 className="text-xl font-bold text-foreground mt-4 tracking-tight">
                  Desbloqueie todo o seu potencial
                </h2>
                {feature && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium text-primary">{feature}</span> é exclusivo do Plenya+
                  </p>
                )}
              </div>
            </div>

            {/* Plans */}
            <div className="px-6 space-y-4">
              {/* Premium Plan */}
              <div className="relative rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-5 overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-2xl bg-gradient-to-r from-primary to-accent text-white text-xs font-bold">
                  RECOMENDADO
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-foreground text-lg">Plenya+</h3>
                </div>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold text-foreground">R$ 29,90</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium mb-4">
                  <Zap className="w-3 h-3" />
                  50% OFF no plano anual
                </div>

                <div className="space-y-2.5">
                  {premiumFeatures.map((feat) => (
                    <div key={feat.label} className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${feat.highlight ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                        <Check className="w-3 h-3" />
                      </div>
                      <span className={`text-sm ${feat.highlight ? 'font-semibold text-foreground' : 'text-foreground'}`}>
                        {feat.label}
                      </span>
                      {feat.highlight && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">NOVO</span>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleSubscribe}
                  className="w-full mt-5 h-13 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold text-base shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Assinar Plenya+ 💳
                </Button>
              </div>

              {/* Free Plan */}
              <div className="rounded-3xl border border-border bg-card p-5 opacity-70">
                <h3 className="font-semibold text-foreground text-base mb-3">Plano Gratuito</h3>
                <div className="grid grid-cols-2 gap-2">
                  {freeFeatures.map((feat) => (
                    <div key={feat.label} className="flex items-center gap-2">
                      <span className="text-sm">{feat.icon}</span>
                      <span className="text-xs text-muted-foreground">{feat.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  🔒 Psicóloga Manu IA bloqueada
                </p>
              </div>
            </div>

            <div className="p-6 pt-4 text-center">
              <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Continuar no plano gratuito
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaywallModal;
