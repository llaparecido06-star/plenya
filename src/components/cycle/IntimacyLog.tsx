import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Heart, Loader2, Check, AlertTriangle, Pill, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useIntimacyLog } from '@/hooks/useIntimacyLog';
import { useCycle } from '@/contexts/CycleContext';
import { useMenstruationLog } from '@/hooks/useMenstruationLog';
import { useSelectedDate } from '@/contexts/SelectedDateContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type DateOption = 'today' | 'yesterday' | 'custom';

interface TagOption {
  id: string;
  emoji: string;
  label: string;
}

const practicesTags: TagOption[] = [
  { id: 'vaginal', emoji: '🍆', label: 'Sexo Vaginal' },
  { id: 'oral', emoji: '👄', label: 'Sexo Oral' },
  { id: 'anal', emoji: '🍑', label: 'Sexo Anal' },
  { id: 'masturbation', emoji: '🖐️', label: 'Masturbação' },
  { id: 'toys', emoji: '🧸', label: 'Brinquedos' },
  { id: 'foreplay', emoji: '🔥', label: 'Preliminares' },
];

const protectionTags: TagOption[] = [
  { id: 'condom', emoji: '🛡️', label: 'Preservativo' },
  { id: 'withdrawal', emoji: '⏱️', label: 'Coito Interrompido' },
  { id: 'unprotected', emoji: '⚠️', label: 'Sem Proteção' },
  { id: 'morning_after', emoji: '💊', label: 'Pílula Dia Seguinte' },
];

const sensationTags: TagOption[] = [
  { id: 'orgasm', emoji: '✨', label: 'Orgasmo' },
  { id: 'high_lubrication', emoji: '🌊', label: 'Lubrificação Alta' },
  { id: 'dryness', emoji: '🌵', label: 'Ressecamento' },
  { id: 'pain', emoji: '😣', label: 'Dor' },
];

const aftercareTags: TagOption[] = [
  { id: 'connected', emoji: '🥰', label: 'Conectada' },
  { id: 'relaxed', emoji: '😌', label: 'Relaxada' },
  { id: 'energized', emoji: '🔋', label: 'Energizada' },
  { id: 'guilty_sad', emoji: '😔', label: 'Culpada/Triste' },
];

interface IntimacyLogProps {
  showAlert?: boolean;
  alertOnly?: boolean;
}

