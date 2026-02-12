import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, Clock, Droplets, Syringe, Heart, ChefHat, Timer } from 'lucide-react';
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

const NotificationSettings: React.FC = () => {
  const {
    supported,
    permission,
    settings,
    requestPermission,
    registerServiceWorker,
    updateSettings,
    schedulePillReminder,
    scheduleRecipeReminder,
    scheduleTrialExpirationReminder,
  } = useNotifications();
  
  
  const { isNative, register: registerNativePush } = useNativePush();
  const { contraceptive_type: contraceptiveType } = useContraceptive();
  const { isTryingToConceive } = useLifePhase();
  const { favorites } = useRecipeHistory();
  const { subscriptionEnd, subscribed } = useAuth();

  // Register service worker or native push on mount
  useEffect(() => {
    if (supported) {
      if (isNative) {
        registerNativePush();
      } else {
        registerServiceWorker();
      }
    }
  }, [supported, isNative, registerServiceWorker, registerNativePush]);

  // Schedule pill reminder when enabled
  useEffect(() => {
    if (settings.pillReminder && permission === 'granted') {
      schedulePillReminder(settings.pillReminderTime);
    }
  }, [settings.pillReminder, settings.pillReminderTime, permission, schedulePillReminder]);

  // Schedule recipe reminder when enabled
  useEffect(() => {
    if (settings.recipeReminder && permission === 'granted') {
      const randomFavorite = favorites.length > 0 
        ? favorites[Math.floor(Math.random() * favorites.length)]?.recipe_name 
        : undefined;
      scheduleRecipeReminder(settings.recipeReminderTime, randomFavorite);
    }
  }, [settings.recipeReminder, settings.recipeReminderTime, permission, scheduleRecipeReminder, favorites]);

  // Schedule trial expiration reminder
  useEffect(() => {
    if (settings.trialExpiration && permission === 'granted' && subscriptionEnd) {
      scheduleTrialExpirationReminder(subscriptionEnd);
    }
  }, [settings.trialExpiration, permission, subscriptionEnd, scheduleTrialExpirationReminder]);

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
          <CardDescription>
            Seu navegador não suporta notificações push.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notificações
          </CardTitle>
          <CardDescription>
            Receba lembretes personalizados
          </CardDescription>
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

          {/* Pill Reminder */}
          {showPillOption && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <Label className="text-base font-medium">Lembrete de Pílula</Label>
                  <p className="text-sm text-muted-foreground">Diário</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="time"
                  value={settings.pillReminderTime}
                  onChange={(e) => updateSettings({ pillReminderTime: e.target.value })}
                  className="w-24"
                  disabled={permission !== 'granted'}
                />
                <Switch
                  checked={settings.pillReminder}
                  onCheckedChange={(checked) => updateSettings({ pillReminder: checked })}
                  disabled={permission !== 'granted'}
                />
              </div>
            </div>
          )}

          {/* Injection Reminder */}
          {showInjectionOption && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <Syringe className="w-4 h-4" />
                </div>
                <div>
                  <Label className="text-base font-medium">Próxima Injeção</Label>
                  <p className="text-sm text-muted-foreground">2 dias antes</p>
                </div>
              </div>
              <Switch
                checked={settings.nextInjection}
                onCheckedChange={(checked) => updateSettings({ nextInjection: checked })}
                disabled={permission !== 'granted'}
              />
            </div>
          )}

          {/* Fertile Window */}
          {showFertileOption && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <Label className="text-base font-medium">Janela Fértil</Label>
                  <p className="text-sm text-muted-foreground">Início da ovulação</p>
                </div>
              </div>
              <Switch
                checked={settings.fertileWindow}
                onCheckedChange={(checked) => updateSettings({ fertileWindow: checked })}
                disabled={permission !== 'granted'}
              />
            </div>
          )}

          {/* Recipe Reminder - Only show if user has favorites */}
          {showRecipeOption && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                  <ChefHat className="w-4 h-4" />
                </div>
                <div>
                  <Label className="text-base font-medium">Lembrete de Receitas</Label>
                  <p className="text-sm text-muted-foreground">
                    Receitas favoritas ({favorites.length})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="time"
                  value={settings.recipeReminderTime}
                  onChange={(e) => updateSettings({ recipeReminderTime: e.target.value })}
                  className="w-24"
                  disabled={permission !== 'granted'}
                />
                <Switch
                  checked={settings.recipeReminder}
                  onCheckedChange={(checked) => updateSettings({ recipeReminder: checked })}
                  disabled={permission !== 'granted'}
                />
              </div>
            </div>
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
                  <p className="text-sm text-muted-foreground">
                    Salve receitas favoritas para ativar
                  </p>
                </div>
              </div>
              <Switch disabled checked={false} />
            </div>
          )}

          {/* Trial Expiration Reminder */}
          {showTrialOption && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <Label className="text-base font-medium">Expiração do Trial</Label>
                  <p className="text-sm text-muted-foreground">2 dias antes</p>
                </div>
              </div>
              <Switch
                checked={settings.trialExpiration}
                onCheckedChange={(checked) => updateSettings({ trialExpiration: checked })}
                disabled={permission !== 'granted'}
              />
            </div>
          )}

          {/* Period Prediction - always show */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 text-red-600">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <Label className="text-base font-medium">Próxima Menstruação</Label>
                <p className="text-sm text-muted-foreground">1 dia antes</p>
              </div>
            </div>
            <Switch
              checked={true}
              disabled={permission !== 'granted'}
            />
          </div>

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
