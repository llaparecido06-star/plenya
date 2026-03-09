import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Droplets, Moon, Smile, Activity, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLifePhase } from '@/hooks/useLifePhase';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { toLocalDateString } from '@/lib/dateUtils';
import { subDays } from 'date-fns';

const PostpartumRecoveryCard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { postpartumWeeks } = useLifePhase();
  const { toast } = useToast();
  const [bleeding, setBleeding] = useState(0);
  const [pain, setPain] = useState(0);
  const [mood, setMood] = useState(3);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [safetyAlert, setSafetyAlert] = useState<string | null>(null);

  const today = toLocalDateString(new Date());

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('postpartum_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .maybeSingle();
      if (data) {
        setBleeding(data.bleeding_level ?? 0);
        setPain(data.pain_level ?? 0);
        setMood(data.mood ?? 3);
        setSaved(true);
      }

      // Safety alert: check if bleeding or pain was 5/5 for 2+ consecutive days
      checkSafetyAlerts();
    };
    load();
  }, [user, today]);

  const checkSafetyAlerts = async () => {
    if (!user) return;
    const yesterday = toLocalDateString(subDays(new Date(), 1));
    const dayBefore = toLocalDateString(subDays(new Date(), 2));

    const { data: recentLogs } = await supabase
      .from('postpartum_logs')
      .select('log_date, bleeding_level, pain_level')
      .eq('user_id', user.id)
      .in('log_date', [yesterday, dayBefore])
      .order('log_date', { ascending: false });

    if (recentLogs && recentLogs.length >= 2) {
      const highBleeding = recentLogs.filter(l => (l.bleeding_level ?? 0) >= 4).length >= 2;
      const highPain = recentLogs.filter(l => (l.pain_level ?? 0) >= 4).length >= 2;
      
      if (highBleeding && highPain) {
        setSafetyAlert('⚠️ Sangramento intenso e dor alta por 2+ dias. Recomendamos que entre em contato com seu médico.');
      } else if (highBleeding) {
        setSafetyAlert('⚠️ Sangramento intenso por 2+ dias. Converse com seu médico para garantir que está tudo bem.');
      } else if (highPain) {
        setSafetyAlert('⚠️ Dor intensa por 2+ dias consecutivos. Considere falar com seu médico.');
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('postpartum_logs').upsert({
        user_id: user.id,
        log_date: today,
        bleeding_level: bleeding,
        pain_level: pain,
        mood,
      }, { onConflict: 'user_id,log_date' });

      if (error) {
        await supabase.from('postpartum_logs').insert({
          user_id: user.id,
          log_date: today,
          bleeding_level: bleeding,
          pain_level: pain,
          mood,
        });
      }

      setSaved(true);
      toast({ title: t('postpartum.saved', 'Registro salvo! 💜') });
      
      // Re-check safety with current values included
      if (bleeding >= 4 || pain >= 4) {
        checkSafetyAlerts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const bleedingLabels = ['Nenhum', 'Leve', 'Moderado', 'Intenso', 'Forte'];
  const moodEmojis = ['😢', '😔', '😐', '😊', '🤩'];

  const getRecoveryTip = () => {
    if (!postpartumWeeks) return null;
    if (postpartumWeeks <= 1) return t('postpartum.tip_week1', 'Primeira semana: descanse o máximo possível. Aceite ajuda! 💛');
    if (postpartumWeeks <= 2) return t('postpartum.tip_week2', 'Semana 2: lóquios devem estar diminuindo. Converse com seu médico se o sangramento aumentar.');
    if (postpartumWeeks <= 4) return t('postpartum.tip_week4', 'Seu corpo está se recuperando. Caminhadas leves podem ajudar o humor.');
    if (postpartumWeeks <= 6) return t('postpartum.tip_week6', 'Consulta pós-parto! Converse sobre contracepção e retorno às atividades.');
    if (postpartumWeeks <= 12) return t('postpartum.tip_week12', 'A recuperação continua. Seja paciente consigo mesma e priorize o sono.');
    return t('postpartum.tip_after', 'Cada corpo tem seu tempo. Continue registrando para acompanhar sua evolução.');
  };

  return (
    <div className="px-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              {t('postpartum.recovery_title', 'Recuperação Pós-Parto')}
              {postpartumWeeks !== null && (
                <span className="text-xs font-normal text-muted-foreground ml-auto">
                  {t('postpartum.week', 'Semana')} {postpartumWeeks}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Safety Alert */}
            {safetyAlert && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-lg bg-destructive/10 border border-destructive/30"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive font-medium">{safetyAlert}</p>
                </div>
              </motion.div>
            )}

            {/* Recovery tip */}
            {getRecoveryTip() && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-foreground">{getRecoveryTip()}</p>
              </div>
            )}

            {/* Bleeding */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-rose-500" />
                  {t('postpartum.bleeding', 'Sangramento')}
                </span>
                <span className="text-xs text-muted-foreground">{bleedingLabels[bleeding]}</span>
              </div>
              <Slider value={[bleeding]} onValueChange={([v]) => { setBleeding(v); setSaved(false); }} max={4} step={1} />
            </div>

            {/* Pain */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-500" />
                  {t('postpartum.pain', 'Dor/Desconforto')}
                </span>
                <span className="text-xs text-muted-foreground">{pain}/5</span>
              </div>
              <Slider value={[pain]} onValueChange={([v]) => { setPain(v); setSaved(false); }} max={5} step={1} />
            </div>

            {/* Mood */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-violet-500" />
                  {t('postpartum.mood', 'Humor')}
                </span>
                <span className="text-lg">{moodEmojis[mood]}</span>
              </div>
              <Slider value={[mood]} onValueChange={([v]) => { setMood(v); setSaved(false); }} max={4} step={1} />
            </div>

            <Button
              onClick={handleSave}
              disabled={loading || saved}
              className="w-full"
              variant={saved ? 'outline' : 'default'}
            >
              {saved ? t('postpartum.saved_btn', '✓ Registrado hoje') : t('postpartum.save_btn', 'Salvar registro')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PostpartumRecoveryCard;
