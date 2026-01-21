export interface Contraceptive {
  name: string;
  type: string;
  effects: string[];
}

export const commonContraceptives: Contraceptive[] = [
  { name: "Yasmin", type: "Pílula Combinada", effects: ["Náusea", "Dor nas mamas", "Baixa libido"] },
  { name: "Selene", type: "Pílula (Anti-androgênica)", effects: ["Dor de cabeça", "Ganho de peso", "Alteração de humor"] },
  { name: "Cerazette", type: "Pílula (Progesterona)", effects: ["Acne", "Sangramento irregular", "Ausência de menstruação"] },
  { name: "Mirena", type: "DIU Hormonal", effects: ["Ausência de menstruação", "Cólica leve", "Acne"] },
  { name: "Ciclo 21", type: "Pílula Combinada", effects: ["Náusea", "Retenção de líquido"] },
  { name: "Diane 35", type: "Pílula", effects: ["Dor nas mamas", "Enxaqueca"] },
  { name: "Qlaira", type: "Pílula Bioidêntica", effects: ["Instabilidade emocional", "Dor de cabeça"] },
  { name: "Microvlar", type: "Pílula Combinada", effects: ["Dor de estômago", "Alteração de peso"] },
  { name: "Adoless", type: "Pílula", effects: ["Sangramento de escape", "Dor nas mamas"] },
  { name: "Kyleena", type: "DIU Hormonal", effects: ["Acne", "Cólica", "Irregularidade menstrual"] },
  { name: "Implanon", type: "Implante", effects: ["Ausência de menstruação", "Dor de cabeça", "Alteração de humor"] },
  { name: "Iumi", type: "Pílula", effects: ["Náusea", "Dor nas mamas"] },
  { name: "Tamisa", type: "Pílula", effects: ["Dor de cabeça", "Alteração de peso"] },
  { name: "Nenhum", type: "Sem contracepção hormonal", effects: [] },
];

// Helper function to find contraceptive by name
export const findContraceptive = (name: string): Contraceptive | undefined => {
  return commonContraceptives.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
};

// Helper function to check if a symptom is a known effect of a medication
export const isKnownMedicationEffect = (
  medicationName: string,
  symptom: string
): boolean => {
  const medication = findContraceptive(medicationName);
  if (!medication) return false;
  
  // Normalize symptom for comparison
  const normalizedSymptom = symptom.toLowerCase().trim();
  
  return medication.effects.some((effect) => {
    const normalizedEffect = effect.toLowerCase().trim();
    // Check for partial matches (e.g., "Dor de cabeça" matches "dor de cabeca")
    return (
      normalizedEffect.includes(normalizedSymptom) ||
      normalizedSymptom.includes(normalizedEffect) ||
      // Handle common variations
      (normalizedEffect.includes("náusea") && normalizedSymptom.includes("enjoo")) ||
      (normalizedEffect.includes("acne") && normalizedSymptom.includes("espinha")) ||
      (normalizedEffect.includes("dor de cabeça") && normalizedSymptom.includes("enxaqueca")) ||
      (normalizedEffect.includes("cólica") && normalizedSymptom.includes("colica"))
    );
  });
};

// Get medication effect warning message
export const getMedicationEffectWarning = (
  medicationName: string,
  symptom: string
): string | null => {
  if (isKnownMedicationEffect(medicationName, symptom)) {
    return `💡 Comum com ${medicationName}`;
  }
  return null;
};
