import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pill, Calendar, Clock, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, addDays, differenceInDays, isBefore, isToday } from 'date-fns';
import { ptBR, es, enUS } from 'date-fns/locale';
import i18n from '@/i18n/config';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const hrtTypes = [
  { value: 'pill', label: 'Comprimido' },
  { value: 'patch', label: 'Adesivo' },
  { value: 'gel', label: 'Gel' },
  { value: 'injection', label: 'Injeção' },
  { value: 'ring', label: 'Anel vaginal' },
  { value: 'cream', label: 'Creme' },
];

const frequencies = [
  { value: 1, label: 'Diário' },
  { value: 2, label: 'A cada 2 dias' },
  { value: 3, label: 'A cada 3 dias' },
  { value: 7, label: 'Semanal' },
  { value: 14, label: 'Quinzenal' },
  { value: 28, label: 'Mensal' },
];

const getLocale = () => {
  const lang = i18n.language?.substring(0, 2);
  if (lang === 'es') return es;
  if (lang === 'en') return enUS;
  return ptBR;
};

interface HRTData {
  hrt_type: string | null;
  hrt_start_date: string | null;
  hrt_frequency_days: number | null;
  hrt_last_taken: string | null;
}

const HRTTracker: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // HRT data
  const [hrtData, setHrtData] = useState<HRTData | null>(null);
  
  // Form state
  const [hrtType, setHrtType] = useState('pill');
  const [frequency, setFrequency] = useState(1);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (!user) return;
    loadHRTData();
  }, [user]);

  const loadHRTData = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data } = await supabase
      .from('profiles')
      .select('hrt_type, hrt_start_date, hrt_frequency_days, hrt_last_taken')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setHrtData(data);
      if (data.hrt_type) setHrtType(data.hrt_type);
      if (data.hrt_frequency_days) setFrequency(data.hrt_frequency_days);
      if (data.hrt_start_date) setStartDate(data.hrt_start_date);
    }
    setLoading(false);
  };

  const saveHRTConfig = async () => {
    if (!user) return;
    setSaving(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        hrt_type: hrtType,
        hrt_frequency_days: frequency,
        hrt_start_date: startDate,
      })
      .eq('user_id', user.id);
    
    if (!error) {
      toast({ title: t('menopause.hrt_saved') });
      setHrtData(prev => ({
        ...prev,
        hrt_type: hrtType,
        hrt_frequency_days: frequency,
        hrt_start_date: startDate,
        hrt_last_taken: prev?.hrt_last_taken || null,
      }));
      setDrawerOpen(false);
    }
    setSaving(false);
  };

  const markAsTaken = async () => {
    if (!user) return;
    setSaving(true);
    
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const { error } = await supabase
      .from('profiles')
      .update({ hrt_last_taken: today })
      .eq('user_id', user.id);
    
    if (!error) {
      toast({ title: t('menopause.hrt_taken'), description: '✓' });
      setHrtData(prev => prev ? { ...prev, hrt_last_taken: today } : null);
    }
    setSaving(false);
  };

  // Calculate next dose date and status
  const getNextDose = () => {
    if (!hrtData?.hrt_last_taken || !hrtData.hrt_frequency_days) return null;
    return addDays(parseISO(hrtData.hrt_last_taken), hrtData.hrt_frequency_days);
  };

  const getStatus = () => {
    const nextDose = getNextDose();
    if (!nextDose) return 'setup';
    
    const today = new Date();
    const diff = differenceInDays(nextDose, today);
    
    if (diff < 0) return 'overdue';
    if (diff === 0) return 'today';
    if (diff <= 2) return 'soon';
    return 'ok';
  };

  const status = getStatus();
  const nextDose = getNextDose();
  const hasHRT = hrtData?.hrt_type;

  const getStatusColor = () => {
    switch (status) {
      case 'overdue': return 'from-red-500/20 to-red-600/20 border-red-500/30';
      case 'today': return 'from-amber-500/20 to-orange-500/20 border-amber-500/30';
      case 'soon': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      default: return 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30';
    }
  };

  const getTypeLabel = (type: string) => {
    return hrtTypes.find(t => t.value === type)?.label || type;
  };

  if (loading) {
    return (
      <div className="mx-4 glass-card p-5 flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      className="mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={`glass-card p-5 bg-gradient-to-br ${getStatusColor()}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
              <Pill className="w-6 h-6 text-pink-500" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{t('menopause.hrt_title')}</h3>
              <p className="text-xs text-muted-foreground">
                {hasHRT ? getTypeLabel(hrtData.hrt_type!) : t('menopause.hrt_subtitle')}
              </p>
            </div>
          </div>
        </div>

        {!hasHRT ? (
          // Setup prompt
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" className="w-full">
                {t('menopause.hrt_setup')}
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-pink-500" />
                  {t('menopause.hrt_config')}
                </DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-8 space-y-5">
                {/* Type */}
                <div>
                  <p className="text-sm font-medium mb-2">{t('menopause.hrt_type')}</p>
                  <Select value={hrtType} onValueChange={setHrtType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hrtTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Frequency */}
                <div>
                  <p className="text-sm font-medium mb-2">{t('menopause.hrt_frequency')}</p>
                  <Select value={frequency.toString()} onValueChange={v => setFrequency(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencies.map(f => (
                        <SelectItem key={f.value} value={f.value.toString()}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Start date */}
                <div>
                  <p className="text-sm font-medium mb-2">{t('menopause.hrt_start_date')}</p>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>

                <Button onClick={saveHRTConfig} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {t('actions.save')}
                </Button>
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          // Active tracking
          <>
            {/* Status message */}
            <div className="mb-4 p-3 rounded-xl bg-card/50">
              {status === 'overdue' && (
                <div className="flex items-center gap-2 text-red-500">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('menopause.hrt_overdue')}</span>
                </div>
              )}
              {status === 'today' && (
                <div className="flex items-center gap-2 text-amber-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('menopause.hrt_due_today')}</span>
                </div>
              )}
              {(status === 'soon' || status === 'ok') && nextDose && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    {t('menopause.hrt_next')}: {format(nextDose, 'dd/MM', { locale: getLocale() })}
                  </span>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={markAsTaken}
                disabled={saving}
                className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                {t('menopause.hrt_mark_taken')}
              </Button>
              
              <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Calendar className="w-4 h-4" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>{t('menopause.hrt_config')}</DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4 pb-8 space-y-5">
                    <div>
                      <p className="text-sm font-medium mb-2">{t('menopause.hrt_type')}</p>
                      <Select value={hrtType} onValueChange={setHrtType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {hrtTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">{t('menopause.hrt_frequency')}</p>
                      <Select value={frequency.toString()} onValueChange={v => setFrequency(Number(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {frequencies.map(f => (
                            <SelectItem key={f.value} value={f.value.toString()}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={saveHRTConfig} disabled={saving} className="w-full">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {t('actions.save')}
                    </Button>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>

            {/* Last taken info */}
            {hrtData?.hrt_last_taken && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                {t('menopause.hrt_last_taken')}: {format(parseISO(hrtData.hrt_last_taken), 'dd/MM/yyyy', { locale: getLocale() })}
              </p>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default HRTTracker;
