import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Sparkles } from 'lucide-react';
import { useCycle, CyclePhase } from '@/contexts/CycleContext';
import { useProfile } from '@/hooks/useProfile';
import { useLifePhase } from '@/hooks/useLifePhase';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

const dietLabels: Record<string, { labelKey: string; emoji: string }> = {
  vegetarian: { labelKey: 'diet.vegetarian', emoji: '🌱' },
  vegan: { labelKey: 'diet.vegan', emoji: '🌿' },
  low_carb: { labelKey: 'diet.low_carb', emoji: '🥩' },
  lactose_free: { labelKey: 'diet.lactose_free', emoji: '🥛' },
  default: { labelKey: 'diet.omnivore', emoji: '🍽️' },
};

interface PhaseSuggestion {
  title: string;
  description: string;
  foods: string[];
  nutrients: string[];
}

const phaseSuggestionsBase: Record<CyclePhase, {
  titleKey: string;
  descKey: string;
  nutrientKeys: string[];
  foods: {
    default: string[];
    vegetarian: string[];
    vegan: string[];
    low_carb: string[];
    lactose_free: string[];
  };
}> = {
  menstrual: {
    titleKey: 'nutrition.phase_menstrual_title',
    descKey: 'nutrition.phase_menstrual_desc',
    nutrientKeys: ['nutrition.iron', 'nutrition.vitamin_c', 'nutrition.magnesium'],
    foods: {
      default: ['Espinafre', 'Carne vermelha', 'Chocolate amargo', 'Lentilha'],
      vegetarian: ['Espinafre', 'Lentilha', 'Chocolate amargo', 'Feijão preto', 'Beterraba'],
      vegan: ['Espinafre', 'Lentilha', 'Chocolate amargo 70%', 'Grão-de-bico', 'Quinoa'],
      low_carb: ['Espinafre', 'Carne vermelha', 'Chocolate amargo 85%', 'Fígado'],
      lactose_free: ['Espinafre', 'Carne vermelha', 'Chocolate amargo', 'Lentilha'],
    },
  },
  folicular: {
    titleKey: 'nutrition.phase_follicular_title',
    descKey: 'nutrition.phase_follicular_desc',
    nutrientKeys: ['nutrition.vitamin_e', 'nutrition.omega3', 'nutrition.zinc'],
    foods: {
      default: ['Abacate', 'Ovos', 'Salmão', 'Sementes de linhaça'],
      vegetarian: ['Abacate', 'Ovos', 'Sementes de linhaça', 'Nozes', 'Tofu'],
      vegan: ['Abacate', 'Sementes de linhaça', 'Nozes', 'Tofu', 'Sementes de chia'],
      low_carb: ['Abacate', 'Ovos', 'Salmão', 'Azeite de oliva'],
      lactose_free: ['Abacate', 'Ovos', 'Salmão', 'Sementes de linhaça'],
    },
  },
  ovulatoria: {
    titleKey: 'nutrition.phase_ovulatory_title',
    descKey: 'nutrition.phase_ovulatory_desc',
    nutrientKeys: ['nutrition.antioxidants', 'nutrition.fiber', 'nutrition.protein'],
    foods: {
      default: ['Frutas vermelhas', 'Vegetais crucíferos', 'Quinoa', 'Amêndoas'],
      vegetarian: ['Frutas vermelhas', 'Brócolis', 'Quinoa', 'Amêndoas', 'Lentilha'],
      vegan: ['Frutas vermelhas', 'Couve-flor', 'Quinoa', 'Amêndoas', 'Edamame'],
      low_carb: ['Frutas vermelhas', 'Brócolis', 'Amêndoas', 'Couve-flor'],
      lactose_free: ['Frutas vermelhas', 'Vegetais crucíferos', 'Quinoa', 'Amêndoas'],
    },
  },
  lutea: {
    titleKey: 'nutrition.phase_luteal_title',
    descKey: 'nutrition.phase_luteal_desc',
    nutrientKeys: ['nutrition.magnesium', 'nutrition.vitamin_b6', 'nutrition.tryptophan'],
    foods: {
      default: ['Banana', 'Batata doce', 'Grão-de-bico', 'Castanhas'],
      vegetarian: ['Banana', 'Batata doce', 'Grão-de-bico', 'Castanhas', 'Queijo'],
      vegan: ['Banana', 'Batata doce', 'Grão-de-bico', 'Castanhas', 'Sementes de abóbora'],
      low_carb: ['Abacate', 'Castanhas', 'Chocolate amargo 85%', 'Ovos'],
      lactose_free: ['Banana', 'Batata doce', 'Grão-de-bico', 'Castanhas'],
    },
  },
};

