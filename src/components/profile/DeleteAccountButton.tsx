import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const DeleteAccountButton: React.FC = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  const confirmWord = t('delete_account.confirm_word');

  const handleDelete = async () => {
    if (!user || confirmation !== confirmWord) return;
    setLoading(true);
    try {
      // Delete all user data from every table
      const tables = [
        'daily_logs', 'menstruation_logs', 'intimacy_logs', 'nutrition_intake',
        'workouts', 'pill_logs', 'chat_messages', 'login_streaks',
        'contraceptive_history', 'recipe_history', 'push_tokens',
        'hot_flash_logs', 'cycle_diary', 'breastfeeding_logs', 'kick_logs',
        'menopause_diary', 'menopause_exams', 'pregnancy_diary',
        'pregnancy_appointments', 'alert_logs', 'monthly_reports',
        'postpartum_logs', 'profiles',
      ];
      for (const table of tables) {
        await supabase.from(table as any).delete().eq('user_id', user.id);
      }

      await signOut();
      toast.success(t('delete_account.success'));
      navigate('/auth');
    } catch (error) {
      toast.error(t('delete_account.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full gap-2">
          <Trash2 className="w-4 h-4" />
          {t('delete_account.button')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('delete_account.title')}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>{t('delete_account.warning')}</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>{t('delete_account.data_cycle')}</li>
              <li>{t('delete_account.data_nutrition')}</li>
              <li>{t('delete_account.data_chat')}</li>
              <li>{t('delete_account.data_settings')}</li>
            </ul>
            <p className="pt-2">
              {t('delete_account.type_confirm', { word: confirmWord })}
            </p>
            <Input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={confirmWord}
              className="mt-2"
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmation('')}>{t('actions.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={confirmation !== confirmWord || loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
            {t('delete_account.confirm_button')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountButton;
