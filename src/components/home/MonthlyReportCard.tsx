import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sparkles, ChevronDown, ChevronUp, Target, TrendingUp, Brain, Lightbulb, History, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR, es, enUS } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useMonthlyReport } from '@/hooks/useMonthlyReport';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const getLocale = () => {
  const lang = localStorage.getItem('i18nextLng') || 'pt';
  if (lang.startsWith('pt')) return ptBR;
  if (lang.startsWith('es')) return es;
  return enUS;
};

const MonthlyReportCard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { report, loading, generated, generateReport, savedReports, loadingHistory, deleteReport } = useMonthlyReport();
  const [expandedSections, setExpandedSections] = useState({
    patterns: false,
    correlations: false,
    recommendations: false,
  });
  const [activeTab, setActiveTab] = useState('current');

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-orange-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {t('monthly_report.title')}
            </CardTitle>
            <Badge variant="outline" className="gap-1">
              <Brain className="w-3 h-3" />
              IA
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current" className="gap-2">
                <Sparkles className="w-4 h-4" />
                {t('monthly_report.current_report')}
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="w-4 h-4" />
                {t('monthly_report.history')}
                {savedReports.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{savedReports.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="mt-4 space-y-4">
              {!generated && !loading && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{t('monthly_report.not_generated')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('monthly_report.description')}
                    </p>
                    <Button onClick={generateReport} className="gap-2">
                      <Sparkles className="w-4 h-4" />
                      {t('monthly_report.generate')}
                    </Button>
                  </div>
                </div>
              )}

              {loading && (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              )}

              {generated && report && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Wellness Score */}
                  <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{t('monthly_report.wellness_score')}</span>
                      <span className={`text-2xl font-bold ${getScoreColor(report.wellnessScore)}`}>
                        {report.wellnessScore}/100
                      </span>
                    </div>
                    <Progress value={report.wellnessScore} className="h-2" />
                  </div>

                  {/* Summary */}
                  <div className="space-y-2">
                    <p className="text-sm leading-relaxed">{report.summary}</p>
                  </div>

                  {/* Patterns */}
                  {report.patterns.length > 0 && (
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleSection('patterns')}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span className="font-medium text-sm">{t('monthly_report.patterns')}</span>
                        </div>
                        {expandedSections.patterns ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <AnimatePresence>
                        {expandedSections.patterns && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-2 overflow-hidden"
                          >
                            {report.patterns.map((pattern, idx) => (
                              <motion.li
                                key={idx}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex items-start gap-2 text-sm pl-3"
                              >
                                <span className="text-primary mt-1">•</span>
                                <span>{pattern}</span>
                              </motion.li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Correlations */}
                  {report.correlations.length > 0 && (
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleSection('correlations')}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-primary" />
                          <span className="font-medium text-sm">{t('monthly_report.correlations')}</span>
                        </div>
                        {expandedSections.correlations ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <AnimatePresence>
                        {expandedSections.correlations && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-2 overflow-hidden"
                          >
                            {report.correlations.map((correlation, idx) => (
                              <motion.li
                                key={idx}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex items-start gap-2 text-sm pl-3"
                              >
                                <span className="text-primary mt-1">•</span>
                                <span>{correlation}</span>
                              </motion.li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Recommendations */}
                  {report.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleSection('recommendations')}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-primary" />
                          <span className="font-medium text-sm">{t('monthly_report.recommendations')}</span>
                        </div>
                        {expandedSections.recommendations ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <AnimatePresence>
                        {expandedSections.recommendations && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-2 overflow-hidden"
                          >
                            {report.recommendations.map((rec, idx) => (
                              <motion.li
                                key={idx}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex items-start gap-2 text-sm pl-3"
                              >
                                <span className="text-primary mt-1">•</span>
                                <span>{rec}</span>
                              </motion.li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Next Cycle Tip */}
                  {report.nextCycleTip && (
                    <div className="p-4 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-accent/20">
                          <Target className="w-4 h-4 text-accent-foreground" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="font-medium text-sm">{t('monthly_report.next_cycle_tip')}</p>
                          <p className="text-sm text-muted-foreground">{report.nextCycleTip}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-4 space-y-3">
              {loadingHistory && (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              )}

              {!loadingHistory && savedReports.length === 0 && (
                <div className="text-center py-8 space-y-2">
                  <History className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {t('monthly_report.no_history')}
                  </p>
                </div>
              )}

              {!loadingHistory && savedReports.map((savedReport, idx) => (
                <motion.div
                  key={savedReport.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {format(new Date(savedReport.report_date), 'dd MMM yyyy', { locale: getLocale() })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(savedReport.cycle_start_date), 'dd/MM', { locale: getLocale() })} - {format(new Date(savedReport.cycle_end_date), 'dd/MM', { locale: getLocale() })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`text-lg font-bold ${getScoreColor(savedReport.wellness_score)}`}>
                        {savedReport.wellness_score}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('monthly_report.delete_confirm')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('monthly_report.delete_description')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteReport(savedReport.id)}>
                              {t('actions.delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {savedReport.summary}
                  </p>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {savedReport.avg_mood && (
                      <Badge variant="outline" className="gap-1">
                        {t('body.mood')}: {savedReport.avg_mood.toFixed(1)}
                      </Badge>
                    )}
                    {savedReport.avg_energy && (
                      <Badge variant="outline" className="gap-1">
                        {t('body.energy')}: {savedReport.avg_energy.toFixed(1)}
                      </Badge>
                    )}
                    {savedReport.total_logs > 0 && (
                      <Badge variant="outline" className="gap-1">
                        {savedReport.total_logs} {t('monthly_report.logs')}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MonthlyReportCard;