interface PregnancyTrimesterSuggestion {
  titleKey: string;
  descKey: string;
  nutrientKeys: string[];
  foods: {
    default: string[];
    vegetarian: string[];
    vegan: string[];
    low_carb: string[];
    lactose_free: string[];
  };
}

const pregnancySuggestions: Record<number, PregnancyTrimesterSuggestion> = {
  1: {
    titleKey: 'nutrition.preg_tri1_title',
    descKey: 'nutrition.preg_tri1_desc',
    nutrientKeys: ['nutrition.folic_acid', 'nutrition.iron', 'nutrition.vitamin_b6'],
    foods: {
      default: ['Espinafre', 'Feijão', 'Laranja', 'Ovos', 'Gengibre'],
      vegetarian: ['Espinafre', 'Feijão', 'Laranja', 'Ovos', 'Gengibre'],
      vegan: ['Espinafre', 'Feijão', 'Laranja', 'Lentilha', 'Gengibre'],
      low_carb: ['Espinafre', 'Ovos', 'Abacate', 'Brócolis', 'Gengibre'],
      lactose_free: ['Espinafre', 'Feijão', 'Laranja', 'Ovos', 'Gengibre'],
    },
  },
  2: {
    titleKey: 'nutrition.preg_tri2_title',
    descKey: 'nutrition.preg_tri2_desc',
    nutrientKeys: ['nutrition.calcium', 'nutrition.omega3', 'nutrition.protein'],
    foods: {
      default: ['Salmão', 'Iogurte', 'Brócolis', 'Amêndoas', 'Batata doce'],
      vegetarian: ['Iogurte', 'Brócolis', 'Amêndoas', 'Tofu', 'Batata doce'],
      vegan: ['Tofu', 'Brócolis', 'Amêndoas', 'Sementes de chia', 'Batata doce'],
      low_carb: ['Salmão', 'Amêndoas', 'Brócolis', 'Ovos', 'Abacate'],
      lactose_free: ['Salmão', 'Brócolis', 'Amêndoas', 'Batata doce', 'Sardinha'],
    },
  },
  3: {
    titleKey: 'nutrition.preg_tri3_title',
    descKey: 'nutrition.preg_tri3_desc',
    nutrientKeys: ['nutrition.iron', 'nutrition.vitamin_c', 'nutrition.fiber'],
    foods: {
      default: ['Carne vermelha', 'Beterraba', 'Mamão', 'Aveia', 'Castanhas'],
      vegetarian: ['Lentilha', 'Beterraba', 'Mamão', 'Aveia', 'Castanhas'],
      vegan: ['Lentilha', 'Beterraba', 'Mamão', 'Aveia', 'Grão-de-bico'],
      low_carb: ['Carne vermelha', 'Castanhas', 'Abacate', 'Brócolis', 'Ovos'],
      lactose_free: ['Carne vermelha', 'Beterraba', 'Mamão', 'Aveia', 'Castanhas'],
    },
  },
};

const menopauseSuggestion = {
  titleKey: 'nutrition.meno_title',
  descKey: 'nutrition.meno_desc',
  nutrientKeys: ['nutrition.calcium', 'nutrition.phytoestrogens', 'nutrition.omega3', 'nutrition.magnesium'],
  foods: {
    default: ['Soja / Tofu', 'Linhaça', 'Salmão', 'Espinafre', 'Castanhas'],
    vegetarian: ['Soja / Tofu', 'Linhaça', 'Espinafre', 'Castanhas', 'Brócolis'],
    vegan: ['Soja / Tofu', 'Linhaça', 'Espinafre', 'Castanhas', 'Sementes de chia'],
    low_carb: ['Salmão', 'Castanhas', 'Abacate', 'Espinafre', 'Ovos'],
    lactose_free: ['Soja / Tofu', 'Linhaça', 'Salmão', 'Espinafre', 'Castanhas'],
  },
};

