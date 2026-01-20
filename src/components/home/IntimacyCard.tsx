import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Eye, EyeOff, Droplets, Flame, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCycle, CyclePhase } from '@/contexts/CycleContext';

const libidoLabels = [
  { value: 1, emoji: '💤', text: 'Baixa' },
  { value: 2, emoji: '🙂', text: 'Moderada' },
  { value: 3, emoji: '🔥', text: 'Alta' },
  { value: 4, emoji: '💕', text: 'Muito Alta' },
];

const fluidTypes = [
  { id: 'dry', label: 'Seco', emoji: '🏜️' },
  { id: 'creamy', label: 'Cremoso', emoji: '🥛' },
  { id: 'eggwhite', label: 'Clara de Ovo', emoji: '✨' },
];

const emotionalTags = [
  { id: 'connected', emoji: '🥰', label: 'Conectada' },
  { id: 'adventurous', emoji: '✨', label: 'Aventureira' },
  { id: 'relaxed', emoji: '😌', label: 'Relaxada' },
  { id: 'distant', emoji: '😐', label: 'Distante' },
];

const physicalTags = [
  { id: 'arousal', emoji: '🔥', label: 'Alta Excitação' },
  { id: 'lubrication', emoji: '💦', label: 'Lubrificação Natural' },
  { id: 'sensitivity', emoji: '⚡', label: 'Sensibilidade' },
];

const healthAlerts = [
  { id: 'pain', emoji: '🔴', label: 'Dor na relação' },
  { id: 'itching', emoji: '🟠', label: 'Coceira/Ardor' },
  { id: 'odor', emoji: '🟤', label: 'Odor alterado' },
  { id: 'swelling', emoji: '🟣', label: 'Inchaço' },
];

const positionsByPhase: Record<CyclePhase, { name: string; description: string; icon: string }[]> = {
  menstrual: [
    { name: 'Conchinha', description: 'Posição de conforto e intimidade', icon: '🌙' },
    { name: 'Lado a Lado', description: 'Mínimo esforço, máximo carinho', icon: '💕' },
  ],
  folicular: [
    { name: 'Variações Criativas', description: 'Energia subindo - hora de explorar', icon: '🌱' },
    { name: 'Posições Ativas', description: 'Aproveite a energia crescente', icon: '⚡' },
  ],
  ovulatoria: [
    { name: 'Intensidade Total', description: 'Pico de energia e desejo', icon: '🔥' },
    { name: 'Conexão Profunda', description: 'Momento de maior receptividade', icon: '☀️' },
  ],
  lutea: [
    { name: 'Relaxamento', description: 'Posições que promovem calma', icon: '🍂' },
    { name: 'Massagem Sensual', description: 'Foco em relaxar e conectar', icon: '🧘' },
  ],
};

const audioCards = [
  { id: 1, title: 'Massagem Pélvica Guiada', duration: '12 min', icon: '🧘‍♀️' },
  { id: 2, title: 'Respiração Íntima', duration: '8 min', icon: '🌬️' },
  { id: 3, title: 'Meditação Sensorial', duration: '15 min', icon: '✨' },
];

