import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Target, Utensils, Zap, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileSettingsEditorProps {
  currentGoals: string[];
  currentDiet: string | null;
  currentFitness: string | null;
  onUpdate: () => void;
}

const goalOptions = [
  { id: 'lose_weight', label: 'Perder Peso', icon: '🎯' },
  { id: 'gain_muscle', label: 'Ganhar Massa', icon: '💪' },
  { id: 'pms_relief', label: 'Alívio de TPM', icon: '💗' },
  { id: 'get_pregnant', label: 'Engravidar', icon: '👶' },
  { id: 'health_monitor', label: 'Monitorar Saúde', icon: '📊' },
];

const dietOptions = [
  { id: 'omnivore', label: 'Onívora', icon: '🍖' },
  { id: 'vegetarian', label: 'Vegetariana', icon: '🥗' },
  { id: 'vegan', label: 'Vegana', icon: '🌱' },
  { id: 'low_carb', label: 'Low Carb', icon: '🥑' },
  { id: 'lactose_free', label: 'Sem Lactose', icon: '🥛' },
];

const fitnessOptions = [
  { id: 'sedentary', label: 'Sedentária', description: 'Pouco ou nenhum exercício' },
  { id: 'light', label: 'Leve', description: '1-2x por semana' },
  { id: 'moderate', label: 'Moderada', description: '3-4x por semana' },
  { id: 'intense', label: 'Intensa/Atleta', description: '5+ vezes por semana' },
];

const ProfileSettingsEditor: React.FC<ProfileSettingsEditorProps> = ({
  currentGoals,
  currentDiet,
  currentFitness,
  onUpdate,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [selectedGoals, setSelectedGoals] = useState<string[]>(currentGoals);
  const [selectedDiet, setSelectedDiet] = useState<string>(currentDiet || 'omnivore');
  const [selectedFitness, setSelectedFitness] = useState<string>(currentFitness || 'moderate');

  useEffect(() => {
    setSelectedGoals(currentGoals);
    setSelectedDiet(currentDiet || 'omnivore');
    setSelectedFitness(currentFitness || 'moderate');
  }, [currentGoals, currentDiet, currentFitness]);

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (selectedGoals.length === 0) {
      toast({
        title: "Selecione ao menos um objetivo",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          goal: selectedGoals.join(','),
          diet_type: selectedDiet,
          fitness_level: selectedFitness,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Preferências atualizadas!",
        description: "Suas configurações foram salvas com sucesso.",
      });
      
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedGoals(currentGoals);
    setSelectedDiet(currentDiet || 'omnivore');
    setSelectedFitness(currentFitness || 'moderate');
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <motion.div
        className="glass-card p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Minhas Preferências</h3>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Editar
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Objetivos, dieta e frequência de exercícios
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="glass-card p-5 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Editar Preferências</h3>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleCancel}
            disabled={saving}
          >
            <X className="w-4 h-4" />
          </Button>
          <Button 
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            <Check className="w-4 h-4 mr-1" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Goals Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-terracotta" />
          <Label className="font-medium">Objetivos</Label>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {goalOptions.map((goal) => (
            <div
              key={goal.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                selectedGoals.includes(goal.id)
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-background/50 hover:border-primary/50'
              }`}
              onClick={() => handleGoalToggle(goal.id)}
            >
              <Checkbox
                checked={selectedGoals.includes(goal.id)}
                onCheckedChange={() => handleGoalToggle(goal.id)}
              />
              <span className="text-lg">{goal.icon}</span>
              <span className="text-sm font-medium">{goal.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Diet Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-amber-500" />
          <Label className="font-medium">Estilo Alimentar</Label>
        </div>
        <RadioGroup
          value={selectedDiet}
          onValueChange={setSelectedDiet}
          className="grid grid-cols-1 gap-2"
        >
          {dietOptions.map((diet) => (
            <div
              key={diet.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                selectedDiet === diet.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-background/50 hover:border-primary/50'
              }`}
              onClick={() => setSelectedDiet(diet.id)}
            >
              <RadioGroupItem value={diet.id} id={diet.id} />
              <span className="text-lg">{diet.icon}</span>
              <Label htmlFor={diet.id} className="text-sm font-medium cursor-pointer">
                {diet.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Fitness Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-500" />
          <Label className="font-medium">Frequência de Exercícios</Label>
        </div>
        <RadioGroup
          value={selectedFitness}
          onValueChange={setSelectedFitness}
          className="grid grid-cols-1 gap-2"
        >
          {fitnessOptions.map((fitness) => (
            <div
              key={fitness.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                selectedFitness === fitness.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-background/50 hover:border-primary/50'
              }`}
              onClick={() => setSelectedFitness(fitness.id)}
            >
              <RadioGroupItem value={fitness.id} id={fitness.id} />
              <div className="flex-1">
                <Label htmlFor={fitness.id} className="text-sm font-medium cursor-pointer">
                  {fitness.label}
                </Label>
                <p className="text-xs text-muted-foreground">{fitness.description}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>
    </motion.div>
  );
};

export default ProfileSettingsEditor;
