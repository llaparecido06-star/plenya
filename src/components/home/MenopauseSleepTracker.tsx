import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Clock, TrendingUp, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const MenopauseSleepTracker: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [hours, setHours] = useState(7);
  const [quality, setQuality] = useState(3);
  const [wakeUps, setWakeUps] = useState(0);
  const [todayLogged, setTodayLogged] = useState(false);
  const [weekAvg, setWeekAvg] = useState<{ hours: number; quality: number } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Check today's log
      const { data: todayData } = await supabase
        .from('daily_logs')
        .select('notes')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .maybeSingle();

      if (todayData?.notes) {
        try {
          const parsed = JSON.parse(todayData.notes);
          if (parsed.sleep_hours) {
            setTodayLogged(true);
            setHours(parsed.sleep_hours);
            setQuality(parsed.sleep_quality || 3);
          }
        } catch { /* notes is plain text */ }
      }

      // Week average
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: weekData } = await supabase
        .from('daily_logs')
        .select('notes')
        .eq('user_id', user.id)
        .gte('log_date', weekAgo.toISOString().split('T')[0]);

      if (weekData) {
        let totalH = 0, totalQ = 0, count = 0;
        weekData.forEach(d => {
          try {
            const p = JSON.parse(d.notes || '{}');
            if (p.sleep_hours) { totalH += p.sleep_hours; totalQ += (p.sleep_quality || 3); count++; }
          } catch { /* ignore */ }
        });
        if (count > 0) setWeekAvg({ hours: Math.round(totalH / count * 10) / 10, quality: Math.round(totalQ / count * 10) / 10 });
      }
    };

    load();
  }, [user]);

  const saveSleep = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    // Get existing log to preserve other data
    const { data: existing } = await supabase
      .from('daily_logs')
      .select('notes')
      .eq('user_id', user.id)
      .eq('log_date', today)
      .maybeSingle();

    let notesObj: Record<string, unknown> = {};
    if (existing?.notes) {
      try { notesObj = JSON.parse(existing.notes); } catch { notesObj = { text: existing.notes }; }
    }

    notesObj.sleep_hours = hours;
    notesObj.sleep_quality = quality;
    notesObj.sleep_wake_ups = wakeUps;

    const { error } = await supabase
      .from('daily_logs')
      .upsert({
        user_id: user.id,
        log_date: today,
        notes: JSON.stringify(notesObj),
      }, { onConflict: 'user_id,log_date' });

    if (!error) {
      setTodayLogged(true);
      setDrawerOpen(false);
      toast({ title: t('menopause.sleep_saved') });
    }
  };

  const qualityEmoji = ['😫', '😟', '😐', '🙂', '😴'][quality - 1] || '😐';
  const qualityLabel = [
    t('menopause.sleep_q1'),
    t('menopause.sleep_q2'),
    t('menopause.sleep_q3'),
    t('menopause.sleep_q4'),
    t('menopause.sleep_q5'),
  ][quality - 1] || '';

  return (
    <div className="glass-card p-5 bg-gradient-to-br from-indigo-500/5 to-violet-500/10 border-indigo-500/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
          <Moon className="w-6 h-6 text-indigo-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-foreground">{t('menopause.sleep_title')}</h3>
          <p className="text-xs text-muted-foreground">{t('menopause.sleep_subtitle')}</p>
        </div>
      </div>

      {todayLogged ? (
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="p-2 bg-card/50 rounded-xl text-center">
            <p className="text-lg font-bold text-foreground">{hours}h</p>
            <p className="text-[10px] text-muted-foreground">{t('menopause.sleep_hours')}</p>
          </div>
          <div className="p-2 bg-card/50 rounded-xl text-center">
            <p className="text-lg">{qualityEmoji}</p>
            <p className="text-[10px] text-muted-foreground">{qualityLabel}</p>
          </div>
          {weekAvg && (
            <div className="p-2 bg-card/50 rounded-xl text-center">
              <p className="text-lg font-bold text-foreground">{weekAvg.hours}h</p>
              <p className="text-[10px] text-muted-foreground">{t('menopause.sleep_week_avg')}</p>
            </div>
          )}
        </div>
      ) : null}

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger asChild>
          <Button
            variant={todayLogged ? 'ghost' : 'outline'}
            size="sm"
            className={todayLogged ? 'w-full text-muted-foreground text-xs' : 'w-full border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10'}
          >
            <Moon className="w-4 h-4 mr-2" />
            {todayLogged ? t('menopause.sleep_update') : t('menopause.sleep_log')}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('menopause.sleep_log')}</DrawerTitle>
          </DrawerHeader>
          <div className="px-6 pb-8 space-y-6">
            {/* Hours */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {t('menopause.sleep_how_many')}: <span className="text-primary font-bold">{hours}h</span>
              </label>
              <Slider
                value={[hours]}
                onValueChange={([v]) => setHours(v)}
                min={2}
                max={12}
                step={0.5}
              />
            </div>

            {/* Quality */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {t('menopause.sleep_quality_label')}: <span className="text-xl ml-1">{qualityEmoji}</span>
              </label>
              <Slider
                value={[quality]}
                onValueChange={([v]) => setQuality(v)}
                min={1}
                max={5}
                step={1}
              />
            </div>

            {/* Wake ups */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {t('menopause.sleep_wake_ups')}: <span className="text-primary font-bold">{wakeUps}x</span>
              </label>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5].map(n => (
                  <Button
                    key={n}
                    variant={wakeUps === n ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setWakeUps(n)}
                    className="flex-1"
                  >
                    {n === 5 ? '5+' : n}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={saveSleep} className="w-full">
              {t('actions.save')}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default MenopauseSleepTracker;
