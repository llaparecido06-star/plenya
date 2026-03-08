import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Smile, Scale, PenLine, Loader2, Check, Camera, X, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLifePhase } from '@/hooks/useLifePhase';
import { useTranslation } from 'react-i18next';
import { toLocalDateString } from '@/lib/dateUtils';
import { useToast } from '@/hooks/use-toast';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

const pregnancySymptoms = [
  'nausea', 'heartburn', 'swelling', 'back_pain', 'insomnia',
  'fatigue', 'cramps', 'headache', 'dizziness', 'cravings',
  'constipation', 'anxiety', 'contractions', 'shortness_breath',
];

const symptomEmojis: Record<string, string> = {
  nausea: '🤢', heartburn: '🔥', swelling: '🦶', back_pain: '💆', insomnia: '🌙',
  fatigue: '😴', cramps: '⚡', headache: '🤕', dizziness: '💫', cravings: '🍫',
  constipation: '😣', anxiety: '😰', contractions: '🤰', shortness_breath: '😮‍💨',
};

const moods = [
  { emoji: '😢', value: 1 },
  { emoji: '😔', value: 2 },
  { emoji: '😐', value: 3 },
  { emoji: '😊', value: 4 },
  { emoji: '🤩', value: 5 },
];

const PregnancyDiaryCard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { pregnancyWeeks } = useLifePhase();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState(3);
  const [weight, setWeight] = useState<number[]>([65]);
  const [existingEntry, setExistingEntry] = useState<any>(null);
  const [bellyPhotoUrl, setBellyPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = toLocalDateString(new Date());

  useEffect(() => {
    if (!user || !open) return;
    const load = async () => {
      const { data } = await supabase
        .from('pregnancy_diary')
        .select('*')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .maybeSingle();
      if (data) {
        setExistingEntry(data);
        setNotes(data.notes || '');
        setSelectedSymptoms(data.symptoms || []);
        if (data.mood) setMood(data.mood);
        if (data.weight) setWeight([data.weight]);
        if (data.belly_photo_url) setBellyPhotoUrl(data.belly_photo_url);
      }
    };
    load();
  }, [user, open, today]);

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: t('pregnancy.photo_invalid') });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: 'destructive', title: t('pregnancy.photo_too_large') });
      return;
    }

    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `${user.id}/${today}-belly.${ext}`;

      // Delete old photo if exists
      if (bellyPhotoUrl) {
        const oldPath = bellyPhotoUrl.split('/belly-photos/')[1]?.split('?')[0];
        if (oldPath) {
          await supabase.storage.from('belly-photos').remove([decodeURIComponent(oldPath)]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('belly-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: signedData } = await supabase.storage
        .from('belly-photos')
        .createSignedUrl(filePath, 365 * 24 * 60 * 60);

      if (signedData?.signedUrl) {
        setBellyPhotoUrl(signedData.signedUrl);
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      toast({ variant: 'destructive', title: t('pregnancy.photo_upload_error') });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!user || !bellyPhotoUrl) return;
    try {
      const oldPath = bellyPhotoUrl.split('/belly-photos/')[1]?.split('?')[0];
      if (oldPath) {
        await supabase.storage.from('belly-photos').remove([decodeURIComponent(oldPath)]);
      }
      setBellyPhotoUrl(null);
    } catch (err) {
      console.error('Photo remove error:', err);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        entry_date: today,
        week_number: pregnancyWeeks,
        mood,
        weight: weight[0],
        symptoms: selectedSymptoms,
        notes: notes || null,
        belly_photo_url: bellyPhotoUrl || null,
      };

      if (existingEntry) {
        await supabase.from('pregnancy_diary').update(payload).eq('id', existingEntry.id);
      } else {
        await supabase.from('pregnancy_diary').insert(payload);
      }
      setSaved(true);
      setTimeout(() => { setSaved(false); setOpen(false); }, 1200);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="px-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <button className="w-full glass-card p-5 border-burnt-pink/20 text-left hover:shadow-soft transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-burnt-pink/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-burnt-pink" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{t('pregnancy.diary_title')}</h3>
                <p className="text-xs text-muted-foreground">{t('pregnancy.diary_subtitle')}</p>
              </div>
              <PenLine className="w-4 h-4 text-muted-foreground" />
            </div>
          </button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-burnt-pink" />
              {t('pregnancy.diary_title')} — {t('pregnancy.week')} {pregnancyWeeks}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-6 max-h-[70vh] overflow-auto">
            {/* Belly Photo */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Camera className="w-4 h-4" /> {t('pregnancy.belly_photo')}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoSelect}
              />
              {bellyPhotoUrl ? (
                <div className="relative w-full max-w-[200px] mx-auto">
                  <img
                    src={bellyPhotoUrl}
                    alt={t('pregnancy.belly_photo')}
                    className="w-full h-48 object-cover rounded-xl border border-border"
                  />
                  <button
                    onClick={handleRemovePhoto}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 transition-colors"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Image className="w-8 h-8" />
                      <span className="text-xs">{t('pregnancy.belly_photo_add')}</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Mood */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Smile className="w-4 h-4" /> {t('pregnancy.how_feeling')}
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
              <p className="text-sm font-medium text-foreground mb-2">{t('pregnancy.symptoms_today')}</p>
              <div className="flex flex-wrap gap-2">
                {pregnancySymptoms.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleSymptom(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedSymptoms.includes(s)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {symptomEmojis[s] || ''} {t(`pregnancy.symptom_${s}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Weight */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Scale className="w-4 h-4" /> {t('pregnancy.weight_today')}
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
                <PenLine className="w-4 h-4" /> {t('pregnancy.notes')}
              </p>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={t('pregnancy.notes_placeholder')}
                className="min-h-[80px]"
              />
            </div>

            <Button onClick={handleSave} disabled={saving || saved} className="w-full phase-gradient text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : saved ? <Check className="w-4 h-4 mr-2" /> : null}
              {saving ? t('actions.loading') : saved ? t('mind.saved') : t('actions.save')}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </motion.div>
  );
};

export default PregnancyDiaryCard;
