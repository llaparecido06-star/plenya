import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, Check, Calendar, Plus, ChevronDown, ChevronUp, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, addYears, isBefore } from 'date-fns';
import { ptBR, es, enUS } from 'date-fns/locale';
import i18n from '@/i18n/config';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';

interface Exam {
  id: string;
  exam_type: string;
  exam_name: string;
  description: string | null;
  recommended_frequency: string | null;
  last_done_at: string | null;
  next_due_at: string | null;
  is_completed: boolean;
  notes: string | null;
}

const defaultExams = [
  { type: 'imaging', name: 'mammography', freq: '1 ano', desc: 'Rastreio de câncer de mama' },
  { type: 'imaging', name: 'densitometry', freq: '2 anos', desc: 'Avaliação da densidade óssea' },
  { type: 'lab', name: 'lipid_panel', freq: '1 ano', desc: 'Colesterol e triglicerídeos' },
  { type: 'lab', name: 'thyroid', freq: '1 ano', desc: 'TSH e hormônios tireoidianos' },
  { type: 'lab', name: 'glucose', freq: '1 ano', desc: 'Glicemia de jejum' },
  { type: 'lab', name: 'vitamin_d', freq: '1 ano', desc: 'Níveis de vitamina D' },
  { type: 'exam', name: 'pap_smear', freq: '3 anos', desc: 'Papanicolau' },
  { type: 'exam', name: 'pelvic_ultrasound', freq: '1 ano', desc: 'Ultrassom pélvico' },
  { type: 'consult', name: 'gynecologist', freq: '1 ano', desc: 'Consulta ginecológica anual' },
  { type: 'consult', name: 'cardiologist', freq: '1 ano', desc: 'Avaliação cardiovascular' },
];

const getLocale = () => {
  const lang = i18n.language?.substring(0, 2);
  if (lang === 'es') return es;
  if (lang === 'en') return enUS;
  return ptBR;
};

const MenopauseExamsCard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // New exam form
  const [newExamName, setNewExamName] = useState('');

  useEffect(() => {
    if (!user) return;
    loadExams();
  }, [user]);

  const loadExams = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('menopause_exams')
      .select('*')
      .eq('user_id', user.id)
      .order('next_due_at', { ascending: true, nullsFirst: false });
    
    if (data && data.length > 0) {
      setExams(data as Exam[]);
    } else if (!error) {
      // Initialize with default exams
      await initializeDefaultExams();
    }
    
    setLoading(false);
  };

  const initializeDefaultExams = async () => {
    if (!user) return;
    
    const examRows = defaultExams.map(e => ({
      user_id: user.id,
      exam_type: e.type,
      exam_name: t(`menopause.exam_${e.name}`),
      description: e.desc,
      recommended_frequency: e.freq,
      is_completed: false,
    }));
    
    await supabase.from('menopause_exams').insert(examRows);
    loadExams();
  };

  const toggleExamCompletion = async (exam: Exam) => {
    const newCompleted = !exam.is_completed;
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate next due date based on frequency
    let nextDue: string | null = null;
    if (newCompleted && exam.recommended_frequency) {
      const years = exam.recommended_frequency.includes('2') ? 2 : 
                    exam.recommended_frequency.includes('3') ? 3 : 1;
      nextDue = addYears(new Date(), years).toISOString().split('T')[0];
    }
    
    const { error } = await supabase
      .from('menopause_exams')
      .update({
        is_completed: newCompleted,
        last_done_at: newCompleted ? today : exam.last_done_at,
        next_due_at: nextDue,
      })
      .eq('id', exam.id);
    
    if (!error) {
      setExams(prev => prev.map(e => 
        e.id === exam.id 
          ? { ...e, is_completed: newCompleted, last_done_at: newCompleted ? today : e.last_done_at, next_due_at: nextDue }
          : e
      ));
      toast({ 
        title: newCompleted ? t('menopause.exam_done') : t('menopause.exam_undone'),
        description: exam.exam_name 
      });
    }
  };

  const addCustomExam = async () => {
    if (!user || !newExamName.trim()) return;
    setSaving(true);
    
    const { error } = await supabase.from('menopause_exams').insert({
      user_id: user.id,
      exam_type: 'custom',
      exam_name: newExamName.trim(),
      recommended_frequency: '1 ano',
      is_completed: false,
    });
    
    if (!error) {
      toast({ title: t('menopause.exam_added') });
      setNewExamName('');
      setDrawerOpen(false);
      loadExams();
    }
    setSaving(false);
  };

  const deleteExam = async (examId: string) => {
    await supabase.from('menopause_exams').delete().eq('id', examId);
    setExams(prev => prev.filter(e => e.id !== examId));
    toast({ title: t('menopause.exam_deleted') });
  };

  const completedCount = exams.filter(e => e.is_completed).length;
  const progress = exams.length > 0 ? (completedCount / exams.length) * 100 : 0;
  
  // Get overdue exams
  const overdueExams = exams.filter(e => 
    e.next_due_at && isBefore(parseISO(e.next_due_at), new Date()) && !e.is_completed
  );

  const getExamIcon = (type: string) => {
    const icons: Record<string, string> = {
      imaging: '📷',
      lab: '🧪',
      exam: '🩺',
      consult: '👩‍⚕️',
      custom: '📋',
    };
    return icons[type] || '📋';
  };

  return (
    <motion.div
      className="mx-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="glass-card p-5 bg-gradient-to-br from-teal-500/5 to-emerald-500/10 border-teal-500/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-teal-500" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{t('menopause.exams_title')}</h3>
              <p className="text-xs text-muted-foreground">{t('menopause.exams_subtitle')}</p>
            </div>
          </div>
          
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button size="icon" variant="ghost">
                <Plus className="w-5 h-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{t('menopause.exam_add_custom')}</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-8 space-y-4">
                <Input
                  value={newExamName}
                  onChange={e => setNewExamName(e.target.value)}
                  placeholder={t('menopause.exam_name_placeholder')}
                />
                <Button 
                  onClick={addCustomExam} 
                  disabled={saving || !newExamName.trim()} 
                  className="w-full"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {t('actions.add')}
                </Button>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">{t('menopause.exams_progress')}</span>
            <span className="font-medium text-foreground">{completedCount}/{exams.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Overdue alert */}
        {overdueExams.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              ⚠️ {overdueExams.length} {t('menopause.exams_overdue')}
            </p>
          </div>
        )}

        {/* Exam list */}
        <div className="space-y-2">
          {(expanded ? exams : exams.slice(0, 4)).map(exam => (
            <div
              key={exam.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                exam.is_completed ? 'bg-teal-500/10' : 'bg-card/50'
              }`}
            >
              <Checkbox
                checked={exam.is_completed}
                onCheckedChange={() => toggleExamCompletion(exam)}
              />
              <span className="text-lg">{getExamIcon(exam.exam_type)}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${exam.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {exam.exam_name}
                </p>
                {exam.next_due_at && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(parseISO(exam.next_due_at), 'MMM yyyy', { locale: getLocale() })}
                  </p>
                )}
              </div>
              {exam.exam_type === 'custom' && (
                <button onClick={() => deleteExam(exam.id)} className="text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Expand button */}
        {exams.length > 4 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-3 flex items-center justify-center gap-2 p-2 rounded-xl bg-card/50 hover:bg-card/80 transition-colors text-sm text-muted-foreground"
          >
            {expanded ? (
              <>
                {t('actions.show_less')} <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                {t('menopause.exams_show_all')} ({exams.length - 4} {t('menopause.exams_more')}) <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default MenopauseExamsCard;
