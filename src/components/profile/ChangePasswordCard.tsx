import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const ChangePasswordCard: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: t('errors.generic_error'), description: t('password.min_length'), variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: t('errors.generic_error'), description: t('password.mismatch'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: t('password.changed_success'), description: t('password.changed_desc') });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({ title: t('errors.generic_error'), description: error.message || t('password.change_error'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleChangePassword} className="space-y-3">
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder={t('password.new_placeholder')}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="pr-10 h-11"
          minLength={6}
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <Input
        type={showPassword ? 'text' : 'password'}
        placeholder={t('password.confirm_placeholder')}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="h-11"
        minLength={6}
        required
      />
      <Button type="submit" className="w-full phase-gradient text-white" disabled={loading}>
        {loading ? t('actions.loading') : t('password.change_button')}
      </Button>
    </form>
  );
};

export default ChangePasswordCard;
