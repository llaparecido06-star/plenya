import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Plus, Clock, TrendingDown, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, parseISO, startOfDay, endOfDay } from 'date-fns';
import { ptBR, es, enUS } from 'date-fns/locale';
import i18n from '@/i18n/config';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface HotFlashLog {
  id: string;
  logged_at: string;
  intensity: number;
  duration_minutes: number | null;
  trigger: string | null;
}

const triggers = ['stress', 'food', 'exercise', 'alcohol', 'caffeine', 'unknown'];

const getLocale = () => {
  const lang = i18n.language?.substring(0, 2);
  if (lang === 'es') return es;
  if (lang === 'en') return enUS;
  return ptBR;
};

const HotFlashCounter: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [intensity, setIntensity] = useState<number[]>([3]);
  const [duration, setDuration] = useState<number[]>([5]);
  const [trigger, setTrigger] = useState<string>('unknown');
  
  // Stats
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [avgIntensity, setAvgIntensity] = useState(0);
  const [history, setHistory] = useState<HotFlashLog[]>([]);

  useEffect(() => {
    if (!user) return;
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    setLoading(true);
    
    const today = new Date();
    const todayStart = startOfDay(today).toISOString();
    const todayEnd = endOfDay(today).toISOString();
    const weekAgo = subDays(today, 7).toISOString();

    // Get today's count
    const { data: todayData } = await supabase
      .from('hot_flash_logs')
      .select('id, intensity')
      .eq('user_id', user.id)
      .gte('logged_at', todayStart)
      .lte('logged_at', todayEnd);
    
    setTodayCount(todayData?.length || 0);

    // Get week data
    const { data: weekData } = await supabase
      .from('hot_flash_logs')
      .select('id, intensity, logged_at, duration_minutes, trigger')
      .eq('user_id', user.id)
      .gte('logged_at', weekAgo)
      .order('logged_at', { ascending: false });
    
    setWeekCount(weekData?.length || 0);
    setHistory(weekData as HotFlashLog[] || []);
    
    if (weekData && weekData.length > 0) {
      const avg = weekData.reduce((acc, log) => acc + (log.intensity || 3), 0) / weekData.length;
      setAvgIntensity(Math.round(avg * 10) / 10);
    }
    
    setLoading(false);
  };

  const handleQuickLog = async () => {
    if (!user) return;
    setSaving(true);
    
    const { error } = await supabase.from('hot_flash_logs').insert({
      user_id: user.id,
      intensity: 3,
      logged_at: new Date().toISOString(),
    });
    
    if (error) {
      toast({ title: t('actions.error'), variant: 'destructive' });
    } else {
      toast({ title: t('menopause.hf_logged'), description: '🔥' });
      loadStats();
    }
    setSaving(false);
  };

  const handleDetailedLog = async () => {
    if (!user) return;
    setSaving(true);
    
    const { error } = await supabase.from('hot_flash_logs').insert({
      user_id: user.id,
      intensity: intensity[0],
      duration_minutes: duration[0],
      trigger: trigger !== 'unknown' ? trigger : null,
      logged_at: new Date().toISOString(),
    });
    
    if (error) {
      toast({ title: t('actions.error'), variant: 'destructive' });
    } else {
      toast({ title: t('menopause.hf_logged'), description: `${t('menopause.hf_intensity')}: ${intensity[0]}/5` });
      loadStats();
      setDrawerOpen(false);
    }
    setSaving(false);
  };

  const getIntensityColor = (i: number) => {
    if (i <= 2) return 'text-yellow-500';
    if (i <= 3) return 'text-orange-500';
    return 'text-red-500';
  };

  const getIntensityEmoji = (i: number) => {
    const emojis = ['🌡️', '🔥', '🔥🔥', '🔥🔥🔥', '🌋'];
    return emojis[i - 1] || '🔥';
  };

  return (
    <motion.div
      className="mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="glass-card p-5 bg-gradient-to-br from-orange-500/5 to-red-500/10 border-orange-500/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{t('menopause.hf_title')}</h3>
              <p className="text-xs text-muted-foreground">{t('menopause.hf_subtitle')}</p>
            </div>
          </div>
          
          {/* Quick log button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleQuickLog}
            disabled={saving}
            className="bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20"
          >
            <Plus className="w-4 h-4 mr-1" />
            {t('menopause.hf_quick_log')}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-card/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-orange-500">{todayCount}</p>
            <p className="text-xs text-muted-foreground">{t('menopause.hf_today')}</p>
          </div>
          <div className="bg-card/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{weekCount}</p>
            <p className="text-xs text-muted-foreground">{t('menopause.hf_week')}</p>
          </div>
          <div className="bg-card/50 rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold ${getIntensityColor(avgIntensity)}`}>
              {avgIntensity || '-'}
            </p>
            <p className="text-xs text-muted-foreground">{t('menopause.hf_avg_intensity')}</p>
          </div>
        </div>

        {/* Detailed log drawer */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button className="w-full p-3 rounded-xl bg-card/50 hover:bg-card/80 transition-colors text-sm text-center text-muted-foreground">
              <Clock className="w-4 h-4 inline mr-2" />
              {t('menopause.hf_detailed_log')}
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                {t('menopause.hf_log_details')}
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-8 space-y-6">
              {/* Intensity */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">
                  {t('menopause.hf_intensity')} {getIntensityEmoji(intensity[0])}
                </p>
                <Slider
                  value={intensity}
                  onValueChange={setIntensity}
                  min={1}
                  max={5}
                  step={1}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t('menopause.hf_mild')}</span>
                  <span>{t('menopause.hf_severe')}</span>
                </div>
              </div>

              {/* Duration */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">
                  {t('menopause.hf_duration')}: {duration[0]} min
                </p>
                <Slider
                  value={duration}
                  onValueChange={setDuration}
                  min={1}
                  max={30}
                  step={1}
                />
              </div>

              {/* Trigger */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">{t('menopause.hf_trigger')}</p>
                <Select value={trigger} onValueChange={setTrigger}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {triggers.map(tr => (
                      <SelectItem key={tr} value={tr}>
                        {t(`menopause.hf_trigger_${tr}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleDetailedLog} 
                disabled={saving} 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {t('actions.save')}
              </Button>
            </div>
          </DrawerContent>
        </Drawer>

        {/* History toggle */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full mt-3 flex items-center justify-center gap-2 p-2 rounded-xl bg-card/50 hover:bg-card/80 transition-colors text-sm text-muted-foreground"
        >
          <TrendingDown className="w-4 h-4" />
          {t('menopause.hf_history')}
          {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* History */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-2 max-h-[200px] overflow-auto">
                {history.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-4">
                    {t('menopause.hf_no_history')}
                  </p>
                ) : (
                  history.slice(0, 10).map(log => (
                    <div key={log.id} className="flex items-center justify-between bg-card/60 rounded-lg p-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span>{getIntensityEmoji(log.intensity)}</span>
                        <span className="text-foreground">
                          {format(parseISO(log.logged_at), 'dd/MM HH:mm', { locale: getLocale() })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        {log.duration_minutes && <span>{log.duration_minutes}min</span>}
                        {log.trigger && <span>{t(`menopause.hf_trigger_${log.trigger}`)}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default HotFlashCounter;
