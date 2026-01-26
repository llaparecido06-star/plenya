import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Pill,
  Syringe,
  CircleDot,
  Ban,
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
  Activity
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

// Goal options
const goals = [
  { id: 'lose_weight', label: 'Perder Peso', icon: Target, color: 'text-terracotta' },
  { id: 'gain_muscle', label: 'Ganhar Massa', icon: Dumbbell, color: 'text-leaf-green' },
  { id: 'pms_relief', label: 'Alívio de TPM', icon: Heart, color: 'text-burnt-pink' },
  { id: 'get_pregnant', label: 'Engravidar', icon: Baby, color: 'text-terracotta' },
  { id: 'health_monitor', label: 'Monitorar Saúde', icon: Activity, color: 'text-leaf-green' },
];

// Contraceptive categories with methods
const contraceptiveCategories = [
  {
    id: 'hormonal_daily',
    label: 'Hormonal Diário',
    icon: Pill,
    description: 'Pílula anticoncepcional',
    methods: ['pill'],
  },
  {
    id: 'injection_patch_ring',
    label: 'Injeção/Adesivo/Anel',
    icon: Syringe,
    description: 'Aplicação periódica',
    methods: ['injection', 'patch', 'ring'],
  },
  {
    id: 'long_duration',
    label: 'Longa Duração',
    icon: CircleDot,
    description: 'DIU ou Implante',
    methods: ['iud', 'implant'],
  },
  {
    id: 'natural_none',
    label: 'Natural/Nenhum',
    icon: Leaf,
    description: 'Sem hormônios',
    methods: ['condom', 'natural', 'none'],
  },
];

