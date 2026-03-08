import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Smile, Scale, PenLine, Loader2, Check, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { toLocalDateString } from '@/lib/dateUtils';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, parseISO } from 'date-fns';
import { ptBR, es, enUS } from 'date-fns/locale';
import i18n from '@/i18n/config';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

const menopauseSymptoms = [
  'hot_flash', 'night_sweats', 'insomnia', 'mood_swings', 'brain_fog',
  'joint_pain', 'dry_skin', 'anxiety', 'fatigue', 'headache',
  'weight_gain', 'hair_loss', 'low_libido', 'palpitations',
];

const symptomEmojis: Record<string, string> = {
  hot_flash: '🔥', night_sweats: '🌙', insomnia: '😵', mood_swings: '🎭',
  brain_fog: '🌫️', joint_pain: '🦴', dry_skin: '💧', anxiety: '😰',
  fatigue: '😴', headache: '🤕', weight_gain: '⚖️', hair_loss: '💇',
  low_libido: '💜', palpitations: '💓',
};

const moods = [
  { emoji: '😢', value: 1 },
  { emoji: '😔', value: 2 },
  { emoji: '😐', value: 3 },
  { emoji: '😊', value: 4 },
  { emoji: '🤩', value: 5 },
];

interface DiaryEntry {
  id: string;
  entry_date: string;
  mood: number | null;
  weight: number | null;
  symptoms: string[];
  notes: string | null;
}

const getLocale = () => {
  const lang = i18n.language?.substring(0, 2);
  if (lang === 'es') return es;
  if (lang === 'en') return enUS;
  return ptBR;
};

