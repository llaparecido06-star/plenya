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
    missingFeatures: [
      'IA Plenya ilimitada',
      'Relatório médico completo',
      'Chef IA personalizado',
      'Insights avançados de ciclo',
      'Treinos personalizados por fase',
      'Suporte prioritário',
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
      'Registro de ciclo menstrual',
      'Log diário de humor e sintomas',
      'Acompanhamento de água',
      'Receitas básicas',
      'IA Plenya ilimitada',
      'Relatório médico completo',
      'Chef IA personalizado',
      'Insights avançados de ciclo',
      'Treinos personalizados por fase',
    ],
    missingFeatures: [
      'Suporte prioritário',
    ],
  },
  premium_annual: {
    name: 'Premium Anual',
    price: 119.90,
    priceLabel: 'R$119,90/ano',
    priceMonthly: 'R$9,99/mês',
    price_id: 'price_1T029NBY8FNRl6PsiS6eWuSu',
    product_id: 'prod_Txy5Of5Md1YTxN',
    description: '50% de desconto!',
    features: [
      'Registro de ciclo menstrual',
      'Log diário de humor e sintomas',
      'Acompanhamento de água',
      'Receitas básicas',
      'IA Plenya ilimitada',
      'Relatório médico completo',
      'Chef IA personalizado',
      'Insights avançados de ciclo',
      'Treinos personalizados por fase',
      'Suporte prioritário',
    ],
    missingFeatures: [],
  },
} as const;

// All features for comparison table
export const ALL_FEATURES = [
  { key: 'cycle', label: 'Registro de ciclo menstrual', category: 'Básico' },
  { key: 'daily_log', label: 'Log diário de humor e sintomas', category: 'Básico' },
  { key: 'water', label: 'Acompanhamento de água', category: 'Básico' },
  { key: 'recipes_basic', label: 'Receitas básicas', category: 'Básico' },
  { key: 'ai_chat', label: 'IA Plenya ilimitada', category: 'Premium' },
  { key: 'medical_report', label: 'Relatório médico completo', category: 'Premium' },
  { key: 'chef_ia', label: 'Chef IA personalizado', category: 'Premium' },
  { key: 'cycle_insights', label: 'Insights avançados de ciclo', category: 'Premium' },
  { key: 'workouts', label: 'Treinos personalizados por fase', category: 'Premium' },
  { key: 'support', label: 'Suporte prioritário', category: 'Exclusivo' },
] as const;

export type PlanKey = keyof typeof STRIPE_PLANS;

export function getPlanByProductId(productId: string | null): PlanKey {
  if (!productId) return 'free';
  if (productId === STRIPE_PLANS.premium_monthly.product_id) return 'premium_monthly';
  if (productId === STRIPE_PLANS.premium_annual.product_id) return 'premium_annual';
  return 'free';
}
