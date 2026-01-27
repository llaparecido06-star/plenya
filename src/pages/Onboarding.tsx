import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Pill,
  Syringe,
  CircleDot,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Search,
  Calendar as CalendarIcon,
  Leaf,
  Target, 
  Dumbbell, 
  Heart, 
  Baby, 
  Activity,
  Utensils,
  Zap,
  Sparkles,
  User,
  Cake
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCycle } from '@/contexts/CycleContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toLocalDateString } from '@/lib/dateUtils';

// Life phase options - THE BIG FILTER
const lifePhases = [
  { id: 'menstruating', label: 'Ciclo Ativo', icon: '🩸', description: 'Menstruo regularmente ou uso anticoncepcional' },
  { id: 'pregnant', label: 'Estou Grávida', icon: '🤰', description: 'Acompanhar minha gestação' },
  { id: 'menopause', label: 'Menopausa', icon: '🧘', description: 'Climatério e bem-estar' },
];

// Goal options with hormonal explanation
const goals = [
  { id: 'lose_weight', label: 'Perder Peso', icon: Target, color: 'text-terracotta', tip: 'Otimizado para seu metabolismo hormonal' },
  { id: 'gain_muscle', label: 'Ganhar Massa', icon: Dumbbell, color: 'text-leaf-green', tip: 'Treinos sincronizados com seu ciclo' },
  { id: 'pms_relief', label: 'Alívio de TPM', icon: Heart, color: 'text-burnt-pink', tip: 'Nutrição e exercícios anti-inflamatórios' },
  { id: 'get_pregnant', label: 'Engravidar', icon: Baby, color: 'text-terracotta', tip: 'Janela fértil destacada' },
  { id: 'health_monitor', label: 'Monitorar Saúde', icon: Activity, color: 'text-leaf-green', tip: 'Padrões e tendências do seu corpo' },
];

// Dietary preference options with hormonal context
const dietaryOptions = [
  { id: 'omnivore', label: 'Onívora', icon: '🍖', description: 'Proteínas variadas para equilíbrio hormonal' },
  { id: 'vegetarian', label: 'Vegetariana', icon: '🥗', description: 'Fontes vegetais de ferro e B12' },
  { id: 'vegan', label: 'Vegana', icon: '🌱', description: 'Ômega-3 de algas e proteínas completas' },
  { id: 'low_carb', label: 'Low Carb', icon: '🥑', description: 'Estabiliza insulina e energia' },
  { id: 'lactose_free', label: 'Sem Lactose', icon: '🥛', description: 'Alternativas ricas em cálcio' },
];

// Activity level options
const activityOptions = [
  { id: 'sedentary', label: 'Sedentária', icon: '🛋️', description: 'Começaremos devagar e seguro' },
  { id: 'light', label: 'Leve', icon: '🚶‍♀️', description: '1-2 vezes por semana' },
  { id: 'moderate', label: 'Moderada', icon: '🏃‍♀️', description: '3-4 vezes por semana' },
  { id: 'intense', label: 'Intensa/Atleta', icon: '💪', description: '5+ vezes por semana' },
];

// Contraceptive categories
const contraceptiveCategories = [
  { id: 'hormonal_daily', label: 'Pílula', icon: Pill, description: 'Hormonal diário', methods: ['pill'] },
  { id: 'injection_patch_ring', label: 'Injeção/Anel', icon: Syringe, description: 'Aplicação periódica', methods: ['injection', 'patch', 'ring'] },
  { id: 'long_duration', label: 'DIU/Implante', icon: CircleDot, description: 'Longa duração', methods: ['iud', 'implant'] },
  { id: 'natural_none', label: 'Natural', icon: Leaf, description: 'Sem hormônios', methods: ['condom', 'natural', 'none'] },
];

