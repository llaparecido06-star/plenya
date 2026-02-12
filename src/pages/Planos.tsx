import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Crown, Sparkles, Loader2, ArrowLeft, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { STRIPE_PLANS, ALL_FEATURES, PlanKey } from '@/data/stripePlans';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';

const planKeys: PlanKey[] = ['free', 'premium_monthly', 'premium_annual'];

const Planos: React.FC = () => {
  const { subscribed, currentPlan, checkSubscription } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Handle success/cancel redirects
  useEffect(() => {
    const status = searchParams.get('subscription');
    if (status === 'success') {
      toast({ title: '🎉 Assinatura ativada!', description: 'Bem-vinda ao Premium!' });
      checkSubscription();
    } else if (status === 'canceled') {
      toast({ title: 'Checkout cancelado', description: 'Você pode assinar quando quiser.' });
    }
  }, [searchParams]);

  const handleSubscribe = async (priceId: string) => {
    setLoadingPlan(priceId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Erro ao iniciar checkout', variant: 'destructive' });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPlan('manage');
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Erro ao abrir portal', variant: 'destructive' });
    } finally {
      setLoadingPlan(null);
    }
  };

  const hasPlanFeature = (planKey: PlanKey, featureLabel: string) => {
    return (STRIPE_PLANS[planKey].features as readonly string[]).includes(featureLabel);
  };

  return (
    <PageLayout showNav={false}>
      <div className="pt-12 pb-6 px-4">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <motion.h1
              className="text-2xl font-bold text-foreground"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Planos Plenya
            </motion.h1>
            <p className="text-sm text-muted-foreground">Escolha o melhor para você</p>
          </div>
        </div>

        {/* Trial Banner */}
        {!subscribed && (
          <motion.div
            className="rounded-2xl p-4 mb-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">7 dias grátis de Premium!</h3>
                <p className="text-sm text-white/80">Experimente tudo sem compromisso. Cancele quando quiser.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Plan Cards */}
        <div className="space-y-4 mb-8">
          {planKeys.map((key, index) => {
            const plan = STRIPE_PLANS[key];
            const isCurrentPlan = currentPlan === key;
            const isPremium = key !== 'free';
            const isAnnual = key === 'premium_annual';
            const priceId = 'price_id' in plan ? plan.price_id : null;

            return (
              <motion.div
                key={key}
                className={`glass-card p-5 relative overflow-hidden ${
                  isAnnual ? 'border-2 border-primary' : ''
                } ${isCurrentPlan ? 'ring-2 ring-primary/50' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {isAnnual && (
                  <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Melhor Valor
                  </Badge>
                )}

                {isCurrentPlan && subscribed && (
                  <Badge className="absolute top-3 left-3 bg-leaf-green text-white">
                    <Crown className="w-3 h-3 mr-1" />
                    Seu Plano
                  </Badge>
                )}

                <div className="mt-1">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    {isPremium && <Crown className="w-5 h-5 text-primary" />}
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold text-primary">{plan.priceLabel}</span>
                    {'priceMonthly' in plan && (
                      <span className="text-sm text-muted-foreground">({plan.priceMonthly})</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  {isPremium && !subscribed && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                      ✨ Inclui 7 dias grátis
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  {isCurrentPlan && subscribed ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleManageSubscription}
                      disabled={loadingPlan === 'manage'}
                    >
                      {loadingPlan === 'manage' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Gerenciar Assinatura
                    </Button>
                  ) : isPremium ? (
                    <Button
                      className={`w-full ${isAnnual ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white' : ''}`}
                      onClick={() => priceId && handleSubscribe(priceId)}
                      disabled={!!loadingPlan}
                    >
                      {loadingPlan === priceId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {subscribed ? 'Trocar Plano' : 'Começar Teste Grátis'}
                    </Button>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <motion.div
          className="glass-card p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-bold text-foreground mb-4">Comparação Detalhada</h3>

          {/* Header */}
          <div className="grid grid-cols-4 gap-2 mb-3 pb-3 border-b border-border">
            <div className="text-sm font-medium text-muted-foreground">Recurso</div>
            {planKeys.map((key) => (
              <div key={key} className="text-center">
                <span className="text-xs font-bold text-foreground">
                  {key === 'free' ? 'Grátis' : key === 'premium_monthly' ? 'Mensal' : 'Anual'}
                </span>
              </div>
            ))}
          </div>

          {/* Feature rows grouped by category */}
          {['Básico', 'Premium', 'Exclusivo'].map((category) => (
            <div key={category} className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-3">
                {category}
              </p>
              {ALL_FEATURES
                .filter((f) => f.category === category)
                .map((feature, idx) => (
                  <div
                    key={feature.key}
                    className={`grid grid-cols-4 gap-2 py-2 ${idx > 0 ? 'border-t border-border/50' : ''}`}
                  >
                    <div className="text-xs text-foreground pr-1">{feature.label}</div>
                    {planKeys.map((planKey) => (
                      <div key={planKey} className="flex justify-center">
                        {hasPlanFeature(planKey, feature.label) ? (
                          <Check className="w-4 h-4 text-leaf-green" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground/30" />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          ))}
        </motion.div>

        {subscribed && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-4 text-muted-foreground"
            onClick={checkSubscription}
          >
            Atualizar status da assinatura
          </Button>
        )}

        <div className="h-8" />
      </div>
    </PageLayout>
  );
};

export default Planos;
