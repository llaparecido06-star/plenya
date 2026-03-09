import React from 'react';
import { motion } from 'framer-motion';
import { Syringe, Pill, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMedication } from '@/hooks/useMedication';
import { useContraceptive } from '@/hooks/useContraceptive';
import { toLocalDateString } from '@/lib/dateUtils';

const MedicationQuickLog: React.FC = () => {
  const { medicationName, medicationLastTaken, saving, saveLastTaken, loading: medLoading } = useMedication();
  const { contraceptive_type, contraceptive_details, loading: contraLoading } = useContraceptive();

  const loading = medLoading || contraLoading;
  if (loading) return null;

  const isInjection = contraceptive_type === 'injection';
  const today = toLocalDateString(new Date());
  const alreadyLoggedMed = medicationLastTaken === today;
  const alreadyLoggedInjection = contraceptive_details?.lastApplicationDate === today;

  // Show only if user has medication or injection configured
  const showMedication = !!medicationName && !alreadyLoggedMed;
  const showInjection = isInjection && !alreadyLoggedInjection;

  if (!showMedication && !showInjection) return null;

  const handleLogMedication = async () => {
    await saveLastTaken(today);
  };

  return (
    <motion.div
      className="glass-card p-4 mx-4 space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        💊 Registrar Dose
      </h4>

      {showMedication && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
          <div className="p-2 rounded-lg bg-primary/10">
            <Pill className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{medicationName}</p>
            <p className="text-xs text-muted-foreground">Marcar como tomado hoje</p>
          </div>
          <Button
            size="sm"
            onClick={handleLogMedication}
            disabled={saving}
            className="gap-1.5"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Tomei
          </Button>
        </div>
      )}

      {showInjection && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
          <div className="p-2 rounded-lg bg-pink-100 text-pink-600">
            <Syringe className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Injeção Contraceptiva</p>
            <p className="text-xs text-muted-foreground">Registrar aplicação de hoje</p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            disabled={saving}
            onClick={handleLogMedication}
            className="gap-1.5"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Syringe className="w-4 h-4" />}
            Apliquei
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default MedicationQuickLog;
