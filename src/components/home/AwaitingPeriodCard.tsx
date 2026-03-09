import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Calendar, Check, Loader2, Sparkles } from 'lucide-react';
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

const AwaitingPeriodCard: React.FC = () => {
  const { toggleMenstruation } = useMenstruationLog();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

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
      className="mx-4 p-4 rounded-2xl border bg-gradient-to-br from-primary/12 to-accent/10 border-primary/20 hover-scale"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-primary/10">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="w-6 h-6 text-primary" />
          </motion.div>
        </div>
        
        <div className="flex-1">
          <p className="font-medium text-foreground">
            Vamos começar!
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Registre quando sua menstruação começar para ter previsões personalizadas do seu ciclo.
          </p>
        </div>
      </div>

      {/* Why it matters */}
      <div className="mt-3 p-3 rounded-xl bg-background/60 border border-border/50">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Por que registrar?</span>
          {' '}Com seus dados, podemos prever sua próxima menstruação, janela fértil e oferecer dicas personalizadas para cada fase do ciclo.
        </p>
      </div>

      {/* Action buttons */}
      <div className="mt-4 pt-3 border-t border-border/50 space-y-2">
        <Button
          onClick={() => setDialogOpen(true)}
          disabled={loading}
          className="w-full"
          variant="default"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : showSuccess ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <Droplets className="w-4 h-4 mr-2" />
          )}
          {showSuccess ? 'Registrado!' : 'Menstruação começou hoje!'}
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
              <Droplets className="w-5 h-5 text-primary" />
              Registrar menstruação?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai marcar hoje como início da sua menstruação e começar a calcular suas previsões de ciclo.
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

export default AwaitingPeriodCard;
