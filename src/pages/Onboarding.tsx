import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Target, 
  Dumbbell, 
  Heart, 
  Baby, 
  Activity,
  Pill,
  Shield,
  CircleDot,
  Syringe,
  Ban,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// Goal options
const goals = [
  { id: 'lose_weight', label: 'Perder Peso', icon: Target, color: 'text-orange-500' },
  { id: 'gain_muscle', label: 'Ganhar Massa', icon: Dumbbell, color: 'text-blue-500' },
  { id: 'pms_relief', label: 'Alívio de TPM', icon: Heart, color: 'text-pink-500' },
  { id: 'get_pregnant', label: 'Engravidar', icon: Baby, color: 'text-purple-500' },
  { id: 'health_monitor', label: 'Monitorar Saúde', icon: Activity, color: 'text-green-500' },
];

// Contraceptive methods
const contraceptiveMethods = [
  { id: 'pill', label: 'Pílula', icon: Pill, needsBrand: true, needsReminder: true },
  { id: 'iud', label: 'DIU/SIU', icon: CircleDot, needsBrand: true, needsReminder: false },
  { id: 'implant', label: 'Implante', icon: Syringe, needsBrand: true, needsReminder: false },
  { id: 'condom', label: 'Camisinha', icon: Shield, needsBrand: false, needsReminder: false },
  { id: 'none', label: 'Nenhum', icon: Ban, needsBrand: false, needsReminder: false },
];

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
];

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step 1: Goals
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  
  // Step 2: Cycle data
  const [lastPeriodDate, setLastPeriodDate] = useState<Date | undefined>(undefined);
  const [cycleLength, setCycleLength] = useState<number>(28);
  
  // Step 3: Contraceptive
  const [contraceptiveMethod, setContraceptiveMethod] = useState<string | null>(null);
  const [contraceptiveBrand, setContraceptiveBrand] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');

  const totalSteps = 3;
  const selectedMethod = contraceptiveMethods.find(m => m.id === contraceptiveMethod);
  
  // Filter brands based on search
  const filteredBrands = contraceptiveBrands.filter(brand =>
    brand.label.toLowerCase().includes(brandSearch.toLowerCase()) ||
    brand.type.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const handleNext = () => {
    if (currentStep === 1 && !selectedGoal) {
      toast({ title: 'Selecione um objetivo', variant: 'destructive' });
      return;
    }
    if (currentStep === 2 && !lastPeriodDate) {
      toast({ title: 'Informe a data da última menstruação', variant: 'destructive' });
      return;
    }
    if (currentStep === 3 && !contraceptiveMethod) {
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
          contraceptive_type: contraceptiveMethod,
          contraceptive_brand: contraceptiveBrand || null,
          pill_reminder_time: enableReminder ? reminderTime : null,
          onboarding_completed: true,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: '🎉 Bem-vinda!',
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
    setContraceptiveBrand(brand.label);
    setBrandSearch(brand.label);
    setShowBrandSuggestions(false);
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
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Método Contraceptivo</h2>
              <p className="text-muted-foreground">Para um acompanhamento personalizado</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {contraceptiveMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = contraceptiveMethod === method.id;
                
                return (
                  <button
                    key={method.id}
                    onClick={() => {
                      setContraceptiveMethod(method.id);
                      if (!method.needsBrand) {
                        setContraceptiveBrand('');
                        setBrandSearch('');
                      }
                      if (!method.needsReminder) {
                        setEnableReminder(false);
                      }
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <Icon className={cn(
                      "w-8 h-8",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {method.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Brand Search */}
            {selectedMethod?.needsBrand && (
              <div className="space-y-3 pt-4">
                <label className="text-sm font-medium text-foreground">
                  Nome/Marca do medicamento
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={brandSearch}
                    onChange={(e) => {
                      setBrandSearch(e.target.value);
                      setShowBrandSuggestions(true);
                    }}
                    onFocus={() => setShowBrandSuggestions(true)}
                    placeholder="Ex: Yasmin, Mirena, Cerazette..."
                    className="pl-10"
                  />
                  
                  {showBrandSuggestions && brandSearch && filteredBrands.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-auto">
                      {filteredBrands.map((brand) => (
                        <button
                          key={brand.label}
                          onClick={() => selectBrand(brand)}
                          className="w-full px-4 py-3 text-left hover:bg-accent flex items-center justify-between"
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

            {/* Reminder Toggle */}
            {selectedMethod?.needsReminder && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Lembrar de tomar?</p>
                    <p className="text-sm text-muted-foreground">Notificação diária</p>
                  </div>
                  <Switch
                    checked={enableReminder}
                    onCheckedChange={setEnableReminder}
                  />
                </div>
                
                {enableReminder && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Lembrar às</span>
                    <Input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-28 ml-auto"
                    />
                  </div>
                )}
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
            className="flex-1"
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
