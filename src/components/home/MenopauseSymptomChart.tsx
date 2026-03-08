import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Line, ComposedChart, ResponsiveContainer } from 'recharts';

interface WeekData {
  week: string;
  symptoms: number;
  sleepHours: number;
  sleepQuality: number;
  exerciseDays: number;
}

const MenopauseSymptomChart: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const weeks: WeekData[] = [];

      for (let w = 3; w >= 0; w--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - w * 7);

        const startStr = weekStart.toISOString().split('T')[0];
        const endStr = weekEnd.toISOString().split('T')[0];

        // Get daily logs for this week
        const { data: logs } = await supabase
          .from('daily_logs')
          .select('symptoms, notes')
          .eq('user_id', user.id)
          .gte('log_date', startStr)
          .lt('log_date', endStr);

        // Get workouts for this week
        const { data: workouts } = await supabase
          .from('workouts')
          .select('id')
          .eq('user_id', user.id)
          .gte('workout_date', startStr)
          .lt('workout_date', endStr);

        let totalSymptoms = 0;
        let totalSleepH = 0;
        let totalSleepQ = 0;
        let sleepCount = 0;

        logs?.forEach(log => {
          if (log.symptoms) totalSymptoms += log.symptoms.length;
          if (log.notes) {
            try {
              const parsed = JSON.parse(log.notes);
              if (parsed.sleep_hours) {
                totalSleepH += parsed.sleep_hours;
                totalSleepQ += parsed.sleep_quality || 3;
                sleepCount++;
              }
            } catch { /* plain text */ }
          }
        });

        const weekLabel = `${t('menopause.chart_week')} ${4 - w}`;
        weeks.push({
          week: weekLabel,
          symptoms: totalSymptoms,
          sleepHours: sleepCount > 0 ? Math.round(totalSleepH / sleepCount * 10) / 10 : 0,
          sleepQuality: sleepCount > 0 ? Math.round(totalSleepQ / sleepCount * 10) / 10 : 0,
          exerciseDays: workouts?.length || 0,
        });
      }

      setData(weeks);
      setLoading(false);
    };

    load();
  }, [user, t]);

  if (loading || data.length === 0) return null;

  const hasData = data.some(d => d.symptoms > 0 || d.sleepHours > 0 || d.exerciseDays > 0);
  if (!hasData) return null;

  const chartConfig = {
    symptoms: { label: t('menopause.chart_symptoms'), color: 'hsl(var(--destructive))' },
    sleepQuality: { label: t('menopause.chart_sleep'), color: 'hsl(262 80% 60%)' },
    exerciseDays: { label: t('menopause.chart_exercise'), color: 'hsl(152 60% 50%)' },
  };

  // Find correlation insights
  const insight = (() => {
    const highExWeek = data.reduce((a, b) => a.exerciseDays > b.exerciseDays ? a : b);
    const lowSymWeek = data.reduce((a, b) => (a.symptoms < b.symptoms && a.symptoms > 0) ? a : b);
    if (highExWeek === lowSymWeek && highExWeek.exerciseDays > 0) {
      return t('menopause.chart_insight_exercise');
    }
    const highSleepWeek = data.reduce((a, b) => a.sleepQuality > b.sleepQuality ? a : b);
    if (highSleepWeek.symptoms <= lowSymWeek.symptoms && highSleepWeek.sleepQuality > 0) {
      return t('menopause.chart_insight_sleep');
    }
    return t('menopause.chart_insight_default');
  })();

  return (
    <motion.div
      className="glass-card p-5 bg-gradient-to-br from-purple-500/5 to-pink-500/10 border-purple-500/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-purple-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-foreground">{t('menopause.chart_title')}</h3>
          <p className="text-xs text-muted-foreground">{t('menopause.chart_subtitle')}</p>
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-48 w-full">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
          <XAxis dataKey="week" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
          <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="symptoms" fill="var(--color-symptoms)" radius={[4, 4, 0, 0]} barSize={20} />
          <Line type="monotone" dataKey="sleepQuality" stroke="var(--color-sleepQuality)" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="exerciseDays" stroke="var(--color-exerciseDays)" strokeWidth={2} dot={{ r: 4 }} />
        </ComposedChart>
      </ChartContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-destructive" /> {t('menopause.chart_symptoms')}</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: 'hsl(262 80% 60%)' }} /> {t('menopause.chart_sleep')}</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: 'hsl(152 60% 50%)' }} /> {t('menopause.chart_exercise')}</span>
      </div>

      {/* Insight */}
      <div className="mt-3 p-3 bg-card/60 rounded-xl">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">{t('menopause.chart_correlation')}</span>
        </div>
        <p className="text-xs text-muted-foreground">{insight}</p>
      </div>
    </motion.div>
  );
};

export default MenopauseSymptomChart;
