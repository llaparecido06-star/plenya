import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toLocalDateString } from '@/lib/dateUtils';

export const usePregnancyDiarySymptoms = () => {
  const { user } = useAuth();
  const [symptoms, setSymptoms] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchRecent = async () => {
      const today = toLocalDateString(new Date());
      const { data } = await supabase
        .from('pregnancy_diary')
        .select('symptoms')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(3);

      if (data) {
        const allSymptoms = data.flatMap(d => d.symptoms || []);
        setSymptoms([...new Set(allSymptoms)]);
      }
    };
    fetchRecent();
  }, [user]);

  return { symptoms };
};
