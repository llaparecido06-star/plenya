import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Wind, Droplets, Moon as MoonIcon, Brain, Bone, Heart, Activity, Flame, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAIBrain } from '@/hooks/useAIBrain';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MenopauseWellnessHubProps {
  age?: number | null;
}

const MenopauseWellnessHub: React.FC<MenopauseWellnessHubProps> = ({ age }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { chat, loading: aiLoading } = useAIBrain();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [dailyTip, setDailyTip] = useState<string | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<{ totalLogs: number; topSymptom: string | null }>({ totalLogs: 0, topSymptom: null });

  const quickSymptoms = [
    { id: 'hot_flash', labelKey: 'menopause.sym_hot_flash', icon: Flame, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' },
    { id: 'insomnia', labelKey: 'menopause.sym_insomnia', icon: MoonIcon, color: 'text-indigo-500', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
    { id: 'brain_fog', labelKey: 'menopause.sym_brain_fog', icon: Brain, color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
    { id: 'mood_swing', labelKey: 'menopause.sym_mood', icon: Heart, color: 'text-pink-500', bgColor: 'bg-pink-100 dark:bg-pink-900/30' },
    { id: 'joint_pain', labelKey: 'menopause.sym_joint', icon: Bone, color: 'text-amber-500', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
    { id: 'dry_skin', labelKey: 'menopause.sym_dry_skin', icon: Droplets, color: 'text-cyan-500', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30' },
    { id: 'anxiety', labelKey: 'menopause.sym_anxiety', icon: Wind, color: 'text-teal-500', bgColor: 'bg-teal-100 dark:bg-teal-900/30' },
    { id: 'fatigue', labelKey: 'menopause.sym_fatigue', icon: Activity, color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  ];

  const menopauseSymptomIds = quickSymptoms.map(s => s.id);

  // Load today's symptoms + weekly stats
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    const load = async () => {
      // Today's symptoms
      const { data } = await supabase
        .from('daily_logs')
        .select('symptoms')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .maybeSingle();
      
      if (data?.symptoms) {
        setSelectedSymptoms((data.symptoms as string[]).filter(s => menopauseSymptomIds.includes(s)));
      }

      // Weekly stats
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: weekData } = await supabase
        .from('daily_logs')
        .select('symptoms')
        .eq('user_id', user.id)
        .gte('log_date', weekAgo.toISOString().split('T')[0]);

      if (weekData) {
        const allSymptoms = weekData.flatMap(d => ((d.symptoms as string[]) || []).filter(s => menopauseSymptomIds.includes(s)));
        const freq: Record<string, number> = {};
        allSymptoms.forEach(s => { freq[s] = (freq[s] || 0) + 1; });
        const topSymptom = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
        setWeeklyStats({ totalLogs: weekData.length, topSymptom });
      }
    };

    load();

    // Load cached tip
    const cached = localStorage.getItem('plenya_meno_tip');
    if (cached) {
      try {
        const { text, date } = JSON.parse(cached);
        if ((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24) < 1) {
          setDailyTip(text);
        }
      } catch { /* ignore */ }
    }
  }, [user]);

  const toggleSymptom = async (symptomId: string) => {
    if (!user) return;
    const newSelected = selectedSymptoms.includes(symptomId)
      ? selectedSymptoms.filter(s => s !== symptomId)
      : [...selectedSymptoms, symptomId];

    setSelectedSymptoms(newSelected);
    setSaving(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: existingData } = await supabase
        .from('daily_logs')
        .select('symptoms')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .maybeSingle();

      const existing = (existingData?.symptoms as string[]) || [];
      const otherSymptoms = existing.filter(s => !menopauseSymptomIds.includes(s));
      const merged = [...otherSymptoms, ...newSelected];

      const { error } = await supabase
        .from('daily_logs')
        .upsert({ user_id: user.id, log_date: today, symptoms: merged }, { onConflict: 'user_id,log_date' });

      if (error) throw error;

      toast({
        title: newSelected.includes(symptomId) ? t('menopause.symptom_logged') : t('menopause.symptom_removed'),
        description: t(quickSymptoms.find(s => s.id === symptomId)?.labelKey || ''),
      });
    } catch {
      setSelectedSymptoms(selectedSymptoms);
      toast({ title: t('menopause.save_error'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const generateTip = async () => {
    const symptomsText = selectedSymptoms.length > 0 
      ? selectedSymptoms.map(s => quickSymptoms.find(q => q.id === s)?.id).join(', ')
      : 'nenhum registrado hoje';

    const result = await chat({
      message: `Sou uma mulher${age ? ` de ${age} anos` : ''} na menopausa. Meus sintomas de hoje: ${symptomsText}. Sintoma mais frequente da semana: ${weeklyStats.topSymptom || 'nenhum'}. Me dê uma dica prática e carinhosa (máximo 3 frases) para aliviar meus sintomas hoje. Inclua uma sugestão de alimentação ou exercício.`,
      history: [],
      life_phase: 'menopause',
    });

    if (result) {
      setDailyTip(result);
      localStorage.setItem('plenya_meno_tip', JSON.stringify({ text: result, date: new Date().toISOString() }));
    }
  };

  const topSymptomLabel = weeklyStats.topSymptom 
    ? t(quickSymptoms.find(s => s.id === weeklyStats.topSymptom)?.labelKey || '')
    : null;

  return (
    <motion.div
      className="mx-4 space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Main Wellness Card */}
      <div className="glass-card p-5 bg-gradient-to-br from-leaf-green/5 to-sage-green/10 border-leaf-green/20">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-leaf-green/20 to-sage-green/20 flex items-center justify-center text-2xl">
              🌿
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{t('menopause.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {age ? t('menopause.subtitle_age', { age }) : t('menopause.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Expanded Symptom Grid - 8 symptoms */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-3">{t('menopause.log_symptoms')}:</p>
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
                  className={`relative flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${
                    isSelected
                      ? `${symptom.bgColor} border-2 border-current ${symptom.color}`
                      : 'bg-card hover:bg-muted border-2 border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? symptom.color : 'text-muted-foreground'}`} />
                  <span className={`text-[10px] font-medium leading-tight text-center ${isSelected ? symptom.color : 'text-muted-foreground'}`}>
                    {t(symptom.labelKey)}
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

        {/* Weekly Mini-Stats */}
        {weeklyStats.totalLogs > 0 && (
          <div className="p-3 bg-card/50 rounded-xl mb-4">
            <p className="text-xs text-muted-foreground mb-1">{t('menopause.weekly_summary')}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {t('menopause.days_logged', { count: weeklyStats.totalLogs })}
              </span>
              {topSymptomLabel && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {t('menopause.top_symptom')}: {topSymptomLabel}
                </span>
              )}
            </div>
          </div>
        )}

        {/* AI Daily Tip */}
        {dailyTip ? (
          <div className="p-3 bg-leaf-green/10 rounded-xl">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-leaf-green shrink-0 mt-0.5" />
              <p className="text-sm text-leaf-green leading-relaxed">{dailyTip}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={generateTip}
              disabled={aiLoading}
              className="mt-2 text-xs text-muted-foreground"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${aiLoading ? 'animate-spin' : ''}`} />
              {t('menopause.new_tip')}
            </Button>
          </div>
        ) : (
          <Button
            onClick={generateTip}
            disabled={aiLoading}
            variant="outline"
            className="w-full border-leaf-green/30 text-leaf-green hover:bg-leaf-green/10"
          >
            {aiLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {aiLoading ? t('actions.loading') : t('menopause.get_tip')}
          </Button>
        )}
      </div>

      {/* Menopause Nutrition Tips */}
      <div className="glass-card p-5 bg-gradient-to-br from-amber-500/5 to-orange-500/10 border-amber-500/20">
        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          🥗 {t('menopause.nutrition_title')}
        </h4>
        <div className="space-y-2">
          {[
            { emoji: '🫘', key: 'menopause.nut_phyto' },
            { emoji: '🦴', key: 'menopause.nut_calcium' },
            { emoji: '🐟', key: 'menopause.nut_omega' },
            { emoji: '🥬', key: 'menopause.nut_magnesium' },
          ].map((item) => (
            <div key={item.key} className="flex items-start gap-2 p-2 bg-card/50 rounded-lg">
              <span>{item.emoji}</span>
              <p className="text-sm text-foreground">{t(item.key)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Self-Care Checklist */}
      <MenopauseSelfCare />
    </motion.div>
  );
};

const MenopauseSelfCare: React.FC = () => {
  const { t } = useTranslation();
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `plenya_meno_selfcare_${today}`;

  const [checked, setChecked] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(cacheKey) || '[]'); } catch { return []; }
  });

  const items = [
    { id: 'water', emoji: '💧', key: 'menopause.sc_water' },
    { id: 'walk', emoji: '🚶‍♀️', key: 'menopause.sc_walk' },
    { id: 'breathe', emoji: '🌬️', key: 'menopause.sc_breathe' },
    { id: 'sleep', emoji: '😴', key: 'menopause.sc_sleep' },
    { id: 'journal', emoji: '📝', key: 'menopause.sc_journal' },
  ];

  const toggle = (id: string) => {
    const updated = checked.includes(id) ? checked.filter(c => c !== id) : [...checked, id];
    setChecked(updated);
    localStorage.setItem(cacheKey, JSON.stringify(updated));
  };

  const progress = (checked.length / items.length) * 100;

  return (
    <div className="glass-card p-5 bg-gradient-to-br from-purple-500/5 to-indigo-500/10 border-purple-500/20">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          💜 {t('menopause.sc_title')}
        </h4>
        <span className="text-xs text-muted-foreground">{checked.length}/{items.length}</span>
      </div>
      <Progress value={progress} className="h-2 mb-3" />
      <div className="space-y-2">
        {items.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => toggle(item.id)}
            whileTap={{ scale: 0.98 }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
              checked.includes(item.id)
                ? 'bg-primary/10 line-through text-muted-foreground'
                : 'bg-card hover:bg-muted'
            }`}
          >
            <span className="text-lg">{item.emoji}</span>
            <span className="text-sm font-medium text-left flex-1">{t(item.key)}</span>
            {checked.includes(item.id) && <Check className="w-4 h-4 text-primary" />}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default MenopauseWellnessHub;
