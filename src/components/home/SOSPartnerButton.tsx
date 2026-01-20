import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useCycle, CyclePhase } from '@/contexts/CycleContext';

const phaseMessages: Record<CyclePhase, { title: string; message: string; emoji: string }> = {
  menstrual: {
    title: 'Fase Menstrual',
    emoji: '🌙',
    message: 'Oi amor! Estou na minha fase menstrual e precisando de mais carinho e descanso hoje. Um chocolate e um abraço seriam perfeitos! 💕',
  },
  folicular: {
    title: 'Fase Folicular',
    emoji: '🌱',
    message: 'Oi amor! Estou na fase folicular, energia subindo! Que tal fazermos algo divertido juntos? 🎉',
  },
  ovulatoria: {
    title: 'Fase Ovulatória',
    emoji: '☀️',
    message: 'Oi amor! Estou no meu auge de energia! Vamos aproveitar e fazer algo especial? 💃✨',
  },
  lutea: {
    title: 'Fase Lútea',
    emoji: '🍂',
    message: 'Oi amor! Fase lútea aqui... paciência pode estar baixa, mas aceito chocolate e muito carinho! 🍫💜',
  },
};

const SOSPartnerButton: React.FC = () => {
  const { currentPhase } = useCycle();
  const [showDialog, setShowDialog] = useState(false);
  
  const phaseInfo = phaseMessages[currentPhase];
  
  const handleSendWhatsApp = () => {
    const encodedMessage = encodeURIComponent(phaseInfo.message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    setShowDialog(false);
  };

  return (
    <>
      <motion.button
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500/20 to-rose-500/20 border border-pink-500/30 hover:border-pink-500/50 transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AlertCircle className="w-4 h-4 text-pink-500" />
        <span className="text-sm font-medium text-pink-600">SOS Parceiro</span>
      </motion.button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{phaseInfo.emoji}</span>
              {phaseInfo.title}
            </DialogTitle>
            <DialogDescription>
              Envie uma mensagem carinhosa para seu parceiro(a)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-secondary/50 text-sm text-foreground">
              {phaseInfo.message}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDialog(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleSendWhatsApp}
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SOSPartnerButton;
