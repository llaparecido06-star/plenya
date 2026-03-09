import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLifePhase } from '@/hooks/useLifePhase';
import LifePhaseSelector from '@/components/profile/LifePhaseSelector';
import PageLayout from '@/components/layout/PageLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/auth/AuthForm';
import { Button } from '@/components/ui/button';
import {
  LogOut, Target, Dumbbell, Heart, Baby, Activity, Utensils, Zap, Crown, Globe,
  Lock, Bell, CalendarDays, Settings, Trash2, ChevronRight, Pill, FileText, Gauge, Sparkles, HelpCircle
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import DUMPicker from '@/components/profile/DUMPicker';
import PatternsCard from '@/components/history/PatternsCard';
import ContraceptiveConfig from '@/components/profile/ContraceptiveConfig';
import MedicalReportButton from '@/components/profile/MedicalReportButton';
import NotificationSettings from '@/components/settings/NotificationSettings';
import WeeklySummaryCard from '@/components/home/WeeklySummaryCard';
import { useProfile } from '@/hooks/useProfile';
import { useAvatar } from '@/hooks/useAvatar';
import { Badge } from '@/components/ui/badge';
import ProfileSettingsEditor from '@/components/profile/ProfileSettingsEditor';
import AvatarUpload from '@/components/profile/AvatarUpload';
import DeleteAccountButton from '@/components/profile/DeleteAccountButton';
import MedicationTracker from '@/components/profile/MedicationTracker';
import ChangePasswordCard from '@/components/profile/ChangePasswordCard';
import BellyPhotoGallery from '@/components/home/BellyPhotoGallery';
import MenopauseAlertSettings from '@/components/settings/MenopauseAlertSettings';
import { useTranslation } from 'react-i18next';

const goalConfig: Record<string, { labelKey: string; icon: React.ElementType; color: string }> = {
  lose_weight: { labelKey: 'goals.lose_weight', icon: Target, color: 'bg-terracotta/20 text-terracotta border-terracotta/30' },
  gain_muscle: { labelKey: 'goals.gain_muscle', icon: Dumbbell, color: 'bg-leaf-green/20 text-leaf-green border-leaf-green/30' },
  pms_relief: { labelKey: 'goals.pms_relief', icon: Heart, color: 'bg-burnt-pink/20 text-burnt-pink border-burnt-pink/30' },
  get_pregnant: { labelKey: 'goals.get_pregnant', icon: Baby, color: 'bg-terracotta/20 text-terracotta border-terracotta/30' },
  health_monitor: { labelKey: 'goals.health_monitor', icon: Activity, color: 'bg-leaf-green/20 text-leaf-green border-leaf-green/30' },
};

const dietConfig: Record<string, { labelKey: string; icon: string }> = {
  omnivore: { labelKey: 'diet.omnivore', icon: '🍖' },
  vegetarian: { labelKey: 'diet.vegetarian', icon: '🥗' },
  vegan: { labelKey: 'diet.vegan', icon: '🌱' },
  low_carb: { labelKey: 'diet.low_carb', icon: '🥑' },
  lactose_free: { labelKey: 'diet.lactose_free', icon: '🥛' },
};

const activityConfig: Record<string, { labelKey: string; icon: string }> = {
  sedentary: { labelKey: 'fitness.sedentary', icon: '🛋️' },
  light: { labelKey: 'fitness.light', icon: '🚶‍♀️' },
  moderate: { labelKey: 'fitness.moderate', icon: '🏃‍♀️' },
  intense: { labelKey: 'fitness.intense', icon: '💪' },
};

const languages = [
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
];

interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  iconClassName?: string;
  children?: React.ReactNode;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon: Icon, label, sublabel, onClick, variant = 'default', iconClassName, children }) => {
  const content = (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors ${
        variant === 'danger'
          ? 'text-destructive hover:bg-destructive/5'
          : 'text-foreground hover:bg-muted/50'
      }`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconClassName || 'bg-muted text-muted-foreground'}`}>
        <Icon className="w-[18px] h-[18px]" />
      </div>
      <div className="flex-1 text-left">
        <span className="text-sm font-medium">{label}</span>
        {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
      </div>
      {!children && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
    </button>
  );

  if (children) {
    return (
      <Sheet>
        <SheetTrigger asChild>{content}</SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Icon className="w-5 h-5" />
              {label}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return content;
};

const Perfil: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { goals, diet_type, fitness_level, full_name, loading, refetch } = useProfile();
  const { avatarUrl, updateAvatarUrl } = useAvatar();
  const { lifePhase } = useLifePhase();
  const isPregnant = lifePhase === 'pregnant';

  const lifePhaseLabel: Record<string, string> = {
    menstruating: '🌙 ' + t('life_phase.menstruating'),
    pregnant: '🤰 ' + t('life_phase.pregnant'),
    postpartum: '🌸 ' + t('life_phase.postpartum'),
    menopause: '💜 ' + t('life_phase.menopause'),
  };

  if (!user) {
    return (
      <PageLayout>
        <div className="hero-gradient pt-12 pb-6 px-4">
          <motion.h1 className="text-2xl font-bold text-foreground mb-2" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            {t('profile.title')}
          </motion.h1>
        </div>
        <div className="px-4 mt-8"><AuthForm /></div>
      </PageLayout>
    );
  }

  const currentLang = languages.find(l => i18n.language?.startsWith(l.code));

  return (
    <PageLayout>
      <div className="hero-gradient pt-12 pb-6 px-4">
        <motion.h1 className="text-2xl font-bold text-foreground mb-2" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          {t('profile.title')}
        </motion.h1>
      </div>

      <div className="px-4 space-y-4">
        {/* User Info Card */}
        <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-4">
            <AvatarUpload
              currentAvatarUrl={avatarUrl}
              onAvatarChange={updateAvatarUrl}
              fallbackInitial={full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
            />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{full_name || user.email}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('profile.member')}</p>
            </div>
          </div>

          {goals.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Target className="w-4 h-4" /> {t('profile.goals')}
              </p>
              <div className="flex flex-wrap gap-2">
                {goals.map((goalId) => {
                  const goal = goalConfig[goalId];
                  if (!goal) return null;
                  const Icon = goal.icon;
                  return (
                    <Badge key={goalId} variant="outline" className={`${goal.color} px-3 py-1 flex items-center gap-1.5`}>
                      <Icon className="w-3.5 h-3.5" /> {t(goal.labelKey)}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {(diet_type || fitness_level) && (
            <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2">
              {diet_type && dietConfig[diet_type] && (
                <Badge variant="outline" className="bg-accent/50 text-accent-foreground border-accent px-3 py-1 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5" />
                  {dietConfig[diet_type].icon} {t(dietConfig[diet_type].labelKey)}
                </Badge>
              )}
              {fitness_level && activityConfig[fitness_level] && (
                <Badge variant="outline" className="bg-secondary text-secondary-foreground border-border px-3 py-1 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  {activityConfig[fitness_level].icon} {t(activityConfig[fitness_level].labelKey)}
                </Badge>
              )}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <PatternsCard />
        </motion.div>

        {isPregnant && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <BellyPhotoGallery />
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <WeeklySummaryCard />
        </motion.div>

        {/* Settings Menu */}
        <motion.div
          className="glass-card overflow-hidden divide-y divide-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <MenuItem icon={Crown} label={t('profile.view_plans')} sublabel={t('profile.view_plans_sub')} iconClassName="bg-amber-100 text-amber-600" onClick={() => navigate('/planos')} />

          <MenuItem icon={Sparkles} label={t('profile.life_phase')} sublabel={lifePhase ? lifePhaseLabel[lifePhase] || '' : ''} iconClassName="bg-pink-100 text-pink-600">
            <LifePhaseSelector />
          </MenuItem>

          <MenuItem icon={Globe} label={t('profile.language')} sublabel={currentLang ? `${currentLang.flag} ${currentLang.label}` : ''} iconClassName="bg-sky-100 text-sky-600">
            <div className="flex flex-col gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${
                    i18n.language?.startsWith(lang.code)
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </MenuItem>

          <MenuItem icon={Lock} label={t('profile.change_password')} sublabel={t('profile.change_password_sub')} iconClassName="bg-violet-100 text-violet-600">
            <ChangePasswordCard />
          </MenuItem>

          <MenuItem icon={Settings} label={t('profile.preferences')} sublabel={t('profile.preferences_sub')} iconClassName="bg-slate-100 text-slate-600">
            <ProfileSettingsEditor currentGoals={goals} currentDiet={diet_type} currentFitness={fitness_level} onUpdate={refetch} />
          </MenuItem>

          <MenuItem icon={CalendarDays} label={t('profile.dum')} sublabel={t('profile.dum_sub')} iconClassName="bg-rose-100 text-rose-600">
            <DUMPicker />
          </MenuItem>

          <MenuItem icon={Pill} label={t('profile.contraceptive_title')} sublabel={t('profile.contraceptive_sub')} iconClassName="bg-pink-100 text-pink-600">
            <ContraceptiveConfig />
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">{t('profile.continuous_medication')}</h3>
              <MedicationTracker />
            </div>
          </MenuItem>

          <MenuItem icon={Bell} label={t('profile.notifications')} sublabel={t('profile.notifications_sub')} iconClassName="bg-emerald-100 text-emerald-600">
            <NotificationSettings />
          </MenuItem>

          {lifePhase === 'menopause' && (
            <MenuItem icon={Gauge} label={t('menopause.alert_settings_title')} sublabel={t('menopause.alert_settings_sub')} iconClassName="bg-orange-100 text-orange-600">
              <MenopauseAlertSettings />
            </MenuItem>
          )}

          <MenuItem icon={FileText} label={t('profile.medical_report')} sublabel={t('profile.medical_report_sub')} iconClassName="bg-amber-100 text-amber-600">
            <MedicalReportButton />
          </MenuItem>

          <MenuItem icon={Trash2} label={t('profile.delete_account')} sublabel={t('profile.delete_account_sub')} iconClassName="bg-red-100 text-red-600">
            <DeleteAccountButton />
          </MenuItem>

          <MenuItem icon={HelpCircle} label="FAQ & Suporte" sublabel="Dúvidas frequentes e contato" iconClassName="bg-sky-100 text-sky-600" onClick={() => navigate('/faq')} />
        </motion.div>

        <Button onClick={signOut} variant="outline" className="w-full mt-6 mb-4">
          <LogOut className="w-4 h-4 mr-2" /> {t('actions.sign_out')}
        </Button>

        <div className="flex justify-center gap-4 text-xs text-muted-foreground mb-8">
          <a href="/privacidade" className="hover:underline">{t('profile.privacy_policy')}</a>
          <span>•</span>
          <a href="/termos" className="hover:underline">{t('profile.terms')}</a>
        </div>
      </div>
    </PageLayout>
  );
};

export default Perfil;
