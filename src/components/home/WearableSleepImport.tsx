import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Watch, Upload, Smartphone, CloudDownload, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SleepEntry {
  date: string;
  hours: number;
  quality: number;
  wake_ups?: number;
}

const WearableSleepImport: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): SleepEntry[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    const header = lines[0].toLowerCase();
    const hasHeader = header.includes('date') || header.includes('data') || header.includes('sleep');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines.map(line => {
      const cols = line.split(/[,;\t]/).map(c => c.trim().replace(/"/g, ''));
      const date = cols[0];
      const hours = parseFloat(cols[1]);
      const quality = parseInt(cols[2]) || 3;
      const wake_ups = parseInt(cols[3]) || 0;

      if (!date || isNaN(hours)) return null;
      // Validate date format
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) return null;

      return {
        date: parsed.toISOString().split('T')[0],
        hours: Math.max(0, Math.min(24, hours)),
        quality: Math.max(1, Math.min(5, quality)),
        wake_ups: Math.max(0, wake_ups),
      };
    }).filter(Boolean) as SleepEntry[];
  };

  const parseJSON = (text: string): SleepEntry[] => {
    try {
      const data = JSON.parse(text);
      const entries = Array.isArray(data) ? data : data.sleep || data.entries || data.data || [];
      return entries.map((e: Record<string, unknown>) => {
        const date = String(e.date || e.dateOfSleep || e.start_date || '');
        const hours = Number(e.hours || e.duration || e.minutesAsleep ? Number(e.minutesAsleep) / 60 : 0);
        const quality = Number(e.quality || e.efficiency ? Math.round(Number(e.efficiency) / 20) : 3);
        
        if (!date || !hours) return null;
        const parsed = new Date(date);
        if (isNaN(parsed.getTime())) return null;

        return {
          date: parsed.toISOString().split('T')[0],
          hours: Math.max(0, Math.min(24, hours)),
          quality: Math.max(1, Math.min(5, quality)),
        };
      }).filter(Boolean) as SleepEntry[];
    } catch {
      return [];
    }
  };

  const importEntries = async (entries: SleepEntry[]) => {
    if (!user || entries.length === 0) return;
    setImporting(true);
    let success = 0;
    let errors = 0;

    for (const entry of entries) {
      try {
        const { data: existing } = await supabase
          .from('daily_logs')
          .select('notes')
          .eq('user_id', user.id)
          .eq('log_date', entry.date)
          .maybeSingle();

        let notesObj: Record<string, unknown> = {};
        if (existing?.notes) {
          try { notesObj = JSON.parse(existing.notes); } catch { notesObj = { text: existing.notes }; }
        }

        notesObj.sleep_hours = entry.hours;
        notesObj.sleep_quality = entry.quality;
        if (entry.wake_ups !== undefined) notesObj.sleep_wake_ups = entry.wake_ups;
        notesObj.sleep_source = 'wearable';

        const { error } = await supabase
          .from('daily_logs')
          .upsert({
            user_id: user.id,
            log_date: entry.date,
            notes: JSON.stringify(notesObj),
          }, { onConflict: 'user_id,log_date' });

        if (error) errors++;
        else success++;
      } catch {
        errors++;
      }
    }

    setImportResult({ success, errors });
    setImporting(false);

    if (success > 0) {
      toast({ title: t('menopause.wearable_imported', { count: success }) });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const isJSON = file.name.endsWith('.json');
    const entries = isJSON ? parseJSON(text) : parseCSV(text);

    if (entries.length === 0) {
      toast({ variant: 'destructive', title: t('menopause.wearable_no_data') });
      return;
    }

    await importEntries(entries);
    if (fileRef.current) fileRef.current.value = '';
  };

  const wearableProviders = [
    { id: 'fitbit', name: 'Fitbit', icon: '⌚', status: 'coming_soon' as const },
    { id: 'google_fit', name: 'Google Fit', icon: '💚', status: 'coming_soon' as const },
    { id: 'apple_health', name: 'Apple Health', icon: '🍎', status: 'coming_soon' as const },
    { id: 'samsung_health', name: 'Samsung Health', icon: '📱', status: 'coming_soon' as const },
  ];

  return (
    <div className="glass-card p-5 bg-gradient-to-br from-cyan-500/5 to-teal-500/10 border-cyan-500/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center">
          <Watch className="w-6 h-6 text-cyan-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-foreground">{t('menopause.wearable_title')}</h3>
          <p className="text-xs text-muted-foreground">{t('menopause.wearable_subtitle')}</p>
        </div>
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm" className="w-full border-cyan-500/30 text-cyan-600 hover:bg-cyan-500/10">
            <CloudDownload className="w-4 h-4 mr-2" />
            {t('menopause.wearable_import')}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('menopause.wearable_import')}</DrawerTitle>
          </DrawerHeader>
          <div className="px-6 pb-8 space-y-6">
            {/* Wearable providers */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">{t('menopause.wearable_connect')}</p>
              <div className="grid grid-cols-2 gap-2">
                {wearableProviders.map(p => (
                  <Button
                    key={p.id}
                    variant="outline"
                    size="sm"
                    disabled
                    className="h-auto py-3 flex-col gap-1 opacity-60"
                  >
                    <span className="text-xl">{p.icon}</span>
                    <span className="text-xs">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground">{t('menopause.wearable_coming_soon')}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Manual file import */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2">{t('menopause.wearable_manual')}</p>
              <p className="text-xs text-muted-foreground mb-3">{t('menopause.wearable_format_hint')}</p>
              
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.json,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />

              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileRef.current?.click()}
                disabled={importing}
              >
                <Upload className="w-4 h-4 mr-2" />
                {importing ? t('actions.loading') : t('menopause.wearable_upload_file')}
              </Button>
            </div>

            {/* Import result */}
            {importResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-card/50"
              >
                <div className="flex items-center gap-2 mb-2">
                  {importResult.errors === 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                  <p className="text-sm font-medium text-foreground">
                    {t('menopause.wearable_result')}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('menopause.wearable_result_detail', {
                    success: importResult.success,
                    errors: importResult.errors,
                  })}
                </p>
              </motion.div>
            )}

            {/* CSV format example */}
            <div className="p-3 rounded-xl bg-muted/50">
              <p className="text-xs font-medium text-foreground mb-1">{t('menopause.wearable_csv_example')}</p>
              <code className="text-[10px] text-muted-foreground block whitespace-pre">
                {`date,hours,quality,wake_ups\n2026-03-01,7.5,4,1\n2026-03-02,6.0,2,3`}
              </code>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default WearableSleepImport;
