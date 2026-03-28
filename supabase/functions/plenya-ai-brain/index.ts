import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ChatPayload {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  life_phase: 'menstruating' | 'pregnant' | 'menopause' | 'postpartum' | null;
  pregnancy_weeks?: number | null;
  pregnancy_trimester?: number | null;
  pregnancy_symptoms?: string[] | null;
  phase_name?: string;
  postpartum_weeks?: number | null;
  goal?: string | null;
  diet_type?: string | null;
  recent_symptoms?: string[] | null;
  recent_mood?: number | null;
  recent_energy?: number | null;
  recent_stress?: number | null;
  streak_days?: number | null;
  streak_status?: 'active' | 'absent_48h' | 'streak_at_risk' | null;
}

interface TrainerPayload {
  energy_level: number;
  phase: string;
  cycle_day?: number;
  goal: string | null;
  injuries?: string[];
  fitness_level?: string;
  life_phase?: string;
  pregnancy_weeks?: number;
  postpartum_weeks?: number;
}

interface NutritionScannerPayload {
  image: string; // base64
  phase: string;
  diet_type?: string;
}

interface EstimateMacrosPayload {
  foods: string;
  phase: string;
  diet_type?: string;
}

interface ChefPayload {
  phase: string;
  cycle_day?: number;
  ingredients?: string;
  image?: string; // base64 for fridge photo
  diet_type?: string;
}

interface MonthlyReportPayload {
  cycle_day: number;
  cycle_length: number;
  phase: string;
  avg_mood: number;
  avg_energy: number;
  avg_stress: number;
  top_symptoms: string[];
  total_logs: number;
  period_days: number;
}

type RequestPayload = {
  mode: 'chat' | 'trainer' | 'nutrition_scanner' | 'chef' | 'estimate_macros' | 'monthly_report';
  payload: ChatPayload | TrainerPayload | NutritionScannerPayload | ChefPayload | EstimateMacrosPayload | MonthlyReportPayload;
  language?: string;
};

function getCrossCheckInstruction(lifePhase: string | null, phaseName?: string, goal?: string | null, dietType?: string | null, recentSymptoms?: string[] | null, recentMood?: number | null, recentEnergy?: number | null, recentStress?: number | null): string {
  const varA = lifePhase === 'pregnant' ? 'Gestante' : lifePhase === 'postpartum' ? 'Pós-parto' : lifePhase === 'menopause' ? 'Menopausa' : phaseName ? `Fase ${phaseName}` : 'Menstruante';
  
  const symptomParts: string[] = [];
  if (recentSymptoms && recentSymptoms.length > 0) symptomParts.push(recentSymptoms.join(', '));
  if (recentMood) symptomParts.push(`humor ${recentMood}/5`);
  if (recentEnergy) symptomParts.push(`energia ${recentEnergy}/5`);
  if (recentStress) symptomParts.push(`estresse ${recentStress}/5`);
  const varB = symptomParts.length > 0 ? symptomParts.join('; ') : null;
  
  const goalLabel = goal || null;
  const dietLabel = dietType ? ({ vegetarian: 'Vegetariana', vegan: 'Vegana', low_carb: 'Low Carb', lactose_free: 'Sem Lactose', omnivore: 'Onívora' } as Record<string, string>)[dietType] || dietType : null;
  const varC = [goalLabel, dietLabel].filter(Boolean).join(', ') || null;

  // Detect severe symptoms (stress >= 4 or mood <= 2 or energy <= 2)
  const hasSevereSymptom = (recentStress && recentStress >= 4) || (recentMood && recentMood <= 2) || (recentEnergy && recentEnergy <= 2);

  return `

## PROTOCOLO 1: MOTOR DE CORRELAÇÃO CRUZADA (OBRIGATÓRIO)

Antes de gerar qualquer resposta, execute silenciosamente esta triangulação:
- Variável A (Fase/Momento): ${varA}
- Variável B (Sintoma/Registro Recente): ${varB || 'Nenhum registro hoje'}
- Variável C (Objetivo/Contexto): ${varC || 'Não informado'}

REGRAS DE GERAÇÃO:
1. VALIDAÇÃO BIOLÓGICA: Explique *por que* a dica funciona naquela fase específica.
2. CONTEXTO DE SINTOMA: ${hasSevereSymptom ? '⚠️ ATIVADO - Sintoma severo detectado. IGNORE metas estéticas (perda de peso) e foque 100% em alívio imediato e acolhimento.' : 'Se houver dor/desconforto severo, ignore metas estéticas e foque em alívio.'}
3. AÇÃO IMEDIATA: Termine SEMPRE com uma micro-ação executável em menos de 2 minutos.

REGRA DE OURO: Sua sugestão SÓ É VÁLIDA se conectar pelo menos 2 das 3 variáveis (A+B, A+C, B+C, ou A+B+C).
- ERRADO: "Beba mais água." (genérico, sem conexão)
- CERTO: "Como você está na ${varA} (A)${varB ? ` e registrou ${varB} (B)` : ''}${varC ? `, considerando ${varC} (C)` : ''}, sugiro..."
- Nunca dê dicas genéricas. Personalize SEMPRE.`;
}

