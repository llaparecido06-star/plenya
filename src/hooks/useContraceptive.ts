import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ContraceptiveData {
  contraceptive_type: string | null;
  contraceptive_brand: string | null;
  contraceptive_start_date: string | null;
  pill_reminder_time: string | null;
}

export const useContraceptive = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<ContraceptiveData>({
    contraceptive_type: null,
    contraceptive_brand: null,
    contraceptive_start_date: null,
    pill_reminder_time: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch contraceptive data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('contraceptive_type, contraceptive_brand, contraceptive_start_date, pill_reminder_time')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching contraceptive data:', error);
          return;
        }

        if (profile) {
          setData({
            contraceptive_type: profile.contraceptive_type as string | null,
            contraceptive_brand: profile.contraceptive_brand as string | null,
            contraceptive_start_date: profile.contraceptive_start_date as string | null,
            pill_reminder_time: profile.pill_reminder_time as string | null,
          });
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Save contraceptive settings
  const saveSettings = useCallback(
    async (settings: Partial<ContraceptiveData>) => {
      if (!user) {
        toast({
          title: 'Faça login',
          description: 'Você precisa estar logada para salvar.',
          variant: 'destructive',
        });
        return false;
      }

      setSaving(true);

      try {
        const { error } = await supabase
          .from('profiles')
          .update(settings)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error saving settings:', error);
          toast({
            title: 'Erro ao salvar',
            description: 'Não foi possível salvar as configurações.',
            variant: 'destructive',
          });
          return false;
        }

        setData(prev => ({ ...prev, ...settings }));
        
        toast({
          title: 'Configurações salvas! ✅',
          description: 'Seu método contraceptivo foi atualizado.',
        });

        return true;
      } catch (err) {
        console.error('Error:', err);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [user, toast]
  );

  return {
    ...data,
    loading,
    saving,
    saveSettings,
    isAuthenticated: !!user,
  };
};
