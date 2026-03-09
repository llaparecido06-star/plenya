import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const CONSENT_KEY = 'plenya_lgpd_consent';

const LGPDConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  const handleRejectOptional = () => {
    localStorage.setItem(CONSENT_KEY, 'essential_only');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 bg-card border-t border-border shadow-2xl"
        >
          <div className="max-w-lg mx-auto space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Privacidade & Cookies</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Usamos cookies essenciais para o funcionamento do app e cookies opcionais para melhorar sua experiência. 
                  Seus dados de saúde são protegidos conforme a LGPD.{' '}
                  <Link to="/privacidade" className="text-primary underline">Política de Privacidade</Link>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={handleRejectOptional}>
                Apenas essenciais
              </Button>
              <Button size="sm" className="flex-1 text-xs" onClick={handleAccept}>
                Aceitar todos
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LGPDConsentBanner;
