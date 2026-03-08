import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Scale, TrendingUp, AlertTriangle, Plus, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useLifePhase } from '@/hooks/useLifePhase';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { toLocalDateString } from '@/lib/dateUtils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface WeightEntry {
  week: number;
  weight: number;
  date: string;
}

// Ideal weight gain range per trimester (cumulative kg from start)
const idealGainRange = {
  trimester1: { min: 0.5, max: 2.0 },   // weeks 1-12
  trimester2: { min: 4.0, max: 8.0 },    // weeks 13-27
  trimester3: { min: 9.0, max: 14.0 },   // weeks 28-40
};

const getIdealRange = (week: number): { min: number; max: number } => {
  if (week <= 12) {
    const progress = week / 12;
    return {
      min: idealGainRange.trimester1.min * progress,
      max: idealGainRange.trimester1.max * progress,
    };
  } else if (week <= 27) {
    const progress = (week - 12) / 15;
    return {
      min: idealGainRange.trimester1.min + (idealGainRange.trimester2.min - idealGainRange.trimester1.min) * progress,
      max: idealGainRange.trimester1.max + (idealGainRange.trimester2.max - idealGainRange.trimester1.max) * progress,
    };
  } else {
    const progress = (week - 27) / 13;
    return {
      min: idealGainRange.trimester2.min + (idealGainRange.trimester3.min - idealGainRange.trimester2.min) * progress,
      max: idealGainRange.trimester2.max + (idealGainRange.trimester3.max - idealGainRange.trimester2.max) * progress,
    };
  }
};