const MenopauseDiaryCard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState(3);
  const [weight, setWeight] = useState<number[]>([65]);
  const [existingEntry, setExistingEntry] = useState<DiaryEntry | null>(null);

  // Timeline
  const [showTimeline, setShowTimeline] = useState(false);
  const [timeline, setTimeline] = useState<DiaryEntry[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const today = toLocalDateString(new Date());

  useEffect(() => {
    if (!user || !open) return;
    const load = async () => {
      const { data } = await supabase
        .from('menopause_diary')
        .select('*')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .maybeSingle();
      if (data) {
        setExistingEntry(data as DiaryEntry);
        setNotes(data.notes || '');
        setSelectedSymptoms(data.symptoms || []);
        if (data.mood) setMood(data.mood);
        if (data.weight) setWeight([Number(data.weight)]);
      }
    };
    load();
  }, [user, open, today]);

  const loadTimeline = async () => {
    if (!user) return;
    setLoadingTimeline(true);
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString().split('T')[0];
    const { data } = await supabase
      .from('menopause_diary')
      .select('*')
      .eq('user_id', user.id)
      .gte('entry_date', thirtyDaysAgo)
      .order('entry_date', { ascending: false });
    setTimeline((data as DiaryEntry[]) || []);
    setLoadingTimeline(false);
  };

  const toggleTimeline = () => {
    if (!showTimeline) loadTimeline();
    setShowTimeline(!showTimeline);
  };

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        entry_date: today,
        mood,
        weight: weight[0],
        symptoms: selectedSymptoms,
        notes: notes || null,
      };

      if (existingEntry) {
        await supabase.from('menopause_diary').update(payload).eq('id', existingEntry.id);
      } else {
        await supabase.from('menopause_diary').insert(payload);
      }
      setSaved(true);
      setTimeout(() => { setSaved(false); setOpen(false); }, 1200);
    } finally {
      setSaving(false);
    }
  };

  const getMoodEmoji = (m: number | null) => {
    if (!m) return '😐';
    return moods.find(mood => mood.value === m)?.emoji || '😐';
  };

  return (
    <motion.div className="mx-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="glass-card p-5 bg-gradient-to-br from-violet-500/5 to-purple-500/10 border-violet-500/20">
        {/* Header + Write Button */}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <button className="w-full text-left">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-violet-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">{t('menopause.diary_title')}</h3>
                  <p className="text-xs text-muted-foreground">{t('menopause.diary_subtitle')}</p>
                </div>
                <PenLine className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-violet-500" />
                {t('menopause.diary_title')}
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-8 space-y-6 max-h-[70vh] overflow-auto">
              {/* Mood */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Smile className="w-4 h-4" /> {t('menopause.diary_mood')}
                </p>
                <div className="flex justify-between px-2">
                  {moods.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setMood(m.value)}
                      className={`text-3xl p-2 rounded-xl transition-all ${mood === m.value ? 'bg-primary/10 scale-110' : 'opacity-40 hover:opacity-100'}`}
                    >
                      {m.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Symptoms */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">{t('menopause.diary_symptoms')}</p>
                <div className="flex flex-wrap gap-2">
                  {menopauseSymptoms.map(s => (
                    <button
                      key={s}
                      onClick={() => toggleSymptom(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedSymptoms.includes(s)
                          ? 'bg-violet-500 text-white'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {symptomEmojis[s] || ''} {t(`menopause.ds_${s}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Scale className="w-4 h-4" /> {t('menopause.diary_weight')}
                </p>
                <div className="text-center mb-2">
                  <span className="text-3xl font-bold text-foreground">{weight[0].toFixed(1)}</span>
                  <span className="text-lg text-muted-foreground ml-1">kg</span>
                </div>
                <Slider value={weight} onValueChange={setWeight} min={40} max={130} step={0.1} />
              </div>

              {/* Notes */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <PenLine className="w-4 h-4" /> {t('menopause.diary_notes')}
                </p>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={t('menopause.diary_notes_placeholder')}
                  className="min-h-[80px]"
                />
              </div>

              <Button onClick={handleSave} disabled={saving || saved} className="w-full bg-violet-500 hover:bg-violet-600 text-white">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : saved ? <Check className="w-4 h-4 mr-2" /> : null}
                {saving ? t('actions.loading') : saved ? t('mind.saved') : t('actions.save')}
              </Button>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Timeline Toggle */}
        <button
          onClick={toggleTimeline}
          className="w-full mt-4 flex items-center justify-center gap-2 p-2 rounded-xl bg-card/50 hover:bg-card/80 transition-colors text-sm text-muted-foreground"
        >
          <Calendar className="w-4 h-4" />
          {t('menopause.diary_timeline')}
          {showTimeline ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Timeline */}
        <AnimatePresence>
          {showTimeline && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3 max-h-[300px] overflow-auto">
                {loadingTimeline ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                  </div>
                ) : timeline.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-4">{t('menopause.diary_empty')}</p>
                ) : (
                  timeline.map((entry) => (
                    <div key={entry.id} className="relative pl-6 pb-1">
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-violet-500/60 border-2 border-background" />
                      <div className="absolute left-[5px] top-5 bottom-0 w-0.5 bg-violet-500/20" />

                      <div className="bg-card/60 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-foreground">
                            {format(parseISO(entry.entry_date), 'dd MMM', { locale: getLocale() })}
                          </span>
                          <span className="text-lg">{getMoodEmoji(entry.mood)}</span>
                        </div>

                        {entry.symptoms && entry.symptoms.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {entry.symptoms.slice(0, 4).map(s => (
                              <span key={s} className="text-xs px-2 py-0.5 bg-violet-500/10 text-violet-600 rounded-full">
                                {symptomEmojis[s] || ''} {t(`menopause.ds_${s}`)}
                              </span>
                            ))}
                            {entry.symptoms.length > 4 && (
                              <span className="text-xs text-muted-foreground">+{entry.symptoms.length - 4}</span>
                            )}
                          </div>
                        )}

                        {entry.weight && (
                          <span className="text-xs text-muted-foreground">{Number(entry.weight).toFixed(1)} kg</span>
                        )}

                        {entry.notes && (
                          <p className="text-xs text-foreground/70 mt-1 line-clamp-2">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default MenopauseDiaryCard;
