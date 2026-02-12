import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Dumbbell, Clock, Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const WORKOUT_TYPE_LABELS: Record<string, string> = {
  hiit: 'HIIT',
  forca: 'Força',
  yoga: 'Yoga',
  mobilidade: 'Mobilidade',
  cardio: 'Cardio',
};

interface MonthlyWorkoutData {
  totalWorkouts: number;
  totalMinutes: number;
  activeDays: number;
  topType: string | null;
  prevTotalWorkouts: number;
}

const MonthlyWorkoutSummary: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<MonthlyWorkoutData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetch = async () => {
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const today = now.toISOString().split('T')[0];
      const firstOfPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const lastOfPrev = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

      const [curRes, prevRes] = await Promise.all([
        supabase.from('workouts').select('workout_date, workout_type, duration_minutes, completed').eq('user_id', user.id).gte('workout_date', firstOfMonth).lte('workout_date', today),
        supabase.from('workouts').select('id').eq('user_id', user.id).gte('workout_date', firstOfPrev).lte('workout_date', lastOfPrev),
      ]);

      const workouts = (curRes.data || []).filter(w => w.completed !== false);
      const prevWorkouts = prevRes.data || [];

      if (workouts.length === 0) { setData(null); setLoading(false); return; }

      const uniqueDays = new Set(workouts.map(w => w.workout_date)).size;
      const totalMins = workouts.reduce((a, w) => a + (w.duration_minutes || 0), 0);

      // Most frequent type
      const typeCounts: Record<string, number> = {};
      workouts.forEach(w => { typeCounts[w.workout_type] = (typeCounts[w.workout_type] || 0) + 1; });
      const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      setData({
        totalWorkouts: workouts.length,
        totalMinutes: totalMins,
        activeDays: uniqueDays,
        topType,
        prevTotalWorkouts: prevWorkouts.length,
      });
      setLoading(false);
    };

    fetch();
  }, [user]);

  if (loading) {
    return (
      <div className="glass-card p-4">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20" /><Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const diff = data.prevTotalWorkouts > 0
    ? Math.round(((data.totalWorkouts - data.prevTotalWorkouts) / data.prevTotalWorkouts) * 100)
    : null;

  const TrendIcon = diff === null ? Minus : diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const trendColor = diff === null ? 'text-muted-foreground' : diff > 0 ? 'text-folicular' : diff < 0 ? 'text-menstrual' : 'text-muted-foreground';

  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long' });

  const stats = [
    { icon: Dumbbell, label: 'Treinos', value: `${data.totalWorkouts}`, color: 'text-primary' },
    { icon: CalendarDays, label: 'Dias ativos', value: `${data.activeDays}`, color: 'text-folicular' },
    { icon: Clock, label: 'Minutos', value: `${data.totalMinutes}`, color: 'text-ovulatoria' },
    { icon: Flame, label: 'Mais frequente', value: data.topType ? WORKOUT_TYPE_LABELS[data.topType] || data.topType : '—', color: 'text-menstrual' },
  ];

  return (
    <motion.div className="glass-card p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground capitalize">Resumo de {monthName}</h3>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-muted/50 rounded-xl p-3 text-center">
            <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {diff !== null && (
        <div className="flex items-center justify-center gap-2 bg-muted/30 rounded-lg py-2">
          <TrendIcon className={`w-4 h-4 ${trendColor}`} />
          <span className="text-xs text-muted-foreground">
            {diff === 0
              ? 'Mesma frequência do mês anterior'
              : `${Math.abs(diff)}% ${diff > 0 ? 'mais' : 'menos'} treinos que o mês anterior`}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default MonthlyWorkoutSummary;
