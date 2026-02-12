import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const PWAInstallBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Don't show if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    
    // Don't show if dismissed
    const dismissed = localStorage.getItem('plenya_pwa_banner_dismissed');
    if (dismissed) {
      // Re-show after 7 days
      const dismissedDate = new Date(dismissed).getTime();
      if (Date.now() - dismissedDate < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Delay to not overwhelm on load
    const timer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('plenya_pwa_banner_dismissed', new Date().toISOString());
    setVisible(false);
  };

  const handleInstall = () => {
    navigate('/instalar');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="mx-4"
        >
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-4">
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
            
            <button
              onClick={handleDismiss}
              className="absolute top-2.5 right-2.5 p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 p-2.5 rounded-xl bg-primary/10">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-semibold text-foreground leading-tight">
                  Instale o Plenya 📲
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Acesse mais rápido pela tela inicial
                </p>
              </div>

              <Button
                size="sm"
                onClick={handleInstall}
                className="h-8 text-xs rounded-lg px-3 shrink-0"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Ver como
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallBanner;
