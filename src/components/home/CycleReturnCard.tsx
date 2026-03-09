import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLifePhase } from '@/hooks/useLifePhase';
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

const CycleReturnCard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { postpartumWeeks } = useLifePhase();
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReturnToCycle = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          life_phase: 'menstruating',
          pregnancy_start_date: null,
          last_period_start: new Date().toISOString().split('T')[0],
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: t('postpartum.cycle_returned_title', 'Ciclo de volta! 🌸'),
        description: t('postpartum.cycle_returned_desc', 'Seu modo foi atualizado. Registramos hoje como o primeiro dia do ciclo.'),
      });
      window.dispatchEvent(new Event('profile-updated'));
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: t('transition.error', 'Erro ao atualizar modo') });
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  // Show after 4 weeks postpartum
  if (postpartumWeeks !== null && postpartumWeeks < 4) return null;

  return (
    <>
      <div className="px-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {t('postpartum.cycle_return_title', 'Menstruação voltou?')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                {t('postpartum.cycle_return_desc', 'Quando sua menstruação retornar, mude para o modo ciclo para acompanhar suas fases novamente.')}
              </p>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowConfirm(true)}>
                {t('postpartum.switch_to_cycle', 'Minha menstruação voltou')}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('postpartum.confirm_cycle_title', 'Confirmar retorno do ciclo')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('postpartum.confirm_cycle_desc', 'Isso ativará o acompanhamento do ciclo menstrual. A data de hoje será registrada como primeiro dia. Seus dados de pós-parto serão mantidos.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleReturnToCycle} disabled={loading}>
              {t('actions.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CycleReturnCard;
