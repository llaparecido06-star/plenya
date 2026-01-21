import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ChevronRight, ChevronLeft, Sparkles, Moon, Sun, Flame, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const goals = [
  { id: 'weight_loss', label: 'Perder Peso', icon: '🔥', description: 'Queimar gordura e emagrecer' },
  { id: 'muscle_gain', label: 'Ganhar Massa', icon: '💪', description: 'Aumentar músculos e força' },
  { id: 'pms_relief', label: 'Alívio de TPM', icon: '🌸', description: 'Reduzir sintomas do ciclo' },
  { id: 'energy', label: 'Mais Energia', icon: '⚡', description: 'Aumentar disposição diária' },
];

const dietTypes = [
  { id: 'omnivore', label: 'Onívora', icon: '🍖' },
  { id: 'vegetarian', label: 'Vegetariana', icon: '🥗' },
  { id: 'vegan', label: 'Vegana', icon: '🌱' },
  { id: 'low_carb', label: 'Low Carb', icon: '🥑' },
];

const fitnessLevels = [
  { id: 'beginner', label: 'Iniciante', description: 'Pouca ou nenhuma experiência' },
  { id: 'intermediate', label: 'Intermediário', description: 'Treino regular há alguns meses' },
  { id: 'advanced', label: 'Avançado', description: 'Treino consistente há anos' },
];

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();

  // Auth state
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Wizard state
  const [wizardStep, setWizardStep] = useState(0);
  const [lastPeriodStart, setLastPeriodStart] = useState<Date | undefined>();
  const [cycleLength, setCycleLength] = useState('28');
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedDiet, setSelectedDiet] = useState<string | null>(null);
  const [selectedFitness, setSelectedFitness] = useState<string | null>(null);

  // Redirect if logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      toast({
        title: 'Bem-vinda de volta! 💜',
        description: 'Login realizado com sucesso.',
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Erro no login',
        description: error.message || 'Verifique suas credenciais.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignupStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) return;
    setWizardStep(1);
  };

  const handleWizardNext = () => {
    if (wizardStep < 3) {
      setWizardStep(wizardStep + 1);
    }
  };

  const handleWizardBack = () => {
    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1);
    } else {
      setWizardStep(0);
    }
  };

  const handleCompleteSignup = async () => {
    setLoading(true);

    try {
      const { error } = await signUp(email, password, fullName);
      if (error) throw error;

      // Wait a moment for the user to be created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update profile with onboarding data
      const { data: { user: newUser } } = await supabase.auth.getUser();
      
      if (newUser) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            last_period_start: lastPeriodStart ? lastPeriodStart.toISOString().split('T')[0] : null,
            cycle_length: parseInt(cycleLength) || 28,
            goal: selectedGoal,
            diet_type: selectedDiet,
            fitness_level: selectedFitness,
          })
          .eq('user_id', newUser.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }
      }

      toast({
        title: `Bem-vinda, ${fullName}! 🎉`,
        description: 'Sua jornada de autoconhecimento começa agora.',
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Erro ao criar conta',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderWizardStep = () => {
    switch (wizardStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full phase-gradient flex items-center justify-center">
                <Moon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Seu Ciclo</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Quando foi sua última menstruação?
              </p>
            </div>

            <div className="space-y-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left h-12">
                    {lastPeriodStart
                      ? format(lastPeriodStart, "dd 'de' MMMM, yyyy", { locale: ptBR })
                      : 'Selecionar data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={lastPeriodStart}
                    onSelect={setLastPeriodStart}
                    disabled={(date) => date > new Date()}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Duração média do ciclo (dias)
                </label>
                <Input
                  type="number"
                  min="21"
                  max="35"
                  value={cycleLength}
                  onChange={(e) => setCycleLength(e.target.value)}
                  className="h-12"
                />
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full phase-gradient flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Seu Objetivo</h2>
              <p className="text-sm text-muted-foreground mt-1">
                O que você quer alcançar?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => setSelectedGoal(goal.id)}
                  className={`p-4 rounded-2xl text-left transition-all ${
                    selectedGoal === goal.id
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-secondary/50 border-2 border-transparent hover:bg-secondary'
                  }`}
                >
                  <span className="text-2xl">{goal.icon}</span>
                  <p className="font-medium text-foreground mt-2">{goal.label}</p>
                  <p className="text-xs text-muted-foreground">{goal.description}</p>
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full phase-gradient flex items-center justify-center">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Personalização</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Conte-nos mais sobre você
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Tipo de Dieta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {dietTypes.map((diet) => (
                    <button
                      key={diet.id}
                      onClick={() => setSelectedDiet(diet.id)}
                      className={`p-3 rounded-xl flex items-center gap-2 transition-all ${
                        selectedDiet === diet.id
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-secondary/50 border-2 border-transparent hover:bg-secondary'
                      }`}
                    >
                      <span>{diet.icon}</span>
                      <span className="font-medium text-sm">{diet.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Nível de Condicionamento
                </label>
                <div className="space-y-2">
                  {fitnessLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setSelectedFitness(level.id)}
                      className={`w-full p-3 rounded-xl text-left transition-all ${
                        selectedFitness === level.id
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-secondary/50 border-2 border-transparent hover:bg-secondary'
                      }`}
                    >
                      <p className="font-medium text-foreground">{level.label}</p>
                      <p className="text-xs text-muted-foreground">{level.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // Wizard navigation
  if (wizardStep > 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Progress bar */}
        <div className="h-1 bg-secondary">
          <motion.div
            className="h-full phase-gradient"
            initial={{ width: 0 }}
            animate={{ width: `${(wizardStep / 3) * 100}%` }}
          />
        </div>

        <div className="flex-1 flex flex-col p-6">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleWizardBack}
            className="self-start mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>

          {/* Wizard content */}
          <div className="flex-1 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {renderWizardStep()}
            </AnimatePresence>
          </div>

          {/* Navigation buttons */}
          <div className="mt-6">
            {wizardStep < 3 ? (
              <Button
                onClick={handleWizardNext}
                className="w-full h-14 text-lg font-semibold phase-gradient text-white"
                disabled={
                  (wizardStep === 1 && !lastPeriodStart) ||
                  (wizardStep === 2 && !selectedGoal)
                }
              >
                Continuar
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCompleteSignup}
                className="w-full h-14 text-lg font-semibold phase-gradient text-white"
                disabled={loading}
              >
                {loading ? 'Criando sua conta...' : 'Começar minha jornada ✨'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Login/Signup form
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            className="w-20 h-20 mx-auto mb-4 rounded-full phase-gradient flex items-center justify-center shadow-glow"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Moon className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground">Ciclos</h1>
          <p className="text-muted-foreground mt-1">Biohacking Feminino</p>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 bg-secondary/50 rounded-full p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
              isLogin ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
              !isLogin ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
            }`}
          >
            Criar Conta
          </button>
        </div>

        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold phase-gradient text-white"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </motion.form>
          ) : (
            <motion.form
              key="signup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSignupStep1}
              className="space-y-4"
            >
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold phase-gradient text-white"
              >
                Continuar
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Auth;
