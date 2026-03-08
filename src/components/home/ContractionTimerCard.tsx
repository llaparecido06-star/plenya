import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Play, Square, Trash2, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface Contraction {
  id: string;
  start: number;
  end: number | null;
  duration: number | null;
}

const ContractionTimerCard: React.FC = () => {
  const { t } = useTranslation();
  const [contractions, setContractions] = useState<Contraction[]>(() => {
    try {
      const cached = localStorage.getItem('plenya_contractions');
      if (cached) {
        const parsed = JSON.parse(cached);
        const today = new Date().toDateString();
        if (parsed.date === today) return parsed.items;
      }
    } catch { /* ignore */ }
    return [];
  });
  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    localStorage.setItem('plenya_contractions', JSON.stringify({
      date: new Date().toDateString(),
      items: contractions,
    }));
  }, [contractions]);

  useEffect(() => {
    if (active) {
      startRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 200);
    } else {
      clearInterval(intervalRef.current);
      setElapsed(0);
    }
    return () => clearInterval(intervalRef.current);
  }, [active]);

  const startContraction = () => {
    setActive(true);
    const newContraction: Contraction = {
      id: Date.now().toString(),
      start: Date.now(),
      end: null,
      duration: null,
    };
    setContractions(prev => [newContraction, ...prev]);
  };

  const stopContraction = () => {
    setActive(false);
    setContractions(prev => {
      const updated = [...prev];
      if (updated[0] && !updated[0].end) {
        updated[0] = {
          ...updated[0],
          end: Date.now(),
          duration: Math.floor((Date.now() - updated[0].start) / 1000),
        };
      }
      return updated;
    });
  };

  const clearAll = () => {
    setContractions([]);
    setActive(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const completedContractions = contractions.filter(c => c.end !== null);
  const avgDuration = completedContractions.length > 0
    ? Math.round(completedContractions.reduce((sum, c) => sum + (c.duration || 0), 0) / completedContractions.length)
    : 0;

  // Calculate average interval between contractions
  let avgInterval = 0;
  if (completedContractions.length >= 2) {
    let totalInterval = 0;
    for (let i = 0; i < completedContractions.length - 1; i++) {
      totalInterval += (completedContractions[i].start - completedContractions[i + 1].start) / 1000;
    }
    avgInterval = Math.round(totalInterval / (completedContractions.length - 1));
  }

  const shouldGoHospital = avgInterval > 0 && avgInterval <= 300 && avgDuration >= 45;

  return (
    <motion.div
      className="mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="glass-card p-5 bg-gradient-to-br from-rose-500/5 to-red-500/10 border-rose-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/20 to-red-500/20 flex items-center justify-center">
            <Timer className="w-6 h-6 text-rose-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground">{t('pregnancy.ct_title')}</h3>
            <p className="text-sm text-muted-foreground">{t('pregnancy.ct_subtitle')}</p>
          </div>
        </div>

        {/* Timer Button */}
        <div className="flex flex-col items-center mb-4">
          {active ? (
            <>
              <motion.div
                className="text-4xl font-bold text-rose-500 mb-3 tabular-nums"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                {formatTime(elapsed)}
              </motion.div>
              <Button
                onClick={stopContraction}
                className="bg-rose-500 hover:bg-rose-600 text-white px-8"
                size="lg"
              >
                <Square className="w-5 h-5 mr-2" />
                {t('pregnancy.ct_stop')}
              </Button>
            </>
          ) : (
            <Button
              onClick={startContraction}
              variant="outline"
              className="border-rose-500/30 text-rose-500 hover:bg-rose-500/10 px-8"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              {t('pregnancy.ct_start')}
            </Button>
          )}
        </div>

        {/* Stats */}
        {completedContractions.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-2 bg-card/50 rounded-xl text-center">
              <p className="text-lg font-bold text-foreground">{completedContractions.length}</p>
              <p className="text-[10px] text-muted-foreground">{t('pregnancy.ct_count')}</p>
            </div>
            <div className="p-2 bg-card/50 rounded-xl text-center">
              <p className="text-lg font-bold text-foreground">{formatTime(avgDuration)}</p>
              <p className="text-[10px] text-muted-foreground">{t('pregnancy.ct_avg_duration')}</p>
            </div>
            <div className="p-2 bg-card/50 rounded-xl text-center">
              <p className="text-lg font-bold text-foreground">{avgInterval > 0 ? formatTime(avgInterval) : '--'}</p>
              <p className="text-[10px] text-muted-foreground">{t('pregnancy.ct_avg_interval')}</p>
            </div>
          </div>
        )}

        {/* Hospital Alert */}
        {shouldGoHospital && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl mb-4"
          >
            <p className="text-sm font-semibold text-red-500 text-center">
              🏥 {t('pregnancy.ct_hospital_alert')}
            </p>
          </motion.div>
        )}

        {/* Recent contractions list */}
        {completedContractions.length > 0 && (
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {completedContractions.slice(0, 5).map((c, i) => (
              <div key={c.id} className="flex items-center justify-between text-xs p-2 bg-card/30 rounded-lg">
                <span className="text-muted-foreground">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {new Date(c.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="font-medium text-foreground">{formatTime(c.duration || 0)}</span>
              </div>
            ))}
          </div>
        )}

        {completedContractions.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="w-full mt-3 text-muted-foreground text-xs"
          >
            <Trash2 className="w-3 h-3 mr-1" /> {t('pregnancy.ct_clear')}
          </Button>
        )}

        <p className="text-xs text-muted-foreground text-center mt-3">
          {t('pregnancy.ct_disclaimer')}
        </p>
      </div>
    </motion.div>
  );
};

export default ContractionTimerCard;