const subMethods = {
  hormonal_daily: [{ id: 'pill', label: 'Pílula' }],
  injection_patch_ring: [
    { id: 'injection', label: 'Injeção' },
    { id: 'patch', label: 'Adesivo' },
    { id: 'ring', label: 'Anel' },
  ],
  long_duration: [
    { id: 'iud', label: 'DIU/SIU' },
    { id: 'implant', label: 'Implante' },
  ],
  natural_none: [
    { id: 'condom', label: 'Camisinha' },
    { id: 'natural', label: 'Tabelinha' },
    { id: 'none', label: 'Nenhum' },
  ],
};

const contraceptiveBrands = [
  { label: "Yasmin", type: "Pílula Combinada" },
  { label: "Selene", type: "Pílula Anti-androgênica" },
  { label: "Cerazette", type: "Pílula Progesterona" },
  { label: "Mirena", type: "DIU Hormonal" },
  { label: "Kyleena", type: "DIU Hormonal" },
  { label: "Qlaria", type: "Pílula Bioidêntica" },
  { label: "Implanon", type: "Implante" },
  { label: "Diane 35", type: "Pílula Combinada" },
  { label: "Ciclo 21", type: "Pílula Combinada" },
  { label: "Stezza", type: "Pílula Combinada" },
  { label: "Yaz", type: "Pílula Combinada" },
  { label: "Elani", type: "Pílula Combinada" },
  { label: "Gestinol", type: "Pílula Combinada" },
  { label: "Tamisa", type: "Pílula Combinada" },
  { label: "DIU de Cobre", type: "DIU Não-Hormonal" },
  { label: "Depo-Provera", type: "Injeção Trimestral" },
  { label: "Mesigyna", type: "Injeção Mensal" },
  { label: "Perlutan", type: "Injeção Mensal" },
  { label: "Noregyna", type: "Injeção Mensal" },
  { label: "Evra", type: "Adesivo" },
  { label: "NuvaRing", type: "Anel" },
];

interface ContraceptiveDetails {
  brand?: string;
  reminderTime?: string;
  lastApplicationDate?: string;
  frequency?: 'monthly' | 'quarterly';
  insertionDate?: string;
  changeDay?: number;
  usageCycle?: string;
}

