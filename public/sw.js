// Plenya Push Notification Service Worker

const CACHE_NAME = 'plenya-v1';
const NOTIFICATION_TAGS = {
  PILL: 'pill-reminder',
  FERTILE: 'fertile-window',
  INJECTION: 'injection-reminder',
  PERIOD: 'period-prediction',
};

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...');
  event.waitUntil(clients.claim());
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let data = {
    title: 'Plenya',
    body: 'Você tem uma nova notificação',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: 'general',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'dismiss', title: 'Dispensar' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open app on notification click
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Background sync for scheduled notifications
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'check-reminders') {
    event.waitUntil(checkScheduledReminders());
  }
});

// Check for scheduled reminders
async function checkScheduledReminders() {
  try {
    // This would typically check IndexedDB or communicate with the main app
    // For now, it's a placeholder for the background sync logic
    console.log('[SW] Checking scheduled reminders...');
  } catch (error) {
    console.error('[SW] Error checking reminders:', error);
  }
}

// Periodic background sync (for browsers that support it)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);

  if (event.tag === 'daily-reminders') {
    event.waitUntil(checkScheduledReminders());
  }
});
