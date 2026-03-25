import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Crown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const TrialExpirationBanner: React.FC = () => {
  const { subscribed, subscriptionEnd } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = React.useState(false);

  // Only show if user has an active subscription with an end date coming within 3 days
  if (!subscribed || !subscriptionEnd || dismissed) return null;

  const endDate = new Date(subscriptionEnd);
  const now = new Date();
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Only show when trial is expiring within 3 days
  if (daysLeft > 3 || daysLeft < 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 relative"
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-500/20">
          <Clock className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground text-sm">
            ⏰ Seu trial expira em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}!
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Continue com acesso ilimitado à Elena, relatórios e mais.
          </p>
          <Button
            size="sm"
            onClick={() => navigate('/planos')}
            className="mt-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs"
          >
            <Crown className="w-3 h-3 mr-1" />
            Assinar Agora
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default TrialExpirationBanner;
