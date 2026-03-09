import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Droplets, Calendar, Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCycle } from '@/contexts/CycleContext';
import { useMenstruationLog } from '@/hooks/useMenstruationLog';
import { Button } from '@/components/ui/button';
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

const LatePeriodCard: React.FC = () => {
  const { daysLate, lastPeriodStart, cycleLength } = useCycle();
  const { toggleMenstruation } = useMenstruationLog();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Calculate expected date (when period should have started)
  const expectedDate = lastPeriodStart 
    ? new Date(lastPeriodStart.getTime() + cycleLength * 24 * 60 * 60 * 1000)
    : null;

  const handleConfirm = async () => {
    setDialogOpen(false);
    setLoading(true);
    
    const today = new Date();
    const success = await toggleMenstruation(today);
    
    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
    
    setLoading(false);
  };

  return (
    <motion.div
      className="mx-4 p-4 rounded-2xl border bg-gradient-to-br from-destructive/20 to-destructive/10 border-destructive/30 hover-scale"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-red-500/20">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </motion.div>
        </div>
        
        <div className="flex-1">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Menstruação atrasada
          </p>
          {expectedDate && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Esperada em {format(expectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </p>
          )}
        </div>

        <div className="text-right">
          <span className="text-2xl font-bold text-red-500">
            {daysLate}
          </span>
          <p className="text-xs text-muted-foreground">
            {daysLate === 1 ? 'dia' : 'dias'}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 pt-3 border-t border-red-500/20 space-y-2">
        <Button
          onClick={() => setDialogOpen(true)}
          disabled={loading}
          className="w-full bg-red-500 hover:bg-red-600 text-white"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : showSuccess ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <Droplets className="w-4 h-4 mr-2" />
          )}
          {showSuccess ? 'Registrado!' : 'Menstruação começou hoje'}
        </Button>
        
        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
          <Calendar className="w-3 h-3" />
          Começou antes? Marque no calendário
        </p>
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-red-500" />
              Registrar menstruação?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai marcar hoje como início da sua menstruação e atualizar suas previsões de ciclo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-red-500 hover:bg-red-600"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default LatePeriodCard;
