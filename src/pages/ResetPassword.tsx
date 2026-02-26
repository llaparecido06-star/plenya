import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logoImage from '@/assets/logo-plenya.png';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });
    // Check hash for recovery token
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem.', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Erro', description: 'A senha deve ter no mínimo 6 caracteres.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast({ title: 'Senha redefinida! 🎉', description: 'Sua nova senha foi salva com sucesso.' });
      setTimeout(() => navigate('/'), 2000);
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Não foi possível redefinir a senha.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery && !success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div className="w-full max-w-sm text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <img src={logoImage} alt="Plenya" className="w-20 h-20 mx-auto mb-4 object-contain" />
          <h1 className="text-xl font-bold text-foreground mb-2">Link inválido</h1>
          <p className="text-muted-foreground mb-6">Este link de redefinição de senha é inválido ou expirou.</p>
          <Button onClick={() => navigate('/auth')} className="phase-gradient text-white">Voltar ao login</Button>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div className="w-full max-w-sm text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Senha redefinida!</h1>
          <p className="text-muted-foreground">Redirecionando...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div className="w-full max-w-sm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <img src={logoImage} alt="Plenya" className="w-20 h-20 mx-auto mb-2 object-contain" />
          <h1 className="text-2xl font-bold text-foreground mb-1">Nova senha</h1>
          <p className="text-muted-foreground">Digite sua nova senha abaixo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nova senha (mín. 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-12"
              minLength={6}
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirmar nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              minLength={6}
              required
            />
          </div>

          <Button type="submit" className="w-full h-12 text-lg font-semibold phase-gradient text-white" disabled={loading}>
            {loading ? 'Salvando...' : 'Redefinir senha'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
