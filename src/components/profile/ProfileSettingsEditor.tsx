import React, { useState, useEffect } from 'react';
import { Target, Utensils, Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface ProfileSettingsEditorProps {
  currentGoals: string[];
  currentDiet: string | null;
  currentFitness: string | null;
  onUpdate: () => void;
}

const goalOptions = [
  { id: 'lose_weight', labelKey: 'goals.lose_weight', icon: '🎯' },
  { id: 'gain_muscle', labelKey: 'goals.gain_muscle', icon: '💪' },
  { id: 'pms_relief', labelKey: 'goals.pms_relief', icon: '💗' },
  { id: 'get_pregnant', labelKey: 'goals.get_pregnant', icon: '👶' },
  { id: 'health_monitor', labelKey: 'goals.health_monitor', icon: '📊' },
];

const dietOptions = [
  { id: 'omnivore', labelKey: 'diet.omnivore', icon: '🍖' },
  { id: 'vegetarian', labelKey: 'diet.vegetarian', icon: '🥗' },
  { id: 'vegan', labelKey: 'diet.vegan', icon: '🌱' },
  { id: 'low_carb', labelKey: 'diet.low_carb', icon: '🥑' },
  { id: 'lactose_free', labelKey: 'diet.lactose_free', icon: '🥛' },
];

const fitnessOptions = [
  { id: 'sedentary', labelKey: 'fitness.sedentary', descKey: 'settings.fitness_sedentary_desc' },
  { id: 'light', labelKey: 'fitness.light', descKey: 'settings.fitness_light_desc' },
  { id: 'moderate', labelKey: 'fitness.moderate', descKey: 'settings.fitness_moderate_desc' },
  { id: 'intense', labelKey: 'fitness.intense', descKey: 'settings.fitness_intense_desc' },
];

const ProfileSettingsEditor: React.FC<ProfileSettingsEditorProps> = ({
  currentGoals,
  currentDiet,
  currentFitness,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
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
      toast({ title: t('settings.select_goal'), variant: 'destructive' });
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
        title: t('settings.updated_success'),
        description: t('settings.updated_desc'),
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t('settings.save_error'),
        description: t('settings.save_error_desc'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-terracotta" />
          <Label className="font-medium">{t('settings.goals_label')}</Label>
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
              <span className="text-sm font-medium">{t(goal.labelKey)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-amber-500" />
          <Label className="font-medium">{t('settings.diet_label')}</Label>
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
                {t(diet.labelKey)}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-500" />
          <Label className="font-medium">{t('settings.fitness_label')}</Label>
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
                  {t(fitness.labelKey)}
                </Label>
                <p className="text-xs text-muted-foreground">{t(fitness.descKey)}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        <Check className="w-4 h-4 mr-1" />
        {saving ? t('actions.loading') : t('settings.save_preferences')}
      </Button>
    </div>
  );
};

export default ProfileSettingsEditor;
