import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface DiaryEntry {
  id: string;
  entry_date: string;
  cycle_day: number | null;
  cycle_phase: string | null;
  content: string;
  ai_analysis: string | null;
  sentiment: string | null;
  tags: string[];
  created_at: string;
}

export const useCycleDiary = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEntries = useCallback(async (limit = 30) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cycle_diary' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setEntries((data as any[]) || []);
    } catch (e) {
      console.error('Error fetching diary:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const saveEntry = useCallback(async (
    content: string,
    cycleDay: number | null,
    cyclePhase: string | null,
    existingId?: string
  ): Promise<DiaryEntry | null> => {
    if (!user) return null;

    try {
      const today = new Date().toISOString().split('T')[0];
      const entryData = {
        user_id: user.id,
        entry_date: today,
        cycle_day: cycleDay,
        cycle_phase: cyclePhase,
        content,
      };

      let result;
      if (existingId) {
        result = await supabase
          .from('cycle_diary' as any)
          .update({ content, cycle_day: cycleDay, cycle_phase: cyclePhase } as any)
          .eq('id', existingId)
          .select()
          .single();
      } else {
        result = await supabase
          .from('cycle_diary' as any)
          .upsert(entryData as any, { onConflict: 'user_id,entry_date' })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      await fetchEntries();
      return result.data as any;
    } catch (e: any) {
      console.error('Error saving diary:', e);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar.' });
      return null;
    }
  }, [user, fetchEntries, toast]);

  const updateAIAnalysis = useCallback(async (
    entryId: string,
    analysis: string,
    sentiment: string,
    tags: string[]
  ) => {
    try {
      await supabase
        .from('cycle_diary' as any)
        .update({ ai_analysis: analysis, sentiment, tags } as any)
        .eq('id', entryId);

      await fetchEntries();
    } catch (e) {
      console.error('Error updating AI analysis:', e);
    }
  }, [fetchEntries]);

  const todayEntry = entries.find(
    e => e.entry_date === new Date().toISOString().split('T')[0]
  );

  return { entries, loading, saveEntry, updateAIAnalysis, todayEntry, fetchEntries };
};
