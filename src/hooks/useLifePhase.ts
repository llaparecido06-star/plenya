import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { parseLocalDate } from '@/lib/dateUtils';

export type LifePhase = 'menstruating' | 'pregnant' | 'menopause' | 'postpartum';

interface LifePhaseData {
  lifePhase: LifePhase | null;
  pregnancyStartDate: Date | null;
  pregnancyWeeks: number | null;
  postpartumWeeks: number | null;
  isTryingToConceive: boolean;
  dateOfBirth: Date | null;
  age: number | null;
  loading: boolean;
}

export const useLifePhase = (): LifePhaseData => {
  const { user } = useAuth();
  const [data, setData] = useState<Omit<LifePhaseData, 'loading'>>({
    lifePhase: null,
    pregnancyStartDate: null,
    pregnancyWeeks: null,
    isTryingToConceive: false,
    dateOfBirth: null,
    age: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLifePhase = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('life_phase, pregnancy_start_date, is_trying_to_conceive, date_of_birth')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching life phase:', error);
          return;
        }

        if (profile) {
          const pregnancyStartDate = profile.pregnancy_start_date 
            ? parseLocalDate(profile.pregnancy_start_date) 
            : null;
          
          const dateOfBirth = profile.date_of_birth 
            ? parseLocalDate(profile.date_of_birth) 
            : null;

          // Calculate pregnancy weeks
          let pregnancyWeeks: number | null = null;
          if (profile.life_phase === 'pregnant' && pregnancyStartDate) {
            const daysSinceStart = Math.floor(
              (Date.now() - pregnancyStartDate.getTime()) / (24 * 60 * 60 * 1000)
            );
            pregnancyWeeks = Math.floor(daysSinceStart / 7);
          }

          // Calculate age
          let age: number | null = null;
          if (dateOfBirth) {
            const today = new Date();
            age = today.getFullYear() - dateOfBirth.getFullYear();
            const monthDiff = today.getMonth() - dateOfBirth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
              age--;
            }
          }

          setData({
            lifePhase: profile.life_phase as LifePhase | null,
            pregnancyStartDate,
            pregnancyWeeks,
            isTryingToConceive: profile.is_trying_to_conceive ?? false,
            dateOfBirth,
            age,
          });
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLifePhase();
  }, [user]);

  return { ...data, loading };
};
