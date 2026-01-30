import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

import { addDays, differenceInDays } from 'date-fns';

export type CyclePhase = 'menstrual' | 'folicular' | 'ovulatoria' | 'lutea';

interface PeriodPrediction {
  nextPeriodDate: Date;
  daysUntil: number;
  predictedEndDate: Date;
}

interface CycleContextType {
  currentPhase: CyclePhase;
  setCurrentPhase: (phase: CyclePhase) => void;
  cycleDay: number;
  setCycleDay: (day: number) => void;
  cycleLength: number;
  setCycleLength: (length: number) => void;
  lastPeriodStart: Date | null;
  setLastPeriodStart: (date: Date | null) => void;
  getPhaseInfo: () => PhaseInfo;
  getPhaseByDay: (day: number) => CyclePhase;
  getPeriodPrediction: () => PeriodPrediction | null;
  getPredictedPeriodDates: (monthsAhead?: number) => Date[];
  isLoading: boolean;
  refreshCycleData: () => Promise<void>;
  // New state flags for late/awaiting logic
  hasDUM: boolean;
  isLate: boolean;
  daysLate: number;
}

interface PhaseInfo {
  name: string;
  nameEn: string;
  description: string;
  insight: string;
  energyLevel: 'baixa' | 'crescente' | 'alta' | 'decrescente';
  icon: string;
  color: string;
  days: string;
}

const phaseData: Record<CyclePhase, PhaseInfo> = {
  menstrual: {
    name: 'Menstrual',
    nameEn: 'menstrual',
    description: 'Fase de renovação e introspecção',
    insight: 'Seu corpo está se renovando. Pegue leve e honre seu descanso.',
    energyLevel: 'baixa',
    icon: '🌙',
    color: 'menstrual',
    days: 'Dias 1-5',
  },
  folicular: {
    name: 'Folicular',
    nameEn: 'folicular',
    description: 'Fase de energia crescente e criatividade',
    insight: 'Sua energia está subindo! Ótimo momento para novos projetos.',
    energyLevel: 'crescente',
    icon: '🌱',
    color: 'folicular',
    days: 'Dias 6-13',
  },
  ovulatoria: {
    name: 'Ovulatória',
    nameEn: 'ovulatoria',
    description: 'Pico de energia e comunicação',
    insight: 'Você está no seu auge! Aproveite para socializar e brilhar.',
    energyLevel: 'alta',
    icon: '☀️',
    color: 'ovulatoria',
    days: 'Dias 14-17',
  },
  lutea: {
    name: 'Lútea',
    nameEn: 'lutea',
    description: 'Fase de organização e conclusão',
    insight: 'Hora de finalizar tarefas. Cuide-se e prepare-se para desacelerar.',
    energyLevel: 'decrescente',
    icon: '🍂',
    color: 'lutea',
    days: 'Dias 18-28',
  },
};

const CycleContext = createContext<CycleContextType | undefined>(undefined);

