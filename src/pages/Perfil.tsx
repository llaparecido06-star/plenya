import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useCycle } from '@/contexts/CycleContext';
import AuthForm from '@/components/auth/AuthForm';
import { Button } from '@/components/ui/button';
import { LogOut, Calendar } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import PatternsCard from '@/components/history/PatternsCard';

const Perfil: React.FC = () => {
  const { user, signOut } = useAuth();
  const { cycleDay, setCycleDay, cycleLength } = useCycle();

  if (!user) {
    return (
      <PageLayout>
        <div className="hero-gradient pt-12 pb-6 px-4">
          <motion.h1
            className="text-2xl font-bold text-foreground mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Perfil
          </motion.h1>
        </div>
        <div className="px-4 mt-8">
          <AuthForm />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="hero-gradient pt-12 pb-6 px-4">
        <motion.h1
          className="text-2xl font-bold text-foreground mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Perfil
        </motion.h1>
      </div>

      <div className="px-4 space-y-4">
        <motion.div
          className="glass-card p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full phase-gradient flex items-center justify-center">
              <span className="text-2xl text-white font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{user.email}</h3>
              <p className="text-sm text-muted-foreground">Membro Ciclos</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="glass-card p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Ajustar Dia do Ciclo</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Dia atual: <span className="font-bold text-primary">{cycleDay}</span> de {cycleLength}
          </p>
          <Slider
            value={[cycleDay]}
            onValueChange={([v]) => setCycleDay(v)}
            min={1}
            max={cycleLength}
            step={1}
          />
        </motion.div>

        {/* Patterns Card - Cycle Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <PatternsCard />
        </motion.div>

        <Button
          onClick={signOut}
          variant="outline"
          className="w-full mt-6"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </PageLayout>
  );
};

export default Perfil;
