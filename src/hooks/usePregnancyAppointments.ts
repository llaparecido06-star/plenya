import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  trimester: number;
  recommended_week: number | null;
  is_completed: boolean;
  completed_at: string | null;
  appointment_date: string | null;
  notes: string | null;
  is_custom: boolean;
}

const DEFAULT_APPOINTMENTS = [
  // 1st Trimester
  { title: 'pregnancy.apt_first_visit', description: 'pregnancy.apt_first_visit_desc', trimester: 1, recommended_week: 6 },
  { title: 'pregnancy.apt_blood_tests', description: 'pregnancy.apt_blood_tests_desc', trimester: 1, recommended_week: 8 },
  { title: 'pregnancy.apt_first_ultrasound', description: 'pregnancy.apt_first_ultrasound_desc', trimester: 1, recommended_week: 12 },
  { title: 'pregnancy.apt_nt_scan', description: 'pregnancy.apt_nt_scan_desc', trimester: 1, recommended_week: 12 },
  // 2nd Trimester
  { title: 'pregnancy.apt_morphological', description: 'pregnancy.apt_morphological_desc', trimester: 2, recommended_week: 20 },
  { title: 'pregnancy.apt_glucose_test', description: 'pregnancy.apt_glucose_test_desc', trimester: 2, recommended_week: 24 },
  { title: 'pregnancy.apt_sex_reveal', description: 'pregnancy.apt_sex_reveal_desc', trimester: 2, recommended_week: 16 },
  // 3rd Trimester
  { title: 'pregnancy.apt_gbs_test', description: 'pregnancy.apt_gbs_test_desc', trimester: 3, recommended_week: 35 },
  { title: 'pregnancy.apt_birth_plan', description: 'pregnancy.apt_birth_plan_desc', trimester: 3, recommended_week: 36 },
  { title: 'pregnancy.apt_ctg', description: 'pregnancy.apt_ctg_desc', trimester: 3, recommended_week: 38 },
];

export const usePregnancyAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from('pregnancy_appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('trimester', { ascending: true })
        .order('recommended_week', { ascending: true });

      if (data && data.length > 0) {
        setAppointments(data as Appointment[]);
      } else {
        // Seed default appointments
        const toInsert = DEFAULT_APPOINTMENTS.map(a => ({
          ...a,
          user_id: user.id,
          is_custom: false,
        }));
        const { data: inserted } = await supabase
          .from('pregnancy_appointments')
          .insert(toInsert)
          .select();
        if (inserted) setAppointments(inserted as Appointment[]);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const toggleComplete = async (id: string) => {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;
    const newVal = !apt.is_completed;
    await supabase
      .from('pregnancy_appointments')
      .update({ is_completed: newVal, completed_at: newVal ? new Date().toISOString() : null })
      .eq('id', id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, is_completed: newVal, completed_at: newVal ? new Date().toISOString() : null } : a));
  };

  return { appointments, loading, toggleComplete, refetch: fetchAppointments };
};
