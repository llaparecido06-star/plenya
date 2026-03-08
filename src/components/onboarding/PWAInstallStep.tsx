import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, Share, MoreVertical, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface PWAInstallStepProps {
  onNext: () => void;
}

const PWAInstallStep: React.FC<PWAInstallStepProps> = ({ onNext }) => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS] = useState(() => /iPad|iPhone|iPod/.test(navigator.userAgent));

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
          <Check className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('pwa.installed_title')}</h2>
          <p className="text-muted-foreground mt-2">{t('pwa.installed_desc')}</p>
        </div>
        <Button onClick={onNext} className="w-full h-14 text-lg phase-gradient text-white">
          {t('actions.continue')}
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div key="pwa-install" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="text-center mb-4">
        <motion.div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center" animate={{ y: [0, -5, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
          <Smartphone className="w-10 h-10 text-primary" />
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('pwa.install_title')}</h2>
        <p className="text-muted-foreground text-sm">{t('pwa.install_subtitle')}</p>
      </div>

      {deferredPrompt && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Button onClick={handleInstall} size="lg" className="w-full gap-2 text-lg py-6 phase-gradient text-white">
            <Download className="w-5 h-5" />
            {t('pwa.install_now')}
          </Button>
        </motion.div>
      )}

      {!deferredPrompt && (
        <div className="space-y-3">
          {isIOS ? (
            <>
              <StepItem step={1} icon={<Share className="w-4 h-4" />} text={t('pwa.ios_step_1')} />
              <StepItem step={2} icon={<Download className="w-4 h-4" />} text={t('pwa.ios_step_2')} />
              <StepItem step={3} icon={<Check className="w-4 h-4" />} text={t('pwa.ios_step_3')} />
            </>
          ) : (
            <>
              <StepItem step={1} icon={<MoreVertical className="w-4 h-4" />} text={t('pwa.android_step_1')} />
              <StepItem step={2} icon={<Download className="w-4 h-4" />} text={t('pwa.android_step_2')} />
              <StepItem step={3} icon={<Check className="w-4 h-4" />} text={t('pwa.android_step_3')} />
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
        <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-card border border-border">
          <span className="text-base">📴</span>
          <span>{t('pwa.benefit_offline')}</span>
        </div>
        <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-card border border-border">
          <span className="text-base">🔔</span>
          <span>{t('pwa.benefit_notifications')}</span>
        </div>
        <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-card border border-border">
          <span className="text-base">⚡</span>
          <span>{t('pwa.benefit_faster')}</span>
        </div>
      </div>

      <Button variant="ghost" onClick={onNext} className="w-full text-muted-foreground text-sm">
        {t('pwa.skip')}
      </Button>
    </motion.div>
  );
};

const StepItem: React.FC<{ step: number; icon: React.ReactNode; text: string }> = ({ step, icon, text }) => (
  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: step * 0.15 }} className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card">
    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
      {step}
    </div>
    <div className="flex items-center gap-2 text-foreground text-sm font-medium">
      <span className="text-primary">{icon}</span>
      {text}
    </div>
  </motion.div>
);

export default PWAInstallStep;
