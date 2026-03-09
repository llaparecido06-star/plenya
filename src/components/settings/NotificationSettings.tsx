import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, Clock, Droplets, Syringe, Heart, ChefHat, Timer, Zap, CloudRain, RefreshCw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/hooks/useNotifications';
import { useNativePush } from '@/hooks/useNativePush';
import { useContraceptive } from '@/hooks/useContraceptive';
import { useLifePhase } from '@/hooks/useLifePhase';
import { useRecipeHistory } from '@/hooks/useRecipeHistory';
import { useAuth } from '@/contexts/AuthContext';
import { useCycle } from '@/contexts/CycleContext';

interface NotificationRowProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled: boolean;
  timeInput?: { value: string; onChange: (v: string) => void };
}

const NotificationRow: React.FC<NotificationRowProps> = ({
  icon, iconBg, label, description, checked, onCheckedChange, disabled, timeInput,
}) => (
  <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
      <div>
        <Label className="text-base font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      {timeInput && (
        <Input
          type="time"
          value={timeInput.value}
          onChange={(e) => timeInput.onChange(e.target.value)}
          className="w-24"
          disabled={disabled}
        />
      )}
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  </div>
);

const NotificationSettings: React.FC = () => {
  const {
    supported, permission, settings,
    requestPermission, registerServiceWorker, updateSettings,
    schedulePillReminder, scheduleRecipeReminder, scheduleTrialExpirationReminder,
    schedulePMSAlert, scheduleFertileWindowAlert, scheduleHydrationAlert,
  } = useNotifications();

  const { isNative, register: registerNativePush } = useNativePush();
  const { contraceptive_type: contraceptiveType } = useContraceptive();
  const { isTryingToConceive, lifePhase } = useLifePhase();
  const { favorites } = useRecipeHistory();
  const { subscriptionEnd, subscribed } = useAuth();
  const { cycleLength, cycleDay, hasDUM } = useCycle();

  const isDisabled = permission !== 'granted';
  const isMenstruating = lifePhase === 'menstruating' || !lifePhase;

  // Register service worker or native push on mount
  useEffect(() => {
    if (supported) {
      if (isNative) registerNativePush();
      else registerServiceWorker();
    }
  }, [supported, isNative, registerServiceWorker, registerNativePush]);

  // Schedule pill reminder
  useEffect(() => {
    if (settings.pillReminder && permission === 'granted') {
      schedulePillReminder(settings.pillReminderTime);
    }
  }, [settings.pillReminder, settings.pillReminderTime, permission, schedulePillReminder]);

  // Schedule recipe reminder
  useEffect(() => {
    if (settings.recipeReminder && permission === 'granted') {
      const randomFav = favorites.length > 0
        ? favorites[Math.floor(Math.random() * favorites.length)]?.recipe_name
        : undefined;
      scheduleRecipeReminder(settings.recipeReminderTime, randomFav);
    }
  }, [settings.recipeReminder, settings.recipeReminderTime, permission, scheduleRecipeReminder, favorites]);

  // Schedule trial expiration reminder
  useEffect(() => {
    if (settings.trialExpiration && permission === 'granted' && subscriptionEnd) {
      scheduleTrialExpirationReminder(subscriptionEnd);
    }
  }, [settings.trialExpiration, permission, subscriptionEnd, scheduleTrialExpirationReminder]);

  // Schedule smart cycle alerts
  useEffect(() => {
    if (permission !== 'granted' || !hasDUM || !isMenstruating) return;

    const now = new Date();
    const periodDate = new Date(now);
    periodDate.setDate(periodDate.getDate() + (cycleLength - cycleDay));

    if (settings.pmsAlert) schedulePMSAlert(periodDate);

    const ovulationDay = Math.round(cycleLength / 2) - 2;
    const fertileStart = new Date(now);
    fertileStart.setDate(fertileStart.getDate() + (ovulationDay - cycleDay));
    if (settings.fertileWindow) scheduleFertileWindowAlert(fertileStart);

    const lutealStart = new Date(now);
    const lutealDay = Math.round(cycleLength / 2) + 2;
    lutealStart.setDate(lutealStart.getDate() + (lutealDay - cycleDay));
    if (settings.hydrationAlert) scheduleHydrationAlert(lutealStart);
  }, [permission, hasDUM, isMenstruating, cycleLength, cycleDay, settings.pmsAlert, settings.fertileWindow, settings.hydrationAlert, schedulePMSAlert, scheduleFertileWindowAlert, scheduleHydrationAlert]);

  const showPillOption = contraceptiveType === 'Pílula';
  const showInjectionOption = contraceptiveType === 'Injeção';
  const showFertileOption = isTryingToConceive;
  const showRecipeOption = favorites.length > 0;
  const showTrialOption = subscribed && subscriptionEnd;

  if (!supported) {
    return (
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <BellOff className="w-5 h-5" />
            Notificações não suportadas
          </CardTitle>
          <CardDescription>Seu navegador não suporta notificações push.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notificações
          </CardTitle>
          <CardDescription>Receba lembretes personalizados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Permission Request */}
          {permission !== 'granted' && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-foreground mb-3">
                Ative as notificações para receber lembretes importantes sobre seu ciclo.
              </p>
              <Button onClick={requestPermission} className="w-full">
                <Bell className="w-4 h-4 mr-2" />
                Ativar Notificações
              </Button>
            </div>
          )}

          {/* Smart Alerts Section */}
          {isMenstruating && (
            <>
              <div className="space-y-1 pt-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Alertas Inteligentes
                </h4>
                <p className="text-xs text-muted-foreground">
                  Notificações proativas baseadas no seu ciclo
                </p>
              </div>

              <NotificationRow
                icon={<CloudRain className="w-4 h-4" />}
                iconBg="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                label="Alerta de TPM"
                description="3 dias antes da menstruação"
                checked={settings.pmsAlert}
                onCheckedChange={(v) => updateSettings({ pmsAlert: v })}
                disabled={isDisabled}
              />

              <NotificationRow
                icon={<Droplets className="w-4 h-4" />}
                iconBg="bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
                label="Hidratação Lútea"
                description="Lembrete na fase lútea"
                checked={settings.hydrationAlert}
                onCheckedChange={(v) => updateSettings({ hydrationAlert: v })}
                disabled={isDisabled}
              />

              <NotificationRow
                icon={<RefreshCw className="w-4 h-4" />}
                iconBg="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                label="Mudança de Fase"
                description="Aviso ao trocar de fase do ciclo"
                checked={settings.phaseChangeAlert}
                onCheckedChange={(v) => updateSettings({ phaseChangeAlert: v })}
                disabled={isDisabled}
              />
            </>
          )}

          {/* Pill Reminder */}
          {showPillOption && (
            <NotificationRow
              icon={<Clock className="w-4 h-4" />}
              iconBg="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
              label="Lembrete de Pílula"
              description="Diário"
              checked={settings.pillReminder}
              onCheckedChange={(v) => updateSettings({ pillReminder: v })}
              disabled={isDisabled}
              timeInput={{
                value: settings.pillReminderTime,
                onChange: (v) => updateSettings({ pillReminderTime: v }),
              }}
            />
          )}

          {/* Injection Reminder */}
          {showInjectionOption && (
            <NotificationRow
              icon={<Syringe className="w-4 h-4" />}
              iconBg="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              label="Próxima Injeção"
              description="2 dias antes"
              checked={settings.nextInjection}
              onCheckedChange={(v) => updateSettings({ nextInjection: v })}
              disabled={isDisabled}
            />
          )}

          {/* Fertile Window */}
          {showFertileOption && (
            <NotificationRow
              icon={<Heart className="w-4 h-4" />}
              iconBg="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
              label="Janela Fértil"
              description="1 dia antes da ovulação"
              checked={settings.fertileWindow}
              onCheckedChange={(v) => updateSettings({ fertileWindow: v })}
              disabled={isDisabled}
            />
          )}

          {/* Recipe Reminder */}
          {showRecipeOption && (
            <NotificationRow
              icon={<ChefHat className="w-4 h-4" />}
              iconBg="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
              label="Lembrete de Receitas"
              description={`Receitas favoritas (${favorites.length})`}
              checked={settings.recipeReminder}
              onCheckedChange={(v) => updateSettings({ recipeReminder: v })}
              disabled={isDisabled}
              timeInput={{
                value: settings.recipeReminderTime,
                onChange: (v) => updateSettings({ recipeReminderTime: v }),
              }}
            />
          )}

          {/* No favorites message */}
          {!showRecipeOption && permission === 'granted' && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 opacity-60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                  <ChefHat className="w-4 h-4" />
                </div>
                <div>
                  <Label className="text-base font-medium text-muted-foreground">Lembrete de Receitas</Label>
                  <p className="text-sm text-muted-foreground">Salve receitas favoritas para ativar</p>
                </div>
              </div>
              <Switch disabled checked={false} />
            </div>
          )}

          {/* Trial Expiration Reminder */}
          {showTrialOption && (
            <NotificationRow
              icon={<Timer className="w-4 h-4" />}
              iconBg="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
              label="Expiração do Trial"
              description="2 dias antes"
              checked={settings.trialExpiration}
              onCheckedChange={(v) => updateSettings({ trialExpiration: v })}
              disabled={isDisabled}
            />
          )}

          {/* Period Prediction - always show */}
          <NotificationRow
            icon={<Droplets className="w-4 h-4" />}
            iconBg="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            label="Próxima Menstruação"
            description="1 dia antes"
            checked={true}
            onCheckedChange={() => {}}
            disabled={isDisabled}
          />

          {permission === 'granted' && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              ✓ Notificações ativas
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NotificationSettings;
