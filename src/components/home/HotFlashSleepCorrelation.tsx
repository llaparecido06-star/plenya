import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Moon, Sparkles, RefreshCw, Wind } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { useAIBrain } from '@/hooks/useAIBrain';
import { Button } from '@/components/ui/button';
import { subDays } from 'date-fns';

interface CorrelationData {
  hotFlashCount: number;
  avgSleepHours: number | null;
  avgSleepQuality: number | null;
  nightFlashPercent: number;
  topTriggers: string[];
}

const HotFlashSleepCorrelation: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { chat, loading: aiLoading } = useAIBrain();
  const [data, setData] = useState<CorrelationData | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;
    analyzeCorrelation();
  }, [user]);

  const analyzeCorrelation = async () => {
    if (!user) return;
    setLoadingData(true);

    const weekAgo = subDays(new Date(), 7).toISOString();

    // Get hot flash logs
    const { data: flashes } = await supabase
      .from('hot_flash_logs')
      .select('logged_at, intensity, trigger')
      .eq('user_id', user.id)
      .gte('logged_at', weekAgo);

    // Get sleep data from daily_logs notes
    const weekAgoDate = subDays(new Date(), 7).toISOString().split('T')[0];
    const { data: sleepLogs } = await supabase
      .from('daily_logs')
      .select('notes')
      .eq('user_id', user.id)
      .gte('log_date', weekAgoDate);

    if (!flashes || flashes.length === 0) {
      setLoadingData(false);
      return;
    }

    // Parse sleep data
    let totalSleepH = 0, totalSleepQ = 0, sleepCount = 0;
    sleepLogs?.forEach(log => {
      try {
        const parsed = JSON.parse(log.notes || '{}');
        if (parsed.sleep_hours) {
          totalSleepH += parsed.sleep_hours;
          totalSleepQ += parsed.sleep_quality || 3;
          sleepCount++;
        }
      } catch { /* ignore */ }
    });

    // Night flashes (22:00-06:00)
    const nightFlashes = flashes.filter(f => {
      const hour = new Date(f.logged_at).getHours();
      return hour >= 22 || hour < 6;
    });

    // Top triggers
    const triggerCounts: Record<string, number> = {};
    flashes.filter(f => f.trigger).forEach(f => {
      triggerCounts[f.trigger!] = (triggerCounts[f.trigger!] || 0) + 1;
    });
    const topTriggers = Object.entries(triggerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t);

    setData({
      hotFlashCount: flashes.length,
      avgSleepHours: sleepCount > 0 ? Math.round((totalSleepH / sleepCount) * 10) / 10 : null,
      avgSleepQuality: sleepCount > 0 ? Math.round((totalSleepQ / sleepCount) * 10) / 10 : null,
      nightFlashPercent: Math.round((nightFlashes.length / flashes.length) * 100),
      topTriggers,
    });

    // Load cached suggestion
    const cached = localStorage.getItem('plenya_hf_sleep_suggestion');
    if (cached) {
      try {
        const { text, date } = JSON.parse(cached);
        if ((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24) < 1) {
          setSuggestion(text);
        }
      } catch { /* ignore */ }
    }

    setLoadingData(false);
  };

  const generateSuggestion = async () => {
    if (!data) return;

    const triggersText = data.topTriggers.length > 0 
      ? data.topTriggers.map(t => t).join(', ')
      : 'não identificados';

    const result = await chat({
      message: `Sou uma mulher na menopausa. Esta semana tive ${data.hotFlashCount} episódios de ondas de calor, ${data.nightFlashPercent}% deles à noite. ${data.avgSleepHours ? `Durmo em média ${data.avgSleepHours}h.` : ''} Gatilhos principais: ${triggersText}. Me dê: 1) Uma sugestão de receita refrescante para o jantar do Chef IA. 2) Uma técnica de respiração para resfriamento corporal. 3) Uma dica para melhorar o sono. Máximo 4 frases, tom carinhoso.`,
      history: [],
      life_phase: 'menopause',
    });

    if (result) {
      setSuggestion(result);
      localStorage.setItem('plenya_hf_sleep_suggestion', JSON.stringify({ text: result, date: new Date().toISOString() }));
    }
  };

  if (loadingData || !data || data.hotFlashCount === 0) return null;

  const sleepQualityEmoji = data.avgSleepQuality 
    ? ['😫', '😟', '😐', '🙂', '😴'][Math.round(data.avgSleepQuality) - 1] || '😐'
    : '❓';

  return (
    <motion.div
      className="mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="glass-card p-5 bg-gradient-to-br from-orange-500/5 to-indigo-500/10 border-orange-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-indigo-500/20 flex items-center justify-center">
            <div className="relative">
              <Flame className="w-5 h-5 text-orange-500" />
              <Moon className="w-3 h-3 text-indigo-500 absolute -bottom-1 -right-1" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-foreground">
              {t('menopause.hf_sleep_title', 'Fogachos × Sono')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('menopause.hf_sleep_subtitle', 'Correlação da última semana')}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-card/50 rounded-xl p-2.5 text-center">
            <p className="text-xl font-bold text-orange-500">🔥 {data.hotFlashCount}</p>
            <p className="text-[10px] text-muted-foreground">Episódios</p>
          </div>
          <div className="bg-card/50 rounded-xl p-2.5 text-center">
            <p className="text-xl font-bold text-indigo-500">🌙 {data.nightFlashPercent}%</p>
            <p className="text-[10px] text-muted-foreground">Noturnos</p>
          </div>
          <div className="bg-card/50 rounded-xl p-2.5 text-center">
            <p className="text-xl">{sleepQualityEmoji}</p>
            <p className="text-[10px] text-muted-foreground">
              {data.avgSleepHours ? `${data.avgSleepHours}h/noite` : 'Sem dados'}
            </p>
          </div>
        </div>

        {/* Insight */}
        {data.nightFlashPercent >= 30 && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-3">
            <p className="text-xs text-foreground">
              <span className="font-semibold">💡</span> {data.nightFlashPercent}% dos seus fogachos ocorrem à noite, o que pode estar impactando seu sono.
              {data.topTriggers.includes('caffeine') && ' Considere reduzir cafeína após 14h.'}
              {data.topTriggers.includes('alcohol') && ' O álcool pode intensificar os episódios noturnos.'}
            </p>
          </div>
        )}

        {/* AI Suggestion */}
        {suggestion ? (
          <div className="p-3 rounded-xl bg-leaf-green/10 border border-leaf-green/20">
            <div className="flex items-start gap-2">
              <Wind className="w-4 h-4 text-leaf-green shrink-0 mt-0.5" />
              <p className="text-sm text-foreground leading-relaxed">{suggestion}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={generateSuggestion}
              disabled={aiLoading}
              className="mt-2 text-xs text-muted-foreground"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${aiLoading ? 'animate-spin' : ''}`} />
              Nova sugestão
            </Button>
          </div>
        ) : (
          <Button
            onClick={generateSuggestion}
            disabled={aiLoading}
            variant="outline"
            className="w-full border-leaf-green/30 text-leaf-green hover:bg-leaf-green/10"
          >
            {aiLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {aiLoading ? t('actions.loading') : t('menopause.hf_sleep_get_tip', 'Sugestão de resfriamento + sono')}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default HotFlashSleepCorrelation;
