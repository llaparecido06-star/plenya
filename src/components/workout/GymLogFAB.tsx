import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Dumbbell, X, Footprints, Waves, Bike, Heart, Zap, Mountain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const exerciseTypes = [
  { value: 'musculacao', label: 'Musculação', icon: Dumbbell },
  { value: 'corrida', label: 'Corrida', icon: Footprints },
  { value: 'caminhada', label: 'Caminhada', icon: Footprints },
  { value: 'natacao', label: 'Natação', icon: Waves },
  { value: 'ciclismo', label: 'Ciclismo', icon: Bike },
  { value: 'hiit', label: 'HIIT', icon: Zap },
  { value: 'cardio', label: 'Cardio', icon: Heart },
  { value: 'trilha', label: 'Trilha', icon: Mountain },
] as const;

type ExerciseType = typeof exerciseTypes[number]['value'];
type Intensity = 'leve' | 'moderado' | 'intenso';

const intensityOptions: { value: Intensity; label: string; color: string }[] = [
  { value: 'leve', label: 'Leve', color: 'bg-green-500' },
  { value: 'moderado', label: 'Moderado', color: 'bg-yellow-500' },
  { value: 'intenso', label: 'Intenso', color: 'bg-red-500' },
];

interface Exercise {
  name: string;
  type: ExerciseType;
  weight: number;
  sets: number;
  reps: number;
  duration?: number;
  intensity?: Intensity;
}

const GymLogFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState<Exercise>({
    name: '',
    type: 'musculacao',
    weight: 0,
    sets: 3,
    reps: 12,
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAddExercise = () => {
    if (!currentExercise.name) {
      toast({ title: 'Informe o nome do exercício', variant: 'destructive' });
      return;
    }

    setExercises(prev => [...prev, currentExercise]);
    setCurrentExercise({ name: '', type: 'musculacao', weight: 0, sets: 3, reps: 12 });
    toast({ title: `${currentExercise.name} adicionado!` });
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveWorkout = async () => {
    if (!user || exercises.length === 0) {
      toast({ title: 'Adicione pelo menos um exercício', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('workouts').insert({
        user_id: user.id,
        workout_name: 'Treino Livre',
        workout_type: 'forca' as const,
        exercises: exercises as any,
        completed: true,
        duration_minutes: exercises.length * 5,
      });

      if (error) throw error;

      toast({ title: '💪 Treino registrado com sucesso!' });
      setExercises([]);
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving workout:', error);
      toast({ title: 'Erro ao salvar treino', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* FAB Button */}
      <motion.button
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full phase-gradient shadow-glow flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-primary" />
              Registrar Treino
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Exercise Form */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
              {/* Exercise Type Selector */}
              <div className="space-y-2">
                <Label>Tipo de Exercício</Label>
                <Select
                  value={currentExercise.type}
                  onValueChange={(value: ExerciseType) => setCurrentExercise(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {exerciseTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-primary" />
                            {type.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nome do Exercício</Label>
                <Input
                  placeholder={currentExercise.type === 'musculacao' ? 'Ex: Supino, Agachamento...' : 'Ex: Parque, Academia...'}
                  value={currentExercise.name}
                  onChange={(e) => setCurrentExercise(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              {/* Conditional fields based on exercise type */}
              {['musculacao', 'hiit'].includes(currentExercise.type) ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Carga (kg)</Label>
                    <Input
                      type="number"
                      value={currentExercise.weight}
                      onChange={(e) => setCurrentExercise(prev => ({ 
                        ...prev, 
                        weight: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Séries</Label>
                    <Input
                      type="number"
                      value={currentExercise.sets}
                      onChange={(e) => setCurrentExercise(prev => ({ 
                        ...prev, 
                        sets: parseInt(e.target.value) || 0 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reps</Label>
                    <Input
                      type="number"
                      value={currentExercise.reps}
                      onChange={(e) => setCurrentExercise(prev => ({ 
                        ...prev, 
                        reps: parseInt(e.target.value) || 0 
                      }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Duração (min)</Label>
                      <Input
                        type="number"
                        placeholder="30"
                        value={currentExercise.duration || ''}
                        onChange={(e) => setCurrentExercise(prev => ({ 
                          ...prev, 
                          duration: parseInt(e.target.value) || 0 
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Distância (km)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="5.0"
                        value={currentExercise.weight || ''}
                        onChange={(e) => setCurrentExercise(prev => ({ 
                          ...prev, 
                          weight: parseFloat(e.target.value) || 0 
                        }))}
                      />
                    </div>
                  </div>
                  
                  {/* Intensity Selector */}
                  <div className="space-y-2">
                    <Label>Intensidade (opcional)</Label>
                    <div className="flex gap-2">
                      {intensityOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setCurrentExercise(prev => ({
                            ...prev,
                            intensity: prev.intensity === option.value ? undefined : option.value
                          }))}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            currentExercise.intensity === option.value
                              ? `${option.color} text-white`
                              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleAddExercise} 
                className="w-full"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Exercício
              </Button>
            </div>

            {/* Exercise List */}
            <AnimatePresence>
              {exercises.length > 0 && (
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Label className="text-muted-foreground">
                    Exercícios adicionados ({exercises.length})
                  </Label>
                  {exercises.map((exercise, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center justify-between p-3 bg-card rounded-lg border"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {exerciseTypes.find(t => t.value === exercise.type)?.label || exercise.type}
                          </span>
                          <p className="font-medium">{exercise.name}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {['musculacao', 'hiit'].includes(exercise.type)
                            ? `${exercise.weight}kg • ${exercise.sets}x${exercise.reps}`
                            : `${exercise.duration || 0}min${exercise.weight ? ` • ${exercise.weight}km` : ''}${exercise.intensity ? ` • ${intensityOptions.find(i => i.value === exercise.intensity)?.label}` : ''}`
                          }
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveExercise(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Save Button */}
            {exercises.length > 0 && (
              <Button
                onClick={handleSaveWorkout}
                disabled={isSaving}
                className="w-full h-12 phase-gradient text-white"
              >
                {isSaving ? 'Salvando...' : `Salvar Treino (${exercises.length} exercícios)`}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GymLogFAB;
