import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from 'lucide-react';
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
import AdaptiveHomeCard from '@/components/home/AdaptiveHomeCard';
import SOSPartnerButton from '@/components/home/SOSPartnerButton';
import WaterTracker from '@/components/home/WaterTracker';

import PillTracker from '@/components/home/PillTracker';
import DeviceExpirationCard from '@/components/home/DeviceExpirationCard';
import NextPeriodCard from '@/components/home/NextPeriodCard';
import LatePeriodCard from '@/components/home/LatePeriodCard';
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
import MenopauseExerciseCard from '@/components/home/MenopauseExerciseCard';
import NextContraceptiveCard from '@/components/home/NextContraceptiveCard';
import TutorialOverlay from '@/components/tutorial/TutorialOverlay';
import UpgradeBanner from '@/components/subscription/UpgradeBanner';
import TrialExpirationBanner from '@/components/subscription/TrialExpirationBanner';
import PWAInstallBanner from '@/components/home/PWAInstallBanner';
import { homeTutorialSteps } from '@/components/tutorial/tutorialSteps';
import { useCycle } from '@/contexts/CycleContext';
import { useSelectedDate } from '@/contexts/SelectedDateContext';
import { useContraceptive } from '@/hooks/useContraceptive';
import { useLifePhase } from '@/hooks/useLifePhase';
import { isPillMethod, hasExpirationDate, isHormonalMethod } from '@/data/contraceptiveMethods';