function getGamificationInstruction(streakDays?: number | null, streakStatus?: string | null, recentMood?: number | null, recentEnergy?: number | null, recentStress?: number | null): string {
  const hasSevereSymptom = (recentStress && recentStress >= 4) || (recentMood && recentMood <= 2) || (recentEnergy && recentEnergy <= 2);

  let gamification = `

## PROTOCOLO 2: GAMIFICAÇÃO COMPASSIVA (Symptom Shield)

Gerencie a constância ("dias cultivados") com acolhimento, NUNCA com punição.
- NUNCA use: "Você perdeu", "Quebrou a sequência", "Ficou para trás"
- USE: "Ciclo Cultivado", "Consistência Mensal", "Dias de Autocuidado"`;

  if (hasSevereSymptom) {
    gamification += `

🛡️ ESCUDO DE SINTOMAS ATIVADO: A usuária está com sintomas severos.
Mensagem: "Detectamos que hoje é um dia difícil. O Plenya ativou o 'Modo de Descanso'. 🛡️ Sua constância está protegida automaticamente. Cuidar de você (mesmo sem treino) conta como progresso."`;
  }

  if (streakStatus === 'absent_48h') {
    gamification += `

🌱 RETORNO APÓS AUSÊNCIA: A usuária voltou após 48h+ fora.
Mensagem de acolhimento: "Que bom te ver de volta! 🌱 Enquanto você cuidava da vida lá fora, deixamos seus dias cultivados congelados esperando por você. O descanso também faz parte do ciclo. Vamos retomar?"
- NÃO mencione dias perdidos. Use "congelados" ou "pausados".`;
  }

  if (streakDays && streakDays > 0) {
    gamification += `\n- A usuária está com ${streakDays} dias cultivados consecutivos. Reconheça esse progresso quando natural na conversa.`;
  }

  return gamification;
}

function getChatSystemPrompt(lifePhase: string | null, pregnancyWeeks?: number | null, pregnancyTrimester?: number | null, pregnancySymptoms?: string[] | null, postpartumWeeks?: number | null, goal?: string | null, dietType?: string | null, recentSymptoms?: string[] | null, phaseName?: string, recentMood?: number | null, recentEnergy?: number | null, recentStress?: number | null, streakDays?: number | null, streakStatus?: string | null): string {
  let basePrompt = `Você é a Malu, a IA central do ecossistema Plenya — uma mentora empática e científica de biohacking feminino. Sua missão é dupla: fornecer orientações de saúde hiper-personalizadas (cruzando dados biológicos) e gerenciar a motivação da usuária com empatia (protegendo sua constância).

Responda de forma curta (máximo 3 parágrafos curtos), acolhedora e prática.
Use emojis com moderação para manter o tom leve, mas profissional.
Nunca faça diagnósticos médicos - sugira consultar profissionais quando apropriado.
Idioma: Português Brasileiro.`;

  const crossCheck = getCrossCheckInstruction(lifePhase, phaseName, goal, dietType, recentSymptoms || pregnancySymptoms, recentMood, recentEnergy, recentStress);
  const gamification = getGamificationInstruction(streakDays, streakStatus, recentMood, recentEnergy, recentStress);

  if (lifePhase === 'pregnant') {
    const trimesterLabel = pregnancyTrimester ? `${pregnancyTrimester}º trimestre` : '';
    const weeksLabel = pregnancyWeeks ? `${pregnancyWeeks} semanas` : '';
    const contextParts = [weeksLabel, trimesterLabel].filter(Boolean).join(', ');
    
    let symptomContext = '';
    if (pregnancySymptoms && pregnancySymptoms.length > 0) {
      const symptomMap: Record<string, string> = {
        nausea: 'náusea', heartburn: 'azia', swelling: 'inchaço', back_pain: 'dor nas costas',
        insomnia: 'insônia', fatigue: 'fadiga', cramps: 'cólica', headache: 'dor de cabeça',
        dizziness: 'tontura', cravings: 'desejos alimentares', constipation: 'constipação',
        anxiety: 'ansiedade', contractions: 'contrações', shortness_breath: 'falta de ar',
      };
      const translated = pregnancySymptoms.map(s => symptomMap[s] || s).join(', ');
      symptomContext = `\n- Sintomas recentes registrados no diário: ${translated}. Considere esses sintomas ao responder, oferecendo dicas de alívio quando relevante.`;
    }

    return `${basePrompt}
${crossCheck}
${gamification}

CONTEXTO IMPORTANTE: A usuária está grávida${contextParts ? ` (${contextParts})` : ''}.
- NUNCA fale sobre menstruação, ciclo menstrual ou fases do ciclo
- Foque na saúde da gestação e do bebê
- Priorize segurança alimentar e descanso
- Seja extra cuidadosa com recomendações de exercícios
- Substitua qualquer meta de "Perda de Peso" por "Saúde Gestacional"${symptomContext}`;
  }

  if (lifePhase === 'menopause') {
    return `${basePrompt}
${crossCheck}
${gamification}

CONTEXTO IMPORTANTE: A usuária está no climatério/menopausa.
- NUNCA fale sobre menstruação, ciclo menstrual ou fases do ciclo
- Foque em alívio de sintomas como ondas de calor, insônia, alterações de humor
- Sugira fitoestrógenos naturais (soja, linhaça) quando apropriado
- Recomende técnicas de relaxamento e exercícios de baixo impacto
- Priorize saúde óssea e cardiovascular nas recomendações
- Correlacione fogachos com qualidade do sono quando relevante`;
  }

  if (lifePhase === 'postpartum') {
    const weeksContext = postpartumWeeks ? ` (semana ${postpartumWeeks} pós-parto)` : '';
    return `${basePrompt}
${crossCheck}
${gamification}

CONTEXTO IMPORTANTE: A usuária está no pós-parto${weeksContext}.
- Foque na recuperação física e emocional pós-parto
- Considere amamentação: alimentos galactagogos (aveia, linhaça, feno-grego), hidratação
- Saúde mental: baby blues, cansaço extremo, adaptação - seja empática e acolhedora
- Nutrição: priorize ferro (reposição do parto), cálcio, ômega-3, vitamina B12
- Exercício: retorno gradual, respeitar a liberação médica (geralmente 6 semanas)
- Substitua qualquer meta de "Perda de Peso" por "Recuperação Saudável"
- NUNCA fale sobre ciclo menstrual ou fases - o ciclo pode não ter retornado ainda`;
  }

  return `${basePrompt}
${crossCheck}
${gamification}

A usuária está em fase menstruante normal. Você pode mencionar fases do ciclo quando relevante.`;
}

