import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { 
  Pill, Syringe, CircleDot, ChevronLeft, ChevronRight, Check, Clock, Search,
  Calendar as CalendarIcon, Leaf, Target, Dumbbell, Heart, Baby, Activity,
  Utensils, Zap, Sparkles, User, Cake
} from 'lucide-react';
import PremiumTrialStep from '@/components/onboarding/PremiumTrialStep';
import PWAInstallStep from '@/components/onboarding/PWAInstallStep';
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

const getDateLocale = (lang: string) => {
  if (lang.startsWith('en')) return enUS;
  if (lang.startsWith('es')) return es;
  return ptBR;
};

const Onboarding: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { refreshCycleData } = useCycle();
  const dateLocale = getDateLocale(i18n.language);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBuildingProfile, setShowBuildingProfile] = useState(false);
  const [buildingStep, setBuildingStep] = useState(0);
  
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [birthMonth, setBirthMonth] = useState<number | null>(null);
  const [birthDay, setBirthDay] = useState<number | null>(null);
  const [lifePhase, setLifePhase] = useState<string | null>(null);
  const [isTryingToConceive, setIsTryingToConceive] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedDiet, setSelectedDiet] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [lastPeriodDate, setLastPeriodDate] = useState<Date | undefined>(undefined);
  const [cycleLength, setCycleLength] = useState<number>(28);
  const [pregnancyStartDate, setPregnancyStartDate] = useState<Date | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [contraceptiveDetails, setContraceptiveDetails] = useState<ContraceptiveDetails>({});
  const [brandSearch, setBrandSearch] = useState('');
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);

  const lifePhases = [
    { id: 'menstruating', labelKey: 'onboarding.life_phase_menstruating', icon: '🩸', descKey: 'onboarding.life_phase_menstruating_desc' },
    { id: 'pregnant', labelKey: 'onboarding.life_phase_pregnant', icon: '🤰', descKey: 'onboarding.life_phase_pregnant_desc' },
    { id: 'menopause', labelKey: 'onboarding.life_phase_menopause', icon: '🧘', descKey: 'onboarding.life_phase_menopause_desc' },
  ];

  const goals = [
    { id: 'lose_weight', labelKey: 'onboarding.goal_lose_weight', icon: Target, color: 'text-terracotta', tipKey: 'onboarding.goal_lose_weight_tip' },
    { id: 'gain_muscle', labelKey: 'onboarding.goal_gain_muscle', icon: Dumbbell, color: 'text-leaf-green', tipKey: 'onboarding.goal_gain_muscle_tip' },
    { id: 'pms_relief', labelKey: 'onboarding.goal_pms_relief', icon: Heart, color: 'text-burnt-pink', tipKey: 'onboarding.goal_pms_relief_tip' },
    { id: 'get_pregnant', labelKey: 'onboarding.goal_get_pregnant', icon: Baby, color: 'text-terracotta', tipKey: 'onboarding.goal_get_pregnant_tip' },
    { id: 'health_monitor', labelKey: 'onboarding.goal_health_monitor', icon: Activity, color: 'text-leaf-green', tipKey: 'onboarding.goal_health_monitor_tip' },
  ];

  const dietaryOptions = [
    { id: 'omnivore', labelKey: 'onboarding.diet_omnivore', icon: '🍖', descKey: 'onboarding.diet_omnivore_desc' },
    { id: 'vegetarian', labelKey: 'onboarding.diet_vegetarian', icon: '🥗', descKey: 'onboarding.diet_vegetarian_desc' },
    { id: 'vegan', labelKey: 'onboarding.diet_vegan', icon: '🌱', descKey: 'onboarding.diet_vegan_desc' },
    { id: 'low_carb', labelKey: 'onboarding.diet_low_carb', icon: '🥑', descKey: 'onboarding.diet_low_carb_desc' },
    { id: 'lactose_free', labelKey: 'onboarding.diet_lactose_free', icon: '🥛', descKey: 'onboarding.diet_lactose_free_desc' },
  ];

  const activityOptions = [
    { id: 'sedentary', labelKey: 'onboarding.activity_sedentary', icon: '🛋️', descKey: 'onboarding.activity_sedentary_desc' },
    { id: 'light', labelKey: 'onboarding.activity_light', icon: '🚶‍♀️', descKey: 'onboarding.activity_light_desc' },
    { id: 'moderate', labelKey: 'onboarding.activity_moderate', icon: '🏃‍♀️', descKey: 'onboarding.activity_moderate_desc' },
    { id: 'intense', labelKey: 'onboarding.activity_intense', icon: '💪', descKey: 'onboarding.activity_intense_desc' },
  ];

  const contraceptiveCategories = [
    { id: 'hormonal_daily', labelKey: 'onboarding.contraceptive_pill', icon: Pill, descKey: 'onboarding.contraceptive_pill_desc', methods: ['pill'] },
    { id: 'injection_patch_ring', labelKey: 'onboarding.contraceptive_injection_ring', icon: Syringe, descKey: 'onboarding.contraceptive_injection_ring_desc', methods: ['injection', 'patch', 'ring'] },
    { id: 'long_duration', labelKey: 'onboarding.contraceptive_iud_implant', icon: CircleDot, descKey: 'onboarding.contraceptive_iud_implant_desc', methods: ['iud', 'implant'] },
    { id: 'natural_none', labelKey: 'onboarding.contraceptive_natural', icon: Leaf, descKey: 'onboarding.contraceptive_natural_desc', methods: ['condom', 'natural', 'none'] },
  ];

  const subMethods: Record<string, { id: string; labelKey: string }[]> = {
    hormonal_daily: [{ id: 'pill', labelKey: 'onboarding.contraceptive_pill' }],
    injection_patch_ring: [
      { id: 'injection', labelKey: 'onboarding.sub_injection' },
      { id: 'patch', labelKey: 'onboarding.sub_patch' },
      { id: 'ring', labelKey: 'onboarding.sub_ring' },
    ],
    long_duration: [
      { id: 'iud', labelKey: 'onboarding.sub_iud' },
      { id: 'implant', labelKey: 'onboarding.sub_implant' },
    ],
    natural_none: [
      { id: 'condom', labelKey: 'onboarding.sub_condom' },
      { id: 'natural', labelKey: 'onboarding.sub_natural' },
      { id: 'none', labelKey: 'onboarding.sub_none' },
    ],
  };

  const chapters = [
    { id: 1, titleKey: 'onboarding.chapter_identity', subtitleKey: 'onboarding.chapter_identity_sub' },
    { id: 2, titleKey: 'onboarding.chapter_moment', subtitleKey: 'onboarding.chapter_moment_sub' },
    { id: 3, titleKey: 'onboarding.chapter_style', subtitleKey: 'onboarding.chapter_style_sub' },
    { id: 4, titleKey: 'onboarding.chapter_sync', subtitleKey: 'onboarding.chapter_sync_sub' },
    { id: 5, titleKey: 'onboarding.chapter_install', subtitleKey: 'onboarding.chapter_install_sub' },
    { id: 6, titleKey: 'onboarding.chapter_premium', subtitleKey: 'onboarding.chapter_premium_sub' },
  ];

  const monthKeys = ['month_jan','month_feb','month_mar','month_apr','month_may','month_jun','month_jul','month_aug','month_sep','month_oct','month_nov','month_dec'];

  useEffect(() => {
    if (user) {
      const authName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      if (authName) setFullName(authName.split(' ')[0]);
    }
  }, [user]);

  useEffect(() => {
    if (birthYear && birthMonth !== null && birthDay) {
      const date = new Date(birthYear, birthMonth, birthDay);
      if (!isNaN(date.getTime())) setDateOfBirth(date);
    }
  }, [birthYear, birthMonth, birthDay]);

  const yearOptions = Array.from({ length: new Date().getFullYear() - 10 - 1940 + 1 }, (_, i) => 1940 + i).reverse();
  const getDaysInMonth = (year: number | null, month: number | null) => {
    if (year === null || month === null) return 31;
    return new Date(year, month + 1, 0).getDate();
  };
  const dayOptions = Array.from({ length: getDaysInMonth(birthYear, birthMonth) }, (_, i) => i + 1);

  const getTotalSteps = () => {
    if (lifePhase === 'menopause') return 7;
    if (lifePhase === 'pregnant') return 8;
    return 10;
  };
  const totalSteps = getTotalSteps();

  const getMethodBrandTypes = (method: string | null): string[] => {
    switch (method) {
      case 'pill': return ['Pílula Combinada', 'Pílula Anti-androgênica', 'Pílula Progesterona', 'Pílula Bioidêntica'];
      case 'injection': return ['Injeção Trimestral', 'Injeção Mensal'];
      case 'iud': return ['DIU Hormonal', 'DIU Não-Hormonal'];
      case 'implant': return ['Implante'];
      case 'ring': return ['Anel'];
      case 'patch': return ['Adesivo'];
      default: return [];
    }
  };

  const allowedBrandTypes = getMethodBrandTypes(selectedMethod);
  const filteredBrands = contraceptiveBrands.filter(brand => {
    const matchesSearch = !brandSearch || brand.label.toLowerCase().includes(brandSearch.toLowerCase()) || brand.type.toLowerCase().includes(brandSearch.toLowerCase());
    const matchesMethod = allowedBrandTypes.length === 0 || allowedBrandTypes.includes(brand.type);
    return matchesSearch && matchesMethod;
  });

  const needsBrand = ['pill', 'injection', 'iud', 'implant'].includes(selectedMethod || '');
  const needsReminder = selectedMethod === 'pill';
  const needsInjectionDetails = selectedMethod === 'injection';
  const needsRingPatchDetails = ['ring', 'patch'].includes(selectedMethod || '');
  const needsInsertionDate = ['iud', 'implant'].includes(selectedMethod || '');

  const buildingSteps = [
    { label: t('onboarding.building_step_1'), icon: '🔍' },
    { label: t('onboarding.building_step_2'), icon: '👩‍🍳' },
    { label: t(`onboarding.building_step_3_${lifePhase || 'menstruating'}`), icon: '⚡' },
    { label: t('onboarding.building_step_4'), icon: '🌸' },
  ];

  useEffect(() => {
    if (showBuildingProfile && buildingStep < buildingSteps.length) {
      const timer = setTimeout(() => setBuildingStep(prev => prev + 1), 800);
      return () => clearTimeout(timer);
    }
    if (showBuildingProfile && buildingStep >= buildingSteps.length) {
      const timer = setTimeout(() => navigate('/', { replace: true }), 500);
      return () => clearTimeout(timer);
    }
  }, [showBuildingProfile, buildingStep, navigate]);

  const handleNext = () => {
    if (currentStep === 1 && !dateOfBirth) { toast({ title: t('onboarding.validation_birth'), variant: 'destructive' }); return; }
    if (currentStep === 2 && !lifePhase) { toast({ title: t('onboarding.validation_life_phase'), variant: 'destructive' }); return; }
    if (currentStep === 3 && selectedGoals.length === 0) { toast({ title: t('onboarding.validation_goals'), variant: 'destructive' }); return; }
    if (currentStep === 4 && !selectedDiet) { toast({ title: t('onboarding.validation_diet'), variant: 'destructive' }); return; }
    if (currentStep === 5 && !selectedActivity) { toast({ title: t('onboarding.validation_activity'), variant: 'destructive' }); return; }
    
    if (lifePhase === 'menstruating') {
      if (currentStep === 6 && !lastPeriodDate) { toast({ title: t('onboarding.validation_dum'), variant: 'destructive' }); return; }
      if (currentStep === 7 && !selectedCategory) { toast({ title: t('onboarding.validation_category'), variant: 'destructive' }); return; }
      if (currentStep === 8 && !selectedMethod) { toast({ title: t('onboarding.validation_method'), variant: 'destructive' }); return; }
    }
    if (lifePhase === 'pregnant' && currentStep === 6 && !pregnancyStartDate) { toast({ title: t('onboarding.validation_dum'), variant: 'destructive' }); return; }
    
    if (currentStep === 5 && lifePhase === 'menopause') { setCurrentStep(6); return; }
    if (lifePhase === 'pregnant' && currentStep === 6) { setCurrentStep(7); return; }
    if (lifePhase === 'menstruating' && currentStep === 8) { setCurrentStep(9); return; }
    
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => { if (currentStep > 1) setCurrentStep(prev => prev - 1); };

  const saveOnboardingData = async () => {
    if (!user) return;
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
    if (lifePhase === 'menstruating') {
      updateData.last_period_start = lastPeriodDate ? toLocalDateString(lastPeriodDate) : null;
      updateData.cycle_length = cycleLength;
      updateData.contraceptive_type = selectedMethod;
      updateData.contraceptive_brand = contraceptiveDetails.brand || null;
      updateData.pill_reminder_time = contraceptiveDetails.reminderTime || null;
      updateData.contraceptive_details = contraceptiveDetails;
    }
    if (lifePhase === 'pregnant') {
      updateData.pregnancy_start_date = pregnancyStartDate ? toLocalDateString(pregnancyStartDate) : null;
    }
    const { error } = await supabase.from('profiles').update(updateData).eq('user_id', user.id);
    if (error) throw error;
    await refreshCycleData();
  };

  const handleComplete = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await saveOnboardingData();
      setShowBuildingProfile(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({ title: t('onboarding.error_save'), description: t('onboarding.error_save_desc'), variant: 'destructive' });
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
    const methods = subMethods[categoryId];
    if (methods.length === 1) setSelectedMethod(methods[0].id);
    else setSelectedMethod(null);
    setContraceptiveDetails({});
    setBrandSearch('');
  };

  const handleContraceptiveDateSelect = (date: Date | undefined, field: 'lastApplicationDate' | 'insertionDate') => {
    setContraceptiveDetails(prev => ({ ...prev, [field]: date ? toLocalDateString(date) : undefined }));
  };

  const getCurrentChapter = () => {
    if (currentStep === 1) return 1;
    if (currentStep === 2) return 2;
    if (currentStep <= 5) return 3;
    if (currentStep === totalSteps - 1) return 5;
    if (currentStep === totalSteps) return 6;
    return 4;
  };

  const formatDate = (date: Date) => format(date, "dd/MM/yyyy");
  const formatDateLong = (date: Date) => format(date, "PPP", { locale: dateLocale });

  // Building Profile Screen
  if (showBuildingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex flex-col items-center justify-center p-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <motion.div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-terracotta to-burnt-pink flex items-center justify-center" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <Sparkles className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{t('onboarding.building_title')}</h2>
          <p className="text-muted-foreground mb-8">{t('onboarding.building_subtitle', { name: fullName.split(' ')[0] })}</p>
          <div className="space-y-4 text-left max-w-xs mx-auto">
            {buildingSteps.map((step, index) => (
              <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: buildingStep > index ? 1 : buildingStep === index ? 0.7 : 0.3, x: 0 }} transition={{ delay: index * 0.1 }} className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-all", buildingStep > index ? "bg-leaf-green/20" : "bg-muted")}>
                  {buildingStep > index ? <Check className="w-4 h-4 text-leaf-green" /> : <span className="text-lg">{step.icon}</span>}
                </div>
                <span className={cn("text-sm transition-all", buildingStep > index ? "text-foreground" : "text-muted-foreground")}>{step.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  const renderStep = () => {
    if (currentStep === totalSteps - 1) {
      return (
        <motion.div key="pwa-install" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <PWAInstallStep onNext={() => setCurrentStep(totalSteps)} />
        </motion.div>
      );
    }
    if (currentStep === totalSteps) {
      return (
        <motion.div key="premium-trial" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <PremiumTrialStep onSkip={handleComplete} onCompleteBeforeCheckout={saveOnboardingData} />
        </motion.div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-terracotta/20 flex items-center justify-center">
                <Cake className="w-10 h-10 text-primary" />
              </div>
              {fullName && <p className="text-lg text-primary font-medium mb-2">{t('onboarding.hello_name', { name: fullName })}</p>}
              <h2 className="text-2xl font-bold text-foreground mb-2">{t('onboarding.when_started')}</h2>
              <p className="text-muted-foreground">{t('onboarding.metabolic_age')}</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{t('onboarding.year')}</label>
                <select value={birthYear || ''} onChange={(e) => setBirthYear(e.target.value ? Number(e.target.value) : null)} className="w-full h-14 px-4 text-lg rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary">
                  <option value="">{t('onboarding.select_year')}</option>
                  {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{t('onboarding.month')}</label>
                <select value={birthMonth !== null ? birthMonth : ''} onChange={(e) => setBirthMonth(e.target.value !== '' ? Number(e.target.value) : null)} className="w-full h-14 px-4 text-lg rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary" disabled={!birthYear}>
                  <option value="">{t('onboarding.select_month')}</option>
                  {monthKeys.map((key, i) => <option key={i} value={i}>{t(`onboarding.${key}`)}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{t('onboarding.day')}</label>
                <select value={birthDay || ''} onChange={(e) => setBirthDay(e.target.value ? Number(e.target.value) : null)} className="w-full h-14 px-4 text-lg rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary" disabled={birthMonth === null}>
                  <option value="">{t('onboarding.select_day')}</option>
                  {dayOptions.map((day) => <option key={day} value={day}>{day}</option>)}
                </select>
              </div>
              {dateOfBirth && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center p-3 bg-primary/10 rounded-xl">
                  <p className="text-primary font-medium">📅 {formatDateLong(dateOfBirth)}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">{t('onboarding.life_phase_title')}</h2>
              <p className="text-muted-foreground">{t('onboarding.life_phase_subtitle')}</p>
            </div>
            <div className="grid gap-4">
              {lifePhases.map((phase) => (
                <button key={phase.id} onClick={() => setLifePhase(phase.id)} className={cn("flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200", lifePhase === phase.id ? "border-primary bg-primary/10 shadow-lg scale-[1.02]" : "border-border bg-card hover:border-primary/50")}>
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-3xl", lifePhase === phase.id ? "bg-primary/20" : "bg-muted")}>{phase.icon}</div>
                  <div className="flex-1 text-left">
                    <span className="font-semibold text-lg text-foreground block">{t(phase.labelKey)}</span>
                    <span className="text-sm text-muted-foreground">{t(phase.descKey)}</span>
                  </div>
                  {lifePhase === phase.id && <Check className="w-6 h-6 text-primary" />}
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">{t('onboarding.goals_title')}</h2>
              <p className="text-muted-foreground">{t('onboarding.goals_subtitle')}</p>
            </div>
            <div className="grid gap-3">
              {goals.map((goal) => {
                const Icon = goal.icon;
                const isSelected = selectedGoals.includes(goal.id);
                if ((lifePhase === 'pregnant' || lifePhase === 'menopause') && (goal.id === 'get_pregnant' || goal.id === 'pms_relief')) return null;
                return (
                  <button key={goal.id} onClick={() => { setSelectedGoals(prev => prev.includes(goal.id) ? prev.filter(g => g !== goal.id) : [...prev, goal.id]); if (goal.id === 'get_pregnant') setIsTryingToConceive(!selectedGoals.includes(goal.id)); }} className={cn("flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200", isSelected ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card hover:border-primary/50")}>
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", isSelected ? "bg-primary/20" : "bg-muted")}>
                      <Icon className={cn("w-6 h-6", goal.color)} />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-medium text-foreground block">{t(goal.labelKey)}</span>
                      <span className="text-xs text-muted-foreground">{t(goal.tipKey)}</span>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center"><Utensils className="w-8 h-8 text-primary" /></div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{t('onboarding.diet_title')}</h2>
              <p className="text-muted-foreground">{t('onboarding.diet_subtitle')}</p>
            </div>
            <div className="grid gap-3">
              {dietaryOptions.map((diet) => {
                const isSelected = selectedDiet === diet.id;
                return (
                  <button key={diet.id} onClick={() => setSelectedDiet(diet.id)} className={cn("flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200", isSelected ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card hover:border-primary/50")}>
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-2xl", isSelected ? "bg-primary/20" : "bg-muted")}>{diet.icon}</div>
                    <div className="flex-1 text-left">
                      <span className="font-medium text-foreground block">{t(diet.labelKey)}</span>
                      <span className="text-xs text-muted-foreground">{t(diet.descKey)}</span>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center"><Zap className="w-8 h-8 text-primary" /></div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{t('onboarding.activity_title')}</h2>
              <p className="text-muted-foreground">{t(`onboarding.activity_subtitle_${lifePhase || 'menstruating'}`)}</p>
            </div>
            <div className="grid gap-3">
              {activityOptions.map((activity) => {
                const isSelected = selectedActivity === activity.id;
                return (
                  <button key={activity.id} onClick={() => setSelectedActivity(activity.id)} className={cn("flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200", isSelected ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card hover:border-primary/50")}>
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-2xl", isSelected ? "bg-primary/20" : "bg-muted")}>{activity.icon}</div>
                    <div className="flex-1 text-left">
                      <span className="font-medium text-foreground block">{t(activity.labelKey)}</span>
                      <span className="text-xs text-muted-foreground">{t(activity.descKey)}</span>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        );

      case 6:
        if (lifePhase === 'pregnant') {
          return (
            <motion.div key="step6-pregnant" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-terracotta/20 to-burnt-pink/20 flex items-center justify-center text-4xl">🤰</div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{t('onboarding.dum_title')}</h2>
                <p className="text-muted-foreground">{t('onboarding.dum_subtitle_pregnant')}</p>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-center text-left font-normal h-14 text-lg", !pregnancyStartDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-3 h-5 w-5" />
                    {pregnancyStartDate ? formatDateLong(pregnancyStartDate) : t('onboarding.select_dum_date')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto" align="center">
                  <Calendar mode="single" selected={pregnancyStartDate} onSelect={setPregnancyStartDate} disabled={(date) => date > new Date() || date < new Date(Date.now() - 280 * 24 * 60 * 60 * 1000)} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              {pregnancyStartDate && (
                <div className="p-4 bg-terracotta/10 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground">{t('onboarding.approx_weeks')}</p>
                  <p className="text-3xl font-bold text-terracotta">
                    {Math.floor((Date.now() - pregnancyStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000))} {t('onboarding.weeks')}
                  </p>
                </div>
              )}
            </motion.div>
          );
        }
        return (
          <motion.div key="step6-cycle" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">{t('onboarding.cycle_data_title')}</h2>
              <p className="text-muted-foreground">{t('onboarding.dum_subtitle_cycle')}</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">{t('onboarding.dum_title')}</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-12", !lastPeriodDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {lastPeriodDate ? formatDateLong(lastPeriodDate) : t('onboarding.select_date')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 pointer-events-auto" align="center">
                    <Calendar mode="single" selected={lastPeriodDate} onSelect={setLastPeriodDate} disabled={(date) => date > new Date()} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">{t('onboarding.cycle_length_label')}</label>
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => setCycleLength(prev => Math.max(21, prev - 1))}>-</Button>
                  <div className="flex-1 text-center">
                    <span className="text-3xl font-bold text-primary">{cycleLength}</span>
                    <span className="text-muted-foreground ml-2">{t('onboarding.days')}</span>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => setCycleLength(prev => Math.min(45, prev + 1))}>+</Button>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 7:
        return (
          <motion.div key="step7" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-foreground mb-2">{t('onboarding.contraceptive_title')}</h2>
              <p className="text-muted-foreground">{t('onboarding.contraceptive_subtitle')}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {contraceptiveCategories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;
                return (
                  <button key={category.id} onClick={() => handleCategorySelect(category.id)} className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200", isSelected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50")}>
                    <Icon className={cn("w-7 h-7", isSelected ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("text-sm font-medium text-center", isSelected ? "text-primary" : "text-foreground")}>{t(category.labelKey)}</span>
                  </button>
                );
              })}
            </div>
            {selectedCategory && subMethods[selectedCategory]?.length > 1 && (
              <div className="pt-3 border-t border-border">
                <label className="text-sm font-medium text-foreground mb-2 block">{t('onboarding.specify')}</label>
                <div className="flex flex-wrap gap-2">
                  {subMethods[selectedCategory].map((method) => (
                    <button key={method.id} onClick={() => setSelectedMethod(method.id)} className={cn("px-4 py-2 rounded-full text-sm font-medium transition-all", selectedMethod === method.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}>
                      {t(method.labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        );

      case 8:
        return (
          <motion.div key="step8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-foreground mb-2">{t('onboarding.method_details_title')}</h2>
            </div>

            {needsBrand && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">{t('onboarding.brand_label')}</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={brandSearch} onChange={(e) => { setBrandSearch(e.target.value); setContraceptiveDetails(prev => ({ ...prev, brand: e.target.value })); setShowBrandSuggestions(true); }} onFocus={() => setShowBrandSuggestions(true)} placeholder={t('onboarding.brand_placeholder')} className="pl-10" />
                  {showBrandSuggestions && brandSearch && filteredBrands.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-40 overflow-auto">
                      {filteredBrands.slice(0, 5).map((brand) => (
                        <button key={brand.label} onClick={() => selectBrand(brand)} className="w-full px-4 py-2.5 text-left hover:bg-accent flex items-center justify-between">
                          <span className="font-medium">{brand.label}</span>
                          <span className="text-xs text-muted-foreground">{brand.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {needsReminder && (
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{t('onboarding.pill_reminder')}</p>
                    <p className="text-sm text-muted-foreground">{t('onboarding.daily_notification')}</p>
                  </div>
                  <Switch checked={!!contraceptiveDetails.reminderTime} onCheckedChange={(checked) => setContraceptiveDetails(prev => ({ ...prev, reminderTime: checked ? '08:00' : undefined }))} />
                </div>
                {contraceptiveDetails.reminderTime && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">{t('onboarding.remind_at')}</span>
                    <Input type="time" value={contraceptiveDetails.reminderTime} onChange={(e) => setContraceptiveDetails(prev => ({ ...prev, reminderTime: e.target.value }))} className="w-28 ml-auto" />
                  </div>
                )}
              </div>
            )}

            {needsInjectionDetails && (
              <div className="space-y-4 pt-3 border-t border-border">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t('onboarding.last_application_date')}</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-11", !contraceptiveDetails.lastApplicationDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {contraceptiveDetails.lastApplicationDate ? formatDate(new Date(contraceptiveDetails.lastApplicationDate + 'T12:00:00')) : t('onboarding.select_date')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="center">
                      <Calendar mode="single" selected={contraceptiveDetails.lastApplicationDate ? new Date(contraceptiveDetails.lastApplicationDate + 'T12:00:00') : undefined} onSelect={(date) => handleContraceptiveDateSelect(date, 'lastApplicationDate')} disabled={(date) => date > new Date()} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t('onboarding.frequency')}</label>
                  <div className="flex gap-2">
                    <button onClick={() => setContraceptiveDetails(prev => ({ ...prev, frequency: 'monthly' }))} className={cn("flex-1 py-3 rounded-lg text-sm font-medium transition-all", contraceptiveDetails.frequency === 'monthly' ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>{t('onboarding.frequency_monthly')}</button>
                    <button onClick={() => setContraceptiveDetails(prev => ({ ...prev, frequency: 'quarterly' }))} className={cn("flex-1 py-3 rounded-lg text-sm font-medium transition-all", contraceptiveDetails.frequency === 'quarterly' ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>{t('onboarding.frequency_quarterly')}</button>
                  </div>
                </div>
              </div>
            )}

            {needsRingPatchDetails && (
              <div className="space-y-4 pt-3 border-t border-border">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t('onboarding.last_change_date')}</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-11", !contraceptiveDetails.lastApplicationDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {contraceptiveDetails.lastApplicationDate ? formatDate(new Date(contraceptiveDetails.lastApplicationDate + 'T12:00:00')) : t('onboarding.select_date')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="center">
                      <Calendar mode="single" selected={contraceptiveDetails.lastApplicationDate ? new Date(contraceptiveDetails.lastApplicationDate + 'T12:00:00') : undefined} onSelect={(date) => handleContraceptiveDateSelect(date, 'lastApplicationDate')} disabled={(date) => date > new Date()} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t('onboarding.usage_cycle')}</label>
                  <div className="flex gap-2">
                    <button onClick={() => setContraceptiveDetails(prev => ({ ...prev, usageCycle: '21-7' }))} className={cn("flex-1 py-3 rounded-lg text-sm font-medium transition-all", contraceptiveDetails.usageCycle === '21-7' ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>{t('onboarding.usage_21_7')}</button>
                    <button onClick={() => setContraceptiveDetails(prev => ({ ...prev, usageCycle: 'continuous' }))} className={cn("flex-1 py-3 rounded-lg text-sm font-medium transition-all", contraceptiveDetails.usageCycle === 'continuous' ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>{t('onboarding.usage_continuous')}</button>
                  </div>
                </div>
              </div>
            )}

            {needsInsertionDate && (
              <div className="space-y-3 pt-3 border-t border-border">
                <label className="text-sm font-medium text-foreground">{t('onboarding.insertion_date')}</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-11", !contraceptiveDetails.insertionDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {contraceptiveDetails.insertionDate ? formatDate(new Date(contraceptiveDetails.insertionDate + 'T12:00:00')) : t('onboarding.select_date')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 pointer-events-auto" align="center">
                    <Calendar mode="single" selected={contraceptiveDetails.insertionDate ? new Date(contraceptiveDetails.insertionDate + 'T12:00:00') : undefined} onSelect={(date) => handleContraceptiveDateSelect(date, 'insertionDate')} disabled={(date) => date > new Date()} initialFocus className="p-3 pointer-events-auto" />
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
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          {currentStep > 1 ? (
            <Button variant="ghost" size="icon" onClick={handleBack}><ChevronLeft className="w-5 h-5" /></Button>
          ) : (
            <div className="w-10" />
          )}
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {t('onboarding.chapter_of', { current: currentChapter, total: 6 })}
            </p>
            <p className="text-sm font-medium text-foreground">
              {t(chapters[currentChapter - 1]?.titleKey || '')}
            </p>
          </div>
          <div className="w-10" />
        </div>
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-primary to-terracotta rounded-full" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      <div className="flex-1 px-6 py-6 overflow-auto">
        <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
      </div>

      {currentStep !== totalSteps && currentStep !== totalSteps - 1 && (
        <div className="p-6 pt-2">
          <Button onClick={handleNext} disabled={isSubmitting} className="w-full h-14 text-lg phase-gradient text-white">
            {isSubmitting ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {t('actions.continue')}
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Onboarding;