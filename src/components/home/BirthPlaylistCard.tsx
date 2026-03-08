import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, ExternalLink, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface PlaylistItem {
  title: string;
  artist: string;
  spotifyUrl: string;
  category: 'relaxation' | 'breathing' | 'affirmations' | 'nature';
}

const playlists: PlaylistItem[] = [
  { title: 'Calm Piano for Birth', artist: 'Spotify Playlist', spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DWZqd5JICZI0u', category: 'relaxation' },
  { title: 'Deep Focus & Breathing', artist: 'Spotify Playlist', spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ', category: 'breathing' },
  { title: 'Nature Sounds', artist: 'Spotify Playlist', spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX4PP3DA4J0N8', category: 'nature' },
  { title: 'Peaceful Guitar', artist: 'Spotify Playlist', spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX0jgyAiPl8Af', category: 'relaxation' },
  { title: 'Meditation & Yoga', artist: 'Spotify Playlist', spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DWZBCPUIUs2iR', category: 'breathing' },
  { title: 'Sleep & Relaxation', artist: 'Spotify Playlist', spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DWYcDQ1hSjOpY', category: 'relaxation' },
];

const categoryConfig: Record<string, { emoji: string; labelKey: string; gradient: string }> = {
  relaxation: { emoji: '🎵', labelKey: 'pregnancy.pl_relaxation', gradient: 'from-purple-500/20 to-pink-500/20' },
  breathing: { emoji: '🌬️', labelKey: 'pregnancy.pl_breathing', gradient: 'from-blue-500/20 to-cyan-500/20' },
  nature: { emoji: '🌿', labelKey: 'pregnancy.pl_nature', gradient: 'from-green-500/20 to-emerald-500/20' },
  affirmations: { emoji: '💜', labelKey: 'pregnancy.pl_affirmations', gradient: 'from-pink-500/20 to-rose-500/20' },
};

const BirthPlaylistCard: React.FC = () => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('plenya_playlist_favorites') || '[]');
    } catch { return []; }
  });

  const toggleFavorite = (url: string) => {
    const updated = favorites.includes(url) 
      ? favorites.filter(f => f !== url) 
      : [...favorites, url];
    setFavorites(updated);
    localStorage.setItem('plenya_playlist_favorites', JSON.stringify(updated));
  };

  const visiblePlaylists = expanded ? playlists : playlists.slice(0, 3);

  return (
    <motion.div
      className="mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="glass-card p-5 bg-gradient-to-br from-purple-500/5 to-pink-500/10 border-purple-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Music className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{t('pregnancy.pl_title')}</h3>
            <p className="text-sm text-muted-foreground">{t('pregnancy.pl_subtitle')}</p>
          </div>
        </div>

        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {visiblePlaylists.map((item, idx) => {
              const cat = categoryConfig[item.category];
              return (
                <motion.div
                  key={item.spotifyUrl}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${cat.gradient}`}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{t(cat.labelKey)}</p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(item.spotifyUrl)}
                    className="p-1.5"
                  >
                    <Heart
                      className={`w-4 h-4 ${favorites.includes(item.spotifyUrl) ? 'fill-pink-500 text-pink-500' : 'text-muted-foreground'}`}
                    />
                  </button>
                  <a
                    href={item.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-[#1DB954]/20 hover:bg-[#1DB954]/30 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-[#1DB954]" />
                  </a>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 text-muted-foreground"
        >
          {expanded ? (
            <><ChevronUp className="w-4 h-4 mr-1" /> {t('pregnancy.pl_show_less')}</>
          ) : (
            <><ChevronDown className="w-4 h-4 mr-1" /> {t('pregnancy.pl_show_more')}</>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-2">
          🎧 {t('pregnancy.pl_hint')}
        </p>
      </div>
    </motion.div>
  );
};

export default BirthPlaylistCard;
