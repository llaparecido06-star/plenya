// Stripe plan configuration
export const STRIPE_PLANS = {
  free: {
    name: 'Gratuito',
    price: 0,
    priceLabel: 'Grátis',
    description: 'Funcionalidades básicas',
    features: [
      'Registro de ciclo menstrual',
      'Log diário de humor e sintomas',
      'Acompanhamento de água',
      'Receitas básicas',
    ],
  },
  premium_monthly: {
    name: 'Premium Mensal',
    price: 19.90,
    priceLabel: 'R$19,90/mês',
    price_id: 'price_1T01RMBY8FNRl6Ps6HadIZd0',
    product_id: 'prod_TxxM1RKhJVtRJW',
    description: 'Acesso completo mensal',
    features: [
      'Tudo do plano Gratuito',
      'IA Plenya ilimitada',
      'Relatório médico completo',
      'Chef IA personalizado',
      'Insights avançados de ciclo',
      'Treinos personalizados por fase',
    ],
  },
  premium_annual: {
    name: 'Premium Anual',
    price: 199.90,
    priceLabel: 'R$199,90/ano',
    priceMonthly: 'R$16,66/mês',
    price_id: 'price_1T01ReBY8FNRl6PsBtyoDLjr',
    product_id: 'prod_TxxMucqxpJbsLV',
    description: '2 meses grátis!',
    features: [
      'Tudo do plano Premium',
      '2 meses grátis',
      'Suporte prioritário',
    ],
  },
} as const;

export type PlanKey = keyof typeof STRIPE_PLANS;

export function getPlanByProductId(productId: string | null): PlanKey {
  if (!productId) return 'free';
  if (productId === STRIPE_PLANS.premium_monthly.product_id) return 'premium_monthly';
  if (productId === STRIPE_PLANS.premium_annual.product_id) return 'premium_annual';
  return 'free';
}
