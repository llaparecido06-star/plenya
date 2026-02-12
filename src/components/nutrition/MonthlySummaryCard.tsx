import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, TrendingUp, TrendingDown, Minus, Flame, Beef, Wheat, Droplets } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface MonthlyData {
  totalDays: number;
  totalMeals: number;
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  prevAvgCalories: number;
}

const MonthlySummaryCard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchMonthly = async () => {
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const today = now.toISOString().split('T')[0];

      // Previous month range
      const firstOfPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const lastOfPrev = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

      const [currentRes, prevRes] = await Promise.all([
        supabase
          .from('nutrition_intake')
          .select('intake_date, calories, protein, carbs, fat')
          .eq('user_id', user.id)
          .gte('intake_date', firstOfMonth)
          .lte('intake_date', today),
        supabase
          .from('nutrition_intake')
          .select('intake_date, calories')
          .eq('user_id', user.id)
          .gte('intake_date', firstOfPrev)
          .lte('intake_date', lastOfPrev),
      ]);

      const meals = currentRes.data || [];
      const prevMeals = prevRes.data || [];

      if (meals.length === 0) { setData(null); setLoading(false); return; }

      // Group by date for averages
      const byDate: Record<string, { cal: number; pro: number; carb: number; fat: number }> = {};
      meals.forEach(m => {
        if (!byDate[m.intake_date]) byDate[m.intake_date] = { cal: 0, pro: 0, carb: 0, fat: 0 };
        byDate[m.intake_date].cal += m.calories || 0;
        byDate[m.intake_date].pro += m.protein || 0;
        byDate[m.intake_date].carb += m.carbs || 0;
        byDate[m.intake_date].fat += m.fat || 0;
      });

      const days = Object.keys(byDate).length;
      const totals = Object.values(byDate).reduce(
        (a, d) => ({ cal: a.cal + d.cal, pro: a.pro + d.pro, carb: a.carb + d.carb, fat: a.fat + d.fat }),
        { cal: 0, pro: 0, carb: 0, fat: 0 }
      );

      // Prev month avg
      const prevByDate: Record<string, number> = {};
      prevMeals.forEach(m => {
        prevByDate[m.intake_date] = (prevByDate[m.intake_date] || 0) + (m.calories || 0);
      });
      const prevDays = Object.keys(prevByDate).length;
      const prevTotal = Object.values(prevByDate).reduce((a, b) => a + b, 0);

      setData({
        totalDays: days,
        totalMeals: meals.length,
        avgCalories: Math.round(totals.cal / days),
        avgProtein: Math.round(totals.pro / days),
        avgCarbs: Math.round(totals.carb / days),
        avgFat: Math.round(totals.fat / days),
        prevAvgCalories: prevDays > 0 ? Math.round(prevTotal / prevDays) : 0,
      });
      setLoading(false);
    };

    fetchMonthly();
  }, [user]);

  if (loading) {
    return (
      <div className="glass-card p-4 mx-4">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const calDiff = data.prevAvgCalories > 0
    ? Math.round(((data.avgCalories - data.prevAvgCalories) / data.prevAvgCalories) * 100)
    : null;

  const TrendIcon = calDiff === null ? Minus : calDiff > 0 ? TrendingUp : calDiff < 0 ? TrendingDown : Minus;
  const trendColor = calDiff === null ? 'text-muted-foreground' : calDiff > 5 ? 'text-menstrual' : calDiff < -5 ? 'text-folicular' : 'text-muted-foreground';

  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long' });

  const stats = [
    { icon: Flame, label: 'Calorias', value: `${data.avgCalories}`, unit: 'kcal/dia', color: 'text-primary' },
    { icon: Beef, label: 'Proteína', value: `${data.avgProtein}g`, unit: '/dia', color: 'text-menstrual' },
    { icon: Wheat, label: 'Carboidratos', value: `${data.avgCarbs}g`, unit: '/dia', color: 'text-folicular' },
    { icon: Droplets, label: 'Gordura', value: `${data.avgFat}g`, unit: '/dia', color: 'text-ovulatoria' },
  ];

  return (
    <motion.div
      className="glass-card p-4 mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground capitalize">Resumo de {monthName}</h3>
        </div>
        <span className="text-xs text-muted-foreground">{data.totalMeals} refeições · {data.totalDays} dias</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {stats.map(({ icon: Icon, label, value, unit, color }) => (
          <div key={label} className="bg-muted/50 rounded-xl p-3 text-center">
            <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground">{label} {unit}</p>
          </div>
        ))}
      </div>

      {calDiff !== null && (
        <div className="flex items-center justify-center gap-2 bg-muted/30 rounded-lg py-2">
          <TrendIcon className={`w-4 h-4 ${trendColor}`} />
          <span className="text-xs text-muted-foreground">
            {calDiff === 0
              ? 'Mesmo consumo calórico do mês anterior'
              : `${Math.abs(calDiff)}% ${calDiff > 0 ? 'a mais' : 'a menos'} que o mês anterior`}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default MonthlySummaryCard;
