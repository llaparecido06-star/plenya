import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, X, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';

const BreathingCard: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [cycles, setCycles] = useState(0);

  const INHALE_DURATION = 4000;
  const EXHALE_DURATION = 4000;

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
    if (!isPlaying) {
      setPhase('inhale');
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;

    const duration = phase === 'inhale' ? INHALE_DURATION : EXHALE_DURATION;

    const timeout = setTimeout(() => {
      if (phase === 'inhale') {
        setPhase('exhale');
      } else {
        setPhase('inhale');
        setCycles(prev => prev + 1);
      }
    }, duration);

    return () => clearTimeout(timeout);
  }, [isPlaying, phase]);

  const handleClose = () => {
    setIsOpen(false);
    setIsPlaying(false);
    setPhase('inhale');
    setCycles(0);
  };

  return (
    <>
      <motion.div
        className="glass-card p-5 cursor-pointer hover:shadow-md transition-shadow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-leaf-green/10 flex items-center justify-center">
            <Wind className="w-6 h-6 text-leaf-green" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{t('mind.breathe_now')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('mind.breathe_technique')}
            </p>
          </div>
          <Play className="w-5 h-5 text-primary" />
        </div>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-gradient-to-b from-background to-muted">
          <div className="relative min-h-[400px] flex flex-col items-center justify-center p-8">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative flex items-center justify-center mb-8">
              <motion.div
                className="w-48 h-48 rounded-full bg-gradient-to-br from-leaf-green/30 to-primary/20 flex items-center justify-center"
                animate={{ scale: isPlaying ? (phase === 'inhale' ? 1.4 : 1) : 1 }}
                transition={{ duration: phase === 'inhale' ? INHALE_DURATION / 1000 : EXHALE_DURATION / 1000, ease: 'easeInOut' }}
              >
                <motion.div
                  className="w-32 h-32 rounded-full bg-gradient-to-br from-leaf-green/50 to-primary/30 flex items-center justify-center"
                  animate={{ scale: isPlaying ? (phase === 'inhale' ? 1.3 : 1) : 1 }}
                  transition={{ duration: phase === 'inhale' ? INHALE_DURATION / 1000 : EXHALE_DURATION / 1000, ease: 'easeInOut' }}
                >
                  <motion.div
                    className="w-20 h-20 rounded-full phase-gradient flex items-center justify-center shadow-glow"
                    animate={{ scale: isPlaying ? (phase === 'inhale' ? 1.2 : 1) : 1 }}
                    transition={{ duration: phase === 'inhale' ? INHALE_DURATION / 1000 : EXHALE_DURATION / 1000, ease: 'easeInOut' }}
                  >
                    <Wind className="w-8 h-8 text-white" />
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={phase}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-2xl font-semibold text-foreground mb-2"
              >
                {isPlaying ? (phase === 'inhale' ? t('mind.inhale') : t('mind.exhale')) : t('mind.ready')}
              </motion.p>
            </AnimatePresence>

            <p className="text-muted-foreground mb-6">
              {isPlaying
                ? (cycles === 1
                    ? t('mind.cycles_complete', { count: cycles })
                    : t('mind.cycles_complete_plural', { count: cycles }))
                : t('mind.breathe_instruction')}
            </p>

            <Button
              onClick={togglePlay}
              size="lg"
              className="h-14 px-8 rounded-full phase-gradient text-white gap-2"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5" />
                  {t('mind.pause')}
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  {t('mind.start')}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BreathingCard;