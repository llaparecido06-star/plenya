import { useState, useEffect, useCallback } from 'react';
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
  });

  // Check for notification support
  useEffect(() => {
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    setSupported(isSupported);
    
    if (isSupported) {
      setPermission(Notification.permission);
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
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        toast({
          title: 'Notificações ativadas! 🔔',
          description: 'Você receberá lembretes personalizados.',
        });
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
    updateSettings,
    showNotification,
  };
};
