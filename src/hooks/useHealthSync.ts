import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import i18n from '@/i18n/config';

interface SleepSample {
  date: string;
  hours: number;
  quality: number;
}

export const useHealthSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const { toast } = useToast();

  const isNative = Capacitor.isNativePlatform();

  const checkAvailability = useCallback(async () => {
    if (!isNative) {
      setAvailable(false);
      return false;
    }

    try {
      const { Health } = await import('@capgo/capacitor-health');
      // Check if health APIs are available on this device
      const result = await Health.isAvailable();
      setAvailable(result.available);
      return result.available;
    } catch {
      setAvailable(false);
      return false;
    }
  }, [isNative]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false;

    try {
      const { Health } = await import('@capgo/capacitor-health');
      await Health.requestAuthorization({ read: ['sleep'] });
      return true;
    } catch (err) {
      console.error('Health permission error:', err);
      toast({
        variant: 'destructive',
        title: i18n.t('menopause.health_permission_denied'),
      });
      return false;
    }
  }, [isNative, toast]);

  const readSleepData = useCallback(async (days = 7): Promise<SleepSample[]> => {
    if (!isNative) return [];

    try {
      const { Health } = await import('@capgo/capacitor-health');
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const { samples } = await Health.readSamples({
        dataType: 'sleep',
        startDate,
        endDate,
      });

      // Group sleep samples by date and sum minutes
      const byDate: Record<string, { minutes: number; count: number }> = {};
      samples.forEach((s: { startDate?: string; value?: number; sleepState?: string }) => {
        const date = (s.startDate || '').split('T')[0];
        if (!date) return;
        if (!byDate[date]) byDate[date] = { minutes: 0, count: 0 };
        byDate[date].minutes += (s.value || 0);
        byDate[date].count++;
      });

      return Object.entries(byDate).map(([date, data]) => ({
        date,
        hours: Math.round(data.minutes / 60 * 10) / 10,
        quality: 3, // HealthKit/HC don't provide quality directly
      }));
    } catch (err) {
      console.error('Health read error:', err);
      return [];
    }
  }, [isNative]);

  const syncSleepToDatabase = useCallback(async (userId: string, days = 7): Promise<number> => {
    setSyncing(true);
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        setSyncing(false);
        return 0;
      }

      const samples = await readSleepData(days);
      if (samples.length === 0) {
        setSyncing(false);
        return 0;
      }

      let count = 0;
      for (const sample of samples) {
        const { data: existing } = await supabase
          .from('daily_logs')
          .select('notes')
          .eq('user_id', userId)
          .eq('log_date', sample.date)
          .maybeSingle();

        let notesObj: Record<string, unknown> = {};
        if (existing?.notes) {
          try { notesObj = JSON.parse(existing.notes); } catch { notesObj = { text: existing.notes }; }
        }

        // Don't overwrite manually logged data
        if (notesObj.sleep_source === 'manual') continue;

        notesObj.sleep_hours = sample.hours;
        notesObj.sleep_quality = sample.quality;
        notesObj.sleep_source = 'health_connect';

        const { error } = await supabase
          .from('daily_logs')
          .upsert({
            user_id: userId,
            log_date: sample.date,
            notes: JSON.stringify(notesObj),
          }, { onConflict: 'user_id,log_date' });

        if (!error) count++;
      }

      if (count > 0) {
        toast({ title: i18n.t('menopause.health_synced', { count }) });
      }

      return count;
    } catch (err) {
      console.error('Health sync error:', err);
      toast({ variant: 'destructive', title: i18n.t('menopause.health_sync_error') });
      return 0;
    } finally {
      setSyncing(false);
    }
  }, [requestPermissions, readSleepData, toast]);

  return {
    isNative,
    available,
    syncing,
    checkAvailability,
    requestPermissions,
    readSleepData,
    syncSleepToDatabase,
  };
};
