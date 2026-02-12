import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Check, Share, ArrowDown } from 'lucide-react';
import logoImg from '@/assets/logo-plenya.png';

const Instalar: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div className="max-w-sm w-full text-center space-y-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <img src={logoImg} alt="Plenya" className="w-20 h-20 mx-auto rounded-2xl shadow-lg" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Instalar Plenya</h1>
          <p className="text-muted-foreground mt-2">Tenha o Plenya na sua tela inicial, como um app nativo — sem precisar de loja.</p>
        </div>

        {isIOS ? (
          <div className="glass-card p-5 text-left space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" /> No iPhone / iPad
            </h3>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">1.</span>
                Toque no botão <Share className="w-4 h-4 inline text-primary" /> <strong>Compartilhar</strong> no Safari
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">2.</span>
                Role e toque em <strong>"Adicionar à Tela de Início"</strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">3.</span>
                Toque em <strong>"Adicionar"</strong> — pronto! 🎉
              </li>
            </ol>
          </div>
        ) : deferredPrompt ? (
          <Button onClick={handleInstall} size="lg" className="w-full gap-2 text-lg py-6">
            <Download className="w-5 h-5" />
            Instalar Agora
          </Button>
        ) : (
          <div className="glass-card p-5 text-left space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" /> No Android
            </h3>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">1.</span>
                Abra o menu <strong>⋮</strong> do navegador
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">2.</span>
                Toque em <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">3.</span>
                Confirme — pronto! 🎉
              </li>
            </ol>
          </div>
        )}

        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span>✅ Funciona offline</span>
          <span>✅ Sem ocupar espaço</span>
          <span>✅ Sempre atualizado</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Instalar;
