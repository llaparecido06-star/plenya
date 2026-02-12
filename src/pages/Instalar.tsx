import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Check, Share, MoreVertical, Plus, ExternalLink } from 'lucide-react';
import logoImg from '@/assets/logo-plenya.png';

const Instalar: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

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

  // Auto-advance steps animation
  useEffect(() => {
    if (isInstalled) return;
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div className="text-center" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">App já instalado!</h2>
          <p className="text-muted-foreground mt-2">Abra o Plenya pela sua tela inicial.</p>
        </motion.div>
      </div>
    );
  }

  const iosSteps = [
    {
      icon: <Share className="w-6 h-6 text-primary" />,
      title: 'Toque em Compartilhar',
      description: 'Na barra inferior do Safari, toque no ícone de compartilhar',
      visual: (
        <div className="flex items-center justify-center py-4">
          <motion.div
            className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Share className="w-6 h-6 text-primary" />
          </motion.div>
        </div>
      ),
    },
    {
      icon: <Plus className="w-6 h-6 text-primary" />,
      title: 'Adicionar à Tela de Início',
      description: 'Role para baixo e toque em "Adicionar à Tela de Início"',
      visual: (
        <div className="flex items-center justify-center py-4">
          <motion.div
            className="px-4 py-3 rounded-xl bg-card border border-border flex items-center gap-3"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Plus className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Tela de Início</span>
          </motion.div>
        </div>
      ),
    },
    {
      icon: <Check className="w-6 h-6 text-primary" />,
      title: 'Confirme "Adicionar"',
      description: 'Toque em "Adicionar" no canto superior direito — pronto! 🎉',
      visual: (
        <div className="flex items-center justify-center py-4">
          <motion.div
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Adicionar
          </motion.div>
        </div>
      ),
    },
  ];

  const androidSteps = [
    {
      icon: <MoreVertical className="w-6 h-6 text-primary" />,
      title: 'Abra o menu do navegador',
      description: 'Toque nos três pontinhos no canto superior',
      visual: (
        <div className="flex items-center justify-center py-4">
          <motion.div
            className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <MoreVertical className="w-5 h-5 text-primary" />
          </motion.div>
        </div>
      ),
    },
    {
      icon: <Download className="w-6 h-6 text-primary" />,
      title: 'Toque em "Instalar app"',
      description: 'Ou "Adicionar à tela inicial" dependendo do navegador',
      visual: (
        <div className="flex items-center justify-center py-4">
          <motion.div
            className="px-4 py-3 rounded-xl bg-card border border-border flex items-center gap-3"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Download className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Instalar app</span>
          </motion.div>
        </div>
      ),
    },
    {
      icon: <Check className="w-6 h-6 text-primary" />,
      title: 'Confirme a instalação',
      description: 'Toque em "Instalar" e pronto! 🎉',
      visual: (
        <div className="flex items-center justify-center py-4">
          <motion.div
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Instalar
          </motion.div>
        </div>
      ),
    },
  ];

  const steps = isIOS ? iosSteps : androidSteps;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        className="max-w-sm w-full text-center space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.img
          src={logoImg}
          alt="Plenya"
          className="w-20 h-20 mx-auto rounded-2xl shadow-lg"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div>
          <h1 className="text-2xl font-bold text-foreground">Instalar Plenya</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Tenha o Plenya na sua tela inicial — como um app nativo.
          </p>
        </div>

        {/* Auto-install button for supported browsers */}
        {deferredPrompt && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Button onClick={handleInstall} size="lg" className="w-full gap-2 text-lg py-6">
              <Download className="w-5 h-5" />
              Instalar Agora
            </Button>
          </motion.div>
        )}

        {/* Animated Step-by-Step Guide */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground flex items-center justify-center gap-2 text-sm">
            <Smartphone className="w-4 h-4 text-primary" />
            {isIOS ? 'No iPhone / iPad' : 'No Android'}
          </h3>

          <div className="space-y-2">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 ${
                  activeStep === index
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-card'
                }`}
                onClick={() => setActiveStep(index)}
              >
                <div className="flex items-center gap-3 p-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    activeStep === index
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-foreground text-sm">{step.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  </div>
                </div>

                <AnimatePresence>
                  {activeStep === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-border/50 bg-muted/30"
                    >
                      {step.visual}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-card border border-border">
            <span className="text-lg">📴</span>
            <span>Funciona offline</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-card border border-border">
            <span className="text-lg">🪶</span>
            <span>Super leve</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-card border border-border">
            <span className="text-lg">🔄</span>
            <span>Sempre atualizado</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Instalar;
