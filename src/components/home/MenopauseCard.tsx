import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Thermometer, Moon, Brain, Heart, Leaf, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MenopauseCardProps {
  age?: number | null;
}

const MenopauseCard: React.FC<MenopauseCardProps> = ({ age }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Common menopause symptoms to track
  const quickSymptoms = [
    { id: 'hot_flash', label: 'Calor', icon: Thermometer, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' },
    { id: 'insomnia', label: 'Insônia', icon: Moon, color: 'text-indigo-500', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
    { id: 'brain_fog', label: 'Névoa Mental', icon: Brain, color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
    { id: 'mood_swing', label: 'Humor', icon: Heart, color: 'text-pink-500', bgColor: 'bg-pink-100 dark:bg-pink-900/30' },
  ];

  // Load existing symptoms on mount
  useEffect(() => {
    const loadTodaySymptoms = async () => {
      if (!user) return;
      
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_logs')
        .select('symptoms')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .maybeSingle();
      
      if (!error && data?.symptoms) {
        // Filter only menopause-specific symptoms
        const menopauseSymptomIds = quickSymptoms.map(s => s.id);
        const todaySymptoms = (data.symptoms as string[]).filter(s => menopauseSymptomIds.includes(s));
        setSelectedSymptoms(todaySymptoms);
      }
    };
    
    loadTodaySymptoms();
  }, [user]);

  const toggleSymptom = async (symptomId: string) => {
    if (!user) return;
    
    const newSelected = selectedSymptoms.includes(symptomId)
      ? selectedSymptoms.filter(s => s !== symptomId)
      : [...selectedSymptoms, symptomId];
    
    // Optimistically update UI
    setSelectedSymptoms(newSelected);
    
    // Save to database
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // First, get existing symptoms to merge (preserve non-menopause symptoms)
      const { data: existingData } = await supabase
        .from('daily_logs')
        .select('symptoms')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .maybeSingle();
      
      const existingSymptoms = (existingData?.symptoms as string[]) || [];
      const menopauseSymptomIds = quickSymptoms.map(s => s.id);
      const otherSymptoms = existingSymptoms.filter(s => !menopauseSymptomIds.includes(s));
      const mergedSymptoms = [...otherSymptoms, ...newSelected];
      
      const { error } = await supabase
        .from('daily_logs')
        .upsert({
          user_id: user.id,
          log_date: today,
          symptoms: mergedSymptoms,
        }, {
          onConflict: 'user_id,log_date'
        });

      if (error) throw error;
      
      toast({
        title: newSelected.includes(symptomId) ? 'Sintoma registrado 💜' : 'Sintoma removido',
        description: `${quickSymptoms.find(s => s.id === symptomId)?.label}`,
      });
    } catch (error) {
      console.error('Error saving symptom:', error);
      // Revert on error
      setSelectedSymptoms(selectedSymptoms);
      toast({
        title: 'Erro ao salvar',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="glass-card p-5 bg-gradient-to-br from-leaf-green/5 to-sage-green/10 border-leaf-green/20">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-leaf-green/20 to-sage-green/20 flex items-center justify-center">
              <Leaf className="w-7 h-7 text-leaf-green" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Bem-estar Climatérico</h3>
              <p className="text-sm text-muted-foreground">
                {age ? `${age} anos de sabedoria` : 'Seu corpo, seu tempo'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Symptom Logging */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-3">Registrar sintoma rápido:</p>
          <div className="grid grid-cols-4 gap-2">
            {quickSymptoms.map((symptom) => {
              const Icon = symptom.icon;
              const isSelected = selectedSymptoms.includes(symptom.id);
              return (
                <motion.button
                  key={symptom.id}
                  onClick={() => toggleSymptom(symptom.id)}
                  disabled={saving}
                  whileTap={{ scale: 0.95 }}
                  className={`relative flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                    isSelected 
                      ? `${symptom.bgColor} border-2 border-current ${symptom.color}` 
                      : 'bg-card hover:bg-muted border-2 border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? symptom.color : 'text-muted-foreground'}`} />
                  <span className={`text-xs font-medium ${isSelected ? symptom.color : 'text-muted-foreground'}`}>
                    {symptom.label}
                  </span>
                  {isSelected && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-leaf-green rounded-full flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Daily Tip */}
        <div className="p-3 bg-leaf-green/10 rounded-xl">
          <p className="text-sm text-leaf-green">
            💚 Dica: Alimentos ricos em fitoestrógenos (soja, linhaça) podem ajudar no equilíbrio
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default MenopauseCard;