// Chapter definitions for storytelling
const chapters = [
  { id: 1, title: 'Identidade', subtitle: 'Quem é você?' },
  { id: 2, title: 'O Momento', subtitle: 'Sua fase biológica' },
  { id: 3, title: 'Estilo', subtitle: 'Nutrição e movimento' },
  { id: 4, title: 'Sincronização', subtitle: 'Seu ciclo' },
];

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { refreshCycleData } = useCycle();
  
  // Wizard state - Start at step 1 (Birth Date, since name is auto-fetched)
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBuildingProfile, setShowBuildingProfile] = useState(false);
  const [buildingStep, setBuildingStep] = useState(0);
  
  // CHAPTER 1: Identity - Auto-fetched from auth
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  
  // Birth date picker state
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [birthMonth, setBirthMonth] = useState<number | null>(null);
  const [birthDay, setBirthDay] = useState<number | null>(null);
  
  // CHAPTER 2: Life Phase (The Big Filter)
  const [lifePhase, setLifePhase] = useState<string | null>(null);
  const [isTryingToConceive, setIsTryingToConceive] = useState(false);
  
  // CHAPTER 3: Goals & Style
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedDiet, setSelectedDiet] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  
  // CHAPTER 4: Cycle Sync (conditional)
  const [lastPeriodDate, setLastPeriodDate] = useState<Date | undefined>(undefined);
  const [cycleLength, setCycleLength] = useState<number>(28);
  const [pregnancyStartDate, setPregnancyStartDate] = useState<Date | undefined>(undefined);
  
  // Contraceptive (for menstruating)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [contraceptiveDetails, setContraceptiveDetails] = useState<ContraceptiveDetails>({});
  const [brandSearch, setBrandSearch] = useState('');
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);

  // Auto-fetch name from auth metadata on mount
  useEffect(() => {
    if (user) {
      const authName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      if (authName) {
        // Extract first name
        const firstName = authName.split(' ')[0];
        setFullName(firstName);
      }
    }
  }, [user]);

  // Update dateOfBirth when year/month/day are selected
  useEffect(() => {
    if (birthYear && birthMonth !== null && birthDay) {
      const date = new Date(birthYear, birthMonth, birthDay);
      if (!isNaN(date.getTime())) {
        setDateOfBirth(date);
      }
    }
  }, [birthYear, birthMonth, birthDay]);

  // Generate year options (1940 to current year - 10)
  const yearOptions = Array.from(
    { length: new Date().getFullYear() - 10 - 1940 + 1 },
    (_, i) => 1940 + i
  ).reverse();

  // Generate month options
  const monthOptions = [
    { value: 0, label: 'Janeiro' },
    { value: 1, label: 'Fevereiro' },
    { value: 2, label: 'Março' },
    { value: 3, label: 'Abril' },
    { value: 4, label: 'Maio' },
    { value: 5, label: 'Junho' },
    { value: 6, label: 'Julho' },
    { value: 7, label: 'Agosto' },
    { value: 8, label: 'Setembro' },
    { value: 9, label: 'Outubro' },
    { value: 10, label: 'Novembro' },
    { value: 11, label: 'Dezembro' },
  ];

  // Generate day options based on selected year and month
  const getDaysInMonth = (year: number | null, month: number | null) => {
    if (year === null || month === null) return 31;
    return new Date(year, month + 1, 0).getDate();
  };
  const dayOptions = Array.from(
    { length: getDaysInMonth(birthYear, birthMonth) },
    (_, i) => i + 1
  );

  // Calculate total steps based on life phase (reduced by 1 since name step removed)
  const getTotalSteps = () => {
    if (lifePhase === 'menopause') return 5; // Birth (1) + Phase (1) + Style (3) = 5 sub-steps
    if (lifePhase === 'pregnant') return 6; // Birth + Phase + Style + Pregnancy date
    return 8; // Full flow with contraceptive
  };

  const totalSteps = getTotalSteps();

  // Filter brands based on search
  const filteredBrands = contraceptiveBrands.filter(brand =>
    brand.label.toLowerCase().includes(brandSearch.toLowerCase()) ||
    brand.type.toLowerCase().includes(brandSearch.toLowerCase())
  );

  // Check contraceptive requirements
  const needsBrand = ['pill', 'injection', 'iud', 'implant'].includes(selectedMethod || '');
  const needsReminder = selectedMethod === 'pill';
  const needsInjectionDetails = selectedMethod === 'injection';
  const needsRingPatchDetails = ['ring', 'patch'].includes(selectedMethod || '');
  const needsInsertionDate = ['iud', 'implant'].includes(selectedMethod || '');

  // Building profile animation steps
  const buildingSteps = [
    { label: 'Analisando seu perfil...', icon: '🔍' },
    { label: 'Personalizando Chef IA...', icon: '👩‍🍳' },
    { label: `Configurando modo ${lifePhase === 'pregnant' ? 'Gestante' : lifePhase === 'menopause' ? 'Menopausa' : 'Ciclo'}...`, icon: '⚡' },
    { label: 'Seu santuário está pronto!', icon: '🌸' },
  ];

  // Animate building profile
  useEffect(() => {
    if (showBuildingProfile && buildingStep < buildingSteps.length) {
      const timer = setTimeout(() => {
        setBuildingStep(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    }
    if (showBuildingProfile && buildingStep >= buildingSteps.length) {
      const timer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showBuildingProfile, buildingStep, navigate]);

  const handleNext = () => {
    // Validation per step (shifted by 1 since name step removed)
    if (currentStep === 1 && !dateOfBirth) {
      toast({ title: 'Informe sua data de nascimento', variant: 'destructive' });
      return;
    }
    if (currentStep === 2 && !lifePhase) {
      toast({ title: 'Selecione sua fase biológica', variant: 'destructive' });
      return;
    }
    if (currentStep === 3 && selectedGoals.length === 0) {
      toast({ title: 'Selecione pelo menos um objetivo', variant: 'destructive' });
      return;
    }
    if (currentStep === 4 && !selectedDiet) {
      toast({ title: 'Selecione seu estilo alimentar', variant: 'destructive' });
      return;
    }
    if (currentStep === 5 && !selectedActivity) {
      toast({ title: 'Selecione seu ritmo de movimento', variant: 'destructive' });
      return;
    }
    
    // For menstruating: validate cycle step
    if (lifePhase === 'menstruating') {
      if (currentStep === 6 && !lastPeriodDate) {
        toast({ title: 'Informe a data da última menstruação', variant: 'destructive' });
        return;
      }
      if (currentStep === 7 && !selectedCategory) {
        toast({ title: 'Selecione uma categoria', variant: 'destructive' });
        return;
      }
      if (currentStep === 8 && !selectedMethod) {
        toast({ title: 'Selecione um método', variant: 'destructive' });
        return;
      }
    }
    
    // For pregnant: validate pregnancy date
    if (lifePhase === 'pregnant' && currentStep === 6 && !pregnancyStartDate) {
      toast({ title: 'Informe a data da última menstruação', variant: 'destructive' });
      return;
    }
    
    // Determine next step based on life phase
    if (currentStep === 5 && lifePhase === 'menopause') {
      // Menopause skips cycle config
      handleComplete();
      return;
    }
    
    if (lifePhase === 'pregnant' && currentStep === 6) {
      handleComplete();
      return;
    }
    
    if (lifePhase === 'menstruating' && currentStep === 8) {
      handleComplete();
      return;
    }
    
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      const updateData: any = {
        full_name: fullName,
        date_of_birth: dateOfBirth ? toLocalDateString(dateOfBirth) : null,
        life_phase: lifePhase,
        is_trying_to_conceive: isTryingToConceive || selectedGoals.includes('get_pregnant'),
        goal: selectedGoals.join(','),
        diet_type: selectedDiet,
        fitness_level: selectedActivity,
        onboarding_completed: true,
      };

      // Add cycle data for menstruating users
      if (lifePhase === 'menstruating') {
        updateData.last_period_start = lastPeriodDate ? toLocalDateString(lastPeriodDate) : null;
        updateData.cycle_length = cycleLength;
        updateData.contraceptive_type = selectedMethod;
        updateData.contraceptive_brand = contraceptiveDetails.brand || null;
        updateData.pill_reminder_time = contraceptiveDetails.reminderTime || null;
        updateData.contraceptive_details = contraceptiveDetails;
      }

      // Add pregnancy data for pregnant users
      if (lifePhase === 'pregnant') {
        updateData.pregnancy_start_date = pregnancyStartDate ? toLocalDateString(pregnancyStartDate) : null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshCycleData();

      // Show building profile animation
      setShowBuildingProfile(true);
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  const selectBrand = (brand: { label: string; type: string }) => {
    setContraceptiveDetails(prev => ({ ...prev, brand: brand.label }));
    setBrandSearch(brand.label);
    setShowBrandSuggestions(false);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const methods = subMethods[categoryId as keyof typeof subMethods];
    if (methods.length === 1) {
      setSelectedMethod(methods[0].id);
    } else {
      setSelectedMethod(null);
    }
    setContraceptiveDetails({});
    setBrandSearch('');
  };

  const handleContraceptiveDateSelect = (date: Date | undefined, field: 'lastApplicationDate' | 'insertionDate') => {
    setContraceptiveDetails(prev => ({
      ...prev,
      [field]: date ? toLocalDateString(date) : undefined
    }));
  };

  // Calculate current chapter (adjusted for removed name step)
  const getCurrentChapter = () => {
    if (currentStep === 1) return 1; // Birth date only
    if (currentStep === 2) return 2; // Life phase
    if (currentStep <= 5) return 3; // Goals, Diet, Activity
    return 4; // Sync
  };

  // Building Profile Screen
  if (showBuildingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          {/* Pulsing Logo */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary to-terracotta flex items-center justify-center shadow-lg"
          >
            <Sparkles className="w-12 h-12 text-white" />
          </motion.div>

          <h2 className="text-2xl font-bold text-foreground mb-2">Preparando seu Plenya</h2>
          <p className="text-muted-foreground mb-8">Um momento, {fullName.split(' ')[0]}...</p>

          {/* Animated Checklist */}
          <div className="space-y-4 text-left max-w-xs mx-auto">
            {buildingSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: buildingStep > index ? 1 : buildingStep === index ? 0.7 : 0.3,
                  x: 0 
                }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                  buildingStep > index ? "bg-leaf-green/20" : "bg-muted"
                )}>
                  {buildingStep > index ? (
                    <Check className="w-4 h-4 text-leaf-green" />
                  ) : (
                    <span className="text-lg">{step.icon}</span>
                  )}
                </div>
                <span className={cn(
                  "text-sm transition-all",
                  buildingStep > index ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      // CHAPTER 1: Identity - Birth Date (Name removed, auto-fetched)
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-terracotta/20 flex items-center justify-center">
                <Cake className="w-10 h-10 text-primary" />
              </div>
              {fullName && (
                <p className="text-lg text-primary font-medium mb-2">Olá, {fullName}! 👋</p>
              )}
              <h2 className="text-2xl font-bold text-foreground mb-2">Quando iniciou sua jornada?</h2>
              <p className="text-muted-foreground">Para calcular sua idade metabólica</p>
            </div>
            
            {/* Improved Date Picker with Year/Month/Day dropdowns */}
            <div className="space-y-4">
              {/* Year Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Ano</label>
                <select
                  value={birthYear || ''}
                  onChange={(e) => setBirthYear(e.target.value ? Number(e.target.value) : null)}
                  className="w-full h-14 px-4 text-lg rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">Selecione o ano</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Month Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Mês</label>
                <select
                  value={birthMonth !== null ? birthMonth : ''}
                  onChange={(e) => setBirthMonth(e.target.value !== '' ? Number(e.target.value) : null)}
                  className="w-full h-14 px-4 text-lg rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                  disabled={!birthYear}
                >
                  <option value="">Selecione o mês</option>
                  {monthOptions.map((month) => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>

              {/* Day Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Dia</label>
                <select
                  value={birthDay || ''}
                  onChange={(e) => setBirthDay(e.target.value ? Number(e.target.value) : null)}
                  className="w-full h-14 px-4 text-lg rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                  disabled={birthMonth === null}
                >
                  <option value="">Selecione o dia</option>
                  {dayOptions.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              {/* Display selected date */}
              {dateOfBirth && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center p-3 bg-primary/10 rounded-xl"
                >
                  <p className="text-primary font-medium">
                    📅 {format(dateOfBirth, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        );

      // CHAPTER 2: Life Phase (The Big Filter)
      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Em qual fase você está?</h2>
              <p className="text-muted-foreground">Isso define como o Plenya vai te acompanhar</p>
            </div>
            
            <div className="grid gap-4">
              {lifePhases.map((phase) => {
                const isSelected = lifePhase === phase.id;
                
                return (
                  <button
                    key={phase.id}
                    onClick={() => setLifePhase(phase.id)}
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-lg scale-[1.02]"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl",
                      isSelected ? "bg-primary/20" : "bg-muted"
                    )}>
                      {phase.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-semibold text-lg text-foreground block">{phase.label}</span>
                      <span className="text-sm text-muted-foreground">{phase.description}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-6 h-6 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        );

      // CHAPTER 3: Goals
      case 3:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Quais são seus objetivos?</h2>
              <p className="text-muted-foreground">Selecione um ou mais</p>
            </div>
            
            <div className="grid gap-3">
              {goals.map((goal) => {
                const Icon = goal.icon;
                const isSelected = selectedGoals.includes(goal.id);
                
                // Hide "Engravidar" for pregnant/menopause users
                if ((lifePhase === 'pregnant' || lifePhase === 'menopause') && goal.id === 'get_pregnant') {
                  return null;
                }
                
                // Hide "Alívio de TPM" for pregnant/menopause
                if ((lifePhase === 'pregnant' || lifePhase === 'menopause') && goal.id === 'pms_relief') {
                  return null;
                }
                
                return (
                  <button
                    key={goal.id}
                    onClick={() => {
                      setSelectedGoals(prev => 
                        prev.includes(goal.id)
                          ? prev.filter(g => g !== goal.id)
                          : [...prev, goal.id]
                      );
                      if (goal.id === 'get_pregnant') {
                        setIsTryingToConceive(!selectedGoals.includes(goal.id));
                      }
                    }}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      isSelected ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Icon className={cn("w-6 h-6", goal.color)} />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-medium text-foreground block">{goal.label}</span>
                      <span className="text-xs text-muted-foreground">{goal.tip}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        );

      // CHAPTER 3: Dietary Style
      case 4:
        return (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Utensils className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Seu estilo alimentar</h2>
              <p className="text-muted-foreground">O Chef IA vai se adaptar a você</p>
            </div>
            
            <div className="grid gap-3">
              {dietaryOptions.map((diet) => {
                const isSelected = selectedDiet === diet.id;
                
                return (
                  <button
                    key={diet.id}
                    onClick={() => setSelectedDiet(diet.id)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-2xl",
                      isSelected ? "bg-primary/20" : "bg-muted"
                    )}>
                      {diet.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-medium text-foreground block">{diet.label}</span>
                      <span className="text-xs text-muted-foreground">{diet.description}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        );

      // CHAPTER 3: Activity Level
      case 5:
        return (
          <motion.div
            key="step6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Seu ritmo de movimento</h2>
              <p className="text-muted-foreground">
                {lifePhase === 'pregnant' 
                  ? 'Adaptaremos para gestação segura' 
                  : lifePhase === 'menopause'
                    ? 'Exercícios para equilíbrio hormonal'
                    : 'Treinos sincronizados com seu ciclo'}
              </p>
            </div>
            
            <div className="grid gap-3">
              {activityOptions.map((activity) => {
                const isSelected = selectedActivity === activity.id;
                
                return (
                  <button
                    key={activity.id}
                    onClick={() => setSelectedActivity(activity.id)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-2xl",
                      isSelected ? "bg-primary/20" : "bg-muted"
                    )}>
                      {activity.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-medium text-foreground block">{activity.label}</span>
                      <span className="text-xs text-muted-foreground">{activity.description}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        );

      // CHAPTER 4: Cycle Sync - DUM (for menstruating) OR Pregnancy Date (for pregnant)
      case 6:
        if (lifePhase === 'pregnant') {
          return (
            <motion.div
              key="step7-pregnant"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-terracotta/20 to-burnt-pink/20 flex items-center justify-center text-4xl">
                  🤰
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Data da Última Menstruação</h2>
                <p className="text-muted-foreground">Para calcular suas semanas de gestação</p>
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-center text-left font-normal h-14 text-lg",
                      !pregnancyStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5" />
                    {pregnancyStartDate
                      ? format(pregnancyStartDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : "Selecione a data da DUM"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto" align="center">
                  <Calendar
                    mode="single"
                    selected={pregnancyStartDate}
                    onSelect={setPregnancyStartDate}
                    disabled={(date) => date > new Date() || date < new Date(Date.now() - 280 * 24 * 60 * 60 * 1000)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {pregnancyStartDate && (
                <div className="p-4 bg-terracotta/10 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground">Você está com aproximadamente</p>
                  <p className="text-3xl font-bold text-terracotta">
                    {Math.floor((Date.now() - pregnancyStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000))} semanas
                  </p>
                </div>
              )}
            </motion.div>
          );
        }

        // Menstruating: DUM
        return (
          <motion.div
            key="step7-cycle"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Dados do Ciclo</h2>
              <p className="text-muted-foreground">Para previsões mais precisas</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Data da Última Menstruação
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-12",
                        !lastPeriodDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {lastPeriodDate
                        ? format(lastPeriodDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                        : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 pointer-events-auto" align="center">
                    <Calendar
                      mode="single"
                      selected={lastPeriodDate}
                      onSelect={setLastPeriodDate}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Duração Média do Ciclo (dias)
                </label>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCycleLength(prev => Math.max(21, prev - 1))}
                  >
                    -
                  </Button>
                  <div className="flex-1 text-center">
                    <span className="text-3xl font-bold text-primary">{cycleLength}</span>
                    <span className="text-muted-foreground ml-2">dias</span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCycleLength(prev => Math.min(45, prev + 1))}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        );

      // CHAPTER 4: Contraceptive Category
      case 7:
        return (
          <motion.div
            key="step8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-foreground mb-2">Método Contraceptivo</h2>
              <p className="text-muted-foreground">Para acompanhamento personalizado</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {contraceptiveCategories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <Icon className={cn(
                      "w-7 h-7",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-sm font-medium text-center",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {category.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sub-method Selection */}
            {selectedCategory && subMethods[selectedCategory as keyof typeof subMethods]?.length > 1 && (
              <div className="pt-3 border-t border-border">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Especifique:
                </label>
                <div className="flex flex-wrap gap-2">
                  {subMethods[selectedCategory as keyof typeof subMethods].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                        selectedMethod === method.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      )}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        );

      // CHAPTER 4: Contraceptive Details
      case 8:
        return (
          <motion.div
            key="step9"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-foreground mb-2">Detalhes do Método</h2>
            </div>

            {/* Brand Search */}
            {needsBrand && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Nome/Marca
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={brandSearch}
                    onChange={(e) => {
                      setBrandSearch(e.target.value);
                      setContraceptiveDetails(prev => ({ ...prev, brand: e.target.value }));
                      setShowBrandSuggestions(true);
                    }}
                    onFocus={() => setShowBrandSuggestions(true)}
                    placeholder="Ex: Yasmin, Mirena..."
                    className="pl-10"
                  />
                  
                  {showBrandSuggestions && brandSearch && filteredBrands.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-40 overflow-auto">
                      {filteredBrands.slice(0, 5).map((brand) => (
                        <button
                          key={brand.label}
                          onClick={() => selectBrand(brand)}
                          className="w-full px-4 py-2.5 text-left hover:bg-accent flex items-center justify-between"
                        >
                          <span className="font-medium">{brand.label}</span>
                          <span className="text-xs text-muted-foreground">{brand.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pill Reminder */}
            {needsReminder && (
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Lembrar de tomar?</p>
                    <p className="text-sm text-muted-foreground">Notificação diária</p>
                  </div>
                  <Switch
                    checked={!!contraceptiveDetails.reminderTime}
                    onCheckedChange={(checked) => 
                      setContraceptiveDetails(prev => ({ 
                        ...prev, 
                        reminderTime: checked ? '08:00' : undefined 
                      }))
                    }
                  />
                </div>
                
                {contraceptiveDetails.reminderTime && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Lembrar às</span>
                    <Input
                      type="time"
                      value={contraceptiveDetails.reminderTime}
                      onChange={(e) => setContraceptiveDetails(prev => ({ 
                        ...prev, 
                        reminderTime: e.target.value 
                      }))}
                      className="w-28 ml-auto"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Injection Details */}
            {needsInjectionDetails && (
              <div className="space-y-4 pt-3 border-t border-border">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Data da Última Aplicação
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-11",
                          !contraceptiveDetails.lastApplicationDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {contraceptiveDetails.lastApplicationDate
                          ? format(new Date(contraceptiveDetails.lastApplicationDate + 'T12:00:00'), "dd/MM/yyyy")
                          : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="center">
                      <Calendar
                        mode="single"
                        selected={contraceptiveDetails.lastApplicationDate 
                          ? new Date(contraceptiveDetails.lastApplicationDate + 'T12:00:00') 
                          : undefined}
                        onSelect={(date) => handleContraceptiveDateSelect(date, 'lastApplicationDate')}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Frequência</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setContraceptiveDetails(prev => ({ ...prev, frequency: 'monthly' }))}
                      className={cn(
                        "flex-1 py-3 rounded-lg text-sm font-medium transition-all",
                        contraceptiveDetails.frequency === 'monthly'
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      Mensal (30 dias)
                    </button>
                    <button
                      onClick={() => setContraceptiveDetails(prev => ({ ...prev, frequency: 'quarterly' }))}
                      className={cn(
                        "flex-1 py-3 rounded-lg text-sm font-medium transition-all",
                        contraceptiveDetails.frequency === 'quarterly'
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      Trimestral (90 dias)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Ring/Patch Details */}
            {needsRingPatchDetails && (
              <div className="space-y-4 pt-3 border-t border-border">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Dia da última troca</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-11",
                          !contraceptiveDetails.lastApplicationDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {contraceptiveDetails.lastApplicationDate
                          ? format(new Date(contraceptiveDetails.lastApplicationDate + 'T12:00:00'), "dd/MM/yyyy")
                          : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="center">
                      <Calendar
                        mode="single"
                        selected={contraceptiveDetails.lastApplicationDate 
                          ? new Date(contraceptiveDetails.lastApplicationDate + 'T12:00:00') 
                          : undefined}
                        onSelect={(date) => handleContraceptiveDateSelect(date, 'lastApplicationDate')}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Ciclo de uso</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setContraceptiveDetails(prev => ({ ...prev, usageCycle: '21-7' }))}
                      className={cn(
                        "flex-1 py-3 rounded-lg text-sm font-medium transition-all",
                        contraceptiveDetails.usageCycle === '21-7'
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      21 dias + 7 pausa
                    </button>
                    <button
                      onClick={() => setContraceptiveDetails(prev => ({ ...prev, usageCycle: 'continuous' }))}
                      className={cn(
                        "flex-1 py-3 rounded-lg text-sm font-medium transition-all",
                        contraceptiveDetails.usageCycle === 'continuous'
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      Uso contínuo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DIU/Implant Details */}
            {needsInsertionDate && (
              <div className="space-y-3 pt-3 border-t border-border">
                <label className="text-sm font-medium text-foreground">Data de Inserção</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-11",
                        !contraceptiveDetails.insertionDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {contraceptiveDetails.insertionDate
                        ? format(new Date(contraceptiveDetails.insertionDate + 'T12:00:00'), "dd/MM/yyyy")
                        : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 pointer-events-auto" align="center">
                    <Calendar
                      mode="single"
                      selected={contraceptiveDetails.insertionDate 
                        ? new Date(contraceptiveDetails.insertionDate + 'T12:00:00') 
                        : undefined}
                      onSelect={(date) => handleContraceptiveDateSelect(date, 'insertionDate')}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  const currentChapter = getCurrentChapter();
  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex flex-col">
      {/* Header with Chapter Info */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          {currentStep > 1 ? (
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          ) : (
            <div className="w-10" />
          )}
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Capítulo {currentChapter} de 4
            </p>
            <p className="text-sm font-medium text-foreground">
              {chapters[currentChapter - 1]?.title}
            </p>
          </div>
          
          <div className="w-10" />
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-terracotta rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 overflow-auto">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div className="p-6 pt-2">
        <Button
          onClick={handleNext}
          disabled={isSubmitting}
          className="w-full h-14 text-lg phase-gradient text-white"
        >
          {isSubmitting ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : currentStep === totalSteps ? (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Criar Meu Santuário
            </>
          ) : (
            <>
              Continuar
              <ChevronRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
