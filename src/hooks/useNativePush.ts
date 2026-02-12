import { useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useNativePush = () => {
  const { user } = useAuth();
  const isNative = Capacitor.isNativePlatform();
  const initialized = useRef(false);

  const register = useCallback(async () => {
    if (!isNative || initialized.current) return;

    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') {
      console.log('[NativePush] Permission denied');
      return;
    }

    await PushNotifications.register();
    initialized.current = true;
  }, [isNative]);

  useEffect(() => {
    if (!isNative || !user) return;

    // Listen for registration success
    const tokenListener = PushNotifications.addListener('registration', async (token) => {
      console.log('[NativePush] Token:', token.value);
      // Store token in user profile for server-side sends
      // You could store this in a push_tokens table
    });

    // Listen for push received while app is open
    const receivedListener = PushNotifications.addListener(
      'pushNotificationReceived',
      (notification) => {
        console.log('[NativePush] Received in foreground:', notification);
      }
    );

    // Listen for push action (user tapped notification)
    const actionListener = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action) => {
        console.log('[NativePush] Action performed:', action);
        // Navigate based on notification data
        const data = action.notification.data;
        if (data?.route) {
          window.location.href = data.route;
        }
      }
    );

    // Listen for registration error
    const errorListener = PushNotifications.addListener('registrationError', (error) => {
      console.error('[NativePush] Registration error:', error);
    });

    register();

    return () => {
      tokenListener.then(l => l.remove());
      receivedListener.then(l => l.remove());
      actionListener.then(l => l.remove());
      errorListener.then(l => l.remove());
    };
  }, [isNative, user, register]);

  const scheduleLocal = useCallback(async (
    title: string,
    body: string,
    id: number = Date.now()
  ) => {
    if (!isNative) return;
    
    // For local notifications on native, use @capacitor/local-notifications
    // This hook focuses on remote push; local scheduling falls back to web API
    console.log('[NativePush] Local notification:', { title, body, id });
  }, [isNative]);

  return {
    isNative,
    register,
    scheduleLocal,
  };
};
