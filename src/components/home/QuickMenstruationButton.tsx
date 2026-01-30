import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Check, Loader2, CalendarHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMenstruationLog } from '@/hooks/useMenstruationLog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const QuickMenstruationButton: React.FC = () => {
  const { toggleMenstruation, isMenstruating } = useMenstruationLog();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const today = new Date();
  const isAlreadyMarked = isMenstruating(today);

  const handleClick = () => {
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    setDialogOpen(false);
    setLoading(true);
    
    const success = await toggleMenstruation(today);
    
    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
    
    setLoading(false);
  };

  return (
    <>
      <motion.div
        className="px-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div 
          onClick={handleClick}
          className={`
            relative overflow-hidden rounded-2xl p-4 cursor-pointer
            transition-all duration-300 hover:shadow-lg active:scale-[0.98]
            ${isAlreadyMarked 
              ? 'bg-gradient-to-br from-red-100 to-rose-50 dark:from-red-950/40 dark:to-rose-950/20 border border-red-200 dark:border-red-800/30' 
              : 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-md'
            }
          `}
        >
          {/* Background decoration */}
          <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-20 ${isAlreadyMarked ? 'bg-red-300' : 'bg-white'}`} />
          <div className={`absolute -right-2 -bottom-6 w-16 h-16 rounded-full opacity-10 ${isAlreadyMarked ? 'bg-red-400' : 'bg-white'}`} />
          
          <div className="relative flex items-center gap-4">
            {/* Icon */}
            <div className={`
              flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
              ${isAlreadyMarked 
                ? 'bg-red-500/20 dark:bg-red-500/30' 
                : 'bg-white/20'
              }
            `}>
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, rotate: 0 }}
                    animate={{ opacity: 1, rotate: 360 }}
                    exit={{ opacity: 0 }}
                    transition={{ rotate: { duration: 1, repeat: Infinity, ease: "linear" } }}
                  >
                    <Loader2 className={`w-6 h-6 ${isAlreadyMarked ? 'text-red-600' : 'text-white'}`} />
                  </motion.div>
                ) : showSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Check className={`w-6 h-6 ${isAlreadyMarked ? 'text-red-600' : 'text-white'}`} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="icon"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {isAlreadyMarked ? (
                      <CalendarHeart className="w-6 h-6 text-red-600 dark:text-red-400" />
                    ) : (
                      <Droplets className="w-6 h-6 text-white" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Text content */}
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-base ${isAlreadyMarked ? 'text-red-700 dark:text-red-300' : 'text-white'}`}>
                {showSuccess 
                  ? (isAlreadyMarked ? 'Registrado!' : 'Removido!') 
                  : (isAlreadyMarked ? 'Menstruação registrada hoje' : 'Menstruação começou hoje?')
                }
              </h3>
              <p className={`text-sm mt-0.5 ${isAlreadyMarked ? 'text-red-600/70 dark:text-red-400/70' : 'text-white/80'}`}>
                {isAlreadyMarked 
                  ? 'Toque para remover o registro' 
                  : 'Toque para registrar e atualizar suas previsões'
                }
              </p>
            </div>
            
            {/* Status indicator */}
            {isAlreadyMarked && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-red-500" />
              {isAlreadyMarked ? 'Remover registro?' : 'Registrar menstruação?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAlreadyMarked 
                ? 'Isso vai desmarcar o dia de hoje como dia de menstruação.'
                : 'Isso vai marcar o dia de hoje como início da menstruação e atualizar suas previsões de ciclo.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={isAlreadyMarked ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : 'bg-red-500 hover:bg-red-600'}
            >
              {isAlreadyMarked ? 'Remover' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default QuickMenstruationButton;
