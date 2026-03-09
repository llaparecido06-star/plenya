import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useCycleSymptomMap } from '@/hooks/useCycleSymptomMap';
import { useCycle } from '@/contexts/CycleContext';

const chartConfig = {
  mood: { label: 'Humor', color: 'hsl(var(--primary))' },
  energy: { label: 'Energia', color: 'hsl(142 76% 36%)' },
  stress: { label: 'Estresse', color: 'hsl(0 84% 60%)' },
};

const phaseZones = [
  { name: 'Menstrual', start: 1, end: 5, color: 'hsl(0 70% 50% / 0.08)' },
  { name: 'Folicular', start: 6, end: 13, color: 'hsl(142 50% 50% / 0.08)' },
  { name: 'Ovulatória', start: 14, end: 16, color: 'hsl(45 90% 50% / 0.08)' },
  { name: 'Lútea', start: 17, end: 28, color: 'hsl(270 50% 50% / 0.08)' },
];

const symptomTranslations: Record<string, string> = {
  cramps: 'Cólicas', headache: 'Dor de cabeça', bloating: 'Inchaço',
  fatigue: 'Fadiga', nausea: 'Náusea', acne: 'Acne',
  breast_tenderness: 'Sensibilidade nos seios', insomnia: 'Insônia',
  anxiety: 'Ansiedade', irritability: 'Irritabilidade',
  back_pain: 'Dor nas costas', mood_swings: 'Oscilação de humor',
};

const CycleSymptomMap: React.FC = () => {
  const { aggregatedByDay, topSymptoms, loading, cycleLength } = useCycleSymptomMap(3);
  const { cycleDay } = useCycle();
  const [activeMetric, setActiveMetric] = useState<'all' | 'mood' | 'energy' | 'stress'>('all');

  const hasData = aggregatedByDay.some(d => d.dataPoints > 0);

  if (loading) {
    return (
      <div className="px-4">
        <Card className="animate-pulse">
          <CardHeader className="pb-2">
            <div className="h-5 w-40 bg-muted rounded" />
          </CardHeader>
          <CardContent><div className="h-48 bg-muted rounded" /></CardContent>
        </Card>
      </div>
    );
  }

  if (!hasData) return null;

  const chartData = aggregatedByDay.map(d => ({
    day: d.day,
    mood: d.mood,
    energy: d.energy,
    stress: d.stress,
    isToday: d.day === cycleDay,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="px-4"
    >
      <Card className="overflow-hidden border-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
            Mapa de Sintomas
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Padrões médios dos últimos 3 ciclos · Dia {cycleDay}/{cycleLength}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Metric tabs */}
          <Tabs value={activeMetric} onValueChange={(v) => setActiveMetric(v as any)}>
            <TabsList className="grid grid-cols-4 h-8">
              <TabsTrigger value="all" className="text-xs px-2">Todos</TabsTrigger>
              <TabsTrigger value="mood" className="text-xs px-2">😊 Humor</TabsTrigger>
              <TabsTrigger value="energy" className="text-xs px-2">⚡ Energia</TabsTrigger>
              <TabsTrigger value="stress" className="text-xs px-2">😰 Estresse</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Chart */}
          <ChartContainer config={chartConfig} className="h-48 w-full">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(0 84% 60%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                domain={[0, 5]}
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                ticks={[1, 2, 3, 4, 5]}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(v) => `Dia ${v}`}
                  />
                }
              />

              {/* Current day marker */}
              {cycleDay <= cycleLength && (
                <CartesianGrid
                  horizontalPoints={[]}
                  verticalPoints={[]}
                />
              )}

              {(activeMetric === 'all' || activeMetric === 'mood') && (
                <Area
                  type="monotone"
                  dataKey="mood"
                  stroke="hsl(var(--primary))"
                  fill="url(#moodGrad)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              )}
              {(activeMetric === 'all' || activeMetric === 'energy') && (
                <Area
                  type="monotone"
                  dataKey="energy"
                  stroke="hsl(142 76% 36%)"
                  fill="url(#energyGrad)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              )}
              {(activeMetric === 'all' || activeMetric === 'stress') && (
                <Area
                  type="monotone"
                  dataKey="stress"
                  stroke="hsl(0 84% 60%)"
                  fill="url(#stressGrad)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              )}
            </AreaChart>
          </ChartContainer>

          {/* Phase zones legend */}
          <div className="flex justify-between px-1">
            {phaseZones.map((zone) => (
              <div key={zone.name} className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: zone.color.replace('/ 0.08', '/ 0.6') }}
                />
                <span className="text-[10px] text-muted-foreground">{zone.name}</span>
              </div>
            ))}
          </div>

          {/* Top symptoms */}
          {topSymptoms.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                Sintomas mais frequentes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {topSymptoms.map(([symptom, count]) => (
                  <Badge key={symptom} variant="secondary" className="text-xs gap-1">
                    {symptomTranslations[symptom] || symptom}
                    <span className="text-muted-foreground">×{count}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CycleSymptomMap;
