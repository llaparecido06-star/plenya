import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const NotificationPrompt = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('plenya_notif_banner_dismissed');
    if (dismissed) return;

    const timer = setTimeout(() => {
      if (Capacitor.isNativePlatform()) {
        // Native handles its own flow; still show banner
        setVisible(true);
      } else if ('Notification' in window && Notification.permission === 'default') {
        setVisible(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleAllow = useCallback(async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.requestPermissions();
      } else if ('Notification' in window) {
        await Notification.requestPermission();
      }
    } catch (e) {
      console.log('Notification permission failed:', e);
    }
    setVisible(false);
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem('plenya_notif_banner_dismissed', 'true');
    setVisible(false);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -60 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="fixed top-4 inset-x-4 z-[9999] mx-auto max-w-md"
        >
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-lg shadow-primary/10 p-4">
            {/* Decorative gradient blob */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-primary/15 blur-2xl pointer-events-none" />

            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2.5 rounded-xl bg-primary/10">
                <Bell className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">
                  Ative as notificações 🔔
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Receba lembretes de pílula, previsões de ciclo e dicas personalizadas para sua fase.
                </p>

                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={handleAllow} className="h-8 text-xs rounded-lg px-4">
                    Ativar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismiss}
                    className="h-8 text-xs rounded-lg px-3 text-muted-foreground"
                  >
                    Agora não
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPrompt;
