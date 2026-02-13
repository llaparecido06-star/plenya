import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface AuthFormProps {
  onSuccess?: () => void;
}

const translateAuthError = (error: string, t: (key: string) => string): string => {
  const msg = error.toLowerCase();
  if (msg.includes('password') && (msg.includes('weak') || msg.includes('at least') || msg.includes('characters'))) {
    return t('auth.error_weak_password');
  }
  if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already')) {
    return t('auth.error_user_exists');
  }
  if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('wrong password')) {
    return t('auth.error_invalid_credentials');
  }
  if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
    return t('auth.error_email_not_confirmed');
  }
  if (msg.includes('rate limit') || msg.includes('too many')) {
    return t('auth.error_rate_limit');
  }
  return t('auth.error_generic');
};

const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast({
          title: t('auth.login_success'),
          description: t('auth.login_success_desc'),
        });
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast({
          title: t('auth.signup_success'),
          description: t('auth.signup_success_desc'),
        });
      }
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: t('auth.error'),
        description: translateAuthError(error.message || '', t),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="w-full max-w-sm mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {isLogin ? t('auth.welcome_back') : t('auth.create_account')}
        </h1>
        <p className="text-muted-foreground">
          {isLogin ? t('auth.login_subtitle') : t('auth.signup_subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('auth.your_name')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="pl-10"
              required={!isLogin}
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="email"
            placeholder={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <Button
          type="submit"
          className="w-full phase-gradient text-white font-semibold"
          disabled={loading}
        >
          {loading ? t('actions.loading') : isLogin ? t('auth.login') : t('auth.signup')}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        {isLogin ? t('auth.no_account') : t('auth.has_account')}{' '}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-primary font-medium hover:underline"
        >
          {isLogin ? t('auth.signup') : t('auth.login')}
        </button>
      </p>
    </motion.div>
  );
};

export default AuthForm;