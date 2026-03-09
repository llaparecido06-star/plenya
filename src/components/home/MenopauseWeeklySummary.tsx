import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Sparkles, TrendingUp, TrendingDown, Minus, Moon, Flame, Activity, Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAIBrain } from '@/hooks/useAIBrain';

interface WeeklyData {
  sleepAvg: number | null;
  sleepQualityAvg: number | null;
  hotFlashCount: number;
  hotFlashAvgIntensity: number | null;
  symptomCount: number;
  topSymptoms: string[];
  exerciseDays: number;
  weightChange: number | null;
  moodAvg: number | null;
  wellnessScore: number;
}

const MenopauseWeeklySummary: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { chat, loading: aiLoading } = useAIBrain();
  const [data, setData] = useState<WeeklyData | null>(null);
  const [prevData, setPrevData] = useState<WeeklyData | null>(null);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadWeeklyData();
  }, [user]);

  const getDateRange = (weeksAgo: number) => {
    const end = new Date();
    end.setDate(end.getDate() - weeksAgo * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  const computeWeekData = async (startDate: string, endDate: string): Promise<WeeklyData> => {
    // Sleep data from daily_logs notes
    const { data: logs } = await supabase
      .from('daily_logs')
      .select('notes, mood, symptoms')
      .eq('user_id', user!.id)
      .gte('log_date', startDate)
      .lte('log_date', endDate);

    let sleepTotal = 0, sleepQTotal = 0, sleepCount = 0;
    let moodTotal = 0, moodCount = 0;
    const symptomMap: Record<string, number> = {};

    (logs || []).forEach(log => {
      if (log.mood) { moodTotal += log.mood; moodCount++; }
      (log.symptoms || []).forEach((s: string) => { symptomMap[s] = (symptomMap[s] || 0) + 1; });
      if (log.notes) {
        try {
          const p = JSON.parse(log.notes);
          if (p.sleep_hours) { sleepTotal += p.sleep_hours; sleepQTotal += (p.sleep_quality || 3); sleepCount++; }
        } catch { /* plain text */ }
      }
    });

    // Hot flashes
    const { data: flashes } = await supabase
      .from('hot_flash_logs')
      .select('intensity')
      .eq('user_id', user!.id)
      .gte('logged_at', `${startDate}T00:00:00`)
      .lte('logged_at', `${endDate}T23:59:59`);

    const flashIntensities = (flashes || []).map(f => f.intensity);
    const avgIntensity = flashIntensities.length > 0
      ? Math.round(flashIntensities.reduce((a, b) => a + b, 0) / flashIntensities.length * 10) / 10
      : null;

    // Workouts
    const { data: workouts } = await supabase
      .from('workouts')
      .select('workout_date')
      .eq('user_id', user!.id)
      .gte('workout_date', startDate)
      .lte('workout_date', endDate)
      .eq('completed', true);

    const exerciseDays = new Set((workouts || []).map(w => w.workout_date)).size;

    // Weight from menopause_diary
    const { data: diary } = await supabase
      .from('menopause_diary')
      .select('weight, entry_date')
      .eq('user_id', user!.id)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate)
      .not('weight', 'is', null)
      .order('entry_date', { ascending: true });

    let weightChange: number | null = null;
    if (diary && diary.length >= 2) {
      weightChange = Math.round(((diary[diary.length - 1].weight as number) - (diary[0].weight as number)) * 10) / 10;
    }

    const topSymptoms = Object.entries(symptomMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([s]) => s);

    // Wellness score (0-100)
    let score = 50;
    if (sleepCount > 0) {
      const avgSleep = sleepTotal / sleepCount;
      if (avgSleep >= 7) score += 10;
      else if (avgSleep < 5) score -= 10;
      const avgQ = sleepQTotal / sleepCount;
      score += (avgQ - 3) * 5;
    }
    if (flashIntensities.length <= 3) score += 10;
    else if (flashIntensities.length > 10) score -= 10;
    if (exerciseDays >= 3) score += 10;
    else if (exerciseDays === 0) score -= 5;
    if (moodCount > 0 && moodTotal / moodCount >= 4) score += 5;
    score = Math.max(0, Math.min(100, Math.round(score)));

    return {
      sleepAvg: sleepCount > 0 ? Math.round(sleepTotal / sleepCount * 10) / 10 : null,
      sleepQualityAvg: sleepCount > 0 ? Math.round(sleepQTotal / sleepCount * 10) / 10 : null,
      hotFlashCount: flashIntensities.length,
      hotFlashAvgIntensity: avgIntensity,
      symptomCount: Object.values(symptomMap).reduce((a, b) => a + b, 0),
      topSymptoms,
      exerciseDays,
      weightChange,
      moodAvg: moodCount > 0 ? Math.round(moodTotal / moodCount * 10) / 10 : null,
      wellnessScore: score,
    };
  };

  const loadWeeklyData = async () => {
    setLoading(true);
    const thisWeek = getDateRange(0);
    const lastWeek = getDateRange(1);

    const [current, previous] = await Promise.all([
      computeWeekData(thisWeek.start, thisWeek.end),
      computeWeekData(lastWeek.start, lastWeek.end),
    ]);

    setData(current);
    setPrevData(previous);
    setLoading(false);

    // Load cached tip
    const cached = localStorage.getItem('menopause_weekly_tip');
    if (cached) {
      try {
        const { tip, date } = JSON.parse(cached);
        const daysDiff = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff < 7) setAiTip(tip);
      } catch { /* ignore */ }
    }
  };

  const generateAITip = async () => {
    if (!data) return;
    const summary = `Sleep: ${data.sleepAvg || 'N/A'}h avg, quality ${data.sleepQualityAvg || 'N/A'}/5. Hot flashes: ${data.hotFlashCount} this week, avg intensity ${data.hotFlashAvgIntensity || 'N/A'}/5. Exercise: ${data.exerciseDays} days. Wellness score: ${data.wellnessScore}/100. Top symptoms: ${data.topSymptoms.join(', ') || 'none'}.`;

    const result = await chat({
      message: `Based on this menopause weekly data, give 2-3 short personalized wellness tips (max 150 words total). Be warm and encouraging. Data: ${summary}`,
      history: [],
      life_phase: 'menopause',
    });

    if (result) {
      setAiTip(result);
      localStorage.setItem('menopause_weekly_tip', JSON.stringify({ tip: result, date: new Date().toISOString() }));
    }
  };

  const TrendIcon = ({ current, previous }: { current: number | null; previous: number | null }) => {
    if (current === null || previous === null) return <Minus className="w-3 h-3 text-muted-foreground" />;
    if (current > previous + 0.3) return <TrendingUp className="w-3 h-3 text-green-500" />;
    if (current < previous - 0.3) return <TrendingDown className="w-3 h-3 text-red-500" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return '🌟';
    if (score >= 60) return '😊';
    if (score >= 40) return '😐';
    return '😟';
  };

  if (loading) {
    return (
      <div className="glass-card p-5 animate-pulse">
        <div className="h-6 w-48 bg-muted rounded mb-4" />
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 bg-gradient-to-br from-purple-500/5 to-pink-500/10 border-purple-500/20"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-purple-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-foreground">{t('menopause.weekly_title')}</h3>
          <p className="text-xs text-muted-foreground">{t('menopause.weekly_subtitle')}</p>
        </div>
      </div>

      {/* Wellness Score */}
      <div className="p-4 rounded-2xl bg-card/50 mb-4 text-center">
        <p className="text-xs text-muted-foreground mb-1">{t('menopause.weekly_score')}</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-3xl">{getScoreEmoji(data.wellnessScore)}</span>
          <span className={`text-4xl font-bold ${getScoreColor(data.wellnessScore)}`}>
            {data.wellnessScore}
          </span>
          <span className="text-lg text-muted-foreground">/100</span>
        </div>
        <Progress value={data.wellnessScore} className="mt-2 h-2" />
        {prevData && (
          <p className="text-xs text-muted-foreground mt-1">
            {data.wellnessScore > prevData.wellnessScore
              ? `↑ +${data.wellnessScore - prevData.wellnessScore} ${t('menopause.weekly_vs_last')}`
              : data.wellnessScore < prevData.wellnessScore
                ? `↓ ${data.wellnessScore - prevData.wellnessScore} ${t('menopause.weekly_vs_last')}`
                : `= ${t('menopause.weekly_stable')}`}
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-3 rounded-xl bg-card/50">
          <div className="flex items-center gap-1 mb-1">
            <Moon className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-[10px] text-muted-foreground">{t('menopause.weekly_sleep')}</span>
            <TrendIcon current={data.sleepAvg} previous={prevData?.sleepAvg ?? null} />
          </div>
          <p className="text-lg font-bold text-foreground">
            {data.sleepAvg ? `${data.sleepAvg}h` : '-'}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-card/50">
          <div className="flex items-center gap-1 mb-1">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] text-muted-foreground">{t('menopause.weekly_flashes')}</span>
          </div>
          <p className="text-lg font-bold text-foreground">{data.hotFlashCount}x</p>
        </div>

        <div className="p-3 rounded-xl bg-card/50">
          <div className="flex items-center gap-1 mb-1">
            <Activity className="w-3.5 h-3.5 text-green-500" />
            <span className="text-[10px] text-muted-foreground">{t('menopause.weekly_exercise')}</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {data.exerciseDays} {t('menopause.weekly_days')}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-card/50">
          <div className="flex items-center gap-1 mb-1">
            <Brain className="w-3.5 h-3.5 text-pink-500" />
            <span className="text-[10px] text-muted-foreground">{t('menopause.weekly_mood')}</span>
            <TrendIcon current={data.moodAvg} previous={prevData?.moodAvg ?? null} />
          </div>
          <p className="text-lg font-bold text-foreground">
            {data.moodAvg ? `${data.moodAvg}/5` : '-'}
          </p>
        </div>
      </div>

      {/* Top Symptoms */}
      {data.topSymptoms.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">{t('menopause.weekly_top_symptoms')}</p>
          <div className="flex flex-wrap gap-1">
            {data.topSymptoms.map(s => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Tip */}
      {aiTip ? (
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 mb-3">
          <div className="flex items-center gap-1 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-xs font-medium text-foreground">{t('menopause.weekly_ai_tip')}</span>
          </div>
          <p className="text-xs text-muted-foreground whitespace-pre-line">{aiTip}</p>
        </div>
      ) : null}

      <Button
        variant="outline"
        size="sm"
        className="w-full border-purple-500/30 text-purple-600 hover:bg-purple-500/10"
        onClick={generateAITip}
        disabled={aiLoading}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {aiLoading ? t('actions.loading') : aiTip ? t('menopause.weekly_refresh_tip') : t('menopause.weekly_get_tip')}
      </Button>
    </motion.div>
  );
};

export default MenopauseWeeklySummary;
