import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Baby, Weight, Heart, TrendingUp, TrendingDown, Minus, Footprints, Stethoscope } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLifePhase } from '@/hooks/useLifePhase';
import { format, subDays } from 'date-fns';

interface PregnancyWeeklyStats {
  avgMood: number | null;
  avgWeight: number | null;
  weightChange: number | null;
  symptomsCount: number;
  topSymptoms: { symptom: string; count: number }[];
  diaryEntries: number;
  kickSessions: number;
  totalKicks: number;
  appointmentsCompleted: number;
  daysLogged: number;
  moodTrend: 'up' | 'down' | 'stable';
}

const PregnancyWeeklySummaryCard: React.FC = () => {
  const { user } = useAuth();
  const { pregnancyWeeks } = useLifePhase();
  const [stats, setStats] = useState<PregnancyWeeklyStats | null>(null);
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

        const [diaryRes, kicksRes, apptRes, prevDiaryRes] = await Promise.all([
          supabase.from('pregnancy_diary').select('mood, weight, symptoms, entry_date')
            .eq('user_id', user.id).gte('entry_date', weekAgoStr).lte('entry_date', todayStr),
          supabase.from('kick_logs').select('kick_count, log_date')
            .eq('user_id', user.id).gte('log_date', weekAgoStr).lte('log_date', todayStr),
          supabase.from('pregnancy_appointments').select('id')
            .eq('user_id', user.id).eq('is_completed', true)
            .gte('completed_at', weekAgo.toISOString()),
          supabase.from('pregnancy_diary').select('mood')
            .eq('user_id', user.id).gte('entry_date', twoWeeksAgoStr).lt('entry_date', weekAgoStr),
        ]);

        const entries = diaryRes.data || [];
        const kicks = kicksRes.data || [];
        const prevEntries = prevDiaryRes.data || [];

        const moods = entries.filter(e => e.mood != null).map(e => e.mood!);
        const weights = entries.filter(e => e.weight != null).map(e => Number(e.weight));
        const avgMood = moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : null;
        const avgWeight = weights.length > 0 ? weights[weights.length - 1] : null;
        const weightChange = weights.length >= 2 ? weights[weights.length - 1] - weights[0] : null;

        const prevMoods = prevEntries.filter(e => e.mood != null).map(e => e.mood!);
        const prevAvgMood = prevMoods.length > 0 ? prevMoods.reduce((a, b) => a + b, 0) / prevMoods.length : null;
        const moodTrend: 'up' | 'down' | 'stable' = !avgMood || !prevAvgMood ? 'stable'
          : avgMood > prevAvgMood + 0.5 ? 'up' : avgMood < prevAvgMood - 0.5 ? 'down' : 'stable';

        const symptomCounts: Record<string, number> = {};
        entries.forEach(e => (e.symptoms || []).forEach((s: string) => {
          symptomCounts[s] = (symptomCounts[s] || 0) + 1;
        }));
        const topSymptoms = Object.entries(symptomCounts)
          .map(([symptom, count]) => ({ symptom, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        setStats({
          avgMood,
          avgWeight,
          weightChange,
          symptomsCount: Object.keys(symptomCounts).length,
          topSymptoms,
          diaryEntries: entries.length,
          kickSessions: kicks.length,
          totalKicks: kicks.reduce((sum, k) => sum + (k.kick_count || 0), 0),
          appointmentsCompleted: apptRes.data?.length || 0,
          daysLogged: entries.length,
          moodTrend,
        });
      } catch (e) {
        console.error('Error fetching pregnancy weekly stats:', e);
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
            <Baby className="w-4 h-4 text-violet-500" />
            Resumo da Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum registro esta semana.<br />
            <span className="text-xs">Registre seu diário de gravidez para ver insights!</span>
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
              <Baby className="w-4 h-4 text-violet-500" />
              Resumo da Semana
              {pregnancyWeeks != null && (
                <span className="text-xs font-normal text-muted-foreground">• {pregnancyWeeks}ª semana</span>
              )}
            </span>
            <span className="text-xs font-normal text-muted-foreground">{stats.daysLogged}/7 dias</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <TrendIcon trend={stats.moodTrend} />
              </div>
              <p className="text-2xl">{stats.avgMood ? getMoodEmoji(stats.avgMood) : '—'}</p>
              <p className="text-xs font-semibold text-foreground">Humor</p>
              {stats.avgMood && <p className="text-xs text-muted-foreground">{stats.avgMood.toFixed(1)}/5</p>}
            </div>

            <div className="text-center p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20">
              <Weight className="w-4 h-4 text-violet-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{stats.avgWeight ? `${stats.avgWeight.toFixed(1)}kg` : '—'}</p>
              <p className="text-xs font-semibold text-foreground">Peso</p>
              {stats.weightChange != null && (
                <p className={`text-xs ${stats.weightChange > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                  {stats.weightChange > 0 ? '+' : ''}{stats.weightChange.toFixed(1)}kg
                </p>
              )}
            </div>

            <div className="text-center p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20">
              <Footprints className="w-4 h-4 text-pink-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{stats.totalKicks || '—'}</p>
              <p className="text-xs font-semibold text-foreground">Chutes</p>
              {stats.kickSessions > 0 && (
                <p className="text-xs text-muted-foreground">{stats.kickSessions} sessões</p>
              )}
            </div>
          </div>

          {/* Activity row */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>{stats.appointmentsCompleted} consulta{stats.appointmentsCompleted !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>{stats.diaryEntries} diário{stats.diaryEntries !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Top symptoms */}
          {stats.topSymptoms.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Sintomas da Semana</p>
              <div className="space-y-1.5">
                {stats.topSymptoms.map(({ symptom, count }) => (
                  <div key={symptom} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 text-foreground">{symptom}</span>
                    <span className="text-xs font-semibold text-violet-600 bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 rounded-full">{count}x</span>
                    <Progress value={(count / stats.daysLogged) * 100} className="w-14 h-1.5" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PregnancyWeeklySummaryCard;