const Index: React.FC = () => {
  const { t } = useTranslation();
  const {
    getPhaseInfo,
    hasDUM,
    isLate
  } = useCycle();
  const {
    isToday
  } = useSelectedDate();
  const {
    contraceptive_type
  } = useContraceptive();
  const {
    lifePhase,
    pregnancyWeeks,
    pregnancyStartDate,
    isTryingToConceive,
    age,
    loading: lifePhaseLoading
  } = useLifePhase();
  const phaseInfo = getPhaseInfo();
  const [showCalendar, setShowCalendar] = useState(false);
  const showPillTracker = isPillMethod(contraceptive_type);
  const showDeviceExpiration = hasExpirationDate(contraceptive_type);
  const usesHormonal = isHormonalMethod(contraceptive_type);

  // Determine what mode we're in based on life phase
  const isPregnant = lifePhase === 'pregnant';
  const isMenopause = lifePhase === 'menopause';
  const isMenstruating = lifePhase === 'menstruating' || !lifePhase;

  return (
    <PageLayout>
      <div className="hero-gradient pt-12 pb-6 my-[10px] py-0">
        <motion.div
          className="text-center mb-6 px-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header with Streak and Calendar */}
          <div className="flex items-center justify-between mb-4">
            <GardenStreak />
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setShowCalendar(!showCalendar)}>
                <Calendar className="w-5 h-5 text-primary" />
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mt-1">
            {isToday
              ? isPregnant
                ? t('home.subtitle_pregnant')
                : isMenopause
                  ? t('home.subtitle_menopause')
                  : t('home.subtitle_menstruating')
              : t('home.subtitle_history')}
          </p>
        </motion.div>

        {/* Calendar Dropdown */}
        <AnimatePresence>
          {showCalendar && (
            <div className="px-4 mb-4">
              <HistoryCalendar onClose={() => setShowCalendar(false)} onDaySelect={() => setShowCalendar(false)} />
            </div>
          )}
        </AnimatePresence>

        {/* Show CycleWheel only for menstruating users viewing today */}
        {isToday && isMenstruating && <CycleWheel />}
        
        {/* Cycle Sync Insight Card - Right below the wheel for menstruating users */}
        {isToday && isMenstruating && <CycleSyncInsightCard />}
      </div>

      <div className="space-y-4 mt-4">
        {/* Trial Expiration Banner */}
        {isToday && <TrialExpirationBanner />}
        
        {/* Upgrade Banner for free users */}
        {isToday && <UpgradeBanner />}

        {/* PWA Install Banner */}
        {isToday && <PWAInstallBanner />}

        {/* === PREGNANT MODE === */}
        {isToday && isPregnant && pregnancyWeeks !== null && pregnancyStartDate && (
          <PregnancyWeeksCard weeks={pregnancyWeeks} pregnancyStartDate={pregnancyStartDate} />
        )}
        {isToday && isPregnant && pregnancyWeeks !== null && pregnancyWeeks >= 20 && (
          <KickCounterCard />
        )}
        {isToday && isPregnant && pregnancyWeeks !== null && pregnancyWeeks >= 36 && (
          <ContractionTimerCard />
        )}
        {isToday && isPregnant && <BirthCountdownCard />}
        {isToday && isPregnant && <WeeklyPregnancyInsight />}
        {isToday && isPregnant && pregnancyWeeks !== null && pregnancyWeeks >= 28 && <BirthPlanCard />}
        {isToday && isPregnant && <GestationalWeightTracker />}
        {isToday && isPregnant && pregnancyWeeks !== null && pregnancyWeeks >= 34 && <HospitalBagCard />}
        {isToday && isPregnant && <BabyRegistryCard />}
        {isToday && isPregnant && pregnancyWeeks !== null && pregnancyWeeks >= 32 && <BirthPlaylistCard />}
        {isToday && isPregnant && <AppointmentChecklist />}
        {isToday && isPregnant && <PregnancyDiaryCard />}

        {/* === MENOPAUSE MODE === */}
        {isToday && isMenopause && <MenopauseWellnessHub age={age} />}
        {isToday && isMenopause && (
          <div className="mx-4 space-y-4">
            <MenopauseSleepTracker />
            <MenopauseExerciseCard />
          </div>
        )}

        {/* === MENSTRUATING MODE === */}
        {isToday && isMenstruating && (
          <>
            {/* Trying to Conceive Card - Golden Fertile Window */}
            {isTryingToConceive && <TryingToConceiveCard />}

            {/* Period State Cards - Conditional based on DUM and late status */}
            {!isPregnant && (
              <>
                {!hasDUM ? (
                  <AwaitingPeriodCard />
                ) : isLate ? (
                  <LatePeriodCard />
                ) : (
                  <NextPeriodCard />
                )}
              </>
            )}

            {/* Next Contraceptive Reminder (Injection, Ring, Patch) */}
            <NextContraceptiveCard />
          </>
        )}

        {/* Show historical data summary when viewing past dates */}
        {!isToday && <DayDataSummary />}
        
        {/* IntimacyLog drawer - always rendered so it can receive events from DayDataSummary */}
        {!isToday && <IntimacyLog hideTrigger />}
        
        {/* Show current day components when viewing today */}
        {isToday && (
          <>
            {/* Adaptive Home Card - Shows based on contraceptive method (menstruating only, NOT pregnant) */}
            {isMenstruating && !isPregnant && <AdaptiveHomeCard />}
            
            {/* Water Tracker - All modes */}
            <WaterTracker />

            {/* Pill Tracker - Menstruating only, NOT pregnant */}
            {isMenstruating && !isPregnant && showPillTracker && (
              <div className="px-4">
                <PillTracker />
              </div>
            )}

            {/* Device Expiration Card (DIU/Implant) - Menstruating only, NOT pregnant */}
            {isMenstruating && !isPregnant && showDeviceExpiration && (
              <div className="px-4">
                <DeviceExpirationCard />
              </div>
            )}
            
            {/* Recipe of the Day - All modes */}
            <RecipeOfTheDayCard />
            
            {/* Chef Suggestion - All modes */}
            <ChefSuggestion />
            
            
            {/* Quick Log - All modes */}
            <QuickLog />
            
            {/* SOS Partner FAB */}
            <SOSPartnerButton />
          </>
        )}
      </div>

      {/* Tutorial Overlay */}
      <TutorialOverlay tutorialKey="home" steps={homeTutorialSteps} />
    </PageLayout>
  );
};

export default Index;