const postpartumSuggestion = {
  titleKey: 'nutrition.postpartum_title',
  descKey: 'nutrition.postpartum_desc',
  nutrientKeys: ['nutrition.iron', 'nutrition.calcium', 'nutrition.omega3', 'nutrition.vitamin_b12'],
  foods: {
    default: ['Salmão', 'Ovos', 'Aveia', 'Espinafre', 'Batata doce'],
    vegetarian: ['Ovos', 'Aveia', 'Espinafre', 'Lentilha', 'Castanhas'],
    vegan: ['Aveia', 'Espinafre', 'Lentilha', 'Castanhas', 'Sementes de chia'],
    low_carb: ['Salmão', 'Ovos', 'Abacate', 'Espinafre', 'Castanhas'],
    lactose_free: ['Salmão', 'Ovos', 'Aveia', 'Espinafre', 'Batata doce'],
  },
};

const HormonalSuggestion: React.FC = () => {
  const { t } = useTranslation();
  const { currentPhase, getPhaseInfo } = useCycle();
  const { diet_type } = useProfile();
  const { lifePhase, pregnancyWeeks } = useLifePhase();
  const phaseInfo = getPhaseInfo();

  const isPregnant = lifePhase === 'pregnant';
  const isMenopause = lifePhase === 'menopause';
  const isPostpartum = lifePhase === 'postpartum';
  const trimester = pregnancyWeeks ? (pregnancyWeeks <= 12 ? 1 : pregnancyWeeks <= 27 ? 2 : 3) : 1;

  const suggestion = useMemo((): PhaseSuggestion => {
    const dietKey = (diet_type as 'default' | 'vegetarian' | 'vegan' | 'low_carb' | 'lactose_free') || 'default';

    if (isMenopause) {
      return {
        title: t(menopauseSuggestion.titleKey),
        description: t(menopauseSuggestion.descKey),
        nutrients: menopauseSuggestion.nutrientKeys.map(k => t(k)),
        foods: menopauseSuggestion.foods[dietKey] || menopauseSuggestion.foods.default,
      };
    }

    if (isPostpartum) {
      return {
        title: t(postpartumSuggestion.titleKey, 'Nutrição Pós-Parto'),
        description: t(postpartumSuggestion.descKey, 'Alimentos para recuperação e produção de leite. Priorize ferro, cálcio e ômega-3.'),
        nutrients: postpartumSuggestion.nutrientKeys.map(k => t(k)),
        foods: postpartumSuggestion.foods[dietKey] || postpartumSuggestion.foods.default,
      };
    }

    if (isPregnant) {
      const base = pregnancySuggestions[trimester];
      return {
        title: t(base.titleKey),
        description: t(base.descKey),
        nutrients: base.nutrientKeys.map(k => t(k)),
        foods: base.foods[dietKey] || base.foods.default,
      };
    }

    const base = phaseSuggestionsBase[currentPhase];
    return {
      title: t(base.titleKey),
      description: t(base.descKey),
      nutrients: base.nutrientKeys.map(k => t(k)),
      foods: base.foods[dietKey] || base.foods.default,
    };
  }, [currentPhase, diet_type, isPregnant, isMenopause, isPostpartum, trimester, t]);

  const contextLabel = isPregnant
    ? `${t('pregnancy.trimester_' + trimester)} — ${t('pregnancy.week')} ${pregnancyWeeks || '?'}`
    : isMenopause
    ? t('menopause.title')
    : phaseInfo.name;

  return (
    <motion.div
      id="hormonal-suggestion"
      className="glass-card p-5 mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl phase-gradient">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {isMenopause ? t('nutrition.menopause_suggestion') : isPregnant ? t('nutrition.pregnancy_suggestion') : t('nutrition.hormonal_suggestion')}
            </h3>
            <p className="text-xs text-muted-foreground">{contextLabel}</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {dietLabels[diet_type || 'default']?.emoji} {t(dietLabels[diet_type || 'default']?.labelKey)}
        </Badge>
      </div>

      <h4 className="text-lg font-semibold text-primary mb-2">{suggestion.title}</h4>
      <p className="text-sm text-foreground/70 mb-4">{suggestion.description}</p>

      <div className="space-y-3">
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('nutrition.recommended_foods')}
          </span>
          <div className="flex flex-wrap gap-2 mt-2">
            {suggestion.foods.map((food) => (
              <span
                key={food}
                className="px-3 py-1 bg-phase-secondary/30 text-phase-primary rounded-full text-sm font-medium"
              >
                {food}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('nutrition.key_nutrients')}
          </span>
          <div className="flex flex-wrap gap-2 mt-2">
            {suggestion.nutrients.map((nutrient) => (
              <span
                key={nutrient}
                className="flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
              >
                <Leaf className="w-3 h-3" />
                {nutrient}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HormonalSuggestion;
