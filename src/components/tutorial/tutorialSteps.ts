import { TutorialStep } from './TutorialOverlay';

export const homeTutorialSteps: TutorialStep[] = [
  {
    targetId: 'cycle-wheel',
    title: '🧭 Seu GPS Hormonal',
    description: 'Veja aqui em qual fase você está e o que esperar do seu corpo. A roda se adapta ao seu ciclo único.',
    position: 'bottom',
  },
  {
    targetId: 'sos-partner-button',
    title: '💕 Modo Parceiro',
    description: 'Precisa de compreensão? Envie um alerta automático para quem você ama com apenas um toque.',
    position: 'top',
  },
  {
    title: '🌸 Diário Sensorial',
    description: 'Registre sintomas íntimos e descubra padrões do seu corpo. Tudo protegido e privado. Explore o app para encontrar mais funcionalidades!',
    position: 'center',
  },
];

export const nutritionTutorialSteps: TutorialStep[] = [
  {
    targetId: 'chef-ia-card',
    title: '👨‍🍳 Geladeira Inteligente',
    description: 'Tire uma foto do que tem em casa e receba uma receita perfeita para sua fase hormonal.',
    position: 'bottom',
  },
  {
    targetId: 'hormonal-suggestion',
    title: '🥗 Alimentos Chave',
    description: 'Descubra o que seu corpo pede hoje para equilibrar os hormônios e maximizar sua energia.',
    position: 'top',
  },
];

export const bodyTutorialSteps: TutorialStep[] = [
  {
    targetId: 'workout-card',
    title: '💪 Treino Sincronizado',
    description: 'A intensidade muda conforme sua energia hormonal. Respeite seu ritmo para melhores resultados.',
    position: 'bottom',
  },
  {
    targetId: 'rest-timer-button',
    title: '⏱️ Descanse Corretamente',
    description: 'Use o timer entre séries para maximizar seu resultado e evitar overtraining.',
    position: 'bottom',
  },
];

export const mindTutorialSteps: TutorialStep[] = [
  {
    targetId: 'emotional-checkin',
    title: '📊 Rastreador de Humor',
    description: 'Monitore estresse e energia diariamente para prever sua TPM e entender seus padrões emocionais.',
    position: 'bottom',
  },
  {
    targetId: 'chat-interface',
    title: '🤖 Sua Amiga Virtual',
    description: 'Desabafe ou peça conselhos a qualquer hora. A IA entende seu ciclo e oferece suporte personalizado.',
    position: 'top',
  },
];
