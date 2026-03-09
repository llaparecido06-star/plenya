import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Flame, Bell, BellOff, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AlertThresholds {
  sleep_min_hours: number;
  sleep_consecutive_nights: number;
  hot_flash_increase_percent: number;
  alerts_enabled: boolean;
}

const DEFAULTS: AlertThresholds = {
  sleep_min_hours: 6,
  sleep_consecutive_nights: 3,
  hot_flash_increase_percent: 50,
  alerts_enabled: true,
};

const MenopauseAlertSettings: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [thresholds, setThresholds] = useState<AlertThresholds>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('alert_thresholds')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.alert_thresholds) {
        const parsed = data.alert_thresholds as unknown as Partial<AlertThresholds>;
        setThresholds({ ...DEFAULTS, ...parsed });
      }
      setLoaded(true);
    };
    load();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({ alert_thresholds: JSON.parse(JSON.stringify(thresholds)) })
      .eq('user_id', user.id);

    setSaving(false);
    if (!error) {
      toast({ title: t('menopause.alert_saved') });
    }
  };

  if (!loaded) return null;

  return (
    <div className="space-y-6">
      {/* Master toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
        <div className="flex items-center gap-3">
          {thresholds.alerts_enabled ? (
            <Bell className="w-5 h-5 text-primary" />
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">{t('menopause.alert_enabled')}</p>
            <p className="text-xs text-muted-foreground">{t('menopause.alert_enabled_desc')}</p>
          </div>
        </div>
        <Switch
          checked={thresholds.alerts_enabled}
          onCheckedChange={(v) => setThresholds(prev => ({ ...prev, alerts_enabled: v }))}
        />
      </div>

      <div className={thresholds.alerts_enabled ? '' : 'opacity-40 pointer-events-none'}>
        {/* Sleep threshold */}
        <div className="p-4 rounded-xl bg-muted/30 space-y-3">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-500" />
            <p className="text-sm font-medium text-foreground">{t('menopause.alert_sleep_title')}</p>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">
              {t('menopause.alert_sleep_hours')}: <span className="font-bold text-foreground">{thresholds.sleep_min_hours}h</span>
            </Label>
            <Slider
              value={[thresholds.sleep_min_hours]}
              onValueChange={([v]) => setThresholds(prev => ({ ...prev, sleep_min_hours: v }))}
              min={3}
              max={8}
              step={0.5}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">
              {t('menopause.alert_sleep_nights')}: <span className="font-bold text-foreground">{thresholds.sleep_consecutive_nights}</span>
            </Label>
            <Slider
              value={[thresholds.sleep_consecutive_nights]}
              onValueChange={([v]) => setThresholds(prev => ({ ...prev, sleep_consecutive_nights: v }))}
              min={2}
              max={7}
              step={1}
              className="mt-2"
            />
          </div>

          <p className="text-[10px] text-muted-foreground italic">
            {t('menopause.alert_sleep_example', {
              hours: thresholds.sleep_min_hours,
              nights: thresholds.sleep_consecutive_nights,
            })}
          </p>
        </div>

        {/* Hot flash threshold */}
        <div className="p-4 rounded-xl bg-muted/30 space-y-3 mt-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <p className="text-sm font-medium text-foreground">{t('menopause.alert_flash_title')}</p>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">
              {t('menopause.alert_flash_percent')}: <span className="font-bold text-foreground">{thresholds.hot_flash_increase_percent}%</span>
            </Label>
            <Slider
              value={[thresholds.hot_flash_increase_percent]}
              onValueChange={([v]) => setThresholds(prev => ({ ...prev, hot_flash_increase_percent: v }))}
              min={20}
              max={100}
              step={10}
              className="mt-2"
            />
          </div>

          <p className="text-[10px] text-muted-foreground italic">
            {t('menopause.alert_flash_example', {
              percent: thresholds.hot_flash_increase_percent,
            })}
          </p>
        </div>
      </div>

      <Button onClick={save} className="w-full" disabled={saving}>
        <Save className="w-4 h-4 mr-2" />
        {saving ? t('actions.loading') : t('actions.save')}
      </Button>
    </div>
  );
};

export default MenopauseAlertSettings;