const IntimacyLog: React.FC<IntimacyLogProps> = ({ showAlert = false, alertOnly = false }) => {
  const { selectedDate: contextDate, isToday: isContextToday } = useSelectedDate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateOption, setDateOption] = useState<DateOption>('today');
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Sync with context date when it changes (user picks a day in the calendar)
  React.useEffect(() => {
    setSelectedDate(contextDate);
    if (isContextToday) {
      setDateOption('today');
    } else {
      setDateOption('custom');
    }
  }, [contextDate, isContextToday]);
  
  const { existingLog, loading, saving, saveLog, isAuthenticated, yesterdayRiskDetected } = useIntimacyLog(selectedDate);
  const { currentPhase } = useCycle();
  const { logEmergencyContraception } = useMenstruationLog();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  // Listen for open-intimacy-log event from DayDataSummary
  React.useEffect(() => {
    const handleOpenIntimacy = () => {
      setDrawerOpen(true);
    };
    window.addEventListener('open-intimacy-log', handleOpenIntimacy);
    return () => window.removeEventListener('open-intimacy-log', handleOpenIntimacy);
  }, []);
  
  const [selectedPractices, setSelectedPractices] = useState<string[]>([]);
  const [selectedProtection, setSelectedProtection] = useState<string[]>([]);
  const [selectedSensations, setSelectedSensations] = useState<string[]>([]);
  const [selectedAftercare, setSelectedAftercare] = useState<string[]>([]);
  const [logMorningAfterPill, setLogMorningAfterPill] = useState(false);

  // Handle date option changes
  const handleDateOptionChange = (option: DateOption) => {
    setDateOption(option);
    if (option === 'today') {
      setSelectedDate(new Date());
    } else if (option === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      setSelectedDate(yesterday);
    }
    // Reset selections when date changes
    setSelectedPractices([]);
    setSelectedProtection([]);
    setSelectedSensations([]);
    setSelectedAftercare([]);
  };

  const handleCustomDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setDateOption('custom');
      setCalendarOpen(false);
      // Reset selections when date changes
      setSelectedPractices([]);
      setSelectedProtection([]);
      setSelectedSensations([]);
      setSelectedAftercare([]);
    }
  };

  // Load existing data
  useEffect(() => {
    if (existingLog) {
      // Parse the stored arrays back into state
      const practices = existingLog.sensation_physical?.filter(s => 
        practicesTags.some(t => t.id === s)
      ) || [];
      const protection = existingLog.sensation_physical?.filter(s => 
        protectionTags.some(t => t.id === s)
      ) || [];
      const sensations = existingLog.sensation_emotional?.filter(s => 
        sensationTags.some(t => t.id === s)
      ) || [];
      const aftercare = existingLog.sensation_emotional?.filter(s => 
        aftercareTags.some(t => t.id === s)
      ) || [];
      
      setSelectedPractices(practices);
      setSelectedProtection(protection);
      setSelectedSensations(sensations);
      setSelectedAftercare(aftercare);
    }
  }, [existingLog]);

  const toggleTag = (
    tagId: string, 
    selected: string[], 
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setSelected(prev =>
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSave = async () => {
    // Combine all selections for storage
    const allPhysical = [...selectedPractices, ...selectedProtection];
    const allEmotional = [...selectedSensations, ...selectedAftercare];
    
    // Check if morning after pill was selected
    if (logMorningAfterPill || selectedProtection.includes('morning_after')) {
      await logEmergencyContraception(selectedDate);
    }
    
    const success = await saveLog({
      libido: existingLog?.libido || 3,
      fluid_type: existingLog?.fluid_type || null,
      sensation_emotional: allEmotional,
      sensation_physical: allPhysical,
      symptoms: existingLog?.symptoms || [],
      activity_type: selectedPractices.length > 0 
        ? (selectedPractices.includes('masturbation') ? 'solo' : 'partner') 
        : null,
      is_protected: selectedProtection.includes('condom'),
      pleasure_rating: selectedSensations.includes('orgasm') ? 5 : 3,
    }, selectedDate);
    
    if (success) {
      setSaved(true);
      // Dispatch custom event to trigger calendar refresh
      window.dispatchEvent(new CustomEvent('intimacy-log-saved'));
      setTimeout(() => {
        setSaved(false);
        setDrawerOpen(false);
        setLogMorningAfterPill(false);
        // Reset to today after saving
        setDateOption('today');
        setSelectedDate(new Date());
      }, 1500);
    }
  };

  const hasIntimacyData = existingLog && (
    (existingLog.sensation_physical?.length || 0) > 0 ||
    (existingLog.sensation_emotional?.length || 0) > 0
  );

  const renderTagGroup = (
    title: string,
    tags: TagOption[],
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
    isCritical: boolean = false
  ) => (
    <div className="space-y-2">
      <h4 className={`text-sm font-medium ${isCritical ? 'text-amber-600' : 'text-muted-foreground'}`}>
        {title} {isCritical && '⚠️'}
      </h4>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <button
            key={tag.id}
            onClick={() => toggleTag(tag.id, selected, setSelected)}
            className={`px-3 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
              selected.includes(tag.id)
                ? isCritical && (tag.id === 'unprotected' || tag.id === 'withdrawal')
                  ? 'bg-amber-500 text-white'
                  : 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            <span>{tag.emoji}</span>
            <span>{tag.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return null;
  }

  // If alertOnly, just render the alert without the button
  if (alertOnly) {
    if (showAlert && yesterdayRiskDetected) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
              <strong>Atenção:</strong> Chance de gravidez detectada ontem (relação sem proteção durante janela fértil).
            </AlertDescription>
          </Alert>
        </motion.div>
      );
    }
    return null;
  }

  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerTrigger asChild>
        <motion.button
          className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl glass-card hover:shadow-soft transition-all"
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className={`p-3 rounded-xl ${hasIntimacyData ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-600'}`}>
            <Flame className="w-5 h-5" fill={hasIntimacyData ? 'currentColor' : 'none'} />
          </div>
          <span className="text-xs font-medium text-foreground text-center">Sexo & Libido</span>
        </motion.button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <Heart className="w-4 h-4" />
            </div>
            Registrar Intimidade
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8 overflow-y-auto space-y-6">
          {/* Date Selector */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Quando aconteceu?</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleDateOptionChange('today')}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  dateOption === 'today'
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                Hoje
              </button>
              <button
                onClick={() => handleDateOptionChange('yesterday')}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  dateOption === 'yesterday'
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                Ontem
              </button>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                      dateOption === 'custom'
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    <CalendarDays className="w-4 h-4" />
                    {dateOption === 'custom' 
                      ? format(selectedDate, "dd/MM", { locale: ptBR })
                      : "Outra data"
                    }
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleCustomDateSelect}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            {dateOption === 'custom' && (
              <p className="text-xs text-muted-foreground">
                Registrando para: {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </p>
            )}
          </div>

          {/* Fertility Warning */}
          {currentPhase === 'ovulatoria' && dateOption === 'today' && (
            <Alert className="border-purple-500/50 bg-purple-50 dark:bg-purple-950/20">
              <Heart className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-700 dark:text-purple-400 text-sm">
                Você está na <strong>janela fértil</strong>. Registre com atenção o método de proteção utilizado.
              </AlertDescription>
            </Alert>
          )}

          {renderTagGroup('Práticas', practicesTags, selectedPractices, setSelectedPractices)}
          {renderTagGroup('Proteção', protectionTags, selectedProtection, setSelectedProtection, true)}
          
          {/* Morning After Pill Checkbox - Shows when unprotected is selected */}
          {(selectedProtection.includes('unprotected') || selectedProtection.includes('withdrawal')) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id="morning-after"
                  checked={logMorningAfterPill}
                  onCheckedChange={(checked) => setLogMorningAfterPill(checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="morning-after" className="text-amber-800 dark:text-amber-200 font-medium flex items-center gap-2">
                    <Pill className="w-4 h-4" />
                    Tomei Pílula do Dia Seguinte
                  </Label>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Isso ajustará a previsão da sua próxima menstruação em +7 dias
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          {renderTagGroup('Sensação', sensationTags, selectedSensations, setSelectedSensations)}
          {renderTagGroup('After-Care', aftercareTags, selectedAftercare, setSelectedAftercare)}

          <Button 
            className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white"
            onClick={handleSave}
            disabled={saving || saved || !isAuthenticated}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </span>
            ) : saved ? (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Salvo!
              </span>
            ) : !isAuthenticated ? (
              'Faça login para salvar'
            ) : (
              'Salvar Registro 💜'
            )}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default IntimacyLog;