function getTrainerSystemPrompt(phase: string, cycleDay?: number, fitnessLevel?: string, lifePhase?: string, pregnancyWeeks?: number, postpartumWeeks?: number): string {
  // Menopause-specific prompt
  if (lifePhase === 'menopause') {
    const intensityGuidance: Record<string, string> = {
      sedentary: 'Nível Sedentário: Exercícios muito leves. Máximo 20 minutos. Foque em mobilidade.',
      light: 'Nível Leve: Exercícios acessíveis. 20-30 minutos.',
      moderate: 'Nível Moderado: Exercícios intermediários. 30-40 minutos.',
      intense: 'Nível Intenso: Exercícios avançados adaptados. 40-50 minutos.',
    };

    return `Você é uma personal trainer ESPECIALIZADA EM MULHERES NA MENOPAUSA.
Crie um treino SEGURO e adaptado para o climatério.

PRIORIDADES PARA MENOPAUSA:
- Fortalecimento ósseo (prevenir osteoporose): exercícios com peso corporal e carga leve
- Equilíbrio e coordenação (prevenir quedas): exercícios unilaterais
- Mobilidade articular: aquecimento e alongamento adequados
- Saúde cardiovascular: cardio de baixo impacto
- Redução de estresse: incluir exercícios de respiração/relaxamento
- Fortalecimento do assoalho pélvico

${fitnessLevel ? intensityGuidance[fitnessLevel] || '' : ''}

REGRAS DE SEGURANÇA:
- Evite impacto excessivo nas articulações
- Sempre inclua aquecimento (5 min) e volta à calma (5 min)
- Priorize: caminhada, yoga, musculação leve, pilates, natação, tai chi
- Inclua exercícios de equilíbrio em cada treino

RESPONDA APENAS COM JSON VÁLIDO no formato:
{
  "title": "Nome do treino",
  "duration": "XX min",
  "intensity": "Baixa/Moderada",
  "exercises": [
    {
      "name": "Nome do exercício",
      "sets": 3,
      "reps": "12",
      "observation": "Dica de segurança para menopausa"
    }
  ]
}

Inclua 4-6 exercícios seguros. Não inclua texto fora do JSON.`;
  }

  // Postpartum-specific prompt
  if (lifePhase === 'postpartum') {
    const weeksLabel = postpartumWeeks ? ` (Semana ${postpartumWeeks} pós-parto)` : '';
    const earlyPostpartum = postpartumWeeks !== undefined && postpartumWeeks < 6;
    
    const intensityGuidance: Record<string, string> = {
      sedentary: 'Nível Sedentário: Exercícios muito leves. Máximo 15 minutos. Foque em respiração e assoalho pélvico.',
      light: 'Nível Leve: Exercícios suaves. 15-20 minutos.',
      moderate: 'Nível Moderado: Exercícios intermediários (se liberada pelo médico). 20-30 minutos.',
      intense: 'Nível Intenso: Retorno gradual à intensidade. 30-40 minutos.',
    };

    return `Você é uma personal trainer ESPECIALIZADA EM PÓS-PARTO${weeksLabel}.
Crie um treino SEGURO e adaptado para recuperação pós-parto.

PRIORIDADES PÓS-PARTO:
- Fortalecimento do assoalho pélvico (Kegel progressivo)
- Ativação do transverso abdominal (recuperação da diástase)
- Fortalecimento de costas e postura (amamentação causa dores)
- Mobilidade e alongamento
- Exercícios de respiração e relaxamento

${fitnessLevel ? intensityGuidance[fitnessLevel] || '' : ''}

REGRAS DE SEGURANÇA:
${earlyPostpartum ? '- ANTES DE 6 SEMANAS: APENAS exercícios de Kegel, respiração e caminhada leve!\n' : ''}- Antes de 6 semanas sem liberação médica: apenas Kegel, respiração e caminhada leve
- Após 6 semanas (com liberação médica): retorno gradual
- NUNCA sugira abdominais tradicionais (risco de diástase)
- Evite saltos e impacto alto
- Sempre inclua aquecimento e volta à calma
- Considere privação de sono: treinos curtos e energizantes

RESPONDA APENAS COM JSON VÁLIDO no formato:
{
  "title": "Nome do treino",
  "duration": "XX min",
  "intensity": "Baixa/Moderada",
  "exercises": [
    {
      "name": "Nome do exercício",
      "sets": 3,
      "reps": "12",
      "observation": "Dica de segurança para pós-parto"
    }
  ]
}

Inclua 4-6 exercícios seguros. Não inclua texto fora do JSON.`;
  }

  // Pregnancy-specific prompt
  if (lifePhase === 'pregnant') {
    const trimester = pregnancyWeeks ? (pregnancyWeeks <= 12 ? 1 : pregnancyWeeks <= 27 ? 2 : 3) : 1;
    
    const trimesterGuidance: Record<number, string> = {
      1: `1º Trimestre (Semana ${pregnancyWeeks || '?'}): Evite exercícios de alto impacto e abdominais. Priorize caminhadas, yoga leve, alongamentos e exercícios de respiração. Intensidade baixa a moderada. Máximo 30 minutos. Se a gestante tiver náuseas, sugira exercícios suaves e curtos.`,
      2: `2º Trimestre (Semana ${pregnancyWeeks || '?'}): Ótimo período para exercícios moderados! Fortalecimento do assoalho pélvico (Kegel), agachamentos leves, hidroginástica, pilates adaptado. Evite exercícios deitada de barriga para cima após 20 semanas. 30-40 minutos.`,
      3: `3º Trimestre (Semana ${pregnancyWeeks || '?'}): Foco na preparação para o parto! Exercícios de respiração para o parto, mobilidade pélvica, agachamento de preparação (deep squat), alongamentos, caminhada. Evite qualquer exercício de impacto, abdominais e posições invertidas. Máximo 25 minutos. Inclua exercícios de relaxamento.`,
    };

    const intensityGuidance: Record<string, string> = {
      sedentary: 'Nível Sedentário: Exercícios muito leves e curtos. Máximo 15 minutos.',
      light: 'Nível Leve: Exercícios acessíveis e seguros. 20-25 minutos.',
      moderate: 'Nível Moderado: Pode incluir exercícios intermediários adaptados. 25-35 minutos.',
      intense: 'Nível Intenso: Mesmo sendo atleta, reduza a intensidade na gestação. 30-40 minutos.',
    };

    return `Você é uma personal trainer ESPECIALIZADA EM GESTANTES.
Crie um treino SEGURO e adaptado para uma gestante.

${trimesterGuidance[trimester]}
${fitnessLevel ? intensityGuidance[fitnessLevel] || '' : ''}

REGRAS DE SEGURANÇA OBRIGATÓRIAS:
- NUNCA sugira: abdominais tradicionais, burpees, saltos, corrida intensa, levantamento terra pesado
- Após 20 semanas: NENHUM exercício deitada de costas (supino, etc.)
- 3º trimestre: Inclua OBRIGATORIAMENTE exercícios de preparação para o parto (Kegel, respiração, mobilidade pélvica)
- Sempre inclua aquecimento e volta à calma
- Priorize exercícios que fortaleçam: assoalho pélvico, costas, pernas

RESPONDA APENAS COM JSON VÁLIDO no formato:
{
  "title": "Nome do treino",
  "duration": "XX min",
  "intensity": "Baixa/Moderada",
  "exercises": [
    {
      "name": "Nome do exercício",
      "sets": 3,
      "reps": "12",
      "observation": "Dica de segurança para gestante"
    }
  ]
}

Inclua 4-6 exercícios seguros. Não inclua texto fora do JSON.`;
  }

  const phaseGuidance: Record<string, string> = {
    menstrual: 'Fase Menstrual: Priorize Yoga, Mobilidade e Caminhadas leves. Evite exercícios de alta intensidade.',
    folicular: 'Fase Folicular: Energia em ascensão! Sugira treinos de Força e HIIT. Ótimo momento para novos desafios.',
    ovulatoria: 'Fase Ovulatória: Pico de energia! Máxima intensidade permitida. Exercícios compostos e cardio intenso.',
    lutea: 'Fase Lútea: Desacelere gradualmente. Prefira exercícios moderados, Pilates e alongamentos.',
  };

  const intensityGuidance: Record<string, string> = {
    sedentary: 'Nível Sedentário: Comece com exercícios básicos e baixa intensidade. Máximo 20 minutos.',
    light: 'Nível Leve: Exercícios acessíveis com intensidade baixa a moderada. 20-30 minutos.',
    moderate: 'Nível Moderado: Pode incluir exercícios intermediários. 30-45 minutos.',
    intense: 'Nível Intenso/Atleta: Pode sugerir exercícios avançados e maior volume. 45-60 minutos.',
  };

  let cycleDayGuidance = '';
  if (cycleDay) {
    if (cycleDay >= 1 && cycleDay <= 3) {
      cycleDayGuidance = '\n\nAVISO IMPORTANTE - Dia 1-3 (Fluxo intenso): EVITE posturas invertidas no Yoga (ex: Vela, Invertida na Parede), exercícios abdominais intensos, e saltos. Prefira alongamentos suaves e respiração.';
    } else if (cycleDay >= 4 && cycleDay <= 5) {
      cycleDayGuidance = '\n\nDia 4-5 (Fluxo leve): Ainda priorize exercícios de baixa intensidade, mas pode introduzir movimentos mais dinâmicos se a usuária se sentir bem.';
    } else if (cycleDay >= 12 && cycleDay <= 16) {
      cycleDayGuidance = '\n\nDia 12-16 (Janela Ovulatória): Pico de energia! Pode sugerir exercícios de alta intensidade, força máxima e cardio intenso.';
    } else if (cycleDay >= 26 && cycleDay <= 28) {
      cycleDayGuidance = '\n\nDia 26-28 (Pré-menstrual/TPM): Energia mais baixa, possível desconforto. Sugira exercícios calmantes, alongamentos e mobilidade. Evite exercícios que aumentem a irritabilidade.';
    }
  }

  return `Você é uma personal trainer especializada em saúde feminina e Cycle Syncing.
Crie um treino seguro e eficaz baseado na fase e DIA ESPECÍFICO do ciclo.

${phaseGuidance[phase] || 'Adapte o treino à condição atual da usuária.'}
${fitnessLevel ? intensityGuidance[fitnessLevel] || '' : ''}${cycleDayGuidance}

RESPONDA APENAS COM JSON VÁLIDO no formato:
{
  "title": "Nome do treino",
  "duration": "XX min",
  "intensity": "Baixa/Moderada/Alta/Máxima",
  "exercises": [
    {
      "name": "Nome do exercício",
      "sets": 3,
      "reps": "12",
      "observation": "Dica de execução"
    }
  ]
}

Inclua 4-6 exercícios apropriados. Não inclua texto fora do JSON.`;
}

