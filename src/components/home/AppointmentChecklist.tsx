import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { usePregnancyAppointments } from '@/hooks/usePregnancyAppointments';
import { useTranslation } from 'react-i18next';
import { useLifePhase } from '@/hooks/useLifePhase';

const AppointmentChecklist: React.FC = () => {
  const { t } = useTranslation();
  const { appointments, loading, toggleComplete } = usePregnancyAppointments();
  const { pregnancyWeeks } = useLifePhase();
  const [expandedTrimester, setExpandedTrimester] = useState<number | null>(() => {
    if (!pregnancyWeeks) return 1;
    if (pregnancyWeeks < 13) return 1;
    if (pregnancyWeeks < 27) return 2;
    return 3;
  });

  if (loading) return null;

  const trimesters = [1, 2, 3];
  const trimesterLabels: Record<number, string> = {
    1: t('pregnancy.trimester_1'),
    2: t('pregnancy.trimester_2'),
    3: t('pregnancy.trimester_3'),
  };

  const getProgress = (tri: number) => {
    const triAppts = appointments.filter(a => a.trimester === tri);
    const completed = triAppts.filter(a => a.is_completed).length;
    return { completed, total: triAppts.length };
  };

  return (
    <motion.div className="px-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="glass-card p-5 border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t('pregnancy.appointments_title')}</h3>
            <p className="text-xs text-muted-foreground">{t('pregnancy.appointments_subtitle')}</p>
          </div>
        </div>

        <div className="space-y-3">
          {trimesters.map(tri => {
            const progress = getProgress(tri);
            const isExpanded = expandedTrimester === tri;
            const triAppts = appointments.filter(a => a.trimester === tri);

            return (
              <div key={tri} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedTrimester(isExpanded ? null : tri)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{trimesterLabels[tri]}</span>
                    <span className="text-xs text-muted-foreground">
                      {progress.completed}/{progress.total}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
                      />
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2">
                    {triAppts.map(apt => (
                      <button
                        key={apt.id}
                        onClick={() => toggleComplete(apt.id)}
                        className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors text-left"
                      >
                        <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          apt.is_completed ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                        }`}>
                          {apt.is_completed && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1">
                          <span className={`text-sm font-medium ${apt.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {t(apt.title)}
                          </span>
                          {apt.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{t(apt.description)}</p>
                          )}
                          {apt.recommended_week && (
                            <span className="text-xs text-primary">
                              ~{t('pregnancy.week')} {apt.recommended_week}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default AppointmentChecklist;
