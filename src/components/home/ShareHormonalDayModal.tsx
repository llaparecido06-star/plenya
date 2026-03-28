import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCycle, CyclePhase } from '@/contexts/CycleContext';
import { useToast } from '@/hooks/use-toast';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
}

const phaseShareData: Record<CyclePhase, {
  season: string;
  emoji: string;
  superpower: string;
  energy: string;
  energyEmoji: string;
  insight: string;
  gradient: string;
  textGradient: string;
}> = {
  menstrual: {
    season: 'Inverno Interior',
    emoji: '🌙',
    superpower: 'Intuição Afiada 🔮',
    energy: 'Baixa (Foco em Recuperação)',
    energyEmoji: '🔋',
    insight: 'Meu corpo pede recolhimento. É tempo de focar no essencial.',
    gradient: 'from-violet-600 via-purple-700 to-indigo-900',
    textGradient: 'from-violet-300 to-purple-200',
  },
  folicular: {
    season: 'Primavera Interior',
    emoji: '🌱',
    superpower: 'Foco a Laser 🎯',
    energy: 'Em ascensão',
    energyEmoji: '⚡',
    insight: 'Minha energia está subindo! Hora de iniciar novos projetos.',
    gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
    textGradient: 'from-emerald-200 to-cyan-200',
  },
  ovulatoria: {
    season: 'Verão Interior',
    emoji: '☀️',
    superpower: 'Comunicação Magnética 🧲',
    energy: 'Máxima',
    energyEmoji: '🔥',
    insight: 'Estou no meu ápice magnético! Foco em conexões e comunicação.',
    gradient: 'from-amber-500 via-orange-500 to-rose-600',
    textGradient: 'from-amber-200 to-rose-200',
  },
  lutea: {
    season: 'Outono Interior',
    emoji: '🍂',
    superpower: 'Atenção aos Detalhes 🔍',
    energy: 'Desacelerando',
    energyEmoji: '🪫',
    insight: 'Meu corpo está desacelerando. Produtividade agora é sobre organização.',
    gradient: 'from-orange-600 via-amber-700 to-yellow-800',
    textGradient: 'from-orange-200 to-yellow-200',
  },
};

const ShareHormonalDayModal: React.FC<ShareModalProps> = ({ open, onClose }) => {
  const { currentPhase, cycleDay } = useCycle();
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  const data = phaseShareData[currentPhase];

  const handleShare = async () => {
    const text = `${data.emoji} Meu dia hormonal:\n\n📍 Fase: ${data.season}\n⚡ Energia: ${data.energy} ${data.energyEmoji}\n✨ Superpoder: ${data.superpower}\n\n"${data.insight}"\n\n🌺 Biohacking guiado pela Manu IA — Plenya App`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copiado! 📋', description: 'Cole no Instagram Stories ou onde preferir.' });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-[320px]"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 9:16 Card */}
            <div
              ref={cardRef}
              className={`relative rounded-3xl bg-gradient-to-br ${data.gradient} p-6 text-white overflow-hidden`}
              style={{ aspectRatio: '9/16' }}
            >
              {/* Decorative circles */}
              <div className="absolute top-10 right-6 w-32 h-32 rounded-full bg-white/5 blur-xl" />
              <div className="absolute bottom-20 left-4 w-24 h-24 rounded-full bg-white/5 blur-xl" />

              {/* Close */}
              <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <X className="w-4 h-4 text-white/80" />
              </button>

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full justify-between">
                {/* Top */}
                <div>
                  <p className="text-xs font-medium text-white/60 uppercase tracking-widest">Meu Dia Hormonal</p>
                  <p className="text-5xl mt-2">{data.emoji}</p>
                </div>

                {/* Middle */}
                <div className="space-y-5">
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Fase Atual</p>
                    <h2 className={`text-2xl font-bold bg-gradient-to-r ${data.textGradient} bg-clip-text text-transparent`}>
                      {data.season}
                    </h2>
                    <p className="text-xs text-white/40 mt-0.5">Dia {cycleDay} do ciclo</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-3">
                      <p className="text-[10px] text-white/50 uppercase tracking-wider">Energia</p>
                      <p className="text-sm font-semibold mt-1">{data.energy}</p>
                      <p className="text-lg mt-0.5">{data.energyEmoji}</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-3">
                      <p className="text-[10px] text-white/50 uppercase tracking-wider">Superpoder</p>
                      <p className="text-sm font-semibold mt-1">{data.superpower}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4">
                    <p className="text-xs text-white/80 italic leading-relaxed">"{data.insight}"</p>
                  </div>
                </div>

                {/* Bottom */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-white/60" />
                    <span className="text-xs text-white/60">Biohacking pela Manu IA</span>
                  </div>
                  <span className="text-xs font-bold text-white/80">Plenya</span>
                </div>
              </div>
            </div>

            {/* Share button */}
            <Button
              onClick={handleShare}
              className="w-full mt-3 h-12 rounded-2xl bg-white text-foreground font-semibold hover:bg-white/90 shadow-lg"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar ✨
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareHormonalDayModal;
