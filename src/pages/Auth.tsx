import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { lovable } from '@/integrations/lovable/index';
import { supabase } from '@/integrations/supabase/client';
import logoImage from '@/assets/logo-plenya.png';

const translateLoginError = (msg: string, t: (key: string) => string): string => {
  const lower = msg.toLowerCase();
  if (lower.includes('invalid login') || lower.includes('invalid credentials')) return t('auth.error_invalid_credentials');
  if (lower.includes('email not confirmed') || lower.includes('not confirmed')) return t('auth.error_email_not_confirmed');
  if (lower.includes('rate limit') || lower.includes('too many')) return t('auth.error_rate_limit');
  return t('auth.error_check_credentials');
};

const translateSignupError = (msg: string, t: (key: string) => string): string => {
  const lower = msg.toLowerCase();
  if (lower.includes('already registered') || lower.includes('already been registered') || lower.includes('user already')) return t('auth.error_user_exists');
  if (lower.includes('password') && (lower.includes('weak') || lower.includes('at least') || lower.includes('characters'))) return t('auth.error_weak_password');
  if (lower.includes('rate limit') || lower.includes('too many')) return t('auth.error_rate_limit');
  return t('auth.error_try_again');
};

const Auth: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      toast({ title: t('auth.login_success'), description: t('auth.login_success_desc') });
      navigate('/');
    } catch (error: any) {
      toast({ title: t('auth.error_login'), description: translateLoginError(error.message || '', t), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) return;
    if (!acceptedTerms) {
      toast({ title: t('auth.error'), description: t('auth.must_accept_terms'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await signUp(email, password, fullName);
      if (error) throw error;
      toast({ title: t('auth.signup_success', { name: fullName }), description: t('auth.signup_success_desc') });
    } catch (error: any) {
      toast({ title: t('auth.error_signup'), description: translateSignupError(error.message || '', t), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: t('auth.error_google'), description: error.message || t('auth.error_try_again'), variant: 'destructive' });
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('apple', { redirect_uri: window.location.origin });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: t('auth.error_apple'), description: error.message || t('auth.error_try_again'), variant: 'destructive' });
      setAppleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      toast({ title: t('auth.email_sent'), description: t('auth.email_sent_desc') });
      setShowForgotPassword(false);
      setForgotEmail('');
    } catch (error: any) {
      toast({ title: t('auth.error'), description: error.message || t('auth.error_send_email'), variant: 'destructive' });
    } finally {
      setForgotLoading(false);
    }
  };

  const renderOAuthButtons = () => (
    <>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-muted" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">{t('auth.or')}</span>
        </div>
      </div>

      <Button type="button" variant="outline" className="w-full h-12 gap-3" onClick={handleGoogleSignIn} disabled={googleLoading}>
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {googleLoading ? t('auth.connecting') : t('auth.continue_google')}
      </Button>

      <Button type="button" variant="outline" className="w-full h-12 gap-3 bg-black text-white hover:bg-black/90 hover:text-white border-black" onClick={handleAppleSignIn} disabled={appleLoading}>
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
        {appleLoading ? t('auth.connecting') : t('auth.continue_apple')}
      </Button>
    </>
  );

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div className="w-full max-w-sm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <motion.img src={logoImage} alt="Plenya Logo" className="w-28 h-28 mx-auto mb-2 object-contain" animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 3, repeat: Infinity }} />
            <h1 className="text-2xl font-bold text-foreground mb-1">{t('auth.forgot_password_title')}</h1>
            <p className="text-muted-foreground">{t('auth.forgot_password_subtitle')}</p>
          </div>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input type="email" placeholder={t('auth.email')} value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="pl-10 h-12" required />
            </div>
            <Button type="submit" className="w-full h-12 text-lg font-semibold phase-gradient text-white" disabled={forgotLoading}>
              {forgotLoading ? t('auth.sending') : t('auth.send_link')}
            </Button>
            <button type="button" onClick={() => setShowForgotPassword(false)} className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> {t('auth.back_to_login')}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div className="w-full max-w-sm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <motion.img src={logoImage} alt="Plenya Logo" className="w-28 h-28 mx-auto mb-2 object-contain" animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 3, repeat: Infinity }} />
          <h1 className="text-3xl font-bold text-foreground mb-1">{t('auth.plenya')}</h1>
          <p className="text-muted-foreground">{t('auth.tagline')}</p>
        </div>

        <div className="flex mb-6 bg-secondary/50 rounded-full p-1">
          <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${isLogin ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>
            {t('auth.login')}
          </button>
          <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${!isLogin ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>
            {t('auth.signup')}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type="email" placeholder={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type={showPassword ? 'text' : 'password'} placeholder={t('auth.password')} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <Button type="submit" className="w-full h-12 text-lg font-semibold phase-gradient text-white" disabled={loading}>
                {loading ? t('auth.signing_in') : t('auth.login')}
              </Button>
              <button type="button" onClick={() => setShowForgotPassword(true)} className="w-full text-sm text-primary hover:underline">
                {t('auth.forgot_password')}
              </button>
              {renderOAuthButtons()}
            </motion.form>
          ) : (
            <motion.form key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSignup} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type="text" placeholder={t('auth.full_name')} value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10 h-12" required />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type="email" placeholder={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type={showPassword ? 'text' : 'password'} placeholder={t('auth.password_min')} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12" minLength={6} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex items-start gap-3 py-1">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="terms" className="text-xs leading-relaxed text-muted-foreground cursor-pointer">
                  {t('auth.accept_terms')}{' '}
                  <Link to="/termos" target="_blank" className="text-primary underline hover:text-primary/80">
                    {t('auth.terms_link')}
                  </Link>{' '}
                  {t('auth.and')}{' '}
                  <Link to="/privacidade" target="_blank" className="text-primary underline hover:text-primary/80">
                    {t('auth.privacy_link')}
                  </Link>.
                </label>
              </div>

              <Button type="submit" className="w-full h-12 text-lg font-semibold phase-gradient text-white" disabled={loading || !acceptedTerms}>
                {loading ? t('auth.creating_account') : t('auth.signup')}
              </Button>
              {renderOAuthButtons()}
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Auth;