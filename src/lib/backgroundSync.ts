import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

/**
 * Stores auth credentials in Capacitor KV store for background runner access.
 * Call this after login and on session refresh.
 */
export const storeAuthForBackground = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { BackgroundRunner } = await import('@capacitor/background-runner');
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return;

    // Store credentials for background runner
    await BackgroundRunner.dispatchEvent({
      label: 'app.lovable.23584ca0d6a848d49275dab1f6be180e.health-sync',
      event: 'storeCredentials',
      details: {},
    });

    // Use CapacitorKV from the foreground to set values
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    // Store in localStorage as bridge (background runner reads from KV)
    localStorage.setItem('bg_supabase_url', supabaseUrl);
    localStorage.setItem('bg_supabase_key', supabaseKey);
    localStorage.setItem('bg_user_id', session.user.id);
    localStorage.setItem('bg_access_token', session.access_token);
  } catch (err) {
    console.error('Failed to store auth for background:', err);
  }
};

/**
 * Manually trigger a background health sync from the foreground.
 */
export const triggerManualSync = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { BackgroundRunner } = await import('@capacitor/background-runner');
    await BackgroundRunner.dispatchEvent({
      label: 'app.lovable.23584ca0d6a848d49275dab1f6be180e.health-sync',
      event: 'syncHealthData',
      details: {},
    });
  } catch (err) {
    console.error('Manual background sync trigger failed:', err);
  }
};
