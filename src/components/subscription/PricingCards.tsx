import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Sparkles, Loader2, Zap, Shield, Star, Gift } from 'lucide-react';
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
    { key: 'premium_monthly' },
    { key: 'premium_annual', highlight: true },
  ];

  return (
    <div className="space-y-4">
      {/* Marketing Hero */}
      <motion.div
        className="text-center mb-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 mb-3">
          <Gift className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">🔥 Oferta por tempo limitado</span>
        </div>
        <p className="text-xs text-muted-foreground">Preços promocionais de lançamento — garanta agora!</p>
      </motion.div>

      {plans.map(({ key, highlight }, index) => {
        const plan = STRIPE_PLANS[key];
        const isCurrentPlan = currentPlan === key;
        const isPremium = key !== 'free';
        const priceId = 'price_id' in plan ? plan.price_id : null;
        const originalPrice = 'originalPrice' in plan ? plan.originalPrice : null;
        const discount = 'discount' in plan ? plan.discount : null;
        const savings = 'savings' in plan ? plan.savings : null;

        return (
          <motion.div
            key={key}
            className={`relative overflow-hidden rounded-2xl p-[2px] ${
              highlight
                ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500'
                : ''
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div
              className={`glass-card p-5 rounded-2xl relative ${
                isCurrentPlan ? 'ring-2 ring-primary/50' : ''
              }`}
            >
              {/* Discount Badge */}
              {discount && (
                <motion.div
                  className="absolute -top-0.5 -right-0.5"
                  initial={{ scale: 0, rotate: -12 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3 + index * 0.1, type: 'spring', stiffness: 200 }}
                >
                  <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs px-3 py-1 rounded-bl-xl rounded-tr-xl shadow-lg">
                    <Zap className="w-3 h-3 mr-1" />
                    {discount}
                  </Badge>
                </motion.div>
              )}

              {/* Best Value tag */}
              {highlight && (
                <div className="flex justify-center mb-3">
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-4 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Melhor Custo-Benefício
                  </Badge>
                </div>
              )}

              {isCurrentPlan && (
                <Badge className="absolute top-2 left-2 bg-leaf-green text-white text-xs">
                  <Crown className="w-3 h-3 mr-1" />
                  Seu Plano
                </Badge>
              )}

              <div className="text-center">
                <h3 className="font-bold text-foreground text-lg flex items-center justify-center gap-2">
                  {isPremium && <Crown className="w-5 h-5 text-amber-500" />}
                  {plan.name}
                </h3>

                {/* Price with strikethrough */}
                <div className="mt-2">
                  {originalPrice && (
                    <p className="text-sm text-muted-foreground line-through">
                      R${originalPrice.toFixed(2).replace('.', ',')}
                    </p>
                  )}
                  <p className="text-3xl font-extrabold text-foreground">
                    {plan.priceLabel}
                  </p>
                  {'priceMonthly' in plan && (
                    <p className="text-sm font-medium text-primary">{plan.priceMonthly}</p>
                  )}
                </div>

                {/* Savings callout */}
                {savings && (
                  <motion.p
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 bg-emerald-50 dark:bg-emerald-950/30 rounded-full px-3 py-1 inline-block"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    💰 {savings}
                  </motion.p>
                )}

                <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
              </div>

              {/* CTA Button */}
              <div className="mt-4">
                {isCurrentPlan && subscribed ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleManageSubscription}
                    disabled={loadingPlan === 'manage'}
                  >
                    {loadingPlan === 'manage' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Gerenciar Assinatura
                      </>
                    )}
                  </Button>
                ) : isPremium && !isCurrentPlan ? (
                  <Button
                    className={`w-full text-white font-bold ${
                      highlight
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-orange-500/25'
                        : 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70'
                    }`}
                    onClick={() => priceId && handleSubscribe(priceId)}
                    disabled={!!loadingPlan}
                    size="lg"
                  >
                    {loadingPlan === priceId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        {highlight ? 'Garantir Melhor Oferta' : 'Assinar Agora'}
                      </>
                    )}
                  </Button>
                ) : null}
              </div>

              {/* Features */}
              <ul className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="text-xs text-muted-foreground flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-leaf-green flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
                {plan.missingFeatures.map((feature) => (
                  <li key={feature} className="text-xs text-muted-foreground/40 flex items-start gap-2 line-through">
                    <span className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-center">✕</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        );
      })}

      {/* Trust signals */}
      <motion.div
        className="text-center space-y-1 pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-xs text-muted-foreground">🔒 Pagamento seguro via Stripe</p>
        <p className="text-xs text-muted-foreground">Cancele quando quiser · Sem taxas ocultas</p>
      </motion.div>

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
