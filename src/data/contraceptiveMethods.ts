export interface ContraceptiveMethod {
  id: string;
  label: string;
  icon: string;
  requiresBrand: boolean;
  requiresReminder: boolean;
  hasExpiration: boolean;
  expirationYears?: number;
  description: string;
}

export const contraceptiveMethods: ContraceptiveMethod[] = [
  { 
    id: 'pill_combined', 
    label: 'Pílula Combinada', 
    icon: '💊', 
    requiresBrand: true, 
    requiresReminder: true, 
    hasExpiration: false,
    description: 'Contém estrogênio + progesterona'
  },
  { 
    id: 'pill_mini', 
    label: 'Minipílula', 
    icon: '💊', 
    requiresBrand: true, 
    requiresReminder: true, 
    hasExpiration: false,
    description: 'Apenas progesterona'
  },
  { 
    id: 'iud_hormonal', 
    label: 'DIU Hormonal', 
    icon: '🧬', 
    requiresBrand: true, 
    requiresReminder: false, 
    hasExpiration: true,
    expirationYears: 5,
    description: 'Mirena, Kyleena - Válido por 5 anos'
  },
  { 
    id: 'iud_copper', 
    label: 'DIU de Cobre', 
    icon: '🧬', 
    requiresBrand: false, 
    requiresReminder: false, 
    hasExpiration: true,
    expirationYears: 10,
    description: 'Sem hormônios - Válido por 10 anos'
  },
  { 
    id: 'implant', 
    label: 'Implante', 
    icon: '🩹', 
    requiresBrand: true, 
    requiresReminder: false, 
    hasExpiration: true,
    expirationYears: 3,
    description: 'Implanon - Válido por 3 anos'
  },
  { 
    id: 'injection', 
    label: 'Injeção', 
    icon: '💉', 
    requiresBrand: true, 
    requiresReminder: false, 
    hasExpiration: false,
    description: 'Mensal ou trimestral'
  },
  { 
    id: 'ring', 
    label: 'Anel Vaginal', 
    icon: '💍', 
    requiresBrand: true, 
    requiresReminder: false, 
    hasExpiration: false,
    description: 'NuvaRing - Troca mensal'
  },
  { 
    id: 'patch', 
    label: 'Adesivo', 
    icon: '🩹', 
    requiresBrand: true, 
    requiresReminder: false, 
    hasExpiration: false,
    description: 'Troca semanal'
  },
  { 
    id: 'natural', 
    label: 'Natural/Camisinha', 
    icon: '🛡️', 
    requiresBrand: false, 
    requiresReminder: false, 
    hasExpiration: false,
    description: 'Sem hormônios'
  },
  { 
    id: 'none', 
    label: 'Nenhum', 
    icon: '❌', 
    requiresBrand: false, 
    requiresReminder: false, 
    hasExpiration: false,
    description: 'Sem método contraceptivo'
  },
];

export const getMethodById = (id: string): ContraceptiveMethod | undefined => {
  return contraceptiveMethods.find(m => m.id === id);
};

export const isPillMethod = (type: string | null): boolean => {
  return type === 'pill_combined' || type === 'pill_mini';
};

export const isHormonalMethod = (type: string | null): boolean => {
  if (!type) return false;
  return !['natural', 'none', 'iud_copper'].includes(type);
};

export const hasExpirationDate = (type: string | null): boolean => {
  const method = type ? getMethodById(type) : null;
  return method?.hasExpiration ?? false;
};

export const calculateExpirationDate = (
  type: string | null, 
  startDate: Date | null
): Date | null => {
  if (!type || !startDate) return null;
  const method = getMethodById(type);
  if (!method?.hasExpiration || !method.expirationYears) return null;
  
  const expiration = new Date(startDate);
  expiration.setFullYear(expiration.getFullYear() + method.expirationYears);
  return expiration;
};

export const formatTimeRemaining = (expirationDate: Date): string => {
  const now = new Date();
  const diffMs = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Vencido!';
  if (diffDays < 30) return `${diffDays} dias restantes`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses restantes`;
  
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  return months > 0 ? `${years} anos e ${months} meses` : `${years} anos`;
};
