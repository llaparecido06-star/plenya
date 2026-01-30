import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMenstruationLog } from '@/hooks/useMenstruationLog';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const today = new Date();
  const isAlreadyMarked = isMenstruating(today);

  const handleClick = () => {
    if (isAlreadyMarked) {
      // Ask to remove
      setDialogOpen(true);
    } else {
      // Confirm to add
      setDialogOpen(true);
    }
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
        <Button
          onClick={handleClick}
          disabled={loading}
          variant={isAlreadyMarked ? "secondary" : "default"}
          className={`w-full h-12 rounded-xl font-medium transition-all ${
            isAlreadyMarked 
              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/30 dark:text-red-400' 
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </motion.span>
            ) : showSuccess ? (
              <motion.span
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {isAlreadyMarked ? 'Menstruação removida!' : 'Registrado!'}
              </motion.span>
            ) : (
              <motion.span
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Droplets className="w-4 h-4" />
                {isAlreadyMarked ? 'Menstruação registrada hoje ✓' : 'Menstruação começou hoje'}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
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