const IntimacyCard: React.FC = () => {
  const { currentPhase } = useCycle();
  const [showDialog, setShowDialog] = useState(false);
  const [blurred, setBlurred] = useState(false);
  const [libido, setLibido] = useState(2);
  const [selectedFluid, setSelectedFluid] = useState<string | null>(null);
  const [selectedEmotional, setSelectedEmotional] = useState<string[]>([]);
  const [selectedPhysical, setSelectedPhysical] = useState<string[]>([]);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [activityType, setActivityType] = useState<'solo' | 'partner' | null>(null);
  const [isProtected, setIsProtected] = useState(true);
  const [pleasureLevel, setPleasureLevel] = useState(0);

  const positions = positionsByPhase[currentPhase];

  const toggleEmotional = (id: string) => {
    setSelectedEmotional(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const togglePhysical = (id: string) => {
    setSelectedPhysical(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAlert = (id: string) => {
    setSelectedAlerts(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <>
      <motion.button
        onClick={() => setShowDialog(true)}
        className="w-full glass-card p-4 text-left hover:shadow-soft transition-all"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 shadow-lg shadow-rose-500/30">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Intimidade & Saúde</h3>
            <p className="text-sm text-muted-foreground">Bem-estar íntimo sincronizado</p>
          </div>
        </div>
      </motion.button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                Intimidade & Saúde
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setBlurred(!blurred)}
                className="h-8 w-8"
              >
                {blurred ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="tracker" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tracker">Rastreador</TabsTrigger>
              <TabsTrigger value="guide">Guia</TabsTrigger>
              <TabsTrigger value="self">Autoconexão</TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="tracker" className="space-y-6 mt-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={blurred ? 'blur-md select-none' : ''}
                >
                  {/* Libido Slider */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-rose-500" />
                      <span className="font-medium text-foreground">Libido</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      {libidoLabels.map((label) => (
                        <button
                          key={label.value}
                          onClick={() => setLibido(label.value)}
                          className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                            libido === label.value
                              ? 'bg-rose-100 dark:bg-rose-950/50 scale-105'
                              : 'opacity-50 hover:opacity-100 hover:bg-secondary/50'
                          }`}
                        >
                          <span className="text-xl">{label.emoji}</span>
                          <span className="text-[10px] text-muted-foreground">{label.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fluid Type */}
                  <div className="space-y-3 mt-6">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-foreground">Muco Cervical</span>
                    </div>
                    <div className="flex gap-2">
                      {fluidTypes.map((fluid) => (
                        <button
                          key={fluid.id}
                          onClick={() => setSelectedFluid(fluid.id === selectedFluid ? null : fluid.id)}
                          className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                            selectedFluid === fluid.id
                              ? 'bg-blue-100 dark:bg-blue-950/50 border-2 border-blue-300'
                              : 'bg-secondary/50 hover:bg-secondary'
                          }`}
                        >
                          <span className="text-xl">{fluid.emoji}</span>
                          <span className="text-xs text-muted-foreground">{fluid.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Diário de Experiência - Emocional */}
                  <div className="space-y-3 mt-6">
                    <span className="font-medium text-foreground">Como você se sentiu?</span>
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground">Emocional</span>
                      <div className="flex flex-wrap gap-2">
                        {emotionalTags.map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => toggleEmotional(tag.id)}
                            className={`px-3 py-2 rounded-full text-sm transition-all ${
                              selectedEmotional.includes(tag.id)
                                ? 'bg-pink-100 dark:bg-pink-950/50 border-2 border-pink-300'
                                : 'bg-secondary/50 hover:bg-secondary border border-transparent'
                            }`}
                          >
                            {tag.emoji} {tag.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground">Físico</span>
                      <div className="flex flex-wrap gap-2">
                        {physicalTags.map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => togglePhysical(tag.id)}
                            className={`px-3 py-2 rounded-full text-sm transition-all ${
                              selectedPhysical.includes(tag.id)
                                ? 'bg-orange-100 dark:bg-orange-950/50 border-2 border-orange-300'
                                : 'bg-secondary/50 hover:bg-secondary border border-transparent'
                            }`}
                          >
                            {tag.emoji} {tag.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Alerta de Saúde */}
                  <div className="space-y-3 mt-6">
                    <span className="font-medium text-foreground">Sintomas Íntimos</span>
                    <div className="flex flex-wrap gap-2">
                      {healthAlerts.map((alert) => (
                        <button
                          key={alert.id}
                          onClick={() => toggleAlert(alert.id)}
                          className={`px-3 py-2 rounded-full text-sm transition-all ${
                            selectedAlerts.includes(alert.id)
                              ? 'bg-red-100 dark:bg-red-950/50 border-2 border-red-300'
                              : 'bg-secondary/50 hover:bg-secondary border border-transparent'
                          }`}
                        >
                          {alert.emoji} {alert.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Atividade */}
                  <div className="space-y-3 mt-6">
                    <span className="font-medium text-foreground">Atividade</span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setActivityType(activityType === 'solo' ? null : 'solo')}
                        className={`flex-1 py-4 rounded-xl text-center font-medium transition-all ${
                          activityType === 'solo'
                            ? 'bg-purple-100 dark:bg-purple-950/50 border-2 border-purple-400'
                            : 'bg-secondary/50 hover:bg-secondary'
                        }`}
                      >
                        🧘 Solo
                      </button>
                      <button
                        onClick={() => setActivityType(activityType === 'partner' ? null : 'partner')}
                        className={`flex-1 py-4 rounded-xl text-center font-medium transition-all ${
                          activityType === 'partner'
                            ? 'bg-rose-100 dark:bg-rose-950/50 border-2 border-rose-400'
                            : 'bg-secondary/50 hover:bg-secondary'
                        }`}
                      >
                        💑 Parceiro(a)
                      </button>
                    </div>

                    {activityType === 'partner' && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                        <span className="text-sm text-foreground">Proteção</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setIsProtected(true)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isProtected
                                ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300'
                                : 'bg-secondary hover:bg-muted'
                            }`}
                          >
                            ✓ Protegido
                          </button>
                          <button
                            onClick={() => setIsProtected(false)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              !isProtected
                                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                                : 'bg-secondary hover:bg-muted'
                            }`}
                          >
                            Desprotegido
                          </button>
                        </div>
                      </div>
                    )}

                    {activityType && (
                      <div className="space-y-2">
                        <span className="text-sm text-muted-foreground">Nível de Prazer</span>
                        <div className="flex justify-center gap-2">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <button
                              key={level}
                              onClick={() => setPleasureLevel(level)}
                              className="p-2 transition-transform hover:scale-110"
                            >
                              <Heart
                                className={`w-7 h-7 transition-all ${
                                  level <= pleasureLevel
                                    ? 'text-rose-500 fill-rose-500'
                                    : 'text-muted-foreground/30'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="guide" className="space-y-4 mt-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={blurred ? 'blur-md select-none' : ''}
                >
                  <h4 className="font-medium text-foreground mb-3">
                    Posições Sincronizadas com sua Fase
                  </h4>
                  <div className="space-y-3">
                    {positions.map((position, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border border-rose-200/30"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{position.icon}</span>
                          <span className="font-medium text-foreground">{position.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{position.description}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Sugestões baseadas nos níveis de energia e conforto típicos desta fase
                  </p>
                </motion.div>
              </TabsContent>

              <TabsContent value="self" className="space-y-4 mt-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={blurred ? 'blur-md select-none' : ''}
                >
                  <h4 className="font-medium text-foreground mb-3">Práticas de Autoconexão</h4>
                  <div className="space-y-3">
                    {audioCards.map((audio) => (
                      <button
                        key={audio.id}
                        className="w-full p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200/30 flex items-center gap-3 hover:shadow-md transition-all"
                      >
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                          <Headphones className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{audio.icon}</span>
                            <span className="font-medium text-foreground">{audio.title}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{audio.duration}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default IntimacyCard;
