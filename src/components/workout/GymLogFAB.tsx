import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Dumbbell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Exercise {
  name: string;
  weight: number;
  sets: number;
  reps: number;
}

const GymLogFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState<Exercise>({
    name: '',
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
    setCurrentExercise({ name: '', weight: 0, sets: 3, reps: 12 });
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
              <div className="space-y-2">
                <Label>Exercício</Label>
                <Input
                  placeholder="Ex: Supino, Agachamento..."
                  value={currentExercise.name}
                  onChange={(e) => setCurrentExercise(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

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
                        <p className="font-medium">{exercise.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {exercise.weight}kg • {exercise.sets}x{exercise.reps}
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
