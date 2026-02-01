import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useAvatar = () => {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAvatar = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching avatar:', error);
        return;
      }

      setAvatarUrl(data?.avatar_url ?? null);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAvatar();
  }, [fetchAvatar]);

  const updateAvatarUrl = (url: string | null) => {
    setAvatarUrl(url);
  };

  return {
    avatarUrl,
    loading,
    updateAvatarUrl,
    refetch: fetchAvatar,
  };
};
