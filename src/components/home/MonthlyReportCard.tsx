import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Lightbulb, Star, ChevronDown, ChevronUp, FileText, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useMonthlyReport } from '@/hooks/useMonthlyReport';

const MonthlyReportCard: React.FC = () => {
  const { t } = useTranslation();
  const { report, loading, generated, generateReport } = useMonthlyReport();
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="px-4">
        <Card className="border-primary/20">
          <CardContent className="pt-6 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-accent/20 to-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {t('monthly_report.title', 'Relatório Mensal IA')}
              </CardTitle>
              <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                <Sparkles className="w-3 h-3 mr-1" />
                {t('monthly_report.ai_badge', 'IA')}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {!generated ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('monthly_report.description', 'Gere um relatório completo do seu ciclo com análise de padrões e recomendações personalizadas pela IA.')}
                </p>
                <Button onClick={generateReport} className="w-full" size="sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t('monthly_report.generate', 'Gerar Relatório com IA')}
                </Button>
              </div>
            ) : (
              report && (
                <div className="space-y-4">
                  {/* Wellness Score */}
                  <div className="bg-background/50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {t('monthly_report.wellness_score', 'Score de Bem-Estar')}
                      </span>
                      <span className="text-lg font-bold text-primary">{report.wellnessScore}/10</span>
                    </div>
                    <Progress value={report.wellnessScore * 10} className="h-2" />
                  </div>

                  {/* Summary */}
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                    <p className="text-sm leading-relaxed text-foreground">{report.summary}</p>
                  </div>

                  {/* Next Cycle Tip */}
                  <div className="flex items-start gap-3 bg-accent/40 rounded-xl p-4">
                    <Star className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-primary mb-1">
                        {t('monthly_report.next_cycle', 'Dica para o Próximo Ciclo')}
                      </p>
                      <p className="text-sm text-foreground">{report.nextCycleTip}</p>
                    </div>
                  </div>

                  {/* Expand for more details */}
                  <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="w-full text-xs">
                    {expanded ? (
                      <><ChevronUp className="w-4 h-4 mr-1" />{t('monthly_report.hide', 'Ocultar detalhes')}</>
                    ) : (
                      <><ChevronDown className="w-4 h-4 mr-1" />{t('monthly_report.show', 'Ver padrões e recomendações')}</>
                    )}
                  </Button>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4 pt-2 border-t border-border/50">
                          {/* Patterns */}
                          {report.patterns.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  {t('monthly_report.patterns', 'Padrões Identificados')}
                                </p>
                              </div>
                              <ul className="space-y-2">
                                {report.patterns.map((p, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm">
                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                    {p}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Correlations */}
                          {report.correlations.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  {t('monthly_report.correlations', 'Correlações')}
                                </p>
                              </div>
                              <ul className="space-y-2">
                                {report.correlations.map((c, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm">
                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-accent-foreground/40 shrink-0" />
                                    {c}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Recommendations */}
                          {report.recommendations.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-primary" />
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  {t('monthly_report.recommendations', 'Recomendações')}
                                </p>
                              </div>
                              <ul className="space-y-2">
                                {report.recommendations.map((r, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm bg-background/40 rounded-lg px-3 py-2">
                                    <span className="font-medium text-primary mr-1">{i + 1}.</span>
                                    {r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Regenerate */}
                  <Button variant="ghost" size="sm" onClick={generateReport} className="w-full text-xs text-muted-foreground">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    {t('monthly_report.regenerate', 'Gerar novo relatório')}
                  </Button>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default MonthlyReportCard;
