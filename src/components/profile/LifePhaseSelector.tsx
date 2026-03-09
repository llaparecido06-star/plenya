import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLifePhase, LifePhase } from '@/hooks/useLifePhase';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const phaseOptions: Array<{
  id: LifePhase;
  emoji: string;
  labelKey: string;
  descKey: string;
  color: string;
}> = [
  {
    id: 'menstruating',
    emoji: '🌙',
    labelKey: 'life_phase.menstruating',
    descKey: 'life_phase.menstruating_desc',
    color: 'border-primary bg-primary/10',
  },
  {
    id: 'pregnant',
    emoji: '🤰',
    labelKey: 'life_phase.pregnant',
    descKey: 'life_phase.pregnant_desc',
    color: 'border-pink-500 bg-pink-500/10',
  },
  {
    id: 'postpartum',
    emoji: '🌸',
    labelKey: 'life_phase.postpartum',
    descKey: 'life_phase.postpartum_desc',
    color: 'border-rose-500 bg-rose-500/10',
  },
  {
    id: 'menopause',
    emoji: '💜',
    labelKey: 'life_phase.menopause',
    descKey: 'life_phase.menopause_desc',
    color: 'border-violet-500 bg-violet-500/10',
  },
];

const LifePhaseSelector: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { lifePhase } = useLifePhase();
  const { toast } = useToast();
  const [selected, setSelected] = useState<LifePhase | null>(lifePhase);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pregnancyDate, setPregnancyDate] = useState('');

  const needsPregnancyDate = selected === 'pregnant' || selected === 'postpartum';
  const isChanged = selected !== lifePhase;

  const handleSave = async () => {
    if (!user || !selected) return;

    if (needsPregnancyDate && !pregnancyDate && selected !== lifePhase) {
      toast({
        title: t('life_phase.date_required'),
        variant: 'destructive',
      });
      return;
    }

    setShowConfirm(true);
  };

  const confirmSave = async () => {
    if (!user || !selected) return;
    setSaving(true);

    try {
      const updates: Record<string, unknown> = {
        life_phase: selected,
        updated_at: new Date().toISOString(),
      };

      if (selected === 'pregnant' || selected === 'postpartum') {
        if (pregnancyDate) {
          updates.pregnancy_start_date = pregnancyDate;
        }
      }

      if (selected === 'menstruating') {
        updates.pregnancy_start_date = null;
        updates.is_trying_to_conceive = false;
      }

      if (selected === 'menopause') {
        updates.pregnancy_start_date = null;
        updates.is_trying_to_conceive = false;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: t('life_phase.updated'),
        description: t('life_phase.updated_desc'),
      });

      window.dispatchEvent(new Event('profile-updated'));
      window.location.reload();
    } catch (err) {
      console.error('Error updating life phase:', err);
      toast({
        title: t('life_phase.error'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('life_phase.selector_desc')}
      </p>

      <div className="space-y-2">
        {phaseOptions.map((phase) => (
          <motion.button
            key={phase.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelected(phase.id)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              selected === phase.id
                ? phase.color
                : 'border-border bg-background/50 hover:border-muted-foreground/30'
            }`}
          >
            <span className="text-2xl">{phase.emoji}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{t(phase.labelKey)}</p>
              <p className="text-xs text-muted-foreground">{t(phase.descKey)}</p>
            </div>
            {selected === phase.id && (
              <Check className="w-5 h-5 text-primary shrink-0" />
            )}
          </motion.button>
        ))}
      </div>

      {needsPregnancyDate && isChanged && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2 p-4 rounded-xl bg-muted/50 border border-border"
        >
          <Label className="text-sm font-medium">
            {selected === 'pregnant'
              ? t('life_phase.dum_label')
              : t('life_phase.dum_label_postpartum')}
          </Label>
          <Input
            type="date"
            value={pregnancyDate}
            onChange={(e) => setPregnancyDate(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            {selected === 'pregnant'
              ? t('life_phase.dum_hint')
              : t('life_phase.dum_hint_postpartum')}
          </p>
        </motion.div>
      )}

      {isChanged && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {t('life_phase.change_warning')}
          </p>
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={!isChanged || saving}
        className="w-full"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Check className="w-4 h-4 mr-2" />
        )}
        {t('life_phase.save')}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('life_phase.confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('life_phase.confirm_desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSave} disabled={saving}>
              {t('actions.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LifePhaseSelector;
