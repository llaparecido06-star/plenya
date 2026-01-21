import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type TutorialKey = 'home' | 'nutrition' | 'body' | 'mind';

interface TutorialProgress {
  home: boolean;
  nutrition: boolean;
  body: boolean;
  mind: boolean;
}

const DEFAULT_PROGRESS: TutorialProgress = {
  home: false,
  nutrition: false,
  body: false,
  mind: false,
};

export const useTutorial = (tutorialKey: TutorialKey) => {
  const { user } = useAuth();
  const [shouldShowTutorial, setShouldShowTutorial] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkTutorialStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('tutorial_progress')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching tutorial progress:', error);
          setIsLoading(false);
          return;
        }

        const rawProgress = data?.tutorial_progress as unknown as TutorialProgress | null;
        const progress = rawProgress || DEFAULT_PROGRESS;
        const hasCompleted = progress[tutorialKey] === true;
        
        setShouldShowTutorial(!hasCompleted);
      } catch (err) {
        console.error('Error checking tutorial status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkTutorialStatus();
  }, [user, tutorialKey]);

  const completeTutorial = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('complete_tutorial', {
        tutorial_key: tutorialKey,
      });

      if (error) {
        console.error('Error completing tutorial:', error);
        return;
      }

      setShouldShowTutorial(false);
    } catch (err) {
      console.error('Error completing tutorial:', err);
    }
  }, [user, tutorialKey]);

  return {
    shouldShowTutorial,
    isLoading,
    completeTutorial,
  };
};
