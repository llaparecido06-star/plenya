import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Check, Loader2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCycle } from '@/contexts/CycleContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const DUMPicker: React.FC = () => {
  const { user } = useAuth();
  const { setCycleDay, cycleLength, lastPeriodStart, setLastPeriodStart } = useCycle();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(lastPeriodStart || undefined);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load saved DUM from profile
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('last_period_start, cycle_length')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data?.last_period_start) {
          const savedDate = new Date(data.last_period_start);
          setDate(savedDate);
          setLastPeriodStart(savedDate);
          
          // Calculate and set cycle day
          const today = new Date();
          const daysSince = differenceInDays(today, savedDate) + 1;
          const currentCycleDay = ((daysSince - 1) % cycleLength) + 1;
          setCycleDay(currentCycleDay);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, cycleLength, setCycleDay, setLastPeriodStart]);

  const handleDateSelect = async (selectedDate: Date | undefined) => {
    if (!selectedDate || !user) return;

    setDate(selectedDate);
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          last_period_start: selectedDate.toISOString().split('T')[0],
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setLastPeriodStart(selectedDate);
      
      // Calculate and set cycle day
      const today = new Date();
      const daysSince = differenceInDays(today, selectedDate) + 1;
      const currentCycleDay = ((daysSince - 1) % cycleLength) + 1;
      setCycleDay(currentCycleDay);

      toast({
        title: 'DUM Atualizada! ✨',
        description: 'Seu ciclo foi sincronizado com a nova data.',
      });
    } catch (error: any) {
      console.error('Error saving DUM:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a data.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const calculatedCycleDay = date 
    ? ((differenceInDays(new Date(), date)) % cycleLength) + 1
    : null;

  if (loading) {
    return (
      <div className="glass-card p-5 flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      className="glass-card p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <CalendarIcon className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Data da Última Menstruação (DUM)</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        O dia do ciclo será calculado automaticamente a partir desta data.
      </p>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CalendarIcon className="mr-2 h-4 w-4" />
            )}
            {date ? (
              format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
            ) : (
              <span className="text-muted-foreground">Selecione a data</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={(d) => d > new Date()}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {calculatedCycleDay && (
        <motion.div
          className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">
              Dia atual do ciclo: <span className="font-bold text-primary">{calculatedCycleDay}</span> de {cycleLength}
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DUMPicker;