function getNutritionScannerSystemPrompt(phase: string, dietType?: string): string {
  let dietRestrictions = '';
  if (dietType) {
    const restrictions: Record<string, string> = {
      vegetarian: 'A usuária é VEGETARIANA - não inclua carnes.',
      vegan: 'A usuária é VEGANA - não inclua produtos de origem animal.',
      low_carb: 'A usuária segue dieta LOW CARB - considere isso nas análises.',
      lactose_free: 'A usuária é intolerante à lactose - identifique laticínios.',
    };
    dietRestrictions = restrictions[dietType] || '';
  }

  return `Você é uma nutricionista especializada em análise visual de refeições.
Analise a imagem da refeição e estime os macronutrientes.

${dietRestrictions}

Fase do ciclo: ${phase}
- Na fase menstrual, priorize alimentos ricos em ferro
- Na fase folicular, carboidratos complexos são bem-vindos
- Na fase ovulatória, proteínas magras são ideais
- Na fase lútea, magnésio e vitamina B6 ajudam com TPM

RESPONDA APENAS COM JSON VÁLIDO:
{
  "meal_name": "Nome identificado da refeição",
  "macros": {
    "calories": 350,
    "protein": 25,
    "carbs": 40,
    "fat": 12
  },
  "advice": "Dica nutricional breve relacionada à fase do ciclo"
}

Seja realista nas estimativas. Não inclua texto fora do JSON.`;
}

