import { useMemo } from 'react';
import { differenceInDays, addDays, parseISO, isValid } from 'date-fns';
import { useContraceptive } from './useContraceptive';

interface ContraceptiveDetails {
  brand?: string;
  reminderTime?: string;
  lastApplicationDate?: string;
  frequency?: 'monthly' | 'quarterly';
  insertionDate?: string;
  changeDay?: number;
  usageCycle?: string;
}

export interface HomeStatus {
  type: 'pill' | 'injection' | 'ring_patch' | 'long_duration' | 'natural';
  brand?: string;
  // For pill
  reminderTime?: string;
  // For injection/ring/patch
  nextDate?: Date;
  daysUntilNext?: number;
  isUrgent?: boolean; // 2 days or less
  label?: string; // "Injeção", "Troca do Anel", etc.
  // For DIU/Implant
  expirationDate?: Date;
  yearsRemaining?: number;
}

export const useHomeStatus = (): HomeStatus | null => {
  const { contraceptive_type, contraceptive_brand, contraceptive_details } = useContraceptive();

  return useMemo(() => {
    if (!contraceptive_type) return null;

    const details = (contraceptive_details || {}) as ContraceptiveDetails;

    // PILL - Show checkbox
    if (contraceptive_type === 'pill') {
      return {
        type: 'pill',
        brand: contraceptive_brand || details.brand,
        reminderTime: details.reminderTime,
      };
    }

    // INJECTION - Show countdown
    if (contraceptive_type === 'injection') {
      if (details.lastApplicationDate && details.frequency) {
        const lastDate = parseISO(details.lastApplicationDate);
        if (isValid(lastDate)) {
          const daysToAdd = details.frequency === 'monthly' ? 30 : 90;
          const nextDate = addDays(lastDate, daysToAdd);
          const today = new Date();
          const daysUntil = differenceInDays(nextDate, today);

          return {
            type: 'injection',
            brand: contraceptive_brand || details.brand,
            nextDate,
            daysUntilNext: Math.max(0, daysUntil),
            isUrgent: daysUntil <= 2,
            label: 'Injeção',
          };
        }
      }
      return { type: 'injection', brand: contraceptive_brand || details.brand };
    }

    // RING/PATCH - Show countdown
    if (contraceptive_type === 'ring' || contraceptive_type === 'patch') {
      if (details.lastApplicationDate) {
        const lastDate = parseISO(details.lastApplicationDate);
        if (isValid(lastDate)) {
          // Default to 21-day cycle if not specified
          const daysToAdd = details.usageCycle === 'continuous' ? 30 : 21;
          const nextDate = addDays(lastDate, daysToAdd);
          const today = new Date();
          const daysUntil = differenceInDays(nextDate, today);

          return {
            type: 'ring_patch',
            brand: contraceptive_brand || details.brand,
            nextDate,
            daysUntilNext: Math.max(0, daysUntil),
            isUrgent: daysUntil <= 2,
            label: contraceptive_type === 'ring' ? 'Troca do Anel' : 'Troca do Adesivo',
          };
        }
      }
      return { 
        type: 'ring_patch', 
        brand: contraceptive_brand || details.brand,
        label: contraceptive_type === 'ring' ? 'Troca do Anel' : 'Troca do Adesivo',
      };
    }

    // DIU/IMPLANT - Show expiration
    if (contraceptive_type === 'iud' || contraceptive_type === 'implant') {
      if (details.insertionDate) {
        const insertionDate = parseISO(details.insertionDate);
        if (isValid(insertionDate)) {
          // DIU = 5-10 years (use 5 for hormonal), Implant = 3 years
          const yearsValid = contraceptive_type === 'implant' ? 3 : 5;
          const expirationDate = addDays(insertionDate, yearsValid * 365);
          const today = new Date();
          const daysRemaining = differenceInDays(expirationDate, today);
          const yearsRemaining = Math.max(0, daysRemaining / 365);

          return {
            type: 'long_duration',
            brand: contraceptive_brand || details.brand,
            expirationDate,
            yearsRemaining: Math.round(yearsRemaining * 10) / 10,
          };
        }
      }
      return { type: 'long_duration', brand: contraceptive_brand || details.brand };
    }

    // NATURAL/CONDOM/NONE - Show cycle wheel with fertile window
    if (['condom', 'natural', 'none'].includes(contraceptive_type)) {
      return { type: 'natural' };
    }

    return null;
  }, [contraceptive_type, contraceptive_brand, contraceptive_details]);
};
