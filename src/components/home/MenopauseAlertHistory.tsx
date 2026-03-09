import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Moon, Flame, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { pt, es, enUS } from 'date-fns/locale';

interface AlertLog {
  id: string;
  alert_type: string;
  alert_title: string;
  alert_body: string;
  created_at: string;
}

const alertIcons: Record<string, React.ReactNode> = {
  sleep_low: <Moon className="w-4 h-4" />,
  flash_spike: <Flame className="w-4 h-4" />,
  hrt_reminder: <Bell className="w-4 h-4" />,
  exam_overdue: <AlertTriangle className="w-4 h-4" />,
};

const alertColors: Record<string, string> = {
  sleep_low: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  flash_spike: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  hrt_reminder: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  exam_overdue: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
};

const MenopauseAlertHistory: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const locale = i18n.language === 'pt' ? pt : i18n.language === 'es' ? es : enUS;

  useEffect(() => {
    if (!user) return;
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from('alert_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setAlerts((data as AlertLog[]) || []);
      setLoading(false);
    };
    fetchAlerts();
  }, [user]);

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return t('alerts.today');
    if (isYesterday(date)) return t('alerts.yesterday');
    return format(date, 'dd MMM', { locale });
  };

  const displayed = showAll ? alerts : alerts.slice(0, 5);

  if (loading) return null;
  if (alerts.length === 0) return null;

  return (
    <div className="px-4">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            {t('alerts.history_title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <AnimatePresence>
            {displayed.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-start gap-3 p-3 rounded-lg border ${alertColors[alert.alert_type] || 'bg-muted/50 text-foreground border-border/50'}`}
              >
                <div className="mt-0.5 shrink-0">
                  {alertIcons[alert.alert_type] || <Bell className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{alert.alert_title}</p>
                    <Badge variant="outline" className="text-[10px] shrink-0 opacity-70">
                      {formatDate(alert.created_at)}
                    </Badge>
                  </div>
                  <p className="text-xs opacity-80 mt-0.5 line-clamp-2">{alert.alert_body}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {alerts.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? t('alerts.show_less') : t('alerts.show_all', { count: alerts.length })}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MenopauseAlertHistory;
