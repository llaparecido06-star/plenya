import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Moon, Flame, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WeekData {
  week: string;
  sleepAvg: number;
  sleepQuality: number;
  hotFlashes: number;
  hotFlashIntensity: number;
  exerciseDays: number;
  exerciseMinutes: number;
}

const MenopauseMonthlyTrends: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadMonthlyData();
  }, [user]);

  const loadMonthlyData = async () => {
    setLoading(true);
    const weeks: WeekData[] = [];

    for (let w = 3; w >= 0; w--) {
      const end = new Date();
      end.setDate(end.getDate() - w * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];

      const weekLabel = `${t('menopause.trends_week')} ${4 - w}`;

      // Fetch all data in parallel
      const [logsRes, flashesRes, workoutsRes] = await Promise.all([
        supabase.from('daily_logs').select('notes').eq('user_id', user!.id).gte('log_date', startStr).lte('log_date', endStr),
        supabase.from('hot_flash_logs').select('intensity').eq('user_id', user!.id).gte('logged_at', `${startStr}T00:00:00`).lte('logged_at', `${endStr}T23:59:59`),
        supabase.from('workouts').select('workout_date, duration_minutes').eq('user_id', user!.id).gte('workout_date', startStr).lte('workout_date', endStr).eq('completed', true),
      ]);

      // Sleep
      let sleepTotal = 0, sleepQTotal = 0, sleepCount = 0;
      (logsRes.data || []).forEach(log => {
        if (log.notes) {
          try {
            const p = JSON.parse(log.notes);
            if (p.sleep_hours) {
              sleepTotal += p.sleep_hours;
              sleepQTotal += (p.sleep_quality || 3);
              sleepCount++;
            }
          } catch { /* plain text */ }
        }
      });

      // Hot flashes
      const intensities = (flashesRes.data || []).map(f => f.intensity);
      const avgIntensity = intensities.length > 0
        ? Math.round(intensities.reduce((a, b) => a + b, 0) / intensities.length * 10) / 10
        : 0;

      // Exercise
      const uniqueDays = new Set((workoutsRes.data || []).map(w => w.workout_date)).size;
      const totalMin = (workoutsRes.data || []).reduce((acc, w) => acc + (w.duration_minutes || 0), 0);

      weeks.push({
        week: weekLabel,
        sleepAvg: sleepCount > 0 ? Math.round(sleepTotal / sleepCount * 10) / 10 : 0,
        sleepQuality: sleepCount > 0 ? Math.round(sleepQTotal / sleepCount * 10) / 10 : 0,
        hotFlashes: intensities.length,
        hotFlashIntensity: avgIntensity,
        exerciseDays: uniqueDays,
        exerciseMinutes: totalMin,
      });
    }

    setWeeklyData(weeks);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="glass-card p-5 animate-pulse">
        <div className="h-6 w-48 bg-muted rounded mb-4" />
        <div className="h-48 bg-muted rounded" />
      </div>
    );
  }

  const chartColors = {
    sleep: 'hsl(var(--primary))',
    quality: 'hsl(250, 60%, 65%)',
    flashes: 'hsl(25, 90%, 55%)',
    intensity: 'hsl(0, 70%, 55%)',
    exercise: 'hsl(145, 60%, 45%)',
    minutes: 'hsl(170, 50%, 50%)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/10 border-violet-500/20"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-violet-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-foreground">{t('menopause.trends_title')}</h3>
          <p className="text-xs text-muted-foreground">{t('menopause.trends_subtitle')}</p>
        </div>
      </div>

      <Tabs defaultValue="sleep" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="sleep" className="text-xs gap-1">
            <Moon className="w-3 h-3" /> {t('menopause.trends_sleep')}
          </TabsTrigger>
          <TabsTrigger value="flashes" className="text-xs gap-1">
            <Flame className="w-3 h-3" /> {t('menopause.trends_flashes')}
          </TabsTrigger>
          <TabsTrigger value="exercise" className="text-xs gap-1">
            <Activity className="w-3 h-3" /> {t('menopause.trends_exercise')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sleep">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="sleepAvg" name={t('menopause.trends_hours')} stroke={chartColors.sleep} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="sleepQuality" name={t('menopause.trends_quality')} stroke={chartColors.quality} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <SummaryRow
            items={[
              { label: t('menopause.trends_best_week'), value: getBestWeek(weeklyData, 'sleepAvg') },
              { label: t('menopause.trends_trend'), value: getTrend(weeklyData, 'sleepAvg') },
            ]}
          />
        </TabsContent>

        <TabsContent value="flashes">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="hotFlashes" name={t('menopause.trends_count')} fill={chartColors.flashes} radius={[4, 4, 0, 0]} />
                <Bar dataKey="hotFlashIntensity" name={t('menopause.trends_intensity')} fill={chartColors.intensity} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <SummaryRow
            items={[
              { label: t('menopause.trends_total'), value: `${weeklyData.reduce((a, w) => a + w.hotFlashes, 0)}x` },
              { label: t('menopause.trends_trend'), value: getTrend(weeklyData, 'hotFlashes', true) },
            ]}
          />
        </TabsContent>

        <TabsContent value="exercise">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="exerciseDays" name={t('menopause.trends_days')} fill={chartColors.exercise} radius={[4, 4, 0, 0]} />
                <Bar dataKey="exerciseMinutes" name={t('menopause.trends_minutes')} fill={chartColors.minutes} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <SummaryRow
            items={[
              { label: t('menopause.trends_total_min'), value: `${weeklyData.reduce((a, w) => a + w.exerciseMinutes, 0)} min` },
              { label: t('menopause.trends_trend'), value: getTrend(weeklyData, 'exerciseDays') },
            ]}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

const SummaryRow: React.FC<{ items: { label: string; value: string }[] }> = ({ items }) => (
  <div className="flex justify-around mt-3 pt-3 border-t border-border/50">
    {items.map((item, i) => (
      <div key={i} className="text-center">
        <p className="text-[10px] text-muted-foreground">{item.label}</p>
        <p className="text-xs font-bold text-foreground">{item.value}</p>
      </div>
    ))}
  </div>
);

function getBestWeek(data: WeekData[], key: keyof WeekData): string {
  if (data.length === 0) return '-';
  const best = data.reduce((prev, curr) => (Number(curr[key]) > Number(prev[key]) ? curr : prev));
  return best.week;
}

function getTrend(data: WeekData[], key: keyof WeekData, lowerIsBetter = false): string {
  if (data.length < 2) return '—';
  const first = Number(data[0][key]);
  const last = Number(data[data.length - 1][key]);
  if (first === 0 && last === 0) return '—';
  const diff = last - first;
  if (Math.abs(diff) < 0.3) return '→ Estável';
  const improving = lowerIsBetter ? diff < 0 : diff > 0;
  return improving ? '↑ Melhorando' : '↓ Atenção';
}

export default MenopauseMonthlyTrends;
