import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Share2, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

import PageLayout from '@/components/layout/PageLayout';
import CycleWheel from '@/components/cycle/CycleWheel';
import CycleSyncInsightCard from '@/components/cycle/CycleSyncInsightCard';
import QuickLog from '@/components/cycle/QuickLog';
import ChefSuggestion from '@/components/cycle/ChefSuggestion';
import HistoryCalendar from '@/components/history/HistoryCalendar';
import DayDataSummary from '@/components/history/DayDataSummary';
import IntimacyLog from '@/components/cycle/IntimacyLog';
import GardenStreak from '@/components/home/GardenStreak';
import LifePhaseBadge from '@/components/home/LifePhaseBadge';
import AdaptiveHomeCard from '@/components/home/AdaptiveHomeCard';
import SOSPartnerButton from '@/components/home/SOSPartnerButton';
import WaterTracker from '@/components/home/WaterTracker';
import PillTracker from '@/components/home/PillTracker';
import DeviceExpirationCard from '@/components/home/DeviceExpirationCard';
import NextPeriodCard from '@/components/home/NextPeriodCard';
import LatePeriodCard from '@/components/home/LatePeriodCard';
import PMSPredictionCard from '@/components/home/PMSPredictionCard';
import CycleDiaryCard from '@/components/home/CycleDiaryCard';
import CycleSymptomMap from '@/components/home/CycleSymptomMap';
import CycleComparatorCard from '@/components/home/CycleComparatorCard';
import MonthlyReportCard from '@/components/home/MonthlyReportCard';
import AwaitingPeriodCard from '@/components/home/AwaitingPeriodCard';
import PregnancyWeeksCard from '@/components/home/PregnancyWeeksCard';
import TryingToConceiveCard from '@/components/home/TryingToConceiveCard';
import MenopauseWellnessHub from '@/components/home/MenopauseWellnessHub';
import KickCounterCard from '@/components/home/KickCounterCard';
import AppointmentChecklist from '@/components/home/AppointmentChecklist';
import PregnancyDiaryCard from '@/components/home/PregnancyDiaryCard';
import BirthCountdownCard from '@/components/home/BirthCountdownCard';
import RecipeOfTheDayCard from '@/components/home/RecipeOfTheDayCard';
import BirthPlanCard from '@/components/home/BirthPlanCard';
import BabyRegistryCard from '@/components/home/BabyRegistryCard';
import GestationalWeightTracker from '@/components/home/GestationalWeightTracker';
import BirthPlaylistCard from '@/components/home/BirthPlaylistCard';
import WeeklyPregnancyInsight from '@/components/home/WeeklyPregnancyInsight';
import ContractionTimerCard from '@/components/home/ContractionTimerCard';
import HospitalBagCard from '@/components/home/HospitalBagCard';
import MenopauseSleepTracker from '@/components/home/MenopauseSleepTracker';
import WearableSleepImport from '@/components/home/WearableSleepImport';
import HotFlashSleepCorrelation from '@/components/home/HotFlashSleepCorrelation';
import MenopauseWeeklySummary from '@/components/home/MenopauseWeeklySummary';
import MenopauseExerciseCard from '@/components/home/MenopauseExerciseCard';
import MenopauseMonthlyTrends from '@/components/home/MenopauseMonthlyTrends';
import MenopauseSymptomChart from '@/components/home/MenopauseSymptomChart';
import MenopauseDiaryCard from '@/components/home/MenopauseDiaryCard';
import HotFlashCounter from '@/components/home/HotFlashCounter';
import MenopauseExamsCard from '@/components/home/MenopauseExamsCard';
import HRTTracker from '@/components/home/HRTTracker';
import MenopauseWeightChart from '@/components/home/MenopauseWeightChart';
import HotFlashInsights from '@/components/home/HotFlashInsights';
import MenopauseReportCard from '@/components/home/MenopauseReportCard';
import MenopauseAlertHistory from '@/components/home/MenopauseAlertHistory';
import LifePhaseTransitionCard from '@/components/home/LifePhaseTransitionCard';
import WeeklySummaryCard from '@/components/home/WeeklySummaryCard';
import PregnancyWeeklySummaryCard from '@/components/home/PregnancyWeeklySummaryCard';
import PostpartumWeeklySummaryCard from '@/components/home/PostpartumWeeklySummaryCard';
import NextContraceptiveCard from '@/components/home/NextContraceptiveCard';
import MedicationQuickLog from '@/components/home/MedicationQuickLog';
import PostpartumWeeksCard from '@/components/home/PostpartumWeeksCard';
import PostpartumRecoveryCard from '@/components/home/PostpartumRecoveryCard';
import PostpartumEvolutionChart from '@/components/home/PostpartumEvolutionChart';
import BreastfeedingTracker from '@/components/home/BreastfeedingTracker';
import CycleReturnCard from '@/components/home/CycleReturnCard';
import TutorialOverlay from '@/components/tutorial/TutorialOverlay';
import UpgradeBanner from '@/components/subscription/UpgradeBanner';
import TrialExpirationBanner from '@/components/subscription/TrialExpirationBanner';
import PWAInstallBanner from '@/components/home/PWAInstallBanner';
import MaluOrbHero from '@/components/home/MaluOrbHero';
import ShareHormonalDayModal from '@/components/home/ShareHormonalDayModal';
import { homeTutorialSteps } from '@/components/tutorial/tutorialSteps';
import { useCycle } from '@/contexts/CycleContext';
import { useSelectedDate } from '@/contexts/SelectedDateContext';
import { useContraceptive } from '@/hooks/useContraceptive';
import { useLifePhase } from '@/hooks/useLifePhase';
import { isPillMethod, hasExpirationDate } from '@/data/contraceptiveMethods';

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

