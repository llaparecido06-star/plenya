import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Heart, TrendingUp, TrendingDown, Minus, Moon, Baby, Droplets, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLifePhase } from '@/hooks/useLifePhase';
import { format, subDays } from 'date-fns';

interface PostpartumWeeklyStats {
  avgMood: number | null;
  avgPainLevel: number | null;
  avgBleedingLevel: number | null;
  avgSleepHours: number | null;
  feedings: number;
  daysLogged: number;
  moodTrend: 'up' | 'down' | 'stable';
  periodReturned: boolean;
}

const PostpartumWeeklySummaryCard: React.FC = () => {
  const { user } = useAuth();
  const { postpartumWeeks } = useLifePhase();
  const [stats, setStats] = useState<PostpartumWeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchData = async () => {
      try {
        const today = new Date();
        const weekAgo = subDays(today, 7);
        const twoWeeksAgo = subDays(today, 14);
        const todayStr = format(today, 'yyyy-MM-dd');
        const weekAgoStr = format(weekAgo, 'yyyy-MM-dd');
        const twoWeeksAgoStr = format(twoWeeksAgo, 'yyyy-MM-dd');

        const [postpartumRes, feedingRes, prevPostpartumRes] = await Promise.all([
          supabase.from('postpartum_logs').select('mood, pain_level, bleeding_level, sleep_hours, first_period_returned, log_date')
            .eq('user_id', user.id).gte('log_date', weekAgoStr).lte('log_date', todayStr),
          supabase.from('breastfeeding_logs').select('id')
            .eq('user_id', user.id).gte('log_date', weekAgoStr).lte('log_date', todayStr),
          supabase.from('postpartum_logs').select('mood')
            .eq('user_id', user.id).gte('log_date', twoWeeksAgoStr).lt('log_date', weekAgoStr),
        ]);

        const entries = postpartumRes.data || [];
        const prevEntries = prevPostpartumRes.data || [];

        const moods = entries.filter(e => e.mood != null).map(e => e.mood!);
        const pains = entries.filter(e => e.pain_level != null).map(e => e.pain_level!);
        const bleedings = entries.filter(e => e.bleeding_level != null).map(e => e.bleeding_level!);
        const sleepHrs = entries.filter(e => e.sleep_hours != null).map(e => Number(e.sleep_hours));

        const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

        const avgMood = avg(moods);
        const prevMoods = prevEntries.filter(e => e.mood != null).map(e => e.mood!);
        const prevAvgMood = avg(prevMoods);
        const moodTrend: 'up' | 'down' | 'stable' = !avgMood || !prevAvgMood ? 'stable'
          : avgMood > prevAvgMood + 0.5 ? 'up' : avgMood < prevAvgMood - 0.5 ? 'down' : 'stable';

        setStats({
          avgMood,
          avgPainLevel: avg(pains),
          avgBleedingLevel: avg(bleedings),
          avgSleepHours: avg(sleepHrs),
          feedings: feedingRes.data?.length || 0,
          daysLogged: entries.length,
          moodTrend,
          periodReturned: entries.some(e => e.first_period_returned),
        });
      } catch (e) {
        console.error('Error fetching postpartum weekly stats:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const getMoodEmoji = (mood: number) =>
    mood >= 4.5 ? '🤩' : mood >= 3.5 ? '😊' : mood >= 2.5 ? '😐' : mood >= 1.5 ? '😔' : '😢';

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) =>
    trend === 'up' ? <TrendingUp className="w-3.5 h-3.5 text-green-500" />
    : trend === 'down' ? <TrendingDown className="w-3.5 h-3.5 text-red-500" />
    : <Minus className="w-3.5 h-3.5 text-muted-foreground" />;

  const getPainLabel = (level: number) => level >= 4 ? 'Intensa' : level >= 2.5 ? 'Moderada' : 'Leve';
  const getBleedingLabel = (level: number) => level >= 4 ? 'Intenso' : level >= 2.5 ? 'Moderado' : 'Leve';

  if (loading) {
    return (
      <Card className="glass-card animate-pulse mx-4">
        <CardHeader className="pb-2"><div className="h-5 bg-muted rounded w-40" /></CardHeader>
        <CardContent><div className="h-24 bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  if (!stats || stats.daysLogged === 0) {
    return (
      <Card className="glass-card mx-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-4 h-4 text-sky-500" />
            Resumo Pós-Parto Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum registro esta semana.<br />
            <span className="text-xs">Registre sua recuperação para ver insights!</span>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-4">
      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-sky-500" />
              Resumo Pós-Parto
              {postpartumWeeks != null && (
                <span className="text-xs font-normal text-muted-foreground">• {postpartumWeeks}ª semana</span>
              )}
            </span>
            <span className="text-xs font-normal text-muted-foreground">{stats.daysLogged}/7 dias</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Mood */}
            <div className="text-center p-3 rounded-lg bg-sky-50 dark:bg-sky-900/20">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <TrendIcon trend={stats.moodTrend} />
              </div>
              <p className="text-2xl">{stats.avgMood ? getMoodEmoji(stats.avgMood) : '—'}</p>
              <p className="text-xs font-semibold text-foreground">Humor</p>
              {stats.avgMood && <p className="text-xs text-muted-foreground">{stats.avgMood.toFixed(1)}/5</p>}
            </div>

            {/* Sleep */}
            <div className="text-center p-3 rounded-lg bg-sky-50 dark:bg-sky-900/20">
              <Moon className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">
                {stats.avgSleepHours ? `${stats.avgSleepHours.toFixed(1)}h` : '—'}
              </p>
              <p className="text-xs font-semibold text-foreground">Sono/dia</p>
              {stats.avgSleepHours != null && (
                <p className={`text-xs ${stats.avgSleepHours < 5 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {stats.avgSleepHours < 5 ? 'Abaixo do ideal' : 'Ok'}
                </p>
              )}
            </div>
          </div>

          {/* Recovery indicators */}
          <div className="space-y-2">
            {stats.avgPainLevel != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dor</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{getPainLabel(stats.avgPainLevel)}</span>
                  <Progress value={(stats.avgPainLevel / 5) * 100} className="w-16 h-1.5" />
                </div>
              </div>
            )}
            {stats.avgBleedingLevel != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1"><Droplets className="w-3.5 h-3.5" />Sangramento</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{getBleedingLabel(stats.avgBleedingLevel)}</span>
                  <Progress value={(stats.avgBleedingLevel / 5) * 100} className="w-16 h-1.5" />
                </div>
              </div>
            )}
          </div>

          {/* Activity row */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Baby className="w-3.5 h-3.5" />
              <span>{stats.feedings} amamentações</span>
            </div>
            {stats.periodReturned && (
              <div className="flex items-center gap-1.5 text-primary">
                <Activity className="w-3.5 h-3.5" />
                <span className="font-medium">Ciclo retornou</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PostpartumWeeklySummaryCard;
