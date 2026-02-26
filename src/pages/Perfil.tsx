import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/auth/AuthForm';
import { Button } from '@/components/ui/button';
import { LogOut, Target, Dumbbell, Heart, Baby, Activity, Utensils, Zap, Crown, Globe } from 'lucide-react';
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
import { useTranslation } from 'react-i18next';

// Goal configuration for badges
const goalConfig: Record<string, { labelKey: string; icon: React.ElementType; color: string }> = {
  lose_weight: { labelKey: 'goals.lose_weight', icon: Target, color: 'bg-terracotta/20 text-terracotta border-terracotta/30' },
  gain_muscle: { labelKey: 'goals.gain_muscle', icon: Dumbbell, color: 'bg-leaf-green/20 text-leaf-green border-leaf-green/30' },
  pms_relief: { labelKey: 'goals.pms_relief', icon: Heart, color: 'bg-burnt-pink/20 text-burnt-pink border-burnt-pink/30' },
  get_pregnant: { labelKey: 'goals.get_pregnant', icon: Baby, color: 'bg-terracotta/20 text-terracotta border-terracotta/30' },
  health_monitor: { labelKey: 'goals.health_monitor', icon: Activity, color: 'bg-leaf-green/20 text-leaf-green border-leaf-green/30' },
};

// Diet configuration for badge
const dietConfig: Record<string, { labelKey: string; icon: string }> = {
  omnivore: { labelKey: 'diet.omnivore', icon: '🍖' },
  vegetarian: { labelKey: 'diet.vegetarian', icon: '🥗' },
  vegan: { labelKey: 'diet.vegan', icon: '🌱' },
  low_carb: { labelKey: 'diet.low_carb', icon: '🥑' },
  lactose_free: { labelKey: 'diet.lactose_free', icon: '🥛' },
};

// Activity configuration for badge
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

const Perfil: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { goals, diet_type, fitness_level, full_name, loading, refetch } = useProfile();
  const { avatarUrl, updateAvatarUrl } = useAvatar();

  if (!user) {
    return (
      <PageLayout>
        <div className="hero-gradient pt-12 pb-6 px-4">
          <motion.h1
            className="text-2xl font-bold text-foreground mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {t('profile.title')}
          </motion.h1>
        </div>
        <div className="px-4 mt-8">
          <AuthForm />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="hero-gradient pt-12 pb-6 px-4">
        <motion.h1
          className="text-2xl font-bold text-foreground mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {t('profile.title')}
        </motion.h1>
      </div>

      <div className="px-4 space-y-4">
        <motion.div
          className="glass-card p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
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

          {/* Goals Badges */}
          {goals.length > 0 && (
            <motion.div
              className="mt-4 pt-4 border-t border-border"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Target className="w-4 h-4" />
                {t('profile.goals')}
              </p>
              <div className="flex flex-wrap gap-2">
                {goals.map((goalId) => {
                  const goal = goalConfig[goalId];
                  if (!goal) return null;
                  const Icon = goal.icon;
                  return (
                    <Badge 
                      key={goalId} 
                      variant="outline"
                      className={`${goal.color} px-3 py-1 flex items-center gap-1.5`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t(goal.labelKey)}
                    </Badge>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Diet & Activity Badges */}
          {(diet_type || fitness_level) && (
            <motion.div
              className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {diet_type && dietConfig[diet_type] && (
                <Badge 
                  variant="outline"
                  className="bg-amber-100/50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-300/50 px-3 py-1 flex items-center gap-1.5"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  {dietConfig[diet_type].icon} {t(dietConfig[diet_type].labelKey)}
                </Badge>
              )}
              {fitness_level && activityConfig[fitness_level] && (
                <Badge 
                  variant="outline"
                  className="bg-blue-100/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-300/50 px-3 py-1 flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  {activityConfig[fitness_level].icon} {t(activityConfig[fitness_level].labelKey)}
                </Badge>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Language Selector */}
        <motion.div
          className="glass-card p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            {t('profile.language')}
          </h3>
          <div className="flex gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                  i18n.language?.startsWith(lang.code)
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="block text-xs mt-0.5">{lang.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Subscription Plans Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => navigate('/planos')}
          >
            <Crown className="w-4 h-4 text-primary" />
            {t('profile.view_plans')}
          </Button>
        </motion.div>

        {/* Profile Settings Editor */}
        <ProfileSettingsEditor
          currentGoals={goals}
          currentDiet={diet_type}
          currentFitness={fitness_level}
          onUpdate={refetch}
        />

        {/* DUM Calendar Picker */}
        <DUMPicker />

        {/* Contraceptive Configuration */}
        <motion.div
          className="glass-card p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            {t('profile.contraceptive_title')}
          </h3>
          <ContraceptiveConfig />
        </motion.div>

        {/* Medication Tracker */}
        <MedicationTracker />

        {/* Patterns Card - Cycle Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <PatternsCard />
        </motion.div>

        {/* Weekly Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <WeeklySummaryCard />
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <NotificationSettings />
        </motion.div>

        {/* Change Password */}
        <ChangePasswordCard />

        {/* Medical Report Button */}
        <MedicalReportButton />

        <Button
          onClick={signOut}
          variant="outline"
          className="w-full mt-6"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t('actions.sign_out')}
        </Button>

        {/* Delete Account */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-24"
        >
          <DeleteAccountButton />
        </motion.div>

        {/* Legal Links */}
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
