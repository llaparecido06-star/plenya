import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scale, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { format, parseISO, subDays } from 'date-fns';
import { ptBR, es, enUS } from 'date-fns/locale';
import i18n from '@/i18n/config';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';

interface WeightEntry {
  date: string;
  weight: number;
}

const getLocale = () => {
  const lang = i18n.language?.substring(0, 2);
  if (lang === 'es') return es;
  if (lang === 'en') return enUS;
  return ptBR;
};

const MenopauseWeightChart: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    current: number | null;
    change: number;
    min: number;
    max: number;
    avg: number;
  }>({ current: null, change: 0, min: 0, max: 0, avg: 0 });

  useEffect(() => {
    if (!user) return;
    loadWeightData();
  }, [user]);

  const loadWeightData = async () => {
    if (!user) return;
    setLoading(true);
    
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString().split('T')[0];
    
    const { data: diaryData } = await supabase
      .from('menopause_diary')
      .select('entry_date, weight')
      .eq('user_id', user.id)
      .gte('entry_date', thirtyDaysAgo)
      .not('weight', 'is', null)
      .order('entry_date', { ascending: true });
    
    if (diaryData && diaryData.length > 0) {
      const weightData: WeightEntry[] = diaryData.map(d => ({
        date: format(parseISO(d.entry_date), 'dd/MM', { locale: getLocale() }),
        weight: Number(d.weight),
      }));
      
      setData(weightData);
      
      // Calculate stats
      const weights = weightData.map(w => w.weight);
      const current = weights[weights.length - 1];
      const first = weights[0];
      const change = Math.round((current - first) * 10) / 10;
      const min = Math.min(...weights);
      const max = Math.max(...weights);
      const avg = Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10;
      
      setStats({ current, change, min, max, avg });
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="glass-card p-5 flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (data.length < 2) {
    return (
      <div className="glass-card p-5 bg-gradient-to-br from-indigo-500/5 to-violet-500/10 border-indigo-500/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
            <Scale className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{t('menopause.weight_title')}</h3>
            <p className="text-xs text-muted-foreground">{t('menopause.weight_subtitle')}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          {t('menopause.weight_need_more_data')}
        </p>
      </div>
    );
  }

  const chartConfig = {
    weight: {
      label: t('menopause.weight_label'),
      color: 'hsl(var(--primary))',
    },
  };

  const getTrendIcon = () => {
    if (stats.change > 0) return <TrendingUp className="w-4 h-4 text-amber-500" />;
    if (stats.change < 0) return <TrendingDown className="w-4 h-4 text-emerald-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="glass-card p-5 bg-gradient-to-br from-indigo-500/5 to-violet-500/10 border-indigo-500/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
              <Scale className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{t('menopause.weight_title')}</h3>
              <p className="text-xs text-muted-foreground">{t('menopause.weight_30days')}</p>
            </div>
          </div>
          
          {/* Current + trend */}
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <span className="text-2xl font-bold text-foreground">{stats.current}</span>
              <span className="text-sm text-muted-foreground">kg</span>
            </div>
            <div className="flex items-center gap-1 justify-end text-xs">
              {getTrendIcon()}
              <span className={stats.change > 0 ? 'text-amber-500' : stats.change < 0 ? 'text-emerald-500' : 'text-muted-foreground'}>
                {stats.change > 0 ? '+' : ''}{stats.change} kg
              </span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <ChartContainer config={chartConfig} className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={['dataMin - 1', 'dataMax + 1']}
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ReferenceLine y={stats.avg} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-card/50 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground">{t('menopause.weight_min')}</p>
            <p className="text-sm font-bold text-foreground">{stats.min} kg</p>
          </div>
          <div className="bg-card/50 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground">{t('menopause.weight_avg')}</p>
            <p className="text-sm font-bold text-foreground">{stats.avg} kg</p>
          </div>
          <div className="bg-card/50 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground">{t('menopause.weight_max')}</p>
            <p className="text-sm font-bold text-foreground">{stats.max} kg</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MenopauseWeightChart;