/* ── Expandable section toggle ── */
const ExpandSection: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? 'Ocultar' : label}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Index: React.FC = () => {
  const { t } = useTranslation();
  const { getPhaseInfo, hasDUM, isLate } = useCycle();
  const { isToday } = useSelectedDate();
  const { contraceptive_type } = useContraceptive();
  const {
    lifePhase, pregnancyWeeks, pregnancyStartDate,
    postpartumWeeks, isTryingToConceive, age, loading: lifePhaseLoading,
  } = useLifePhase();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const showPillTracker = isPillMethod(contraceptive_type);
  const showDeviceExpiration = hasExpirationDate(contraceptive_type);

  const isPregnant = lifePhase === 'pregnant';
  const isMenopause = lifePhase === 'menopause';
  const isPostpartum = lifePhase === 'postpartum';
  const isMenstruating = lifePhase === 'menstruating' || (!lifePhase && !isPostpartum);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greeting_morning', 'Bom dia');
    if (hour < 18) return t('home.greeting_afternoon', 'Boa tarde');
    return t('home.greeting_evening', 'Boa noite');
  };

  return (
    <PageLayout>
      {/* ── Header ── */}
      <div className="pt-safe-top px-5 pt-10 pb-2">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              {getGreeting()} ✨
            </h1>
            <div className="flex items-center gap-1">
              <GardenStreak />
              <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9" onClick={() => setShowCalendar(!showCalendar)}>
                <Calendar className="w-[18px] h-[18px] text-muted-foreground" />
              </Button>
            </div>
          </div>
          {isToday && (
            <div className="mt-1">
              <LifePhaseBadge />
            </div>
          )}
        </motion.div>
      </div>

      {/* Calendar */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div className="px-4 mb-3" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <HistoryCalendar onClose={() => setShowCalendar(false)} onDaySelect={() => setShowCalendar(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <div className="space-y-4 pb-4">

        {/* Malu Orb — hero insight */}
        {isToday && (
          <div className="px-4">
            <MaluOrbHero />
          </div>
        )}

        {/* Banners (conditional, self-hiding) */}
        {isToday && (
          <div className="space-y-2">
            <TrialExpirationBanner />
            <UpgradeBanner />
            <PWAInstallBanner />
          </div>
        )}

        {/* ── CYCLE WHEEL (menstruating) ── */}
        {isToday && isMenstruating && (
          <motion.div className="px-4" {...fadeUp} transition={{ delay: 0.05 }}>
            <CycleWheel />
          </motion.div>
        )}

        {/* Cycle Sync Insight */}
        {isToday && <CycleSyncInsightCard />}

        {/* ═══ MENSTRUATING ═══ */}
        {isToday && isMenstruating && (
          <div className="space-y-4">
            {/* Priority cards */}
            {!isPregnant && (
              <motion.div {...fadeUp}>
                {!hasDUM ? <AwaitingPeriodCard /> : isLate ? <LatePeriodCard /> : <NextPeriodCard />}
              </motion.div>
            )}

            {isTryingToConceive && <TryingToConceiveCard />}

            <motion.div {...fadeUp}><PMSPredictionCard /></motion.div>

            <motion.div {...fadeUp}><QuickLog /></motion.div>

            {/* Adaptive & Contraceptive */}
            {isMenstruating && !isPregnant && <AdaptiveHomeCard />}
            {showPillTracker && <div className="px-4"><PillTracker /></div>}
            {showDeviceExpiration && <div className="px-4"><DeviceExpirationCard /></div>}

            {/* Secondary: diary, analysis, reports */}
            <ExpandSection label="Ver análise do ciclo">
              <NextContraceptiveCard />
              <MedicationQuickLog />
              <div className="px-4"><WeeklySummaryCard /></div>
              <CycleDiaryCard />
              <CycleSymptomMap />
              <CycleComparatorCard />
              <MonthlyReportCard />
            </ExpandSection>
          </div>
        )}

        {/* ═══ PREGNANT ═══ */}
        {isToday && isPregnant && (
          <div className="space-y-4">
            {pregnancyWeeks !== null && pregnancyStartDate && (
              <PregnancyWeeksCard weeks={pregnancyWeeks} pregnancyStartDate={pregnancyStartDate} />
            )}
            <BirthCountdownCard />
            <WeeklyPregnancyInsight />

            {pregnancyWeeks !== null && pregnancyWeeks >= 20 && <KickCounterCard />}
            {pregnancyWeeks !== null && pregnancyWeeks >= 36 && <ContractionTimerCard />}

            <ExpandSection label="Ver mais sobre a gestação">
              {pregnancyWeeks !== null && pregnancyWeeks >= 28 && <BirthPlanCard />}
              <GestationalWeightTracker />
              {pregnancyWeeks !== null && pregnancyWeeks >= 34 && <HospitalBagCard />}
              <BabyRegistryCard />
              {pregnancyWeeks !== null && pregnancyWeeks >= 32 && <BirthPlaylistCard />}
              <PregnancyWeeklySummaryCard />
              <AppointmentChecklist />
              <PregnancyDiaryCard />
              <LifePhaseTransitionCard />
            </ExpandSection>
          </div>
        )}

        {/* ═══ MENOPAUSE ═══ */}
        {isToday && isMenopause && (
          <div className="space-y-4">
            <MenopauseWellnessHub age={age} />
            <MenopauseWeeklySummary />
            <HotFlashCounter />

            <ExpandSection label="Ver mais sobre menopausa">
              <HotFlashInsights />
              <HotFlashSleepCorrelation />
              <HRTTracker />
              <MenopauseDiaryCard />
              <MenopauseExamsCard />
              <MenopauseReportCard />
              <MenopauseAlertHistory />
              <div className="mx-4 space-y-3">
                <MenopauseMonthlyTrends />
                <MenopauseWeightChart />
                <MenopauseSleepTracker />
                <WearableSleepImport />
                <MenopauseSymptomChart />
                <MenopauseExerciseCard />
              </div>
            </ExpandSection>
          </div>
        )}

        {/* ═══ POSTPARTUM ═══ */}
        {isToday && isPostpartum && (
          <div className="space-y-4">
            <PostpartumWeeksCard />
            <PostpartumRecoveryCard />
            <BreastfeedingTracker />

            <ExpandSection label="Ver evolução pós-parto">
              <PostpartumEvolutionChart />
              <PostpartumWeeklySummaryCard />
              <CycleReturnCard />
            </ExpandSection>
          </div>
        )}

        {/* ── Historical view ── */}
        {!isToday && <DayDataSummary />}
        {!isToday && <IntimacyLog hideTrigger />}

        {/* ── Common daily cards ── */}
        {isToday && (
          <div className="space-y-4">
            <WaterTracker />
            <RecipeOfTheDayCard />
            <ChefSuggestion />
            <SOSPartnerButton />
          </div>
        )}

        {/* Share button */}
        {isToday && isMenstruating && hasDUM && (
          <div className="px-4">
            <Button
              onClick={() => setShowShareModal(true)}
              variant="outline"
              className="w-full h-11 rounded-2xl border-primary/20 text-sm hover:-translate-y-0.5 hover:shadow-md transition-all"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar meu Dia Hormonal ✨
            </Button>
          </div>
        )}
      </div>

      <ShareHormonalDayModal open={showShareModal} onClose={() => setShowShareModal(false)} />
      <TutorialOverlay tutorialKey="home" steps={homeTutorialSteps} />
    </PageLayout>
  );
};

export default Index;
