import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { subDays, parseISO, getDay, getHours } from 'date-fns';

interface TriggerCorrelation {
  trigger: string;
  count: number;
  avgIntensity: number;
  percentOfTotal: number;
  trend: 'up' | 'down' | 'stable';
}

interface TimePattern {
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  count: number;
  percent: number;
}

interface HotFlashInsight {
  type: 'trigger_top' | 'trigger_increase' | 'time_pattern' | 'intensity_trend' | 'frequency_change';
  message: string;
  emoji: string;
  severity: 'info' | 'warning' | 'positive';
}

const HotFlashInsights: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [insights, setInsights] = useState<HotFlashInsight[]>([]);
  const [correlations, setCorrelations] = useState<TriggerCorrelation[]>([]);
  const [timePatterns, setTimePatterns] = useState<TimePattern[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    analyzeData();
  }, [user]);

  const analyzeData = async () => {
    if (!user) return;
    setLoading(true);

    const fourWeeksAgo = subDays(new Date(), 28).toISOString();
    const twoWeeksAgo = subDays(new Date(), 14).toISOString();

    // Fetch last 4 weeks
    const { data: allLogs } = await supabase
      .from('hot_flash_logs')
      .select('id, logged_at, intensity, duration_minutes, trigger')
      .eq('user_id', user.id)
      .gte('logged_at', fourWeeksAgo)
      .order('logged_at', { ascending: true });

    if (!allLogs || allLogs.length < 3) {
      setLoading(false);
      return;
    }

    // Split into 2-week periods for trend analysis
    const recentLogs = allLogs.filter(l => l.logged_at >= twoWeeksAgo);
    const olderLogs = allLogs.filter(l => l.logged_at < twoWeeksAgo);

    // === TRIGGER CORRELATIONS ===
    const triggerCounts: Record<string, { count: number; totalIntensity: number }> = {};
    const logsWithTrigger = allLogs.filter(l => l.trigger);
    
    logsWithTrigger.forEach(log => {
      const tr = log.trigger!;
      if (!triggerCounts[tr]) triggerCounts[tr] = { count: 0, totalIntensity: 0 };
      triggerCounts[tr].count++;
      triggerCounts[tr].totalIntensity += log.intensity;
    });

    const recentTriggerCounts: Record<string, number> = {};
    const olderTriggerCounts: Record<string, number> = {};
    
    recentLogs.filter(l => l.trigger).forEach(l => {
      recentTriggerCounts[l.trigger!] = (recentTriggerCounts[l.trigger!] || 0) + 1;
    });
    olderLogs.filter(l => l.trigger).forEach(l => {
      olderTriggerCounts[l.trigger!] = (olderTriggerCounts[l.trigger!] || 0) + 1;
    });

    const triggerCorrelations: TriggerCorrelation[] = Object.entries(triggerCounts)
      .map(([trigger, data]) => {
        const recentCount = recentTriggerCounts[trigger] || 0;
        const olderCount = olderTriggerCounts[trigger] || 0;
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (olderCount > 0) {
          const change = (recentCount - olderCount) / olderCount;
          if (change > 0.2) trend = 'up';
          else if (change < -0.2) trend = 'down';
        }
        
        return {
          trigger,
          count: data.count,
          avgIntensity: Math.round((data.totalIntensity / data.count) * 10) / 10,
          percentOfTotal: Math.round((data.count / allLogs.length) * 100),
          trend,
        };
      })
      .sort((a, b) => b.count - a.count);

    setCorrelations(triggerCorrelations);

    // === TIME PATTERNS ===
    const timeBuckets: Record<string, number> = {
      morning: 0,    // 6-12
      afternoon: 0,  // 12-18
      evening: 0,    // 18-22
      night: 0,      // 22-6
    };

    allLogs.forEach(log => {
      const hour = getHours(parseISO(log.logged_at));
      if (hour >= 6 && hour < 12) timeBuckets.morning++;
      else if (hour >= 12 && hour < 18) timeBuckets.afternoon++;
      else if (hour >= 18 && hour < 22) timeBuckets.evening++;
      else timeBuckets.night++;
    });

    const patterns: TimePattern[] = (['morning', 'afternoon', 'evening', 'night'] as const).map(period => ({
      period,
      count: timeBuckets[period],
      percent: Math.round((timeBuckets[period] / allLogs.length) * 100),
    }));
    setTimePatterns(patterns);

    // === GENERATE INSIGHTS ===
    const newInsights: HotFlashInsight[] = [];

    // Top trigger insight
    if (triggerCorrelations.length > 0) {
      const top = triggerCorrelations[0];
      newInsights.push({
        type: 'trigger_top',
        message: t('menopause.insight_top_trigger', { 
          trigger: t(`menopause.hf_trigger_${top.trigger}`),
          percent: top.percentOfTotal 
        }),
        emoji: '🎯',
        severity: 'info',
      });

      // Trigger with highest intensity
      const highestIntensity = triggerCorrelations.reduce((prev, curr) => 
        curr.avgIntensity > prev.avgIntensity ? curr : prev
      );
      if (highestIntensity.avgIntensity >= 3.5) {
        newInsights.push({
          type: 'trigger_increase',
          message: t('menopause.insight_intense_trigger', {
            trigger: t(`menopause.hf_trigger_${highestIntensity.trigger}`),
            intensity: highestIntensity.avgIntensity,
          }),
          emoji: '⚠️',
          severity: 'warning',
        });
      }
    }

    // Trigger with increasing trend
    const increasingTrigger = triggerCorrelations.find(c => c.trend === 'up');
    if (increasingTrigger) {
      newInsights.push({
        type: 'trigger_increase',
        message: t('menopause.insight_trigger_increasing', {
          trigger: t(`menopause.hf_trigger_${increasingTrigger.trigger}`),
        }),
        emoji: '📈',
        severity: 'warning',
      });
    }

    // Decreasing trigger
    const decreasingTrigger = triggerCorrelations.find(c => c.trend === 'down');
    if (decreasingTrigger) {
      newInsights.push({
        type: 'trigger_increase',
        message: t('menopause.insight_trigger_decreasing', {
          trigger: t(`menopause.hf_trigger_${decreasingTrigger.trigger}`),
        }),
        emoji: '📉',
        severity: 'positive',
      });
    }

    // Time pattern
    const peakTime = patterns.reduce((prev, curr) => curr.count > prev.count ? curr : prev);
    if (peakTime.percent >= 30) {
      newInsights.push({
        type: 'time_pattern',
        message: t('menopause.insight_time_pattern', {
          period: t(`menopause.time_${peakTime.period}`),
          percent: peakTime.percent,
        }),
        emoji: '🕐',
        severity: 'info',
      });
    }

    // Frequency trend
    if (olderLogs.length > 0 && recentLogs.length > 0) {
      const recentPerDay = recentLogs.length / 14;
      const olderPerDay = olderLogs.length / 14;
      const changePercent = Math.round(((recentPerDay - olderPerDay) / olderPerDay) * 100);
      
      if (Math.abs(changePercent) >= 20) {
        newInsights.push({
          type: 'frequency_change',
          message: changePercent > 0
            ? t('menopause.insight_frequency_up', { percent: changePercent })
            : t('menopause.insight_frequency_down', { percent: Math.abs(changePercent) }),
          emoji: changePercent > 0 ? '🔺' : '🔻',
          severity: changePercent > 0 ? 'warning' : 'positive',
        });
      }
    }

    // Intensity trend
    if (recentLogs.length >= 3 && olderLogs.length >= 3) {
      const recentAvgI = recentLogs.reduce((a, b) => a + b.intensity, 0) / recentLogs.length;
      const olderAvgI = olderLogs.reduce((a, b) => a + b.intensity, 0) / olderLogs.length;
      
      if (recentAvgI - olderAvgI >= 0.5) {
        newInsights.push({
          type: 'intensity_trend',
          message: t('menopause.insight_intensity_up'),
          emoji: '🌡️',
          severity: 'warning',
        });
      } else if (olderAvgI - recentAvgI >= 0.5) {
        newInsights.push({
          type: 'intensity_trend',
          message: t('menopause.insight_intensity_down'),
          emoji: '✨',
          severity: 'positive',
        });
      }
    }

    setInsights(newInsights);
    setLoading(false);
  };

  if (loading || insights.length === 0) return null;

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'warning': return 'bg-amber-500/10 border-amber-500/20';
      case 'positive': return 'bg-emerald-500/10 border-emerald-500/20';
      default: return 'bg-sky-500/10 border-sky-500/20';
    }
  };

  const periodLabels: Record<string, string> = {
    morning: '☀️',
    afternoon: '🌤️',
    evening: '🌅',
    night: '🌙',
  };

  return (
    <motion.div
      className="mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="glass-card p-5 bg-gradient-to-br from-amber-500/5 to-orange-500/10 border-amber-500/20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{t('menopause.insights_title')}</h3>
            <p className="text-xs text-muted-foreground">{t('menopause.insights_subtitle')}</p>
          </div>
        </div>

        {/* Top Insights */}
        <div className="space-y-2 mb-4">
          {(expanded ? insights : insights.slice(0, 2)).map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-3 rounded-xl border ${getSeverityBg(insight.severity)}`}
            >
              <p className="text-sm text-foreground">
                <span className="mr-2">{insight.emoji}</span>
                {insight.message}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Trigger bar chart */}
        {correlations.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">{t('menopause.insights_triggers')}</p>
            <div className="space-y-2">
              {correlations.slice(0, 4).map(c => (
                <div key={c.trigger} className="flex items-center gap-2">
                  <span className="text-xs w-20 text-foreground truncate">
                    {t(`menopause.hf_trigger_${c.trigger}`)}
                  </span>
                  <div className="flex-1 bg-card/50 rounded-full h-4 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${c.percentOfTotal}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full"
                    />
                  </div>
                  <div className="flex items-center gap-1 w-14 justify-end">
                    <span className="text-xs text-muted-foreground">{c.percentOfTotal}%</span>
                    {c.trend === 'up' && <TrendingUp className="w-3 h-3 text-red-400" />}
                    {c.trend === 'down' && <TrendingDown className="w-3 h-3 text-emerald-400" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Time distribution */}
        {timePatterns.some(p => p.count > 0) && (
          <div className="mb-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">{t('menopause.insights_time')}</p>
            <div className="flex gap-2">
              {timePatterns.map(p => (
                <div key={p.period} className="flex-1 bg-card/50 rounded-xl p-2 text-center">
                  <span className="text-lg">{periodLabels[p.period]}</span>
                  <p className="text-xs font-bold text-foreground">{p.percent}%</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expand */}
        {insights.length > 2 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-card/50 hover:bg-card/80 transition-colors text-sm text-muted-foreground"
          >
            {expanded ? t('actions.show_less') : `${t('menopause.insights_see_more')} (${insights.length - 2})`}
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default HotFlashInsights;
