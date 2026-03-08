import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronLeft, ChevronRight, X, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface DiaryEntry {
  id: string;
  entry_date: string;
  week_number: number | null;
  belly_photo_url: string | null;
  mood: number | null;
}

const BellyPhotoGallery: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('pregnancy_diary')
        .select('id, entry_date, week_number, belly_photo_url, mood')
        .eq('user_id', user.id)
        .not('belly_photo_url', 'is', null)
        .order('entry_date', { ascending: true });

      if (data) setEntries(data as DiaryEntry[]);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading || entries.length === 0) {
    return (
      <motion.div
        className="glass-card p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-burnt-pink/20 flex items-center justify-center">
            <Camera className="w-5 h-5 text-burnt-pink" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t('pregnancy.gallery_title')}</h3>
            <p className="text-xs text-muted-foreground">{t('pregnancy.gallery_subtitle')}</p>
          </div>
        </div>
        {!loading && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <ImageIcon className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">{t('pregnancy.gallery_empty')}</p>
            <p className="text-xs mt-1">{t('pregnancy.gallery_empty_hint')}</p>
          </div>
        )}
      </motion.div>
    );
  }

  const selected = selectedIndex !== null ? entries[selectedIndex] : null;

  return (
    <>
      <motion.div
        className="glass-card p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-burnt-pink/20 flex items-center justify-center">
            <Camera className="w-5 h-5 text-burnt-pink" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t('pregnancy.gallery_title')}</h3>
            <p className="text-xs text-muted-foreground">
              {t('pregnancy.gallery_count', { count: entries.length })}
            </p>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {entries.map((entry, idx) => (
            <motion.button
              key={entry.id}
              onClick={() => setSelectedIndex(idx)}
              className="shrink-0 relative group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img
                src={entry.belly_photo_url!}
                alt={`${t('pregnancy.week')} ${entry.week_number}`}
                className="w-20 h-28 object-cover rounded-xl border-2 border-border group-hover:border-primary transition-colors"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-xl px-1 py-1.5">
                <p className="text-[10px] text-white font-semibold text-center">
                  {t('pregnancy.week')} {entry.week_number || '?'}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Fullscreen viewer */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden bg-black/95 border-none">
          {selected && (
            <div className="relative flex flex-col items-center">
              <button
                onClick={() => setSelectedIndex(null)}
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>

              <AnimatePresence mode="wait">
                <motion.img
                  key={selected.id}
                  src={selected.belly_photo_url!}
                  alt={`${t('pregnancy.week')} ${selected.week_number}`}
                  className="w-full max-h-[70vh] object-contain"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                />
              </AnimatePresence>

              <div className="w-full p-4 flex items-center justify-between">
                <button
                  onClick={() => setSelectedIndex(Math.max(0, (selectedIndex ?? 0) - 1))}
                  disabled={selectedIndex === 0}
                  className="p-2 rounded-full bg-white/10 text-white disabled:opacity-30"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="text-center">
                  <p className="text-white font-semibold">
                    {t('pregnancy.week')} {selected.week_number || '?'}
                  </p>
                  <p className="text-white/60 text-xs">{selected.entry_date}</p>
                </div>

                <button
                  onClick={() => setSelectedIndex(Math.min(entries.length - 1, (selectedIndex ?? 0) + 1))}
                  disabled={selectedIndex === entries.length - 1}
                  className="p-2 rounded-full bg-white/10 text-white disabled:opacity-30"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BellyPhotoGallery;
