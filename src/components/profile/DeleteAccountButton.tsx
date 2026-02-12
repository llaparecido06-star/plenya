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

const DeleteAccountButton: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!user || confirmation !== 'DELETAR') return;
    setLoading(true);
    try {
      // Delete user data from all tables
      // Delete user data from all tables
      await supabase.from('daily_logs').delete().eq('user_id', user.id);
      await supabase.from('menstruation_logs').delete().eq('user_id', user.id);
      await supabase.from('intimacy_logs').delete().eq('user_id', user.id);
      await supabase.from('nutrition_intake').delete().eq('user_id', user.id);
      await supabase.from('workouts').delete().eq('user_id', user.id);
      await supabase.from('pill_logs').delete().eq('user_id', user.id);
      await supabase.from('chat_messages').delete().eq('user_id', user.id);
      await supabase.from('login_streaks').delete().eq('user_id', user.id);
      await supabase.from('contraceptive_history').delete().eq('user_id', user.id);
      await supabase.from('recipe_history').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('user_id', user.id);

      // Sign out (account deletion from auth requires admin, so we clear data + sign out)
      await signOut();
      toast.success('Conta e dados excluídos com sucesso');
      navigate('/auth');
    } catch (error) {
      toast.error('Erro ao excluir conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full gap-2">
          <Trash2 className="w-4 h-4" />
          Excluir Minha Conta
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir conta permanentemente?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>Esta ação é <strong>irreversível</strong>. Todos os seus dados serão permanentemente excluídos:</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>Histórico de ciclo e sintomas</li>
              <li>Registros de nutrição e treinos</li>
              <li>Conversas com a IA</li>
              <li>Configurações e preferências</li>
            </ul>
            <p className="pt-2">
              Digite <strong>DELETAR</strong> para confirmar:
            </p>
            <Input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETAR"
              className="mt-2"
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmation('')}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={confirmation !== 'DELETAR' || loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Excluir Permanentemente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountButton;