// Sub-methods for detailed selection
const subMethods = {
  hormonal_daily: [
    { id: 'pill', label: 'Pílula' },
  ],
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

// Contraceptive brands for autocomplete
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

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { refreshCycleData } = useCycle();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step 1: Goals
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  
  // Step 2: Cycle data
  const [lastPeriodDate, setLastPeriodDate] = useState<Date | undefined>(undefined);
  const [cycleLength, setCycleLength] = useState<number>(28);
  
  // Step 3: Contraceptive
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [contraceptiveDetails, setContraceptiveDetails] = useState<ContraceptiveDetails>({});
  const [brandSearch, setBrandSearch] = useState('');
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);

  const totalSteps = 3;
  
  // Filter brands based on search
  const filteredBrands = contraceptiveBrands.filter(brand =>
    brand.label.toLowerCase().includes(brandSearch.toLowerCase()) ||
    brand.type.toLowerCase().includes(brandSearch.toLowerCase())
  );

  // Check if method needs specific inputs
  const needsBrand = ['pill', 'injection', 'iud', 'implant'].includes(selectedMethod || '');
  const needsReminder = selectedMethod === 'pill';
  const needsInjectionDetails = selectedMethod === 'injection';
  const needsRingPatchDetails = ['ring', 'patch'].includes(selectedMethod || '');
  const needsInsertionDate = ['iud', 'implant'].includes(selectedMethod || '');

  const handleNext = () => {
    if (currentStep === 1 && !selectedGoal) {
      toast({ title: 'Selecione um objetivo', variant: 'destructive' });
      return;
    }
    if (currentStep === 2 && !lastPeriodDate) {
      toast({ title: 'Informe a data da última menstruação', variant: 'destructive' });
      return;
    }
    if (currentStep === 3 && !selectedMethod) {
      toast({ title: 'Selecione um método contraceptivo', variant: 'destructive' });
      return;
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
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
      const { error } = await supabase
        .from('profiles')
        .update({
          goal: selectedGoal,
          last_period_start: lastPeriodDate ? format(lastPeriodDate, 'yyyy-MM-dd') : null,
          cycle_length: cycleLength,
          contraceptive_type: selectedMethod,
          contraceptive_brand: contraceptiveDetails.brand || null,
          pill_reminder_time: contraceptiveDetails.reminderTime || null,
          contraceptive_details: contraceptiveDetails as any,
          onboarding_completed: true,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh cycle data immediately to sync the Today tab
      await refreshCycleData();

      toast({
        title: '🌿 Bem-vinda ao Plenya!',
        description: 'Seu perfil foi configurado com sucesso.',
      });

      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
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
    setSelectedMethod(null);
    setContraceptiveDetails({});
    setBrandSearch('');
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setContraceptiveDetails({});
    setBrandSearch('');
  };

  const renderStep = () => {
    switch (currentStep) {
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
              <h2 className="text-2xl font-bold text-foreground mb-2">Qual seu objetivo?</h2>
              <p className="text-muted-foreground">Vamos personalizar sua experiência</p>
            </div>
            
            <div className="grid gap-3">
              {goals.map((goal) => {
                const Icon = goal.icon;
                const isSelected = selectedGoal === goal.id;
                
                return (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      isSelected ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Icon className={cn("w-6 h-6", goal.color)} />
                    </div>
                    <span className="font-medium text-foreground">{goal.label}</span>
                    {isSelected && (
                      <Check className="w-5 h-5 text-primary ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        );

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
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={lastPeriodDate}
                      onSelect={setLastPeriodDate}
                      disabled={(date) => date > new Date()}
                      initialFocus
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
                <p className="text-xs text-muted-foreground text-center">
                  Geralmente varia entre 21 e 35 dias
                </p>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-foreground mb-2">Método Contraceptivo</h2>
              <p className="text-muted-foreground">Para um acompanhamento personalizado</p>
            </div>
            
            {/* Category Selection */}
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
                      onClick={() => handleMethodSelect(method.id)}
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

            {/* Auto-select single methods */}
            {selectedCategory && subMethods[selectedCategory as keyof typeof subMethods]?.length === 1 && !selectedMethod && (
              (() => {
                const singleMethod = subMethods[selectedCategory as keyof typeof subMethods][0];
                handleMethodSelect(singleMethod.id);
                return null;
              })()
            )}

            {/* Brand Search */}
            {selectedMethod && needsBrand && (
              <div className="space-y-3 pt-3 border-t border-border">
                <label className="text-sm font-medium text-foreground">
                  Nome/Marca do medicamento
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
                    placeholder="Ex: Yasmin, Mirena, Depo-Provera..."
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
            {selectedMethod && needsReminder && (
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
            {selectedMethod && needsInjectionDetails && (
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
                          ? format(new Date(contraceptiveDetails.lastApplicationDate), "dd/MM/yyyy")
                          : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar
                        mode="single"
                        selected={contraceptiveDetails.lastApplicationDate 
                          ? new Date(contraceptiveDetails.lastApplicationDate) 
                          : undefined}
                        onSelect={(date) => setContraceptiveDetails(prev => ({ 
                          ...prev, 
                          lastApplicationDate: date ? format(date, 'yyyy-MM-dd') : undefined 
                        }))}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Frequência
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setContraceptiveDetails(prev => ({ 
                        ...prev, 
                        frequency: 'monthly' 
                      }))}
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
                      onClick={() => setContraceptiveDetails(prev => ({ 
                        ...prev, 
                        frequency: 'quarterly' 
                      }))}
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
            {selectedMethod && needsRingPatchDetails && (
              <div className="space-y-4 pt-3 border-t border-border">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Dia da última troca/colocação
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
                          ? format(new Date(contraceptiveDetails.lastApplicationDate), "dd/MM/yyyy")
                          : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar
                        mode="single"
                        selected={contraceptiveDetails.lastApplicationDate 
                          ? new Date(contraceptiveDetails.lastApplicationDate) 
                          : undefined}
                        onSelect={(date) => setContraceptiveDetails(prev => ({ 
                          ...prev, 
                          lastApplicationDate: date ? format(date, 'yyyy-MM-dd') : undefined 
                        }))}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Ciclo de uso
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setContraceptiveDetails(prev => ({ 
                        ...prev, 
                        usageCycle: '21-7' 
                      }))}
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
                      onClick={() => setContraceptiveDetails(prev => ({ 
                        ...prev, 
                        usageCycle: 'continuous' 
                      }))}
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

            {/* DIU/Implant Insertion Date */}
            {selectedMethod && needsInsertionDate && (
              <div className="space-y-3 pt-3 border-t border-border">
                <label className="text-sm font-medium text-foreground">
                  Data de Inserção
                </label>
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
                        ? format(new Date(contraceptiveDetails.insertionDate), "dd/MM/yyyy")
                        : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={contraceptiveDetails.insertionDate 
                        ? new Date(contraceptiveDetails.insertionDate) 
                        : undefined}
                      onSelect={(date) => setContraceptiveDetails(prev => ({ 
                        ...prev, 
                        insertionDate: date ? format(date, 'yyyy-MM-dd') : undefined 
                      }))}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  {selectedMethod === 'iud' 
                    ? 'Usado para calcular a validade (5-10 anos dependendo do tipo)'
                    : 'Usado para calcular a validade (3 anos)'}
                </p>
              </div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Progress Bar */}
      <div className="p-4 pt-8">
        <div className="flex gap-2 mb-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                i < currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Passo {currentStep} de {totalSteps}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4 overflow-auto">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="p-6 border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="flex gap-3">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1"
              disabled={isSubmitting}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          )}
          <Button
            onClick={handleNext}
            className="flex-1 phase-gradient text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : currentStep === totalSteps ? (
              <>
                Começar
                <Check className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
