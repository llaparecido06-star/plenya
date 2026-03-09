import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Droplets, Activity, Smile } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';

interface WeeklyData {
  week: string;
  weekNum: number;
  bleeding: number | null;
  pain: number | null;
  mood: number | null;
}

const PostpartumEvolutionChart: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: logs } = await supabase
        .from('postpartum_logs')
        .select('log_date, bleeding_level, pain_level, mood')
        .eq('user_id', user.id)
        .order('log_date', { ascending: true });

      if (!logs || logs.length < 2) {
        setLoading(false);
        return;
      }

      // Group by week number relative to first log
      const firstDate = new Date(logs[0].log_date);
      const weekMap = new Map<number, { bleeding: number[]; pain: number[]; mood: number[] }>();

      logs.forEach(log => {
        const daysDiff = Math.floor((new Date(log.log_date).getTime() - firstDate.getTime()) / (86400000));
        const weekNum = Math.floor(daysDiff / 7) + 1;
        if (!weekMap.has(weekNum)) weekMap.set(weekNum, { bleeding: [], pain: [], mood: [] });
        const w = weekMap.get(weekNum)!;
        if (log.bleeding_level != null) w.bleeding.push(log.bleeding_level);
        if (log.pain_level != null) w.pain.push(log.pain_level);
        if (log.mood != null) w.mood.push(log.mood);
      });

      const avg = (arr: number[]) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;

      const chartData: WeeklyData[] = Array.from(weekMap.entries())
        .sort((a, b) => a[0] - b[0])
        .slice(-8) // last 8 weeks
        .map(([weekNum, vals]) => ({
          week: `S${weekNum}`,
          weekNum,
          bleeding: avg(vals.bleeding),
          pain: avg(vals.pain),
          mood: avg(vals.mood),
        }));

      setData(chartData);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="px-4">
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (data.length < 2) return null;

  const bleedingTrend = data[data.length - 1].bleeding !== null && data[0].bleeding !== null
    ? (data[data.length - 1].bleeding! < data[0].bleeding! ? '📉 Diminuindo' : '📈 Estável')
    : null;
  const painTrend = data[data.length - 1].pain !== null && data[0].pain !== null
    ? (data[data.length - 1].pain! < data[0].pain! ? '📉 Melhorando' : '📈 Estável')
    : null;
  const moodTrend = data[data.length - 1].mood !== null && data[0].mood !== null
    ? (data[data.length - 1].mood! > data[0].mood! ? '📈 Melhorando' : '📉 Estável')
    : null;

  const chartConfig = {
    bleeding: { label: t('postpartum.bleeding', 'Sangramento'), color: 'hsl(var(--destructive))' },
    pain: { label: t('postpartum.pain', 'Dor'), color: 'hsl(var(--accent-foreground))' },
    mood: { label: t('postpartum.mood', 'Humor'), color: 'hsl(var(--primary))' },
  };

  return (
    <div className="px-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              {t('postpartum.evolution_title', 'Evolução Pós-Parto')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-3">
                <TabsTrigger value="all" className="text-xs">
                  {t('postpartum.chart_all', 'Geral')}
                </TabsTrigger>
                <TabsTrigger value="bleeding" className="text-xs">
                  <Droplets className="w-3 h-3 mr-1" />
                  {t('postpartum.chart_bleeding', 'Sangr.')}
                </TabsTrigger>
                <TabsTrigger value="pain" className="text-xs">
                  <Activity className="w-3 h-3 mr-1" />
                  {t('postpartum.chart_pain', 'Dor')}
                </TabsTrigger>
                <TabsTrigger value="mood" className="text-xs">
                  <Smile className="w-3 h-3 mr-1" />
                  {t('postpartum.chart_mood', 'Humor')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <ChartContainer config={chartConfig} className="h-48 w-full">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="bleeding" stroke="var(--color-bleeding)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    <Line type="monotone" dataKey="pain" stroke="var(--color-pain)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    <Line type="monotone" dataKey="mood" stroke="var(--color-mood)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  </LineChart>
                </ChartContainer>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {bleedingTrend && (
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">{t('postpartum.bleeding', 'Sangramento')}</p>
                      <p className="text-xs font-medium">{bleedingTrend}</p>
                    </div>
                  )}
                  {painTrend && (
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">{t('postpartum.pain', 'Dor')}</p>
                      <p className="text-xs font-medium">{painTrend}</p>
                    </div>
                  )}
                  {moodTrend && (
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">{t('postpartum.mood', 'Humor')}</p>
                      <p className="text-xs font-medium">{moodTrend}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="bleeding">
                <ChartContainer config={{ bleeding: chartConfig.bleeding }} className="h-48 w-full">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 4]} tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="bleeding" stroke="var(--color-bleeding)" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                  </LineChart>
                </ChartContainer>
              </TabsContent>

              <TabsContent value="pain">
                <ChartContainer config={{ pain: chartConfig.pain }} className="h-48 w-full">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="pain" stroke="var(--color-pain)" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                  </LineChart>
                </ChartContainer>
              </TabsContent>

              <TabsContent value="mood">
                <ChartContainer config={{ mood: chartConfig.mood }} className="h-48 w-full">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 4]} tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="mood" stroke="var(--color-mood)" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                  </LineChart>
                </ChartContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PostpartumEvolutionChart;
