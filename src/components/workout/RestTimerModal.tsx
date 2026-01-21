import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, X, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RestTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const presets = [
  { label: '30s', seconds: 30 },
  { label: '60s', seconds: 60 },
  { label: '90s', seconds: 90 },
  { label: '2min', seconds: 120 },
];

const RestTimerModal: React.FC<RestTimerModalProps> = ({ isOpen, onClose }) => {
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            // Play sound or vibrate
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handlePresetClick = (seconds: number) => {
    setSelectedTime(seconds);
    setTimeLeft(seconds);
    setIsRunning(true);
  };

  const handleReset = () => {
    if (selectedTime) {
      setTimeLeft(selectedTime);
      setIsRunning(false);
    }
  };

  const togglePause = () => {
    setIsRunning(!isRunning);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = selectedTime ? ((selectedTime - timeLeft) / selectedTime) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" />
            Cronômetro de Descanso
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Timer Display */}
          <div className="relative flex items-center justify-center">
            <motion.div
              className="relative w-48 h-48 rounded-full flex items-center justify-center"
              style={{
                background: `conic-gradient(hsl(var(--primary)) ${progress}%, hsl(var(--secondary)) ${progress}%)`,
              }}
            >
              <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={timeLeft}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className={`text-5xl font-bold ${
                      timeLeft === 0 && selectedTime ? 'text-green-500' : 'text-foreground'
                    }`}
                  >
                    {selectedTime ? formatTime(timeLeft) : '--:--'}
                  </motion.span>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Presets */}
          {!selectedTime && (
            <div className="grid grid-cols-4 gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.seconds}
                  variant="outline"
                  onClick={() => handlePresetClick(preset.seconds)}
                  className="h-12"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          )}

          {/* Controls */}
          {selectedTime !== null && (
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handleReset}
                className="h-12 w-12 rounded-full"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
              <Button
                onClick={togglePause}
                className="h-12 w-12 rounded-full phase-gradient"
              >
                {isRunning ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedTime(null);
                  setTimeLeft(0);
                  setIsRunning(false);
                }}
                className="h-12 w-12 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Done message */}
          {timeLeft === 0 && selectedTime && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-green-500 font-medium"
            >
              ✅ Descanso concluído! Bora treinar!
            </motion.p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RestTimerModal;
