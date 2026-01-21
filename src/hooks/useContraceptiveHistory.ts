import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ContraceptiveHistoryEntry {
  id: string;
  user_id: string;
  contraceptive_type: string;
  contraceptive_brand: string | null;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at: string;
}

export const useContraceptiveHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<ContraceptiveHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch history
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('contraceptive_history')
          .select('*')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false });

        if (error) {
          console.error('Error fetching contraceptive history:', error);
          return;
        }

        setHistory(data || []);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  // Add new history entry (called when method changes)
  const addHistoryEntry = useCallback(
    async (entry: {
      contraceptive_type: string;
      contraceptive_brand?: string | null;
      start_date?: string;
      notes?: string;
    }) => {
      if (!user) return false;

      try {
        // First, close any open entries (set end_date)
        const { error: updateError } = await supabase
          .from('contraceptive_history')
          .update({ end_date: new Date().toISOString().split('T')[0] })
          .eq('user_id', user.id)
          .is('end_date', null);

        if (updateError) {
          console.error('Error closing previous entry:', updateError);
        }

        // Insert new entry
        const { data, error } = await supabase
          .from('contraceptive_history')
          .insert({
            user_id: user.id,
            contraceptive_type: entry.contraceptive_type,
            contraceptive_brand: entry.contraceptive_brand || null,
            start_date: entry.start_date || new Date().toISOString().split('T')[0],
            notes: entry.notes || null,
          })
          .select()
          .single();

        if (error) {
          console.error('Error adding history entry:', error);
          return false;
        }

        // Update local state
        setHistory(prev => [data, ...prev]);
        return true;
      } catch (err) {
        console.error('Error:', err);
        return false;
      }
    },
    [user]
  );

  // Delete history entry
  const deleteHistoryEntry = useCallback(
    async (id: string) => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from('contraceptive_history')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error deleting history entry:', error);
          return false;
        }

        setHistory(prev => prev.filter(entry => entry.id !== id));
        return true;
      } catch (err) {
        console.error('Error:', err);
        return false;
      }
    },
    [user]
  );

  return {
    history,
    loading,
    addHistoryEntry,
    deleteHistoryEntry,
  };
};
