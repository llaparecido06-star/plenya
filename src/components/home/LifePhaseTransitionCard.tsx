import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Baby, Flower2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLifePhase } from '@/hooks/useLifePhase';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
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

const LifePhaseTransitionCard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { lifePhase, pregnancyWeeks } = useLifePhase();
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState<'postpartum' | 'menopause' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTransition = async (newPhase: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const updates: Record<string, unknown> = {
        life_phase: newPhase,
      };

      // Keep pregnancy_start_date for postpartum weeks calculation
      if (newPhase === 'menstruating') {
        updates.pregnancy_start_date = null;
        updates.is_trying_to_conceive = false;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: t('transition.success_title', 'Modo atualizado!'),
        description: newPhase === 'menstruating'
          ? t('transition.postpartum_success', 'Parabéns pela chegada do bebê! 🎉 Seu modo foi atualizado.')
          : t('transition.menopause_success', 'Seu modo foi atualizado para menopausa.'),
      });

      window.dispatchEvent(new Event('profile-updated'));
    } catch (err) {
      console.error('Transition error:', err);
      toast({ variant: 'destructive', title: t('transition.error', 'Erro ao atualizar modo') });
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };

  // Show postpartum transition for pregnant users >= 37 weeks
  if (lifePhase === 'pregnant' && pregnancyWeeks !== null && pregnancyWeeks >= 37) {
    return (
      <>
        <div className="px-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                    <Baby className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-sm">
                      {t('transition.postpartum_title', 'Bebê já chegou?')}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('transition.postpartum_desc', 'Quando seu bebê nascer, troque para o modo pós-parto para acompanhar sua recuperação e ciclo.')}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 gap-1.5 text-xs"
                      onClick={() => setShowConfirm('postpartum')}
                    >
                      {t('transition.switch_postpartum', 'Mudei para pós-parto')}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <AlertDialog open={showConfirm === 'postpartum'} onOpenChange={() => setShowConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('transition.confirm_postpartum_title', 'Confirmar transição')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('transition.confirm_postpartum_desc', 'Isso vai ativar o modo pós-parto com acompanhamento de recuperação e amamentação. Os dados da gestação serão mantidos.')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleTransition('postpartum')} disabled={loading}>
                {t('actions.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Show menopause confirmation for menstruating users age >= 45 with irregular cycles
  // This is a subtle suggestion, not forced
  if (lifePhase === 'menstruating') {
    return null; // Menopause transition is handled in profile settings
  }

  return null;
};

export default LifePhaseTransitionCard;
