import { useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const NotificationPrompt = () => {
  const requestPermission = useCallback(async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.requestPermissions();
      } else if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    } catch (e) {
      console.log('Notification permission request failed:', e);
    }
  }, []);

  useEffect(() => {
    // Small delay so it doesn't block initial render
    const timer = setTimeout(requestPermission, 2000);
    return () => clearTimeout(timer);
  }, [requestPermission]);

  return null;
};

export default NotificationPrompt;
