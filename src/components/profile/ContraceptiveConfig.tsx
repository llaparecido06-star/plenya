import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, Check, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  contraceptiveMethods, 
  getMethodById, 
  isPillMethod, 
  hasExpirationDate 
} from '@/data/contraceptiveMethods';
import { useContraceptive } from '@/hooks/useContraceptive';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import ContraceptiveHistoryCard from './ContraceptiveHistoryCard';

const ContraceptiveConfig: React.FC = () => {
  const { 
    contraceptive_type, 
    contraceptive_brand, 
    contraceptive_start_date,
    pill_reminder_time,
    loading, 
    saving, 
    saveSettings,
    isAuthenticated 
  } = useContraceptive();

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [brand, setBrand] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [hasChanges, setHasChanges] = useState(false);

  // Load saved data
  useEffect(() => {
    if (contraceptive_type) setSelectedType(contraceptive_type);
    if (contraceptive_brand) setBrand(contraceptive_brand);
    if (contraceptive_start_date) setStartDate(new Date(contraceptive_start_date));
    if (pill_reminder_time) setReminderTime(pill_reminder_time.slice(0, 5)); // Remove seconds
  }, [contraceptive_type, contraceptive_brand, contraceptive_start_date, pill_reminder_time]);

  // Track changes
  useEffect(() => {
    const typeChanged = selectedType !== contraceptive_type;
    const brandChanged = brand !== (contraceptive_brand || '');
    const dateChanged = startDate?.toISOString().split('T')[0] !== contraceptive_start_date;
    const timeChanged = reminderTime !== (pill_reminder_time?.slice(0, 5) || '08:00');
    
    setHasChanges(typeChanged || brandChanged || dateChanged || timeChanged);
  }, [selectedType, brand, startDate, reminderTime, contraceptive_type, contraceptive_brand, contraceptive_start_date, pill_reminder_time]);

  const selectedMethod = selectedType ? getMethodById(selectedType) : null;

  const handleSave = async () => {
    await saveSettings({
      contraceptive_type: selectedType,
      contraceptive_brand: selectedMethod?.requiresBrand ? brand : null,
      contraceptive_start_date: hasExpirationDate(selectedType) && startDate 
        ? format(startDate, 'yyyy-MM-dd') 
        : null,
      pill_reminder_time: isPillMethod(selectedType) ? `${reminderTime}:00` : null,
    });
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Method Summary - Show when method is saved */}
      {contraceptive_type && !hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-primary/10 border border-primary/30"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-2xl">
                {getMethodById(contraceptive_type)?.icon || '💊'}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                {getMethodById(contraceptive_type)?.label || contraceptive_type}
              </p>
              {contraceptive_brand && (
                <p className="text-sm text-primary font-medium">
                  {contraceptive_brand}
                </p>
              )}
              {pill_reminder_time && isPillMethod(contraceptive_type) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  Lembrete às {pill_reminder_time.slice(0, 5)}
                </p>
              )}
              {contraceptive_start_date && hasExpirationDate(contraceptive_type) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  Desde {format(new Date(contraceptive_start_date), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              )}
            </div>
            <Check className="w-5 h-5 text-primary" />
          </div>
        </motion.div>
      )}

      {/* Method Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          {contraceptive_type && !hasChanges ? 'Alterar método:' : 'Qual seu método contraceptivo?'}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {contraceptiveMethods.map((method) => (
            <motion.button
              key={method.id}
              onClick={() => {
                setSelectedType(method.id);
                if (!method.requiresBrand) setBrand('');
              }}
              className={`p-3 rounded-xl text-left transition-all ${
                selectedType === method.id
                  ? 'bg-primary/10 border-2 border-primary'
                  : 'bg-secondary/50 border-2 border-transparent hover:bg-secondary'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{method.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">
                    {method.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {method.description}
                  </p>
                </div>
                {selectedType === method.id && (
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Brand Input (for methods that need it) */}
      {selectedMethod?.requiresBrand && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <label className="block text-sm font-medium text-foreground mb-2">
            Qual o nome do medicamento?
          </label>
          <Input
            type="text"
            placeholder="Ex: Yasmin, Cerazette, Kyleena..."
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </motion.div>
      )}

      {/* Start Date (for DIU/Implant) */}
      {selectedMethod?.hasExpiration && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <label className="block text-sm font-medium text-foreground mb-2">
            Quando você colocou o {selectedMethod.label}?
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {startDate ? (
                  format(startDate, 'dd/MM/yyyy', { locale: ptBR })
                ) : (
                  <span className="text-muted-foreground">Selecione a data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50 bg-card" align="start">
              <CalendarComponent
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                disabled={(date) => date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          {startDate && selectedMethod.expirationYears && (
            <div className="mt-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Válido até:{' '}
                <strong>
                  {format(
                    new Date(startDate.getTime() + selectedMethod.expirationYears * 365 * 24 * 60 * 60 * 1000),
                    'dd/MM/yyyy',
                    { locale: ptBR }
                  )}
                </strong>
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Reminder Time (for pills) */}
      {isPillMethod(selectedType) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <label className="block text-sm font-medium text-foreground mb-2">
            <Clock className="w-4 h-4 inline mr-2" />
            Horário do lembrete diário
          </label>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
            <span className="text-sm text-foreground">
              Me lembre de tomar {brand || 'a pílula'} às:
            </span>
            <Input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-28"
            />
          </div>
        </motion.div>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving || !hasChanges || !isAuthenticated}
        className="w-full"
      >
        {saving ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Salvando...
          </span>
        ) : !isAuthenticated ? (
          'Faça login para salvar'
        ) : !hasChanges ? (
          'Configurações salvas'
        ) : (
          'Salvar Configurações'
        )}
      </Button>

      {/* History Card */}
      <ContraceptiveHistoryCard />
    </div>
  );
};

export default ContraceptiveConfig;
