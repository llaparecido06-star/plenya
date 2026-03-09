import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Baby, Sparkles, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAIBrain } from '@/hooks/useAIBrain';
import { useLifePhase } from '@/hooks/useLifePhase';
import { useDailyLog } from '@/hooks/useDailyLog';

// Baby development milestones by week for synchronized insights
const weekMilestones: Record<number, string> = {
  4: 'Implantação no útero',
  5: 'Coração começa a bater',
  6: 'Formação do tubo neural',
  7: 'Braços e pernas em formação',
  8: 'Dedos começam a se formar',
  9: 'Formação dos órgãos principais',
  10: 'Fase embrionária completa',
  11: 'Ossificação começa',
  12: 'Reflexos aparecem',
  13: 'Impressões digitais formam-se',
  14: 'Expressões faciais surgem',
  15: 'Pode ouvir sons',
  16: 'Movimentos ficam mais fortes',
  17: 'Gordura começa a se formar',
  18: 'Sistema nervoso amadurece',
  19: 'Sentidos se desenvolvem',
  20: 'Marco da metade! Vernix aparece',
  21: 'Movimentos coordenados',
  22: 'Pulmões em desenvolvimento',
  23: 'Pele fica mais opaca',
  24: 'Viabilidade fetal',
  25: 'Responde à luz',
  26: 'Olhos se abrem',
  27: 'Cérebro cresce rapidamente',
  28: 'Sonha durante o sono',
  29: 'Músculos e pulmões amadurecem',
  30: 'Ganha peso rapidamente',
  31: 'Todos os sentidos ativos',
  32: 'Unhas formadas',
  33: 'Ossos endurecem',
  34: 'Sistema imunológico fortalece',
  35: 'Rins totalmente maduros',
  36: 'Encaixe pode ocorrer',
  37: 'Considerado a termo precoce',
  38: 'Pronto para nascer',
  39: 'A termo completo',
  40: 'Data prevista do parto',
};

const WeeklyPregnancyInsight: React.FC = () => {
  const { t } = useTranslation();
  const { chat, loading } = useAIBrain();
  const { pregnancyWeeks } = useLifePhase();
  const { mood, energy } = useDailyLog();
  const [insight, setInsight] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const week = pregnancyWeeks ?? 1;
  const cacheKey = `plenya_weekly_insight_w${week}`;
  const milestone = weekMilestones[week] || weekMilestones[Math.min(week, 40)] || '';
  const trimester = week <= 12 ? 1 : week <= 27 ? 2 : 3;

  useEffect(() => {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { text, date } = JSON.parse(cached);
        const daysSince = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 7) {
          setInsight(text);
          setHasLoaded(true);
          return;
        }
      } catch { /* ignore */ }
    }
  }, [cacheKey]);

  const generateInsight = async () => {
    const moodContext = mood ? `Meu humor hoje está ${mood}/5.` : '';
    const energyContext = energy ? `Minha energia está ${energy}/5.` : '';
    const symptomReassurance = trimester === 1 
      ? 'Se eu tiver náuseas ou cansaço, me tranquilize que é normal no 1º trimestre.'
      : trimester === 3
        ? 'Se eu tiver inchaço ou dor lombar, me tranquilize que são comuns no 3º trimestre.'
        : '';

    const result = await chat({
      message: `Estou na semana ${week} de gestação (${trimester}º trimestre). Marco do bebê: "${milestone}". ${moodContext} ${energyContext} ${symptomReassurance} Me dê um resumo curto (máximo 4 frases) sobre: 1) O desenvolvimento do bebê nesta semana conectado ao marco. 2) Uma dica prática personalizada baseada no meu estado emocional. Seja carinhosa e tranquilizadora.`,
      history: [],
      life_phase: 'pregnant',
      pregnancy_weeks: week,
      pregnancy_trimester: trimester,
    });

    if (result) {
      setInsight(result);
      setHasLoaded(true);
      localStorage.setItem(cacheKey, JSON.stringify({ text: result, date: new Date().toISOString() }));
    }
  };

  const getBabySize = (w: number): string => {
    if (w <= 4) return '🫐';
    if (w <= 8) return '🫐';
    if (w <= 12) return '🍋';
    if (w <= 16) return '🍎';
    if (w <= 20) return '🍌';
    if (w <= 24) return '🌽';
    if (w <= 28) return '🥥';
    if (w <= 32) return '🍍';
    if (w <= 36) return '🍈';
    return '🍉';
  };

  return (
    <motion.div
      className="mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="glass-card p-5 bg-gradient-to-br from-pink-500/5 to-purple-500/10 border-pink-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center text-2xl">
            {getBabySize(week)}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground">
              {t('pregnancy.wi_title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('pregnancy.wi_week', { week })}
            </p>
          </div>
          {hasLoaded && (
            <Button
              variant="ghost"
              size="icon"
              onClick={generateInsight}
              disabled={loading}
              className="shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>

        {/* Baby milestone badge */}
        {milestone && (
          <div className="mb-3 px-3 py-2 bg-pink-500/10 rounded-lg">
            <p className="text-xs font-medium text-pink-600">
              🎯 Semana {week}: {milestone}
            </p>
          </div>
        )}

        {insight ? (
          <div className="p-4 bg-card/50 rounded-xl">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{insight}</p>
          </div>
        ) : (
          <Button
            onClick={generateInsight}
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {loading ? t('actions.loading') : t('pregnancy.wi_generate')}
          </Button>
        )}

        <p className="text-xs text-muted-foreground text-center mt-3">
          ✨ {t('pregnancy.wi_disclaimer')}
        </p>
      </div>
    </motion.div>
  );
};

export default WeeklyPregnancyInsight;
