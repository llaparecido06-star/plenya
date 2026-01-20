import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CyclePhase = 'menstrual' | 'folicular' | 'ovulatoria' | 'lutea';

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
  const [currentPhase, setCurrentPhase] = useState<CyclePhase>('folicular');
  const [cycleDay, setCycleDay] = useState(10);
  const [cycleLength, setCycleLength] = useState(28);
  const [lastPeriodStart, setLastPeriodStart] = useState<Date | null>(null);

  // Calculate phase based on cycle day
  const getPhaseByDay = (day: number): CyclePhase => {
    if (day <= 5) return 'menstrual';
    if (day <= 13) return 'folicular';
    if (day <= 17) return 'ovulatoria';
    return 'lutea';
  };

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
