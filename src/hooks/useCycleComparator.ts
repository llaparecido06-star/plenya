import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCycle } from '@/contexts/CycleContext';
import { subDays, format } from 'date-fns';

interface CycleDayData {
  day: number;
  mood: number | null;
  energy: number | null;
  stress: number | null;
  symptoms: string[];
}

interface CycleData {
  cycleNumber: number;
  label: string;
  days: CycleDayData[];
  avgMood: number;
  avgEnergy: number;
  avgStress: number;
  topSymptoms: string[];
}

interface CycleComparatorData {
  currentCycle: CycleData | null;
  previousCycles: CycleData[];
  comparison: {
    moodTrend: 'up' | 'down' | 'stable';
    energyTrend: 'up' | 'down' | 'stable';
    stressTrend: 'up' | 'down' | 'stable';
    moodDiff: number;
    energyDiff: number;
    stressDiff: number;
  } | null;
}

export const useCycleComparator = () => {
  const { user } = useAuth();
  const { cycleLength, lastPeriodStart, cycleDay } = useCycle();
  const [data, setData] = useState<CycleComparatorData>({
    currentCycle: null,
    previousCycles: [],
    comparison: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchCycleData = useCallback(async () => {
    if (!user || !lastPeriodStart) {
      setLoading(false);
      return;
    }

    try {
      // Fetch last 90 days of daily_logs (covers ~3 cycles)
      const startDate = subDays(new Date(), 90);
      
      const { data: logs, error } = await supabase
        .from('daily_logs')
        .select('log_date, mood, energy, stress, symptoms')
        .eq('user_id', user.id)
        .gte('log_date', format(startDate, 'yyyy-MM-dd'))
        .order('log_date', { ascending: true });

      if (error) throw error;

      if (!logs || logs.length === 0) {
        setLoading(false);
        return;
      }

      // Map logs to cycle days
      const cyclesMap: Map<number, CycleDayData[]> = new Map();
      
      logs.forEach(log => {
        const logDate = new Date(log.log_date);
        const diffDays = Math.floor((logDate.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate which cycle this log belongs to
        const cycleIndex = Math.floor(diffDays / cycleLength);
        const dayInCycle = ((diffDays % cycleLength) + cycleLength) % cycleLength + 1;
        
        if (!cyclesMap.has(cycleIndex)) {
          cyclesMap.set(cycleIndex, []);
        }
        
        cyclesMap.get(cycleIndex)!.push({
          day: dayInCycle,
          mood: log.mood,
          energy: log.energy,
          stress: log.stress,
          symptoms: log.symptoms || [],
        });
      });

      // Process cycles
      const processedCycles: CycleData[] = [];
      const sortedCycleIndices = Array.from(cyclesMap.keys()).sort((a, b) => b - a);
      
      sortedCycleIndices.forEach((cycleIndex, i) => {
        const cycleDays = cyclesMap.get(cycleIndex)!;
        
        // Calculate averages
        const moodValues = cycleDays.filter(d => d.mood !== null).map(d => d.mood!);
        const energyValues = cycleDays.filter(d => d.energy !== null).map(d => d.energy!);
        const stressValues = cycleDays.filter(d => d.stress !== null).map(d => d.stress!);
        
        const avgMood = moodValues.length > 0 ? moodValues.reduce((a, b) => a + b, 0) / moodValues.length : 0;
        const avgEnergy = energyValues.length > 0 ? energyValues.reduce((a, b) => a + b, 0) / energyValues.length : 0;
        const avgStress = stressValues.length > 0 ? stressValues.reduce((a, b) => a + b, 0) / stressValues.length : 0;
        
        // Get top symptoms
        const symptomCounts: Record<string, number> = {};
        cycleDays.forEach(d => {
          d.symptoms.forEach(s => {
            symptomCounts[s] = (symptomCounts[s] || 0) + 1;
          });
        });
        const topSymptoms = Object.entries(symptomCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([s]) => s);
        
        processedCycles.push({
          cycleNumber: cycleIndex,
          label: cycleIndex === 0 ? 'Ciclo Atual' : `Ciclo -${Math.abs(cycleIndex)}`,
          days: cycleDays.sort((a, b) => a.day - b.day),
          avgMood: Math.round(avgMood * 10) / 10,
          avgEnergy: Math.round(avgEnergy * 10) / 10,
          avgStress: Math.round(avgStress * 10) / 10,
          topSymptoms,
        });
      });

      // Separate current and previous cycles
      const currentCycle = processedCycles.find(c => c.cycleNumber === 0) || null;
      const previousCycles = processedCycles.filter(c => c.cycleNumber < 0).slice(0, 2);

      // Calculate comparison if we have both current and previous
      let comparison: CycleComparatorData['comparison'] = null;
      if (currentCycle && previousCycles.length > 0) {
        const prevAvg = previousCycles.reduce((acc, c) => ({
          mood: acc.mood + c.avgMood,
          energy: acc.energy + c.avgEnergy,
          stress: acc.stress + c.avgStress,
        }), { mood: 0, energy: 0, stress: 0 });
        
        const prevCount = previousCycles.length;
        const avgPrevMood = prevAvg.mood / prevCount;
        const avgPrevEnergy = prevAvg.energy / prevCount;
        const avgPrevStress = prevAvg.stress / prevCount;
        
        const moodDiff = currentCycle.avgMood - avgPrevMood;
        const energyDiff = currentCycle.avgEnergy - avgPrevEnergy;
        const stressDiff = currentCycle.avgStress - avgPrevStress;
        
        const getTrend = (diff: number): 'up' | 'down' | 'stable' => {
          if (diff > 0.3) return 'up';
          if (diff < -0.3) return 'down';
          return 'stable';
        };
        
        comparison = {
          moodTrend: getTrend(moodDiff),
          energyTrend: getTrend(energyDiff),
          stressTrend: getTrend(stressDiff),
          moodDiff: Math.round(moodDiff * 10) / 10,
          energyDiff: Math.round(energyDiff * 10) / 10,
          stressDiff: Math.round(stressDiff * 10) / 10,
        };
      }

      setData({
        currentCycle,
        previousCycles,
        comparison,
      });
    } catch (err) {
      console.error('Error fetching cycle comparator data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, cycleLength, lastPeriodStart]);

  useEffect(() => {
    fetchCycleData();
  }, [fetchCycleData]);

  return {
    ...data,
    loading,
    refresh: fetchCycleData,
    hasData: data.currentCycle !== null && data.previousCycles.length > 0,
  };
};
