import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const MacroGoalEditor: React.FC = () => {
  const { user } = useAuth();
  const { macro_protein_goal, macro_carbs_goal, macro_fat_goal, macro_calories_goal, refetch } = useProfile();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [protein, setProtein] = useState(macro_protein_goal);
  const [carbs, setCarbs] = useState(macro_carbs_goal);
  const [fat, setFat] = useState(macro_fat_goal);
  const [calories, setCalories] = useState(macro_calories_goal);

  const handleOpen = () => {
    setProtein(macro_protein_goal);
    setCarbs(macro_carbs_goal);
    setFat(macro_fat_goal);
    setCalories(macro_calories_goal);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          macro_protein_goal: protein,
          macro_carbs_goal: carbs,
          macro_fat_goal: fat,
          macro_calories_goal: calories,
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({ title: 'Metas atualizadas! 🎯' });
      refetch();
      setIsEditing(false);
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleOpen}
        className="h-8 w-8"
      >
        <Settings2 className="w-4 h-4 text-muted-foreground" />
      </Button>
    );
  }

  return (
    <motion.div
      className="mt-3 p-3 rounded-xl bg-secondary/50 border border-border space-y-3"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
    >
      <p className="text-sm font-medium text-foreground">Metas diárias (g)</p>
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="text-xs text-muted-foreground">Calorias</label>
          <Input
            type="number"
            value={calories}
            onChange={(e) => setCalories(Number(e.target.value))}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Proteína</label>
          <Input
            type="number"
            value={protein}
            onChange={(e) => setProtein(Number(e.target.value))}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Carbs</label>
          <Input
            type="number"
            value={carbs}
            onChange={(e) => setCarbs(Number(e.target.value))}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Gordura</label>
          <Input
            type="number"
            value={fat}
            onChange={(e) => setFat(Number(e.target.value))}
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
          Cancelar
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" /> Salvar</>}
        </Button>
      </div>
    </motion.div>
  );
};

export default MacroGoalEditor;
