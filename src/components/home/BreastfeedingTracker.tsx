import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Baby, Plus, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { toLocalDateString } from '@/lib/dateUtils';
import { format } from 'date-fns';

interface FeedLog {
  id: string;
  feed_type: string;
  side: string | null;
  duration_minutes: number | null;
  quantity_ml: number | null;
  created_at: string;
}

const BreastfeedingTracker: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [todayLogs, setTodayLogs] = useState<FeedLog[]>([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSide, setTimerSide] = useState<'left' | 'right'>('left');
  const [timerStart, setTimerStart] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const today = toLocalDateString(new Date());

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('breastfeeding_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('log_date', today)
      .order('created_at', { ascending: false });
    setTodayLogs((data as FeedLog[]) || []);
  }, [user, today]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Timer
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - timerStart) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerStart]);

  const startTimer = (side: 'left' | 'right') => {
    setTimerSide(side);
    setTimerStart(Date.now());
    setElapsed(0);
    setTimerRunning(true);
  };

  const stopTimer = async () => {
    setTimerRunning(false);
    const minutes = Math.max(1, Math.round(elapsed / 60));
    
    if (!user) return;
    await supabase.from('breastfeeding_logs').insert({
      user_id: user.id,
      log_date: today,
      feed_type: 'breast',
      side: timerSide,
      duration_minutes: minutes,
    });

    toast({ title: `${minutes}min ${timerSide === 'left' ? '⬅️' : '➡️'} ${t('postpartum.feed_logged', 'registrado!')}` });
    fetchLogs();
  };

  const logBottle = async () => {
    if (!user) return;
    await supabase.from('breastfeeding_logs').insert({
      user_id: user.id,
      log_date: today,
      feed_type: 'bottle',
    });
    toast({ title: t('postpartum.bottle_logged', '🍼 Mamadeira registrada!') });
    fetchLogs();
  };

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const breastCount = todayLogs.filter(l => l.feed_type === 'breast').length;
  const bottleCount = todayLogs.filter(l => l.feed_type === 'bottle').length;
  const totalMinutes = todayLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);

  return (
    <div className="px-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Baby className="w-4 h-4 text-primary" />
              {t('postpartum.feeding_title', 'Amamentação')}
              <div className="flex gap-1.5 ml-auto">
                {breastCount > 0 && <Badge variant="outline" className="text-[10px]">🤱 {breastCount}</Badge>}
                {bottleCount > 0 && <Badge variant="outline" className="text-[10px]">🍼 {bottleCount}</Badge>}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Timer */}
            {timerRunning ? (
              <div className="text-center space-y-3">
                <p className="text-xs text-muted-foreground">
                  {timerSide === 'left' ? '⬅️ Esquerdo' : '➡️ Direito'}
                </p>
                <p className="text-4xl font-bold text-primary font-mono">{formatElapsed(elapsed)}</p>
                <Button onClick={stopTimer} variant="destructive" className="w-full">
                  {t('postpartum.stop_save', 'Parar e Salvar')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => startTimer('left')} variant="outline" className="h-14 flex flex-col gap-0.5">
                    <span className="text-lg">⬅️</span>
                    <span className="text-xs">{t('postpartum.left', 'Esquerdo')}</span>
                  </Button>
                  <Button onClick={() => startTimer('right')} variant="outline" className="h-14 flex flex-col gap-0.5">
                    <span className="text-lg">➡️</span>
                    <span className="text-xs">{t('postpartum.right', 'Direito')}</span>
                  </Button>
                </div>
                <Button onClick={logBottle} variant="outline" className="w-full gap-2">
                  🍼 {t('postpartum.log_bottle', 'Mamadeira / Fórmula')}
                </Button>
              </div>
            )}

            {/* Today's summary */}
            {todayLogs.length > 0 && (
              <div className="pt-3 border-t border-border space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {t('postpartum.today_feeds', 'Hoje')}: {todayLogs.length} {t('postpartum.feeds', 'mamadas')}
                  {totalMinutes > 0 && ` · ${totalMinutes}min`}
                </p>
                <div className="flex flex-wrap gap-1">
                  {todayLogs.slice(0, 8).map(log => (
                    <Badge key={log.id} variant="secondary" className="text-[10px]">
                      {log.feed_type === 'breast' ? (log.side === 'left' ? '⬅️' : '➡️') : '🍼'}
                      {log.duration_minutes ? ` ${log.duration_minutes}m` : ''}
                      {' '}
                      {format(new Date(log.created_at), 'HH:mm')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default BreastfeedingTracker;
