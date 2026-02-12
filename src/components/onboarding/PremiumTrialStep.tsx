import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, ChefHat, FileText, Brain, Dumbbell, TrendingUp, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { STRIPE_PLANS } from '@/data/stripePlans';
import { useToast } from '@/hooks/use-toast';

const premiumFeatures = [
  { icon: Brain, label: 'IA Plenya ilimitada', desc: 'Converse sem limites com sua assistente' },
  { icon: ChefHat, label: 'Chef IA personalizado', desc: 'Receitas adaptadas ao seu ciclo' },
  { icon: FileText, label: 'Relatório médico completo', desc: 'PDF profissional com tendências' },
  { icon: TrendingUp, label: 'Insights avançados', desc: 'Padrões e previsões do seu corpo' },
  { icon: Dumbbell, label: 'Treinos por fase', desc: 'Exercícios sincronizados com hormônios' },
];

interface PremiumTrialStepProps {
  onSkip: () => void;
  onCompleteBeforeCheckout?: () => Promise<void>;
}

const PremiumTrialStep: React.FC<PremiumTrialStepProps> = ({ onSkip, onCompleteBeforeCheckout }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const handleStartTrial = async (priceId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      // Complete onboarding BEFORE opening checkout so user isn't redirected back
      if (onCompleteBeforeCheckout) {
        await onCompleteBeforeCheckout();
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        // Navigate in same window so success_url works properly
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast({ title: 'Erro ao iniciar checkout', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      {/* Hero */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
          <Gift className="w-10 h-10 text-white" />
        </div>
        <motion.div
          className="absolute -top-1 -right-1 left-0 right-0 mx-auto w-fit"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
        </motion.div>
      </motion.div>

      <div>
        <h2 className="text-2xl font-bold text-foreground">
          🎁 7 dias grátis de Premium!
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Experimente tudo que a Plenya tem a oferecer, sem compromisso.
        </p>
      </div>

      {/* Features list */}
      <div className="space-y-3 text-left">
        {premiumFeatures.map((feature, i) => (
          <motion.div
            key={feature.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50"
          >
            <div className="p-2 rounded-lg bg-primary/10">
              <feature.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{feature.label}</p>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </div>
            <Sparkles className="w-3 h-3 text-amber-500 ml-auto" />
          </motion.div>
        ))}
      </div>

      {/* CTA buttons */}
      <div className="space-y-3 pt-2">
        <Button
          onClick={() => handleStartTrial(STRIPE_PLANS.premium_annual.price_id)}
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-6"
        >
          <Crown className="w-4 h-4 mr-2" />
          {loading ? 'Abrindo...' : 'Começar Trial Grátis — Anual'}
        </Button>
        <Button
          onClick={() => handleStartTrial(STRIPE_PLANS.premium_monthly.price_id)}
          disabled={loading}
          variant="outline"
          className="w-full py-5"
        >
          {loading ? 'Abrindo...' : 'Começar Trial Grátis — Mensal'}
        </Button>
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
        >
          Continuar com o plano gratuito
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Cancele a qualquer momento. Sem cobranças durante o trial.
      </p>
    </div>
  );
};

export default PremiumTrialStep;
