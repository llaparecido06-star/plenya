import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface MedicationData {
  medication_name: string | null;
  medication_type: string | null;
}

export const useMedication = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<MedicationData>({
    medication_name: null,
    medication_type: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch medication data
  useEffect(() => {
    const fetchMedication = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('medication_name, medication_type')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching medication:', error);
          return;
        }

        if (profile) {
          setData({
            medication_name: profile.medication_name as string | null,
            medication_type: profile.medication_type as string | null,
          });
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMedication();
  }, [user]);

  // Save medication
  const saveMedication = useCallback(
    async (name: string | null, type: string | null) => {
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
          .update({
            medication_name: name,
            medication_type: type,
          })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error saving medication:', error);
          toast({
            title: 'Erro ao salvar',
            description: 'Não foi possível salvar o medicamento.',
            variant: 'destructive',
          });
          return false;
        }

        setData({ medication_name: name, medication_type: type });
        
        toast({
          title: name ? 'Medicamento salvo!' : 'Medicamento removido!',
          description: name 
            ? `${name} foi configurado como seu método contraceptivo.`
            : 'Você removeu o método contraceptivo.',
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
    medicationName: data.medication_name,
    medicationType: data.medication_type,
    loading,
    saving,
    saveMedication,
    isAuthenticated: !!user,
  };
};
