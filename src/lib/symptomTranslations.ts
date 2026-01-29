/**
 * Symptom Translation Dictionary
 * Maps database keys to human-readable Portuguese labels
 */

export const symptomTranslations: Record<string, string> = {
  // Menstrual symptoms
  cramps: 'Cólicas',
  bleeding_heavy: 'Fluxo Intenso',
  bleeding_light: 'Fluxo Leve',
  spotting: 'Spotting',
  bloating: 'Inchaço',
  breast_tenderness: 'Sensibilidade nos Seios',
  headache: 'Dor de Cabeça',
  migraine: 'Enxaqueca',
  backache: 'Dor nas Costas',
  acne: 'Acne',
  
  // Emotional
  mood_swings: 'Oscilação de Humor',
  mood_swing: 'Oscilação de Humor',
  irritability: 'Irritabilidade',
  anxiety: 'Ansiedade',
  depression: 'Tristeza',
  crying: 'Choro Fácil',
  sad: 'Tristeza',
  happy: 'Feliz',
  calm: 'Calma',
  stressed: 'Estressada',
  anxious: 'Ansiosa',
  
  // Energy
  fatigue: 'Fadiga',
  insomnia: 'Insônia',
  low_energy: 'Baixa Energia',
  brain_fog: 'Névoa Mental',
  tiredness: 'Cansaço',
  
  // Menopause specific
  hot_flash: 'Ondas de Calor',
  hot_flashes: 'Ondas de Calor',
  night_sweats: 'Suores Noturnos',
  vaginal_dryness: 'Ressecamento Vaginal',
  
  // Digestive
  nausea: 'Náusea',
  constipation: 'Constipação',
  diarrhea: 'Diarreia',
  cravings: 'Desejos Alimentares',
  appetite_changes: 'Mudança de Apetite',
  
  // Other physical
  dizziness: 'Tontura',
  joint_pain: 'Dor Articular',
  muscle_aches: 'Dores Musculares',
  pelvic_pain: 'Dor Pélvica',
  water_retention: 'Retenção de Líquido',
  
  // Skin
  dry_skin: 'Pele Seca',
  oily_skin: 'Pele Oleosa',
  hair_loss: 'Queda de Cabelo',
  
  // Sleep
  sleep_issues: 'Problemas de Sono',
  vivid_dreams: 'Sonhos Vívidos',
  
  // Intimacy related
  low_libido: 'Baixa Libido',
  high_libido: 'Alta Libido',
};

/**
 * Translates a symptom key to Portuguese.
 * Falls back to formatting the original key if no translation exists.
 */
export function translateSymptom(key: string): string {
  if (symptomTranslations[key]) {
    return symptomTranslations[key];
  }
  // Format unknown keys: "brain_fog" -> "Brain Fog"
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Cycle phase translations
 */
export const cyclePhaseTranslations: Record<string, string> = {
  menstrual: 'Menstrual',
  folicular: 'Folicular',
  ovulatoria: 'Ovulatória',
  lutea: 'Lútea',
};

/**
 * Translates cycle phase to Portuguese
 */
export function translatePhase(phase: string | null): string {
  if (!phase) return '-';
  return cyclePhaseTranslations[phase] || phase;
}

/**
 * Mood labels by score
 */
export const moodLabels: Record<number, string> = {
  1: 'Muito Triste',
  2: 'Triste',
  3: 'Neutra',
  4: 'Feliz',
  5: 'Radiante',
};

/**
 * Energy labels by score
 */
export const energyLabels: Record<number, string> = {
  1: 'Muito Baixa',
  2: 'Baixa',
  3: 'Moderada',
  4: 'Alta',
  5: 'Muito Alta',
};

/**
 * Stress labels by score
 */
export const stressLabels: Record<number, string> = {
  1: 'Muito Calma',
  2: 'Calma',
  3: 'Moderado',
  4: 'Estressada',
  5: 'Muito Estressada',
};

/**
 * Life phase labels
 */
export const lifePhaseLabels: Record<string, string> = {
  menstruating: 'Ciclo Menstrual Regular',
  pregnant: 'Gestante',
  menopause: 'Menopausa/Climatério',
};
