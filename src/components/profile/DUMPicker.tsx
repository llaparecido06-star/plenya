import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Check, Loader2, Minus, Plus } from 'lucide-react';
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
import { toLocalDateString, parseLocalDate } from '@/lib/dateUtils';

const DUMPicker: React.FC = () => {
  const { user } = useAuth();
  const { setCycleDay, cycleLength, setCycleLength, periodDuration, setPeriodDuration, lastPeriodStart, setLastPeriodStart } = useCycle();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(lastPeriodStart || undefined);
  const [localCycleLength, setLocalCycleLength] = useState(cycleLength);
  const [localPeriodDuration, setLocalPeriodDuration] = useState(periodDuration);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingLength, setSavingLength] = useState(false);
  const [editingCycleDay, setEditingCycleDay] = useState(false);
  const [localCycleDay, setLocalCycleDay] = useState<number | null>(null);

  useEffect(() => {
    setLocalCycleLength(cycleLength);
  }, [cycleLength]);

  useEffect(() => {
    setLocalPeriodDuration(periodDuration);
  }, [periodDuration]);

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

        if (data?.cycle_length) {
          setLocalCycleLength(data.cycle_length);
          setCycleLength(data.cycle_length);
        }

        if (data?.last_period_start) {
          const savedDate = parseLocalDate(data.last_period_start);
          setDate(savedDate);
          setLastPeriodStart(savedDate);
          
          const today = new Date();
          const daysSince = differenceInDays(today, savedDate) + 1;
          setCycleDay(Math.max(1, daysSince));
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, setCycleDay, setLastPeriodStart, setCycleLength]);

  const handleDateSelect = async (selectedDate: Date | undefined) => {
    if (!selectedDate || !user) return;

    setDate(selectedDate);
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          last_period_start: toLocalDateString(selectedDate),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setLastPeriodStart(selectedDate);
      
      const today = new Date();
      const daysSince = differenceInDays(today, selectedDate) + 1;
      setCycleDay(Math.max(1, daysSince));

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

  const handleCycleLengthChange = async (newLength: number) => {
    if (newLength < 20 || newLength > 45 || !user) return;
    
    setLocalCycleLength(newLength);
    setSavingLength(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          cycle_length: newLength,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setCycleLength(newLength);
    } catch (error: any) {
      console.error('Error saving cycle length:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a duração do ciclo.',
        variant: 'destructive',
      });
    } finally {
      setSavingLength(false);
    }
  };

  const handlePeriodDurationChange = async (newDuration: number) => {
    if (newDuration < 2 || newDuration > 10 || !user) return;
    
    setLocalPeriodDuration(newDuration);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          period_duration: newDuration,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setPeriodDuration(newDuration);
    } catch (error: any) {
      console.error('Error saving period duration:', error);
    }
  };

  // Adjust cycle day by recalculating DUM backwards
  const handleCycleDayChange = async (newDay: number) => {
    if (newDay < 1 || !user) return;
    
    setLocalCycleDay(newDay);
    
    // Recalculate DUM: today - (newDay - 1) days
    const today = new Date();
    const newDUM = new Date(today);
    newDUM.setDate(today.getDate() - (newDay - 1));

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          last_period_start: toLocalDateString(newDUM),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setDate(newDUM);
      setLastPeriodStart(newDUM);
      setCycleDay(newDay);

      window.dispatchEvent(new CustomEvent('dum-synced', { detail: { date: toLocalDateString(newDUM) } }));
    } catch (error: any) {
      console.error('Error adjusting cycle day:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível ajustar o dia do ciclo.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const calculatedCycleDay = date 
    ? Math.max(1, differenceInDays(new Date(), date) + 1)
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
        <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={(d) => d > new Date()}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {/* Cycle Length Editor */}
      <div className="mt-4 p-3 rounded-lg bg-secondary/50 border border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground font-medium">Duração do ciclo</span>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => handleCycleLengthChange(localCycleLength - 1)}
              disabled={localCycleLength <= 20 || savingLength}
            >
              <Minus className="w-3.5 h-3.5" />
            </Button>
            <span className="text-lg font-bold text-primary w-8 text-center">
              {savingLength ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : localCycleLength}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => handleCycleLengthChange(localCycleLength + 1)}
              disabled={localCycleLength >= 45 || savingLength}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
            <span className="text-sm text-muted-foreground">dias</span>
          </div>
        </div>
      </div>

      {/* Period Duration Editor */}
      <div className="mt-3 p-3 rounded-lg bg-secondary/50 border border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground font-medium">Duração da menstruação</span>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => handlePeriodDurationChange(localPeriodDuration - 1)}
              disabled={localPeriodDuration <= 2}
            >
              <Minus className="w-3.5 h-3.5" />
            </Button>
            <span className="text-lg font-bold text-primary w-8 text-center">
              {localPeriodDuration}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => handlePeriodDurationChange(localPeriodDuration + 1)}
              disabled={localPeriodDuration >= 10}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
            <span className="text-sm text-muted-foreground">dias</span>
          </div>
        </div>
      </div>

      {calculatedCycleDay && (
        <motion.div
          className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20 cursor-pointer"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setEditingCycleDay(!editingCycleDay)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">
                Dia atual do ciclo: <span className="font-bold text-primary">{localCycleDay ?? calculatedCycleDay}</span> de {localCycleLength}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">{editingCycleDay ? '▲' : 'Editar ▼'}</span>
          </div>

          <AnimatePresence>
            {editingCycleDay && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-primary/20">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleCycleDayChange((localCycleDay ?? calculatedCycleDay) - 1)}
                    disabled={(localCycleDay ?? calculatedCycleDay) <= 1}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-2xl font-bold text-primary w-12 text-center">
                    {localCycleDay ?? calculatedCycleDay}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleCycleDayChange((localCycleDay ?? calculatedCycleDay) + 1)}
                    disabled={(localCycleDay ?? calculatedCycleDay) >= localCycleLength + 14}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Ajustar recalcula a DUM automaticamente
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DUMPicker;
