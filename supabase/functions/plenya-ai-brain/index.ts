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

type RequestPayload = {
  mode: 'chat' | 'trainer' | 'nutrition_scanner' | 'chef' | 'estimate_macros';
  payload: ChatPayload | TrainerPayload | NutritionScannerPayload | ChefPayload | EstimateMacrosPayload;
  language?: string;
};

function getChatSystemPrompt(lifePhase: string | null, pregnancyWeeks?: number | null, pregnancyTrimester?: number | null, pregnancySymptoms?: string[] | null): string {
  let basePrompt = `Você é a Plenya, uma assistente empática de saúde e bem-estar feminino. 
Responda de forma curta (máximo 3 frases), acolhedora e prática. 
Use emojis ocasionalmente para tornar a conversa mais leve.
Nunca faça diagnósticos médicos - sugira consultar profissionais quando apropriado.`;

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

CONTEXTO IMPORTANTE: A usuária está grávida${contextParts ? ` (${contextParts})` : ''}.
- NUNCA fale sobre menstruação, ciclo menstrual ou fases do ciclo
- Foque na saúde da gestação e do bebê
- Priorize segurança alimentar e descanso
- Seja extra cuidadosa com recomendações de exercícios${symptomContext}`;
  }

  if (lifePhase === 'menopause') {
    return `${basePrompt}

CONTEXTO IMPORTANTE: A usuária está no climatério/menopausa.
- NUNCA fale sobre menstruação, ciclo menstrual ou fases do ciclo
- Foque em alívio de sintomas como ondas de calor, insônia, alterações de humor
- Sugira fitoestrógenos naturais (soja, linhaça) quando apropriado
- Recomende técnicas de relaxamento e exercícios de baixo impacto`;
  }

  return `${basePrompt}

A usuária está em fase menstruante normal. Você pode mencionar fases do ciclo quando relevante.`;
}

function getTrainerSystemPrompt(phase: string, cycleDay?: number, fitnessLevel?: string, lifePhase?: string, pregnancyWeeks?: number): string {
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

  return `Você é uma chef especializada em nutrição hormonal feminina e Cycle Syncing.
Sugira receitas saudáveis e deliciosas adaptadas à fase e DIA ESPECÍFICO do ciclo.

Fase atual: ${phase}${cycleDay ? ` (Dia ${cycleDay})` : ''}
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
        systemPrompt = getChatSystemPrompt(chatPayload.life_phase, chatPayload.pregnancy_weeks, chatPayload.pregnancy_trimester, chatPayload.pregnancy_symptoms) + langInstruction;
        
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
        systemPrompt = getTrainerSystemPrompt(trainerPayload.phase, trainerPayload.cycle_day, trainerPayload.fitness_level, trainerPayload.life_phase, trainerPayload.pregnancy_weeks) + langInstruction;
        
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
