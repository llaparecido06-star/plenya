import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettings {
  pillReminder: boolean;
  pillReminderTime: string;
  fertileWindow: boolean;
  nextInjection: boolean;
  recipeReminder: boolean;
  recipeReminderTime: string;
  trialExpiration: boolean;
  pmsAlert: boolean;
  hydrationAlert: boolean;
  phaseChangeAlert: boolean;
  ovulationAlert: boolean;
  latePeriodAlert: boolean;
}

const NOTIFICATION_SETTINGS_KEY = 'plenya_notification_settings';

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    pillReminder: false,
    pillReminderTime: '08:00',
    fertileWindow: false,
    nextInjection: false,
    recipeReminder: false,
    recipeReminderTime: '11:00',
    trialExpiration: true,
    pmsAlert: true,
    hydrationAlert: true,
    phaseChangeAlert: true,
    ovulationAlert: true,
    latePeriodAlert: true,
  });

  // Check for notification support (web or native)
  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    const isWebSupported = 'Notification' in window && 'serviceWorker' in navigator;
    setSupported(isNative || isWebSupported);
    
    if (isWebSupported && !isNative) {
      setPermission(Notification.permission);
    } else if (isNative) {
      setPermission('granted'); // Native handles its own permission flow
    }

    // Load saved settings
    const saved = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Error loading notification settings:', e);
      }
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!supported) {
      toast({
        title: 'Não suportado',
        description: 'Seu navegador não suporta notificações push.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const isNative = Capacitor.isNativePlatform();
      
      if (isNative) {
        const result = await LocalNotifications.requestPermissions();
        const granted = result.display === 'granted';
        setPermission(granted ? 'granted' : 'denied');
        if (granted) {
          toast({ title: 'Notificações ativadas! 🔔', description: 'Você receberá lembretes personalizados.' });
        }
        return granted;
      }

      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        toast({ title: 'Notificações ativadas! 🔔', description: 'Você receberá lembretes personalizados.' });
        return true;
      } else {
        toast({
          title: 'Permissão negada',
          description: 'Você pode ativar notificações nas configurações do navegador.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [supported, toast]);

  // Register service worker
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!supported) return null;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }, [supported]);

  // Schedule a notification
  const scheduleNotification = useCallback(async (
    title: string,
    body: string,
    scheduledTime: Date,
    tag: string
  ) => {
    if (permission !== 'granted') {
      console.log('Notifications not permitted');
      return;
    }

    const now = new Date();
    const delay = scheduledTime.getTime() - now.getTime();

    if (delay <= 0) {
      console.log('Scheduled time is in the past');
      return;
    }

    // For web, we'll use setTimeout as a simple scheduler
    // In production, this would use a service worker with Background Sync API
    setTimeout(() => {
      if (document.visibilityState === 'hidden') {
        new Notification(title, {
          body,
          icon: '/icon.png',
          badge: '/icon.png',
          tag,
          requireInteraction: true,
        });
      }
    }, delay);

    console.log(`Notification scheduled for ${scheduledTime.toISOString()}`);
  }, [permission]);

  // Schedule daily pill reminder
  const schedulePillReminder = useCallback(async (time: string) => {
    if (permission !== 'granted') return;

    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const scheduled = new Date(now);
    scheduled.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }

    await scheduleNotification(
      '💊 Hora da pílula!',
      'Não esqueça de tomar sua pílula anticoncepcional.',
      scheduled,
      'pill-reminder'
    );
  }, [permission, scheduleNotification]);

  // Schedule recipe reminder
  const scheduleRecipeReminder = useCallback(async (time: string, recipeName?: string) => {
    if (permission !== 'granted') return;

    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const scheduled = new Date(now);
    scheduled.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }

    const body = recipeName 
      ? `Que tal preparar "${recipeName}" hoje? Receita adaptada para sua fase!`
      : 'Confira a receita do dia adaptada para sua fase do ciclo!';

    await scheduleNotification(
      '👩‍🍳 Hora de cozinhar!',
      body,
      scheduled,
      'recipe-reminder'
    );
  }, [permission, scheduleNotification]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Show immediate notification
  const showNotification = useCallback((title: string, body: string, tag?: string) => {
    if (permission !== 'granted') return;

    new Notification(title, {
      body,
      icon: '/icon.png',
      badge: '/icon.png',
      tag: tag || 'general',
    });
  }, [permission]);

  // Schedule trial expiration reminder (2 days before)
  const scheduleTrialExpirationReminder = useCallback(async (subscriptionEnd: string | null) => {
    if (permission !== 'granted' || !subscriptionEnd || !settings.trialExpiration) return;

    const endDate = new Date(subscriptionEnd);
    const reminderDate = new Date(endDate);
    reminderDate.setDate(reminderDate.getDate() - 2);
    reminderDate.setHours(10, 0, 0, 0); // 10:00 AM

    const now = new Date();
    if (reminderDate <= now || reminderDate >= endDate) return;

    await scheduleNotification(
      '⏰ Seu trial Premium expira em 2 dias!',
      'Aproveite para assinar e continuar com acesso ao Chef IA, relatórios e muito mais.',
      reminderDate,
      'trial-expiration'
    );
    console.log(`Trial expiration reminder scheduled for ${reminderDate.toISOString()}`);
  }, [permission, settings.trialExpiration, scheduleNotification]);

  // Schedule PMS alert (3 days before predicted period)
  const schedulePMSAlert = useCallback(async (predictedPeriodDate: Date) => {
    if (permission !== 'granted' || !settings.pmsAlert) return;

    const alertDate = new Date(predictedPeriodDate);
    alertDate.setDate(alertDate.getDate() - 3);
    alertDate.setHours(9, 0, 0, 0);

    const now = new Date();
    if (alertDate <= now) return;

    await scheduleNotification(
      '🌙 TPM se aproximando',
      'Sua TPM pode começar em 3 dias. Priorize magnésio, sono e exercícios leves.',
      alertDate,
      'pms-alert'
    );
  }, [permission, settings.pmsAlert, scheduleNotification]);

  // Schedule fertile window alert
  const scheduleFertileWindowAlert = useCallback(async (fertileStartDate: Date) => {
    if (permission !== 'granted' || !settings.fertileWindow) return;

    const alertDate = new Date(fertileStartDate);
    alertDate.setDate(alertDate.getDate() - 1);
    alertDate.setHours(9, 0, 0, 0);

    const now = new Date();
    if (alertDate <= now) return;

    await scheduleNotification(
      '🌸 Janela fértil amanhã',
      'Sua janela de fertilidade começa amanhã. Fique atenta aos sinais do seu corpo.',
      alertDate,
      'fertile-window-alert'
    );
  }, [permission, settings.fertileWindow, scheduleNotification]);

  // Schedule hydration reminder for luteal phase
  const scheduleHydrationAlert = useCallback(async (lutealStartDate: Date) => {
    if (permission !== 'granted' || !settings.hydrationAlert) return;

    const alertDate = new Date(lutealStartDate);
    alertDate.setHours(10, 0, 0, 0);

    const now = new Date();
    if (alertDate <= now) return;

    await scheduleNotification(
      '💧 Hidratação na fase lútea',
      'Na fase lútea seu corpo retém mais líquidos. Beba bastante água para reduzir inchaço.',
      alertDate,
      'hydration-alert'
    );
  }, [permission, settings.hydrationAlert, scheduleNotification]);

  // Schedule ovulation alert (same day)
  const scheduleOvulationAlert = useCallback(async (ovulationDate: Date) => {
    if (permission !== 'granted' || !settings.ovulationAlert) return;

    const alertDate = new Date(ovulationDate);
    alertDate.setHours(8, 30, 0, 0);

    const now = new Date();
    if (alertDate <= now) return;

    await scheduleNotification(
      '✨ Dia da ovulação',
      'Hoje pode ser o pico da sua janela fértil. Observe seu corpo e registre sinais importantes.',
      alertDate,
      'ovulation-alert'
    );
  }, [permission, settings.ovulationAlert, scheduleNotification]);

  // Schedule late period alert (1 day after expected date)
  const scheduleLatePeriodAlert = useCallback(async (expectedPeriodDate: Date) => {
    if (permission !== 'granted' || !settings.latePeriodAlert) return;

    const alertDate = new Date(expectedPeriodDate);
    alertDate.setDate(alertDate.getDate() + 1);
    alertDate.setHours(9, 0, 0, 0);

    const now = new Date();
    if (alertDate <= now) return;

    await scheduleNotification(
      '⚠️ Menstruação em atraso',
      'Sua menstruação não foi registrada na data prevista. Se já começou, registre no app para recalcular seu ciclo.',
      alertDate,
      'late-period-alert'
    );
  }, [permission, settings.latePeriodAlert, scheduleNotification]);

  return {
    supported,
    permission,
    settings,
    requestPermission,
    registerServiceWorker,
    scheduleNotification,
    schedulePillReminder,
    scheduleRecipeReminder,
    scheduleTrialExpirationReminder,
    schedulePMSAlert,
    scheduleFertileWindowAlert,
    scheduleHydrationAlert,
    updateSettings,
    showNotification,
  };
};
