import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { STRIPE_PLANS, PlanKey } from '@/data/stripePlans';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PricingCards: React.FC = () => {
  const { subscribed, currentPlan, checkSubscription } = useAuth();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    setLoadingPlan(priceId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao iniciar checkout',
        variant: 'destructive',
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPlan('manage');
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao abrir portal',
        variant: 'destructive',
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const plans: { key: PlanKey; highlight?: boolean }[] = [
    { key: 'free' },
    { key: 'premium_monthly', highlight: true },
    { key: 'premium_annual' },
  ];

  return (
    <div className="space-y-3">
      {plans.map(({ key, highlight }, index) => {
        const plan = STRIPE_PLANS[key];
        const isCurrentPlan = currentPlan === key;
        const isPremium = key !== 'free';
        const priceId = 'price_id' in plan ? plan.price_id : null;

        return (
          <motion.div
            key={key}
            className={`glass-card p-4 relative overflow-hidden ${
              highlight ? 'border-2 border-primary' : ''
            } ${isCurrentPlan ? 'ring-2 ring-primary/50' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {highlight && (
              <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Popular
              </Badge>
            )}

            {isCurrentPlan && (
              <Badge className="absolute top-2 left-2 bg-leaf-green text-white text-xs">
                <Crown className="w-3 h-3 mr-1" />
                Seu Plano
              </Badge>
            )}

            <div className="flex items-center justify-between mt-1">
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  {isPremium && <Crown className="w-4 h-4 text-primary" />}
                  {plan.name}
                </h3>
                <p className="text-lg font-bold text-primary mt-1">{plan.priceLabel}</p>
                {'priceMonthly' in plan && (
                  <p className="text-xs text-muted-foreground">{plan.priceMonthly}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
              </div>

              <div className="flex-shrink-0 ml-4">
                {isCurrentPlan && subscribed ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManageSubscription}
                    disabled={loadingPlan === 'manage'}
                  >
                    {loadingPlan === 'manage' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Gerenciar'
                    )}
                  </Button>
                ) : isPremium && !isCurrentPlan ? (
                  <Button
                    size="sm"
                    onClick={() => priceId && handleSubscribe(priceId)}
                    disabled={!!loadingPlan}
                  >
                    {loadingPlan === priceId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Assinar'
                    )}
                  </Button>
                ) : null}
              </div>
            </div>

            <ul className="mt-3 space-y-1.5">
              {plan.features.map((feature) => (
                <li key={feature} className="text-xs text-muted-foreground flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-leaf-green flex-shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
          </motion.div>
        );
      })}

      {subscribed && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={checkSubscription}
        >
          Atualizar status da assinatura
        </Button>
      )}
    </div>
  );
};

export default PricingCards;
