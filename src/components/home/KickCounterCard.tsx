import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Baby, Plus, Timer, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useKickCounter } from '@/hooks/useKickCounter';
import { useTranslation } from 'react-i18next';

const KickCounterCard: React.FC = () => {
  const { t } = useTranslation();
  const { todayLog, addKick, loading } = useKickCounter();
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const kickCount = todayLog?.kick_count || 0;
  const goalReached = kickCount >= 10;

  useEffect(() => {
    if (isTimerActive) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isTimerActive]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleKick = async () => {
    await addKick();
    if (!isTimerActive) setIsTimerActive(true);
  };

  if (loading) return null;

  return (
    <motion.div className="px-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="glass-card p-5 border-terracotta/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-terracotta/20 flex items-center justify-center">
              <Baby className="w-5 h-5 text-terracotta" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t('pregnancy.kick_counter')}</h3>
              <p className="text-xs text-muted-foreground">{t('pregnancy.kick_goal')}</p>
            </div>
          </div>
          {isTimerActive && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Timer className="w-3.5 h-3.5" />
              <span className="font-mono">{formatTime(seconds)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-center flex-1">
            <motion.span
              key={kickCount}
              className="text-5xl font-bold text-terracotta block"
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
            >
              {kickCount}
            </motion.span>
            <span className="text-sm text-muted-foreground">{t('pregnancy.kicks_today')}</span>
          </div>

          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              onClick={handleKick}
              size="lg"
              className="w-20 h-20 rounded-full bg-gradient-to-br from-terracotta to-burnt-pink text-white shadow-lg"
            >
              <Plus className="w-8 h-8" />
            </Button>
          </motion.div>
        </div>

        {/* Progress bar to 10 */}
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-terracotta to-burnt-pink rounded-full"
            animate={{ width: `${Math.min(100, (kickCount / 10) * 100)}%` }}
          />
        </div>

        <AnimatePresence>
          {goalReached && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 bg-leaf-green/10 rounded-xl flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 text-leaf-green" />
              <span className="text-sm text-leaf-green font-medium">{t('pregnancy.kick_goal_reached')}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {isTimerActive && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-muted-foreground"
            onClick={() => { setIsTimerActive(false); setSeconds(0); }}
          >
            {t('pregnancy.reset_timer')}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default KickCounterCard;
