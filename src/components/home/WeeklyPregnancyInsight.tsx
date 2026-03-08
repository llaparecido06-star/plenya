import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Baby, Sparkles, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAIBrain } from '@/hooks/useAIBrain';
import { useLifePhase } from '@/hooks/useLifePhase';

const WeeklyPregnancyInsight: React.FC = () => {
  const { t } = useTranslation();
  const { chat, loading } = useAIBrain();
  const { pregnancyWeeks } = useLifePhase();
  const [insight, setInsight] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const week = pregnancyWeeks ?? 1;
  const cacheKey = `plenya_weekly_insight_w${week}`;

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
    const result = await chat({
      message: `Estou na semana ${week} de gestação. Me dê um resumo curto (máximo 4 frases) sobre: 1) O tamanho e desenvolvimento do bebê nesta semana. 2) Uma dica prática personalizada para eu cuidar de mim nesta semana. Seja carinhosa e objetiva.`,
      history: [],
      life_phase: 'pregnant',
      pregnancy_weeks: week,
      pregnancy_trimester: week <= 12 ? 1 : week <= 27 ? 2 : 3,
    });

    if (result) {
      setInsight(result);
      setHasLoaded(true);
      localStorage.setItem(cacheKey, JSON.stringify({ text: result, date: new Date().toISOString() }));
    }
  };

  // Baby size comparisons by week
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
