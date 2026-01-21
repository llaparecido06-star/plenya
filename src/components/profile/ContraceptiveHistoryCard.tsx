import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInMonths, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Trash2, 
  History,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMethodById } from '@/data/contraceptiveMethods';
import { useContraceptiveHistory, ContraceptiveHistoryEntry } from '@/hooks/useContraceptiveHistory';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const ContraceptiveHistoryCard: React.FC = () => {
  const { history, loading, deleteHistoryEntry } = useContraceptiveHistory();
  const [isExpanded, setIsExpanded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatDuration = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const months = differenceInMonths(end, start);
    const days = differenceInDays(end, start) % 30;

    if (months === 0) {
      return `${days} dias`;
    } else if (days === 0) {
      return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    }
    return `${months} ${months === 1 ? 'mês' : 'meses'} e ${days} dias`;
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteHistoryEntry(id);
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            Histórico de Métodos
          </span>
          <span className="text-xs text-muted-foreground">
            ({history.length} {history.length === 1 ? 'registro' : 'registros'})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {history.map((entry, index) => {
              const method = getMethodById(entry.contraceptive_type);
              const isActive = !entry.end_date;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-xl border ${
                    isActive
                      ? 'bg-primary/5 border-primary/30'
                      : 'bg-card border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-primary/20' : 'bg-muted'
                    }`}>
                      <span className="text-lg">
                        {method?.icon || '💊'}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground text-sm">
                          {method?.label || entry.contraceptive_type}
                        </p>
                        {isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                            ATUAL
                          </span>
                        )}
                      </div>
                      
                      {entry.contraceptive_brand && (
                        <p className="text-xs text-primary font-medium">
                          {entry.contraceptive_brand}
                        </p>
                      )}

                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>
                          {format(new Date(entry.start_date), "dd/MM/yyyy", { locale: ptBR })}
                          {entry.end_date && (
                            <> → {format(new Date(entry.end_date), "dd/MM/yyyy", { locale: ptBR })}</>
                          )}
                        </span>
                        <span className="text-muted-foreground/60">
                          • {formatDuration(entry.start_date, entry.end_date)}
                        </span>
                      </div>

                      {entry.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          "{entry.notes}"
                        </p>
                      )}
                    </div>

                    {/* Delete Button */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          disabled={deletingId === entry.id}
                        >
                          {deletingId === entry.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O registro de {method?.label || entry.contraceptive_type} será removido permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(entry.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContraceptiveHistoryCard;
