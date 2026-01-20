import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Check, Dumbbell, Target, AlertCircle } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ExerciseDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: {
    id: string;
    name: string;
    sets: number;
    reps: string;
  } | null;
  onComplete: (exerciseId: string, weight?: number, reps?: number) => void;
}

interface ExerciseInstruction {
  instructions: string[];
  tips: string[];
  muscles: string[];
}

const exerciseInstructions: Record<string, ExerciseInstruction> = {
  'Agachamento com salto': {
    instructions: [
      'Fique em pé com os pés na largura dos ombros',
      'Desça em um agachamento profundo (90 graus)',
      'Impulsione explosivamente para cima em um salto',
      'Aterrisse suavemente e repita o movimento',
    ],
    tips: ['Mantenha o core ativado', 'Joelhos alinhados com os dedos'],
    muscles: ['Quadríceps', 'Glúteos', 'Panturrilhas'],
  },
  'Flexão': {
    instructions: [
      'Posicione as mãos um pouco mais largas que os ombros',
      'Mantenha o corpo em linha reta da cabeça aos pés',
      'Desça o peito até quase tocar o chão',
      'Empurre para cima até estender os braços',
    ],
    tips: ['Não deixe o quadril cair', 'Olhe ligeiramente à frente'],
    muscles: ['Peitoral', 'Tríceps', 'Deltoides'],
  },
  'Burpees': {
    instructions: [
      'Comece em pé, depois agache e coloque as mãos no chão',
      'Salte os pés para trás em posição de prancha',
      'Faça uma flexão (opcional)',
      'Salte os pés de volta e pule para cima',
    ],
    tips: ['Mantenha um ritmo constante', 'Respire ritmicamente'],
    muscles: ['Corpo inteiro', 'Cardio'],
  },
  'Prancha': {
    instructions: [
      'Apoie os antebraços e dedos dos pés no chão',
      'Mantenha o corpo em linha reta',
      'Contraia o abdômen e glúteos',
      'Mantenha a posição pelo tempo indicado',
    ],
    tips: ['Não deixe o quadril subir ou descer', 'Respire normalmente'],
    muscles: ['Core', 'Abdômen', 'Lombar'],
  },
  'Levantamento terra': {
    instructions: [
      'Pés na largura do quadril, barra sobre os pés',
      'Agache e segure a barra com pegada mista ou pronada',
      'Levante mantendo a barra próxima ao corpo',
      'Estenda quadril e joelhos simultaneamente',
    ],
    tips: ['Mantenha as costas retas', 'Core sempre ativado'],
    muscles: ['Posterior de coxa', 'Glúteos', 'Lombar', 'Trapézio'],
  },
  default: {
    instructions: [
      'Execute o movimento com controle',
      'Mantenha a respiração constante',
      'Foque na forma correta',
      'Descanse entre as séries',
    ],
    tips: ['Aqueça antes de começar', 'Hidrate-se durante o treino'],
    muscles: ['Vários grupos musculares'],
  },
};

const ExerciseDetailDrawer: React.FC<ExerciseDetailDrawerProps> = ({
  isOpen,
  onClose,
  exercise,
  onComplete,
}) => {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');

  if (!exercise) return null;

  const instructions = exerciseInstructions[exercise.name] || exerciseInstructions.default;

  const handleComplete = () => {
    onComplete(
      exercise.id,
      weight ? parseFloat(weight) : undefined,
      reps ? parseInt(reps) : undefined
    );
    setWeight('');
    setReps('');
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <div className="p-2 rounded-xl phase-gradient">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            {exercise.name}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-12 space-y-4 overflow-y-auto">
          {/* Video placeholder */}
          <motion.div
            className="relative w-full h-48 bg-secondary rounded-3xl flex items-center justify-center overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-secondary to-muted" />
            <motion.button
              className="relative z-10 w-16 h-16 rounded-full phase-gradient flex items-center justify-center shadow-glow"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play className="w-8 h-8 text-white ml-1" />
            </motion.button>
            <p className="absolute bottom-3 text-sm text-muted-foreground">
              Vídeo demonstrativo em breve
            </p>
          </motion.div>

          {/* Exercise info */}
          <div className="flex gap-2">
            <div className="flex-1 p-3 rounded-xl bg-secondary text-center">
              <p className="text-2xl font-bold text-foreground">{exercise.sets}</p>
              <p className="text-xs text-muted-foreground">Séries</p>
            </div>
            <div className="flex-1 p-3 rounded-xl bg-secondary text-center">
              <p className="text-2xl font-bold text-foreground">{exercise.reps}</p>
              <p className="text-xs text-muted-foreground">Repetições</p>
            </div>
          </div>

          {/* Instructions */}
          <motion.div
            className="glass-card p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Como executar
            </h4>
            <ol className="space-y-2">
              {instructions.instructions.map((step, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-phase-secondary text-primary font-medium flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </motion.div>

          {/* Tips */}
          <motion.div
            className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Dicas importantes
            </h4>
            <ul className="space-y-1">
              {instructions.tips.map((tip, index) => (
                <li key={index} className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                  <span>•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Muscles */}
          <div className="flex flex-wrap gap-2">
            {instructions.muscles.map((muscle) => (
              <span
                key={muscle}
                className="px-3 py-1 bg-phase-secondary/50 text-primary rounded-full text-sm font-medium"
              >
                {muscle}
              </span>
            ))}
          </div>

          {/* Weight and reps input */}
          <motion.div
            className="glass-card p-4 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="font-semibold text-foreground">Registrar performance</h4>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Peso (kg)</label>
                <Input
                  type="number"
                  placeholder="Ex: 20"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Repetições</label>
                <Input
                  type="number"
                  placeholder="Ex: 12"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                />
              </div>
            </div>
          </motion.div>

          {/* Complete button */}
          <Button
            onClick={handleComplete}
            className="w-full h-14 text-lg font-semibold phase-gradient text-white shadow-glow"
          >
            <Check className="w-5 h-5 mr-2" />
            Concluir Exercício
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ExerciseDetailDrawer;
