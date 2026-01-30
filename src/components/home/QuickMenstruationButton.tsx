import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Check, Loader2 } from 'lucide-react';
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
      <motion.button
        onClick={handleClick}
        disabled={loading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
          transition-all duration-200 active:scale-95
          ${isAlreadyMarked 
            ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40' 
            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20'
          }
        `}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{ rotate: { duration: 1, repeat: Infinity, ease: "linear" } }}
            >
              <Loader2 className="w-4 h-4" />
            </motion.div>
          ) : showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <Check className="w-4 h-4" />
            </motion.div>
          ) : (
            <motion.div
              key="icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Droplets className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>
        
        <span>
          {showSuccess 
            ? (isAlreadyMarked ? 'Registrado!' : 'Removido!')
            : (isAlreadyMarked ? 'Menstruação registrada' : 'Começou hoje?')
          }
        </span>
        
        {isAlreadyMarked && !loading && !showSuccess && (
          <Check className="w-3.5 h-3.5 text-red-500" />
        )}
      </motion.button>

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