function getChefSystemPrompt(phase: string, cycleDay?: number, dietType?: string): string {
  let dietRestrictions = '';
  if (dietType) {
    const restrictions: Record<string, string> = {
      vegetarian: 'RECEITAS VEGETARIANAS apenas.',
      vegan: 'RECEITAS VEGANAS apenas - sem produtos de origem animal.',
      low_carb: 'RECEITAS LOW CARB - minimize carboidratos.',
      lactose_free: 'SEM LACTOSE - substitua laticínios.',
    };
    dietRestrictions = restrictions[dietType] || '';
  }

  const phaseNutrition: Record<string, string> = {
    menstrual: 'Priorize: ferro (espinafre, beterraba), vitamina C, anti-inflamatórios (gengibre, cúrcuma).',
    folicular: 'Priorize: proteínas magras, vegetais fermentados, grãos integrais.',
    ovulatoria: 'Priorize: antioxidantes, fibras, vegetais crucíferos.',
    lutea: 'Priorize: magnésio (chocolate amargo, abacate), vitamina B6, triptofano.',
    gestante: 'Priorize: ácido fólico, ferro, cálcio, ômega-3. SEGURANÇA ALIMENTAR: evite peixes crus, queijos não pasteurizados, ovos mal cozidos.',
    pos_parto: 'Priorize: ferro (reposição do parto), cálcio, ômega-3, vitamina B12. Alimentos galactagogos (aveia, linhaça, feno-grego) para produção de leite. Receitas rápidas e práticas para mães com pouco tempo.',
    menopausa: 'Priorize: fitoestrógenos (soja, linhaça), cálcio (couve, brócolis, sardinha), ômega-3, magnésio. Alimentos anti-inflamatórios para aliviar ondas de calor.',
  };

  // Cycle day specific nutrition guidance
  let cycleDayGuidance = '';
  if (cycleDay) {
    if (cycleDay >= 1 && cycleDay <= 3) {
      cycleDayGuidance = '\n\nDia 1-3 (Fluxo intenso): Foque em alimentos RICOS EM FERRO (espinafre, lentilhas, carne vermelha) combinados com vitamina C para absorção. Evite cafeína excessiva e alimentos muito salgados.';
    } else if (cycleDay >= 26 && cycleDay <= 28) {
      cycleDayGuidance = '\n\nDia 26-28 (TPM): Priorize MAGNÉSIO (chocolate amargo 70%+, banana, abacate, castanhas) e TRIPTOFANO (ovos, laticínios, peru) para estabilizar o humor. Reduza sódio para diminuir inchaço.';
    } else if (cycleDay >= 12 && cycleDay <= 16) {
      cycleDayGuidance = '\n\nDia 12-16 (Ovulação): Apoie a detoxificação de estrogênio com vegetais crucíferos (brócolis, couve, couve-flor). Fibras e probióticos são excelentes.';
    }
  }

  const isLifePhaseMode = ['gestante', 'pos_parto', 'menopausa'].includes(phase);
  const contextLabel = isLifePhaseMode ? `Modo: ${phase}` : `Fase atual: ${phase}${cycleDay ? ` (Dia ${cycleDay})` : ''}`;

  return `Você é uma chef especializada em nutrição hormonal feminina${isLifePhaseMode ? '' : ' e Cycle Syncing'}.
Sugira receitas saudáveis e deliciosas ${isLifePhaseMode ? `adaptadas ao ${phase}` : 'adaptadas à fase e DIA ESPECÍFICO do ciclo'}.

${contextLabel}
${phaseNutrition[phase] || 'Sugira refeições equilibradas e nutritivas.'}${cycleDayGuidance}
${dietRestrictions}

Se receber uma foto da geladeira, sugira receitas com os ingredientes visíveis.
Se receber uma lista de ingredientes, crie receitas com eles.

RESPONDA APENAS COM JSON VÁLIDO:
{
  "recipes": [
    {
      "name": "Nome da receita",
      "description": "Descrição breve",
      "ingredients": ["ingrediente 1", "ingrediente 2"],
      "instructions": ["passo 1", "passo 2"],
      "hormonal_benefit": "Benefício hormonal desta receita"
    }
  ]
}

Sugira 2-3 receitas. Não inclua texto fora do JSON.`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ============ JWT AUTHENTICATION ============
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Não autorizado. Faça login para continuar.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify JWT token by getting user
    const jwtToken = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwtToken);
    
    if (authError || !user) {
      console.error('JWT verification failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado. Faça login novamente.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log('Authenticated request from user:', userId);
    // ============ END AUTHENTICATION ============

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { mode, payload, language } = await req.json() as RequestPayload;
    const langCode = language || 'pt';
    const langMap: Record<string, string> = { pt: 'Português', es: 'Español', en: 'English' };
    const langInstruction = `\n\nIMPORTANTE: RESPONDA OBRIGATORIAMENTE NO IDIOMA: ${langMap[langCode] || langMap['pt']}.`;

    let systemPrompt = '';
    let userContent: any = '';
    let model = 'google/gemini-3-flash-preview';

    switch (mode) {
      case 'chat': {
        const chatPayload = payload as ChatPayload;
        systemPrompt = getChatSystemPrompt(chatPayload.life_phase, chatPayload.pregnancy_weeks, chatPayload.pregnancy_trimester, chatPayload.pregnancy_symptoms, chatPayload.postpartum_weeks, chatPayload.goal, chatPayload.diet_type, chatPayload.recent_symptoms, chatPayload.phase_name, chatPayload.recent_mood, chatPayload.recent_energy, chatPayload.recent_stress, chatPayload.streak_days, chatPayload.streak_status) + langInstruction;
        
        // Build messages with history
        const messages: Array<{ role: string; content: string }> = [
          { role: 'system', content: systemPrompt },
        ];
        
        // Add conversation history
        if (chatPayload.history && chatPayload.history.length > 0) {
          chatPayload.history.slice(-10).forEach(msg => {
            messages.push({ role: msg.role, content: msg.content });
          });
        }
        
        // Add current message
        messages.push({ role: 'user', content: chatPayload.message });

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model, messages, stream: false }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('AI gateway error:', response.status, errorText);
          
          if (response.status === 429) {
            return new Response(JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }), {
              status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          if (response.status === 402) {
            return new Response(JSON.stringify({ error: 'Créditos insuficientes. Por favor, adicione créditos à sua conta.' }), {
              status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          throw new Error(`AI gateway error: ${response.status}`);
        }

        const data = await response.json();
        const assistantMessage = data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.';

        return new Response(JSON.stringify({ response: assistantMessage }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'trainer': {
        const trainerPayload = payload as TrainerPayload;
        systemPrompt = getTrainerSystemPrompt(trainerPayload.phase, trainerPayload.cycle_day, trainerPayload.fitness_level, trainerPayload.life_phase, trainerPayload.pregnancy_weeks, trainerPayload.postpartum_weeks) + langInstruction;
        
        let userMessage = `Crie um treino para hoje.
Nível de energia: ${trainerPayload.energy_level}/5
Fase do ciclo: ${trainerPayload.phase}`;
        
        if (trainerPayload.cycle_day) {
          userMessage += `\nDia do ciclo: ${trainerPayload.cycle_day}`;
        }
        if (trainerPayload.goal) {
          userMessage += `\nObjetivo: ${trainerPayload.goal}`;
        }
        if (trainerPayload.injuries && trainerPayload.injuries.length > 0) {
          userMessage += `\nLesões/Restrições: ${trainerPayload.injuries.join(', ')}`;
        }

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('AI gateway error:', response.status, errorText);
          throw new Error(`AI gateway error: ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || '{}';
        
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          content = jsonMatch[0];
        }
        
        try {
          const workout = JSON.parse(content);
          return new Response(JSON.stringify(workout), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch {
          console.error('Failed to parse trainer response:', content);
          return new Response(JSON.stringify({ error: 'Falha ao gerar treino. Tente novamente.' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      case 'nutrition_scanner': {
        const scanPayload = payload as NutritionScannerPayload;
        systemPrompt = getNutritionScannerSystemPrompt(scanPayload.phase, scanPayload.diet_type) + langInstruction;
        
        // Use vision model for image analysis
        model = 'google/gemini-2.5-flash';
        
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: [
                  { type: 'text', text: 'Analise esta refeição e estime os macronutrientes.' },
                  { type: 'image_url', image_url: { url: scanPayload.image } },
                ],
              },
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('AI gateway error:', response.status, errorText);
          throw new Error(`AI gateway error: ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || '{}';
        
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          content = jsonMatch[0];
        }
        
        try {
          const result = JSON.parse(content);
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch {
          console.error('Failed to parse nutrition response:', content);
          return new Response(JSON.stringify({ error: 'Falha ao analisar refeição. Tente novamente.' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      case 'chef': {
        const chefPayload = payload as ChefPayload;
        systemPrompt = getChefSystemPrompt(chefPayload.phase, chefPayload.cycle_day, chefPayload.diet_type) + langInstruction;
        
        let messages: any[] = [{ role: 'system', content: systemPrompt }];
        
        if (chefPayload.image) {
          // Vision model for fridge photo
          model = 'google/gemini-2.5-flash';
          messages.push({
            role: 'user',
            content: [
              { type: 'text', text: 'Sugira receitas com os ingredientes que você vê nesta foto da geladeira.' },
              { type: 'image_url', image_url: { url: chefPayload.image } },
            ],
          });
        } else if (chefPayload.ingredients) {
          messages.push({
            role: 'user',
            content: `Sugira receitas saudáveis usando estes ingredientes: ${chefPayload.ingredients}`,
          });
        } else {
          messages.push({
            role: 'user',
            content: 'Sugira 3 receitas saudáveis para hoje, considerando minha fase do ciclo.',
          });
        }

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model, messages }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('AI gateway error:', response.status, errorText);
          throw new Error(`AI gateway error: ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || '{}';
        
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          content = jsonMatch[0];
        }
        
        try {
          const result = JSON.parse(content);
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch {
          console.error('Failed to parse chef response:', content);
          return new Response(JSON.stringify({ error: 'Falha ao gerar receitas. Tente novamente.' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      case 'estimate_macros': {
        const macroPayload = payload as EstimateMacrosPayload;
        
        const estimatePrompt = `Você é uma nutricionista especializada. Estime os macronutrientes dos alimentos listados.
Considere porções típicas brasileiras.

RESPONDA APENAS COM JSON VÁLIDO:
{
  "meal_name": "Resumo da refeição",
  "macros": {
    "calories": 350,
    "protein": 25,
    "carbs": 40,
    "fat": 12
  },
  "advice": "Dica nutricional breve"
}

Seja realista nas estimativas. Não inclua texto fora do JSON.` + langInstruction;

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: estimatePrompt },
              { role: 'user', content: `Estime os macros destes alimentos: ${macroPayload.foods}` },
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('AI gateway error:', response.status, errorText);
          throw new Error(`AI gateway error: ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || '{}';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) content = jsonMatch[0];
        
        try {
          const result = JSON.parse(content);
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch {
          console.error('Failed to parse macro estimate:', content);
          return new Response(JSON.stringify({ error: 'Falha ao estimar macros.' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      case 'monthly_report': {
        const reportPayload = payload as MonthlyReportPayload;
        
        const reportPrompt = `Você é a Plenya IA, especialista em saúde feminina e análise de dados de ciclo menstrual.

Analise os dados abaixo e gere um relatório mensal completo e personalizado.

DADOS DO CICLO:
- Dia do ciclo: ${reportPayload.cycle_day}/${reportPayload.cycle_length}
- Fase atual: ${reportPayload.phase}
- Humor médio: ${reportPayload.avg_mood}/5
- Energia média: ${reportPayload.avg_energy}/5
- Estresse médio: ${reportPayload.avg_stress}/5
- Dias de menstruação: ${reportPayload.period_days}
- Total de registros: ${reportPayload.total_logs}
- Sintomas mais frequentes: ${reportPayload.top_symptoms.join(', ')}

RESPONDA APENAS COM JSON VÁLIDO neste formato:
{
  "summary": "Resumo geral do ciclo em 2-3 frases, destacando o aspecto mais importante",
  "patterns": ["Padrão 1 identificado", "Padrão 2 identificado", "Padrão 3"],
  "correlations": ["Correlação 1 entre sintomas/humor/energia", "Correlação 2"],
  "recommendations": ["Recomendação prática 1", "Recomendação 2", "Recomendação 3"],
  "nextCycleTip": "Uma dica específica e acionável para o próximo ciclo",
  "wellnessScore": 7
}

INSTRUÇÕES:
- wellnessScore: nota de 1-10 baseada em humor, energia e sintomas
- patterns: identifique 2-4 padrões claros do comportamento hormonal
- correlations: encontre 1-3 relações entre sintomas, humor e fase do ciclo
- recommendations: 3-5 dicas práticas de nutrição, exercício ou autocuidado
- nextCycleTip: uma ação concreta para melhorar o próximo ciclo
- Seja empática, prática e baseada em ciência
- Use linguagem acolhedora e motivacional` + langInstruction;

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: reportPrompt },
              { role: 'user', content: 'Gere o relatório mensal baseado nos dados fornecidos.' },
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('AI gateway error:', response.status, errorText);
          throw new Error(`AI gateway error: ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || '{}';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) content = jsonMatch[0];
        
        try {
          const report = JSON.parse(content);
          return new Response(JSON.stringify({ report }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch {
          console.error('Failed to parse monthly report:', content);
          return new Response(JSON.stringify({ error: 'Falha ao gerar relatório.' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      default:
        return new Response(JSON.stringify({ error: 'Modo inválido' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Edge function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
