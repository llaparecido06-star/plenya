import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Loader2, Undo2, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePillTracker } from '@/hooks/usePillTracker';
import { useContraceptive } from '@/hooks/useContraceptive';

const PillTracker: React.FC = () => {
  const { contraceptive_brand } = useContraceptive();
  const { 
    hasTakenToday, 
    hasSkippedToday, 
    streak, 
    loading, 
    saving, 
    markAsTaken, 
    markAsSkipped,
    undoLog,
    isAuthenticated 
  } = usePillTracker();

  const brandName = contraceptive_brand || 'sua pílula';

  if (loading) {
    return (
      <div className="glass-card p-5 flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Already taken today
  if (hasTakenToday) {
    return (
      <motion.div
        className="glass-card p-5 overflow-hidden relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Success background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/5" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-green-100 dark:bg-green-900/50">
                <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Protegida! ✅</h3>
                <p className="text-sm text-muted-foreground">
                  {brandName} tomado hoje
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={undoLog}
              disabled={saving}
              className="h-8 w-8"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Streak */}
          {streak > 1 && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/30">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                {streak} dias consecutivos! 🔥
              </span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Skipped today
  if (hasSkippedToday) {
    return (
      <motion.div
        className="glass-card p-5 overflow-hidden relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-red-500/5" />
        
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-900/50">
                <X className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Pílula pulada</h3>
                <p className="text-sm text-muted-foreground">
                  Lembre-se de tomar amanhã
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={undoLog}
              disabled={saving}
            >
              <Undo2 className="w-4 h-4 mr-2" />
              Desfazer
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Not taken yet - show tracker
  return (
    <motion.div
      className="glass-card p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="text-center mb-4">
        <h3 className="font-semibold text-foreground text-lg">
          Já tomou seu {brandName} hoje?
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Registre para manter o controle
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 h-14"
          onClick={markAsSkipped}
          disabled={saving || !isAuthenticated}
        >
          <X className="w-5 h-5 mr-2 text-rose-500" />
          Pulei hoje
        </Button>
        <Button
          className="flex-1 h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          onClick={markAsTaken}
          disabled={saving || !isAuthenticated}
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Tomei! 💊
            </>
          )}
        </Button>
      </div>

      {/* Current streak */}
      {streak > 0 && (
        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
          <Flame className="w-4 h-4 text-orange-500" />
          <span>Sequência atual: {streak} dias</span>
        </div>
      )}
    </motion.div>
  );
};

export default PillTracker;
