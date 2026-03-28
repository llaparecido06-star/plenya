import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Share2 } from 'lucide-react';
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
import ManuOrbHero from '@/components/home/ManuOrbHero';
import ShareHormonalDayModal from '@/components/home/ShareHormonalDayModal';
import { homeTutorialSteps } from '@/components/tutorial/tutorialSteps';
import { useCycle } from '@/contexts/CycleContext';
import { useSelectedDate } from '@/contexts/SelectedDateContext';
import { useContraceptive } from '@/hooks/useContraceptive';
import { useLifePhase } from '@/hooks/useLifePhase';
import { isPillMethod, hasExpirationDate, isHormonalMethod } from '@/data/contraceptiveMethods';

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
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
  const phaseInfo = getPhaseInfo();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const showPillTracker = isPillMethod(contraceptive_type);
  const showDeviceExpiration = hasExpirationDate(contraceptive_type);

  const isPregnant = lifePhase === 'pregnant';
  const isMenopause = lifePhase === 'menopause';
  const isPostpartum = lifePhase === 'postpartum';
  const isMenstruating = lifePhase === 'menstruating' || (!lifePhase && !isPostpartum);

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greeting_morning', 'Bom dia');
    if (hour < 18) return t('home.greeting_afternoon', 'Boa tarde');
    return t('home.greeting_evening', 'Boa noite');
  };

  return (
    <PageLayout>
      {/* === COMPACT HEADER === */}
      <div className="pt-safe-top px-5 pt-10 pb-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Top row: greeting + calendar */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-foreground">
                {getGreeting()} ✨
              </h1>
            </div>
            <div className="flex items-center gap-1">
              <GardenStreak />
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl h-9 w-9"
                onClick={() => setShowCalendar(!showCalendar)}
              >
                <Calendar className="w-[18px] h-[18px] text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Subtitle + badge */}
          <div className="flex items-center gap-2 mt-1">
            {isToday && <LifePhaseBadge />}
          </div>
        </motion.div>
      </div>

      {/* Calendar Dropdown */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div
            className="px-4 mb-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <HistoryCalendar onClose={() => setShowCalendar(false)} onDaySelect={() => setShowCalendar(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* === MANU ORB HERO === */}
      {isToday && (
        <div className="px-4">
          <ManuOrbHero />
        </div>
      )}

      {/* === CYCLE HERO (menstruating only) === */}
      {isToday && isMenstruating && (
        <motion.div
          className="px-4 mb-2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <CycleWheel />
        </motion.div>
      )}

      {/* Cycle Sync Insight Card */}
      {isToday && <CycleSyncInsightCard />}

      {/* === BANNERS === */}
      <motion.div className="space-y-3 mt-3" variants={stagger} initial="initial" animate="animate">
        {isToday && (
          <motion.div variants={fadeUp}><TrialExpirationBanner /></motion.div>
        )}
        {isToday && (
          <motion.div variants={fadeUp}><UpgradeBanner /></motion.div>
        )}
        {isToday && (
          <motion.div variants={fadeUp}><PWAInstallBanner /></motion.div>
        )}
      </motion.div>

      {/* === MAIN CONTENT SECTIONS === */}
      <motion.div
        className="space-y-3 mt-2"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        {/* === PREGNANT MODE === */}
        {isToday && isPregnant && (
          <>
            {pregnancyWeeks !== null && pregnancyStartDate && (
              <motion.div variants={fadeUp}>
                <PregnancyWeeksCard weeks={pregnancyWeeks} pregnancyStartDate={pregnancyStartDate} />
              </motion.div>
            )}
            {pregnancyWeeks !== null && pregnancyWeeks >= 20 && (
              <motion.div variants={fadeUp}><KickCounterCard /></motion.div>
            )}
            {pregnancyWeeks !== null && pregnancyWeeks >= 36 && (
              <motion.div variants={fadeUp}><ContractionTimerCard /></motion.div>
            )}
            <motion.div variants={fadeUp}><BirthCountdownCard /></motion.div>
            <motion.div variants={fadeUp}><WeeklyPregnancyInsight /></motion.div>
            {pregnancyWeeks !== null && pregnancyWeeks >= 28 && (
              <motion.div variants={fadeUp}><BirthPlanCard /></motion.div>
            )}
            <motion.div variants={fadeUp}><GestationalWeightTracker /></motion.div>
            {pregnancyWeeks !== null && pregnancyWeeks >= 34 && (
              <motion.div variants={fadeUp}><HospitalBagCard /></motion.div>
            )}
            <motion.div variants={fadeUp}><BabyRegistryCard /></motion.div>
            {pregnancyWeeks !== null && pregnancyWeeks >= 32 && (
              <motion.div variants={fadeUp}><BirthPlaylistCard /></motion.div>
            )}
            <motion.div variants={fadeUp}><PregnancyWeeklySummaryCard /></motion.div>
            <motion.div variants={fadeUp}><AppointmentChecklist /></motion.div>
            <motion.div variants={fadeUp}><PregnancyDiaryCard /></motion.div>
            <motion.div variants={fadeUp}><LifePhaseTransitionCard /></motion.div>
          </>
        )}

        {/* === MENOPAUSE MODE === */}
        {isToday && isMenopause && (
          <>
            <motion.div variants={fadeUp}><MenopauseWellnessHub age={age} /></motion.div>
            <motion.div variants={fadeUp}><MenopauseWeeklySummary /></motion.div>
            <motion.div variants={fadeUp}><HotFlashCounter /></motion.div>
            <motion.div variants={fadeUp}><HotFlashInsights /></motion.div>
            <motion.div variants={fadeUp}><HotFlashSleepCorrelation /></motion.div>
            <motion.div variants={fadeUp}><HRTTracker /></motion.div>
            <motion.div variants={fadeUp}><MenopauseDiaryCard /></motion.div>
            <motion.div variants={fadeUp}><MenopauseExamsCard /></motion.div>
            <motion.div variants={fadeUp}><MenopauseReportCard /></motion.div>
            <motion.div variants={fadeUp}><MenopauseAlertHistory /></motion.div>
            <motion.div variants={fadeUp} className="mx-4 space-y-3">
              <MenopauseMonthlyTrends />
              <MenopauseWeightChart />
              <MenopauseSleepTracker />
              <WearableSleepImport />
              <MenopauseSymptomChart />
              <MenopauseExerciseCard />
            </motion.div>
          </>
        )}

        {/* === POSTPARTUM MODE === */}
        {isToday && isPostpartum && (
          <>
            <motion.div variants={fadeUp}><PostpartumWeeksCard /></motion.div>
            <motion.div variants={fadeUp}><PostpartumRecoveryCard /></motion.div>
            <motion.div variants={fadeUp}><BreastfeedingTracker /></motion.div>
            <motion.div variants={fadeUp}><PostpartumEvolutionChart /></motion.div>
            <motion.div variants={fadeUp}><PostpartumWeeklySummaryCard /></motion.div>
            <motion.div variants={fadeUp}><CycleReturnCard /></motion.div>
          </>
        )}

        {/* === MENSTRUATING MODE === */}
        {isToday && isMenstruating && (
          <>
            {isTryingToConceive && (
              <motion.div variants={fadeUp}><TryingToConceiveCard /></motion.div>
            )}
            <motion.div variants={fadeUp}><PMSPredictionCard /></motion.div>

            {!isPregnant && (
              <motion.div variants={fadeUp}>
                {!hasDUM ? <AwaitingPeriodCard /> : isLate ? <LatePeriodCard /> : <NextPeriodCard />}
              </motion.div>
            )}

            <motion.div variants={fadeUp}><NextContraceptiveCard /></motion.div>
            <motion.div variants={fadeUp}><MedicationQuickLog /></motion.div>

            <motion.div variants={fadeUp} className="px-4">
              <WeeklySummaryCard />
            </motion.div>

            <motion.div variants={fadeUp}><CycleDiaryCard /></motion.div>
            <motion.div variants={fadeUp}><CycleSymptomMap /></motion.div>
            <motion.div variants={fadeUp}><CycleComparatorCard /></motion.div>
            <motion.div variants={fadeUp}><MonthlyReportCard /></motion.div>
          </>
        )}

        {/* Historical data */}
        {!isToday && <DayDataSummary />}
        {!isToday && <IntimacyLog hideTrigger />}

        {/* Today common cards */}
        {isToday && (
          <>
            {isMenstruating && !isPregnant && (
              <motion.div variants={fadeUp}><AdaptiveHomeCard /></motion.div>
            )}
            <motion.div variants={fadeUp}><WaterTracker /></motion.div>

            {isMenstruating && !isPregnant && showPillTracker && (
              <motion.div variants={fadeUp} className="px-4"><PillTracker /></motion.div>
            )}
            {isMenstruating && !isPregnant && showDeviceExpiration && (
              <motion.div variants={fadeUp} className="px-4"><DeviceExpirationCard /></motion.div>
            )}

            <motion.div variants={fadeUp}><RecipeOfTheDayCard /></motion.div>
            <motion.div variants={fadeUp}><ChefSuggestion /></motion.div>
            <motion.div variants={fadeUp}><QuickLog /></motion.div>
            <SOSPartnerButton />
          </>
        )}
      </motion.div>

      {/* Share button */}
      {isToday && isMenstruating && hasDUM && (
        <div className="px-4 pb-4">
          <Button
            onClick={() => setShowShareModal(true)}
            variant="outline"
            className="w-full h-12 rounded-2xl border-primary/20 hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar meu Dia Hormonal ✨
          </Button>
        </div>
      )}

      <ShareHormonalDayModal open={showShareModal} onClose={() => setShowShareModal(false)} />
      <TutorialOverlay tutorialKey="home" steps={homeTutorialSteps} />
    </PageLayout>
  );
};

export default Index;
