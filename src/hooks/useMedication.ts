import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface MedicationData {
  medication_name: string | null;
  medication_type: string | null;
  medication_last_taken: string | null;
  medication_frequency_days: number | null;
}

export const useMedication = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<MedicationData>({
    medication_name: null,
    medication_type: null,
    medication_last_taken: null,
    medication_frequency_days: null,
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
          .select('medication_name, medication_type, medication_last_taken, medication_frequency_days')
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
            medication_last_taken: (profile as any).medication_last_taken as string | null,
            medication_frequency_days: (profile as any).medication_frequency_days as number | null,
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

        setData(prev => ({ ...prev, medication_name: name, medication_type: type }));
        
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

  // Save last taken date
  const saveLastTaken = useCallback(
    async (date: string | null) => {
      if (!user) return false;
      setSaving(true);
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ medication_last_taken: date } as any)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error saving last taken:', error);
          toast({ title: 'Erro ao salvar', variant: 'destructive' });
          return false;
        }

        setData(prev => ({ ...prev, medication_last_taken: date }));
        toast({ title: 'Data registrada! ✅' });
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

  // Save frequency
  const saveFrequency = useCallback(
    async (days: number | null) => {
      if (!user) return false;
      setSaving(true);
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ medication_frequency_days: days } as any)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error saving frequency:', error);
          return false;
        }

        setData(prev => ({ ...prev, medication_frequency_days: days }));
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
    medicationLastTaken: data.medication_last_taken,
    medicationFrequencyDays: data.medication_frequency_days,
    loading,
    saving,
    saveMedication,
    saveLastTaken,
    saveFrequency,
    isAuthenticated: !!user,
  };
};
