import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Heart, 
  Zap, 
  Brain,
  Droplets,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCycle } from '@/contexts/CycleContext';
import { format, subDays } from 'date-fns';
import { translateSymptom } from '@/lib/symptomTranslations';

interface WeeklyStats {
  avgMood: number | null;
  avgEnergy: number | null;
  avgStress: number | null;
  topSymptoms: { symptom: string; count: number }[];
  daysLogged: number;
  moodTrend: 'up' | 'down' | 'stable';
  energyTrend: 'up' | 'down' | 'stable';
}

const WeeklySummaryCard: React.FC = () => {
  const { user } = useAuth();
  const { currentPhase, getPhaseInfo } = useCycle();
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeeklyData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const today = new Date();
        const weekAgo = subDays(today, 7);
        const twoWeeksAgo = subDays(today, 14);

        // Fetch this week's logs
        const { data: thisWeekLogs, error: thisWeekError } = await supabase
          .from('daily_logs')
          .select('mood, energy, stress, symptoms, log_date')
          .eq('user_id', user.id)
          .gte('log_date', format(weekAgo, 'yyyy-MM-dd'))
          .lte('log_date', format(today, 'yyyy-MM-dd'));

        if (thisWeekError) throw thisWeekError;

        // Fetch last week's logs for comparison
        const { data: lastWeekLogs, error: lastWeekError } = await supabase
          .from('daily_logs')
          .select('mood, energy')
          .eq('user_id', user.id)
          .gte('log_date', format(twoWeeksAgo, 'yyyy-MM-dd'))
          .lt('log_date', format(weekAgo, 'yyyy-MM-dd'));

        if (lastWeekError) throw lastWeekError;

        // Calculate this week's averages
        const validMoods = thisWeekLogs?.filter(l => l.mood !== null).map(l => l.mood!) || [];
        const validEnergy = thisWeekLogs?.filter(l => l.energy !== null).map(l => l.energy!) || [];
        const validStress = thisWeekLogs?.filter(l => l.stress !== null).map(l => l.stress!) || [];

        const avgMood = validMoods.length > 0 
          ? validMoods.reduce((a, b) => a + b, 0) / validMoods.length 
          : null;
        const avgEnergy = validEnergy.length > 0 
          ? validEnergy.reduce((a, b) => a + b, 0) / validEnergy.length 
          : null;
        const avgStress = validStress.length > 0 
          ? validStress.reduce((a, b) => a + b, 0) / validStress.length 
          : null;

        // Calculate last week's averages for trend
        const lastWeekMoods = lastWeekLogs?.filter(l => l.mood !== null).map(l => l.mood!) || [];
        const lastWeekEnergy = lastWeekLogs?.filter(l => l.energy !== null).map(l => l.energy!) || [];

        const lastAvgMood = lastWeekMoods.length > 0 
          ? lastWeekMoods.reduce((a, b) => a + b, 0) / lastWeekMoods.length 
          : null;
        const lastAvgEnergy = lastWeekEnergy.length > 0 
          ? lastWeekEnergy.reduce((a, b) => a + b, 0) / lastWeekEnergy.length 
          : null;

        // Determine trends
        const moodTrend = !avgMood || !lastAvgMood 
          ? 'stable' 
          : avgMood > lastAvgMood + 0.5 
            ? 'up' 
            : avgMood < lastAvgMood - 0.5 
              ? 'down' 
              : 'stable';

        const energyTrend = !avgEnergy || !lastAvgEnergy 
          ? 'stable' 
          : avgEnergy > lastAvgEnergy + 0.5 
            ? 'up' 
            : avgEnergy < lastAvgEnergy - 0.5 
              ? 'down' 
              : 'stable';

        // Count symptoms
        const symptomCounts: Record<string, number> = {};
        thisWeekLogs?.forEach(log => {
          (log.symptoms || []).forEach((symptom: string) => {
            symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
          });
        });

        const topSymptoms = Object.entries(symptomCounts)
          .map(([symptom, count]) => ({ symptom, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        setStats({
          avgMood,
          avgEnergy,
          avgStress,
          topSymptoms,
          daysLogged: thisWeekLogs?.length || 0,
          moodTrend,
          energyTrend,
        });
      } catch (error) {
        console.error('Error fetching weekly stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyData();
  }, [user]);

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getMoodEmoji = (mood: number): string => {
    if (mood >= 4.5) return '🤩';
    if (mood >= 3.5) return '😊';
    if (mood >= 2.5) return '😐';
    if (mood >= 1.5) return '😔';
    return '😢';
  };

  const phaseInfo = getPhaseInfo();

  if (loading) {
    return (
      <Card className="glass-card animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-5 bg-muted rounded w-32" />
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.daysLogged === 0) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Resumo Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum registro esta semana.
            <br />
            <span className="text-xs">Comece a registrar seu humor e sintomas!</span>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Resumo Semanal
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {stats.daysLogged}/7 dias
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Phase indicator */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10">
            <span className="text-lg">{phaseInfo.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Fase {phaseInfo.name}</p>
              <p className="text-xs text-muted-foreground">Energia {phaseInfo.energyLevel}</p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Mood */}
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <TrendIcon trend={stats.moodTrend} />
              </div>
              <p className="text-2xl">{stats.avgMood ? getMoodEmoji(stats.avgMood) : '—'}</p>
              <p className="text-xs font-semibold text-foreground">
                {stats.avgMood 
                  ? stats.avgMood >= 4.5 ? 'Radiante' 
                    : stats.avgMood >= 3.5 ? 'Feliz' 
                    : stats.avgMood >= 2.5 ? 'Neutra' 
                    : stats.avgMood >= 1.5 ? 'Triste' 
                    : 'Difícil'
                  : 'Humor'}
              </p>
              {stats.avgMood && (
                <p className="text-xs text-muted-foreground">{stats.avgMood.toFixed(1)}/5</p>
              )}
            </div>

            {/* Energy */}
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <TrendIcon trend={stats.energyTrend} />
              </div>
              <p className="text-2xl">{stats.avgEnergy ? '⚡' : '—'}</p>
              <p className="text-xs font-semibold text-foreground">
                {stats.avgEnergy 
                  ? stats.avgEnergy >= 4 ? 'Alta' 
                    : stats.avgEnergy >= 3 ? 'Média' 
                    : 'Baixa'
                  : 'Energia'}
              </p>
              {stats.avgEnergy && (
                <p className="text-xs text-muted-foreground">{stats.avgEnergy.toFixed(1)}/5</p>
              )}
            </div>

            {/* Stress */}
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Brain className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <p className="text-2xl">{stats.avgStress ? '🧠' : '—'}</p>
              <p className="text-xs font-semibold text-foreground">
                {stats.avgStress 
                  ? stats.avgStress >= 4 ? 'Estressada' 
                    : stats.avgStress >= 3 ? 'Moderado' 
                    : 'Tranquila'
                  : 'Estresse'}
              </p>
              {stats.avgStress && (
                <p className="text-xs text-muted-foreground">{stats.avgStress.toFixed(1)}/5</p>
              )}
            </div>
          </div>

          {/* Top symptoms */}
          {stats.topSymptoms.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-primary" />
                Sintomas da Semana ({stats.topSymptoms.length})
              </p>
              <div className="space-y-2">
                {stats.topSymptoms.map(({ symptom, count }) => (
                  <div key={symptom} className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                    <span className="text-sm font-medium flex-1">{translateSymptom(symptom)}</span>
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{count}x</span>
                    <Progress
                      value={(count / stats.daysLogged) * 100} 
                      className="w-16 h-1.5" 
                    />
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

export default WeeklySummaryCard;
