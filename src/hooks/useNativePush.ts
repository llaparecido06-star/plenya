import { useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useNativePush = () => {
  const { user } = useAuth();
  const isNative = Capacitor.isNativePlatform();
  const initialized = useRef(false);

  // Register for remote push notifications (FCM/APNs)
  const register = useCallback(async () => {
    if (!isNative || initialized.current) return;

    try {
      const permResult = await PushNotifications.requestPermissions();
      if (permResult.receive !== 'granted') {
        console.log('[NativePush] Permission denied');
        return;
      }

      await PushNotifications.register();

      // Also request local notification permission
      await LocalNotifications.requestPermissions();

      initialized.current = true;
    } catch (e) {
      console.error('[NativePush] Registration error:', e);
    }
  }, [isNative]);

  // Save token to database
  const saveToken = useCallback(async (token: string) => {
    if (!user) return;
    const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
    
    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        { user_id: user.id, token, platform },
        { onConflict: 'user_id,token' }
      );

    if (error) {
      console.error('[NativePush] Failed to save token:', error);
    } else {
      console.log('[NativePush] Token saved for', platform);
    }
  }, [user]);

  useEffect(() => {
    if (!isNative || !user) return;

    const tokenListener = PushNotifications.addListener('registration', async (token) => {
      console.log('[NativePush] Token:', token.value);
      await saveToken(token.value);
    });

    const receivedListener = PushNotifications.addListener(
      'pushNotificationReceived',
      (notification) => {
        console.log('[NativePush] Foreground:', notification);
      }
    );

    const actionListener = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action) => {
        console.log('[NativePush] Tapped:', action);
        const data = action.notification.data;
        if (data?.route) {
          window.location.href = data.route;
        }
      }
    );

    const errorListener = PushNotifications.addListener('registrationError', (error) => {
      console.error('[NativePush] Error:', error);
    });

    // Listen for local notification actions
    const localActionListener = LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (action) => {
        console.log('[LocalNotif] Tapped:', action);
        const data = action.notification.extra;
        if (data?.route) {
          window.location.href = data.route;
        }
      }
    );

    register();

    return () => {
      tokenListener.then(l => l.remove());
      receivedListener.then(l => l.remove());
      actionListener.then(l => l.remove());
      errorListener.then(l => l.remove());
      localActionListener.then(l => l.remove());
    };
  }, [isNative, user, register, saveToken]);

  // Schedule a local notification at a specific time
  const scheduleLocal = useCallback(async (opts: {
    id: number;
    title: string;
    body: string;
    at: Date;
    repeat?: boolean;
    every?: 'day' | 'week' | 'month';
    extra?: Record<string, string>;
  }) => {
    if (!isNative) return;

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: opts.id,
            title: opts.title,
            body: opts.body,
            schedule: {
              at: opts.at,
              repeats: opts.repeat || false,
              every: opts.every,
              allowWhileIdle: true,
            },
            sound: 'default',
            smallIcon: 'ic_notification',
            largeIcon: 'ic_launcher',
            extra: opts.extra || {},
          },
        ],
      });
      console.log(`[LocalNotif] Scheduled #${opts.id}: "${opts.title}" at ${opts.at.toISOString()}`);
    } catch (e) {
      console.error('[LocalNotif] Schedule error:', e);
    }
  }, [isNative]);

  // Cancel a scheduled local notification
  const cancelLocal = useCallback(async (id: number) => {
    if (!isNative) return;
    try {
      await LocalNotifications.cancel({ notifications: [{ id }] });
    } catch (e) {
      console.error('[LocalNotif] Cancel error:', e);
    }
  }, [isNative]);

  // Schedule daily pill reminder (repeating)
  const schedulePillReminder = useCallback(async (time: string) => {
    if (!isNative) return;
    const [hours, minutes] = time.split(':').map(Number);
    const at = new Date();
    at.setHours(hours, minutes, 0, 0);
    if (at <= new Date()) at.setDate(at.getDate() + 1);

    await scheduleLocal({
      id: 1001,
      title: '💊 Hora da pílula!',
      body: 'Não esqueça de tomar sua pílula anticoncepcional.',
      at,
      repeat: true,
      every: 'day',
      extra: { route: '/' },
    });
  }, [isNative, scheduleLocal]);

  // Schedule period prediction reminder
  const schedulePeriodReminder = useCallback(async (predictedDate: Date) => {
    if (!isNative) return;
    const reminderDate = new Date(predictedDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(9, 0, 0, 0);

    if (reminderDate <= new Date()) return;

    await scheduleLocal({
      id: 2001,
      title: '🩸 Menstruação prevista para amanhã',
      body: 'Prepare-se! Sua menstruação deve começar amanhã.',
      at: reminderDate,
      extra: { route: '/' },
    });
  }, [isNative, scheduleLocal]);

  // Schedule fertile window reminder
  const scheduleFertileReminder = useCallback(async (fertileStart: Date) => {
    if (!isNative) return;
    const at = new Date(fertileStart);
    at.setHours(9, 0, 0, 0);

    if (at <= new Date()) return;

    await scheduleLocal({
      id: 3001,
      title: '🌸 Janela fértil começando!',
      body: 'Seu período fértil começa hoje. Fique atenta aos sinais do seu corpo.',
      at,
      extra: { route: '/' },
    });
  }, [isNative, scheduleLocal]);

  // Schedule injection/ring/patch reminder
  const scheduleContraceptiveReminder = useCallback(async (nextDate: Date, method: string) => {
    if (!isNative) return;
    const reminderDate = new Date(nextDate);
    reminderDate.setDate(reminderDate.getDate() - 2);
    reminderDate.setHours(10, 0, 0, 0);

    if (reminderDate <= new Date()) return;

    await scheduleLocal({
      id: 4001,
      title: `🛡️ ${method} em 2 dias`,
      body: `Sua próxima aplicação de ${method.toLowerCase()} é em 2 dias.`,
      at: reminderDate,
      extra: { route: '/perfil' },
    });
  }, [isNative, scheduleLocal]);

  // Schedule recipe reminder (repeating daily)
  const scheduleRecipeReminder = useCallback(async (time: string) => {
    if (!isNative) return;
    const [hours, minutes] = time.split(':').map(Number);
    const at = new Date();
    at.setHours(hours, minutes, 0, 0);
    if (at <= new Date()) at.setDate(at.getDate() + 1);

    await scheduleLocal({
      id: 5001,
      title: '👩‍🍳 Hora de cozinhar!',
      body: 'Confira a receita do dia adaptada para sua fase do ciclo!',
      at,
      repeat: true,
      every: 'day',
      extra: { route: '/nutricao' },
    });
  }, [isNative, scheduleLocal]);

  return {
    isNative,
    register,
    scheduleLocal,
    cancelLocal,
    schedulePillReminder,
    schedulePeriodReminder,
    scheduleFertileReminder,
    scheduleContraceptiveReminder,
    scheduleRecipeReminder,
  };
};
