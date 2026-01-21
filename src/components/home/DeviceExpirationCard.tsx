import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, AlertCircle, Clock } from 'lucide-react';
import { useContraceptive } from '@/hooks/useContraceptive';
import { 
  getMethodById, 
  calculateExpirationDate, 
  formatTimeRemaining 
} from '@/data/contraceptiveMethods';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DeviceExpirationCard: React.FC = () => {
  const { 
    contraceptive_type, 
    contraceptive_brand, 
    contraceptive_start_date,
    loading 
  } = useContraceptive();

  if (loading) return null;

  const method = contraceptive_type ? getMethodById(contraceptive_type) : null;
  
  // Only show for methods with expiration
  if (!method?.hasExpiration || !contraceptive_start_date) return null;

  const startDate = new Date(contraceptive_start_date);
  const expirationDate = calculateExpirationDate(contraceptive_type, startDate);
  
  if (!expirationDate) return null;

  const daysRemaining = differenceInDays(expirationDate, new Date());
  const isExpiringSoon = daysRemaining <= 90; // 3 months warning
  const isExpired = daysRemaining <= 0;

  return (
    <motion.div
      className={`glass-card p-5 overflow-hidden relative ${
        isExpired 
          ? 'border-2 border-red-500/50' 
          : isExpiringSoon 
            ? 'border-2 border-amber-500/50' 
            : ''
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Background effect based on status */}
      <div className={`absolute inset-0 ${
        isExpired 
          ? 'bg-gradient-to-br from-red-500/10 to-rose-500/5'
          : isExpiringSoon
            ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/5'
            : 'bg-gradient-to-br from-primary/5 to-primary/0'
      }`} />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${
              isExpired 
                ? 'bg-red-100 dark:bg-red-900/50' 
                : isExpiringSoon
                  ? 'bg-amber-100 dark:bg-amber-900/50'
                  : 'bg-primary/10'
            }`}>
              {isExpired || isExpiringSoon ? (
                <AlertCircle className={`w-6 h-6 ${
                  isExpired 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-amber-600 dark:text-amber-400'
                }`} />
              ) : (
                <Calendar className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {contraceptive_brand || method.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                {method.label}
              </p>
            </div>
          </div>
        </div>

        {/* Expiration info */}
        <div className={`mt-4 p-3 rounded-xl ${
          isExpired 
            ? 'bg-red-50 dark:bg-red-950/30'
            : isExpiringSoon
              ? 'bg-amber-50 dark:bg-amber-950/30'
              : 'bg-secondary/50'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <Clock className={`w-4 h-4 ${
              isExpired 
                ? 'text-red-600' 
                : isExpiringSoon
                  ? 'text-amber-600'
                  : 'text-muted-foreground'
            }`} />
            <span className={`text-sm font-medium ${
              isExpired 
                ? 'text-red-700 dark:text-red-300' 
                : isExpiringSoon
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-foreground'
            }`}>
              {isExpired ? 'Vencido!' : formatTimeRemaining(expirationDate)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Vencimento: {format(expirationDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Warning message */}
        {isExpiringSoon && !isExpired && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Agende a troca com seu médico
          </p>
        )}
        
        {isExpired && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Procure seu médico para renovar
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default DeviceExpirationCard;
