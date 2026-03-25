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
      'Elena Chef personalizada',
      'Scan de refeições com IA',
      'Insights avançados de ciclo',
      'Treinos personalizados por fase',
      'Suporte prioritário',
    ],
  },
  premium_monthly: {
    name: 'Premium Mensal',
    price: 19.90,
    originalPrice: 39.90,
    priceLabel: 'R$19,90/mês',
    price_id: 'price_1T02XRBqlwBgf593L9sfn3hR',
    product_id: 'prod_TxyUsc3K0NYYH1',
    description: 'Acesso completo mensal',
    discount: '50% OFF',
    features: [
      'Registro de ciclo menstrual',
      'Log diário de humor e sintomas',
      'Acompanhamento de água',
      'Receitas básicas',
      'IA Plenya ilimitada',
      'Relatório médico completo',
      'Elena Chef personalizada',
      'Scan de refeições com IA',
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
    originalPrice: 478.80,
    priceLabel: 'R$119,90/ano',
    priceMonthly: 'R$9,99/mês',
    price_id: 'price_1T02YJBqlwBgf593DW88vgFC',
    product_id: 'prod_TxyVXEl8ZSfKQM',
    description: 'Melhor custo-benefício',
    discount: '75% OFF',
    savings: 'Economize R$358,90',
    features: [
      'Registro de ciclo menstrual',
      'Log diário de humor e sintomas',
      'Acompanhamento de água',
      'Receitas básicas',
      'IA Plenya ilimitada',
      'Relatório médico completo',
      'Elena Chef personalizada',
      'Scan de refeições com IA',
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
  { key: 'chef_ia', label: 'Elena Chef personalizada', category: 'Premium' },
  { key: 'meal_scan', label: 'Scan de refeições com IA', category: 'Premium' },
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