const GestationalWeightTracker: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { lifePhase, pregnancyWeeks, pregnancyStartDate } = useLifePhase();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weight, setWeight] = useState<number[]>([65]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isPregnant = lifePhase === 'pregnant';

  useEffect(() => {
    if (!user || !isPregnant) { setLoading(false); return; }

    const fetchWeights = async () => {
      const { data, error } = await supabase
        .from('pregnancy_diary')
        .select('week_number, weight, entry_date')
        .eq('user_id', user.id)
        .not('weight', 'is', null)
        .order('entry_date', { ascending: true });

      if (!error && data) {
        // Deduplicate by week, keep latest
        const byWeek = new Map<number, WeightEntry>();
        data.forEach(d => {
          if (d.week_number != null && d.weight != null) {
            byWeek.set(d.week_number, {
              week: d.week_number,
              weight: Number(d.weight),
              date: d.entry_date,
            });
          }
        });
        setEntries(Array.from(byWeek.values()).sort((a, b) => a.week - b.week));
      }
      setLoading(false);
    };

    fetchWeights();
  }, [user, isPregnant]);

  const handleSaveWeight = async () => {
    if (!user || !pregnancyWeeks) return;
    setSaving(true);

    const today = toLocalDateString(new Date());
    const { error } = await supabase
      .from('pregnancy_diary')
      .upsert({
        user_id: user.id,
        entry_date: today,
        week_number: pregnancyWeeks,
        weight: weight[0],
      }, { onConflict: 'user_id,entry_date' });

    if (!error) {
      // Update local state
      setEntries(prev => {
        const filtered = prev.filter(e => e.week !== pregnancyWeeks);
        return [...filtered, { week: pregnancyWeeks, weight: weight[0], date: today }].sort((a, b) => a.week - b.week);
      });
      toast({ title: t('pregnancy.wt_saved'), description: t('pregnancy.wt_saved_desc') });
      setDrawerOpen(false);
    } else {
      toast({ title: 'Erro', description: 'Não foi possível salvar.', variant: 'destructive' });
    }
    setSaving(false);
  };

  // Chart data with ideal range
  const chartData = useMemo(() => {
    if (entries.length === 0) return [];
    const baseWeight = entries[0]?.weight || 60;

    return entries.map(e => {
      const gain = e.weight - baseWeight;
      const ideal = getIdealRange(e.week);
      return {
        week: `S${e.week}`,
        peso: e.weight,
        ganho: Number(gain.toFixed(1)),
        idealMin: Number((baseWeight + ideal.min).toFixed(1)),
        idealMax: Number((baseWeight + ideal.max).toFixed(1)),
      };
    });
  }, [entries]);

  // Current status
  const currentStatus = useMemo(() => {
    if (entries.length < 2 || !pregnancyWeeks) return null;
    const baseWeight = entries[0].weight;
    const currentWeight = entries[entries.length - 1].weight;
    const gain = currentWeight - baseWeight;
    const ideal = getIdealRange(pregnancyWeeks);

    if (gain < ideal.min) return 'low';
    if (gain > ideal.max) return 'high';
    return 'normal';
  }, [entries, pregnancyWeeks]);

  if (!isPregnant) return null;

  return (
    <motion.div
      className="mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{t('pregnancy.wt_title')}</h3>
              <p className="text-xs text-muted-foreground">{t('pregnancy.wt_subtitle')}</p>
            </div>
          </div>

          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="w-4 h-4" />
                {t('pregnancy.wt_add')}
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{t('pregnancy.wt_register')}</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-8 space-y-6">
                <div className="text-center">
                  <span className="text-5xl font-bold text-foreground">{weight[0].toFixed(1)}</span>
                  <span className="text-2xl text-muted-foreground ml-1">kg</span>
                </div>
                <Slider
                  value={weight}
                  onValueChange={setWeight}
                  min={40}
                  max={150}
                  step={0.1}
                />
                <p className="text-xs text-muted-foreground text-center">
                  {t('pregnancy.week')} {pregnancyWeeks}
                </p>
                <Button
                  className="w-full"
                  onClick={handleSaveWeight}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {saving ? t('actions.loading') : t('actions.save')}
                </Button>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Status alert */}
        {currentStatus && currentStatus !== 'normal' && (
          <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 ${
            currentStatus === 'high'
              ? 'bg-amber-50 dark:bg-amber-950/30'
              : 'bg-blue-50 dark:bg-blue-950/30'
          }`}>
            <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${
              currentStatus === 'high' ? 'text-amber-500' : 'text-blue-500'
            }`} />
            <p className={`text-xs ${
              currentStatus === 'high'
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-blue-700 dark:text-blue-400'
            }`}>
              {currentStatus === 'high'
                ? t('pregnancy.wt_alert_high')
                : t('pregnancy.wt_alert_low')}
            </p>
          </div>
        )}

        {currentStatus === 'normal' && entries.length >= 2 && (
          <div className="flex items-center gap-2 p-3 rounded-xl mb-4 bg-green-50 dark:bg-green-950/30">
            <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0" />
            <p className="text-xs text-green-700 dark:text-green-400">
              {t('pregnancy.wt_alert_normal')}
            </p>
          </div>
        )}

        {/* Chart */}
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : entries.length >= 2 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      peso: 'Peso',
                      idealMin: 'Mín. ideal',
                      idealMax: 'Máx. ideal',
                    };
                    return [`${value} kg`, labels[name] || name];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="idealMin"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="idealMax"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="peso"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">{t('pregnancy.wt_empty')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('pregnancy.wt_empty_hint')}</p>
          </div>
        )}

        {/* Summary */}
        {entries.length >= 2 && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="text-center flex-1">
              <p className="text-lg font-bold text-foreground">{entries[0].weight.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">{t('pregnancy.wt_initial')}</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-lg font-bold text-foreground">{entries[entries.length - 1].weight.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">{t('pregnancy.wt_current')}</p>
            </div>
            <div className="text-center flex-1">
              <p className={`text-lg font-bold ${
                currentStatus === 'normal' ? 'text-green-500' :
                currentStatus === 'high' ? 'text-amber-500' : 'text-blue-500'
              }`}>
                +{(entries[entries.length - 1].weight - entries[0].weight).toFixed(1)}
              </p>
              <p className="text-[10px] text-muted-foreground">{t('pregnancy.wt_gain')}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GestationalWeightTracker;