export const CycleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentPhase, setCurrentPhase] = useState<CyclePhase>('folicular');
  const [cycleDay, setCycleDay] = useState(10);
  const [cycleLength, setCycleLength] = useState(28);
  const [lastPeriodStart, setLastPeriodStart] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate phase based on cycle day
  const getPhaseByDay = (day: number): CyclePhase => {
    if (day <= 5) return 'menstrual';
    if (day <= 13) return 'folicular';
    if (day <= 17) return 'ovulatoria';
    return 'lutea';
  };

  // Calculate cycle day from last period start date
  // REMOVED modulo operator - now counts actual days since last period
  // This allows the app to show "late" status when cycleDay > cycleLength
  const calculateCycleDay = useCallback((lastPeriod: Date | null, length: number): number => {
    if (!lastPeriod) return 0; // 0 indicates no DUM

    const today = new Date();
    const diffTime = today.getTime() - lastPeriod.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // Return actual days since last period (no modulo, no cap)
    // This allows cycleDay to exceed cycleLength, indicating late period
    return Math.max(1, diffDays);
  }, []);

  // Fetch cycle data from profile
  const refreshCycleData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('last_period_start, cycle_length')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching cycle data:', error);
        setIsLoading(false);
        return;
      }

      if (profile) {
        const newCycleLength = profile.cycle_length || 28;
        setCycleLength(newCycleLength);

        if (profile.last_period_start) {
          const periodDate = new Date(profile.last_period_start);
          setLastPeriodStart(periodDate);
          
          const calculatedDay = calculateCycleDay(periodDate, newCycleLength);
          setCycleDay(calculatedDay);
          
          const calculatedPhase = getPhaseByDay(calculatedDay);
          setCurrentPhase(calculatedPhase);
        }
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, calculateCycleDay]);

  // Fetch data on mount and when user changes
  useEffect(() => {
    refreshCycleData();
  }, [refreshCycleData]);

  // Listen for DUM sync events from manual menstruation logs
  useEffect(() => {
    const handleDUMSync = (event: CustomEvent<{ date: string }>) => {
      console.log('[CycleContext] DUM synced from manual log:', event.detail.date);
      refreshCycleData();
    };
    
    window.addEventListener('dum-synced', handleDUMSync as EventListener);
    return () => {
      window.removeEventListener('dum-synced', handleDUMSync as EventListener);
    };
  }, [refreshCycleData]);

  // Subscribe to profile changes for real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('cycle-profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData.last_period_start || newData.cycle_length) {
            refreshCycleData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshCycleData]);

  // Update phase when cycle day changes
  useEffect(() => {
    const phase = getPhaseByDay(cycleDay);
    setCurrentPhase(phase);
  }, [cycleDay]);

  // Apply phase class to document
  useEffect(() => {
    const root = document.documentElement;
    // Remove all phase classes
    root.classList.remove('phase-menstrual', 'phase-folicular', 'phase-ovulatoria', 'phase-lutea');
    // Add current phase class
    root.classList.add(`phase-${currentPhase}`);
  }, [currentPhase]);

  const getPhaseInfo = (): PhaseInfo => {
    return phaseData[currentPhase];
  };

  // Calculate next period prediction
  const getPeriodPrediction = useCallback((): PeriodPrediction | null => {
    if (!lastPeriodStart) return null;
    
    const today = new Date();
    const daysSinceLastPeriod = differenceInDays(today, lastPeriodStart);
    const cyclesPassed = Math.floor(daysSinceLastPeriod / cycleLength);
    
    const nextPeriodDate = addDays(lastPeriodStart, (cyclesPassed + 1) * cycleLength);
    const daysUntil = differenceInDays(nextPeriodDate, today);
    const predictedEndDate = addDays(nextPeriodDate, 4); // Assume 5 days period
    
    return { nextPeriodDate, daysUntil, predictedEndDate };
  }, [lastPeriodStart, cycleLength]);

  // Get predicted period dates for calendar marking (returns start dates of predicted periods)
  const getPredictedPeriodDates = useCallback((monthsAhead: number = 3): Date[] => {
    if (!lastPeriodStart) return [];
    
    const dates: Date[] = [];
    const today = new Date();
    const endDate = addDays(today, monthsAhead * 30);
    
    const daysSinceLastPeriod = differenceInDays(today, lastPeriodStart);
    const cyclesPassed = Math.floor(daysSinceLastPeriod / cycleLength);
    
    // Get next few predicted periods
    for (let i = 0; i <= Math.ceil(monthsAhead * 30 / cycleLength) + 1; i++) {
      const periodDate = addDays(lastPeriodStart, (cyclesPassed + i) * cycleLength);
      if (periodDate >= today && periodDate <= endDate) {
        // Add all days of predicted period (5 days)
        for (let day = 0; day < 5; day++) {
          dates.push(addDays(periodDate, day));
        }
      }
    }
    
    return dates;
  }, [lastPeriodStart, cycleLength]);

  // Computed state flags for late/awaiting logic
  const hasDUM = !!lastPeriodStart;
  const isLate = hasDUM && cycleDay > cycleLength;
  const daysLate = isLate ? cycleDay - cycleLength : 0;

  return (
    <CycleContext.Provider
      value={{
        currentPhase,
        setCurrentPhase,
        cycleDay,
        setCycleDay,
        cycleLength,
        setCycleLength,
        lastPeriodStart,
        setLastPeriodStart,
        getPhaseInfo,
        getPhaseByDay,
        getPeriodPrediction,
        getPredictedPeriodDates,
        isLoading,
        refreshCycleData,
        hasDUM,
        isLate,
        daysLate,
      }}
    >
      {children}
    </CycleContext.Provider>
  );
};

export const useCycle = (): CycleContextType => {
  const context = useContext(CycleContext);
  if (context === undefined) {
    throw new Error('useCycle must be used within a CycleProvider');
  }
  return context;
};

export { phaseData };
