import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageLayout from '@/components/layout/PageLayout';
import CycleWheel from '@/components/cycle/CycleWheel';
import InsightCard from '@/components/cycle/InsightCard';
import CycleSyncInsightCard from '@/components/cycle/CycleSyncInsightCard';
import QuickLog from '@/components/cycle/QuickLog';
import ChefSuggestion from '@/components/cycle/ChefSuggestion';
import HistoryCalendar from '@/components/history/HistoryCalendar';
import DayDataSummary from '@/components/history/DayDataSummary';
import GardenStreak from '@/components/home/GardenStreak';
import AdaptiveHomeCard from '@/components/home/AdaptiveHomeCard';
import SOSPartnerButton from '@/components/home/SOSPartnerButton';
import WaterTracker from '@/components/home/WaterTracker';
import IntimacyCard from '@/components/home/IntimacyCard';
import PillTracker from '@/components/home/PillTracker';
import DeviceExpirationCard from '@/components/home/DeviceExpirationCard';
import NextPeriodCard from '@/components/home/NextPeriodCard';
import LatePeriodCard from '@/components/home/LatePeriodCard';
import AwaitingPeriodCard from '@/components/home/AwaitingPeriodCard';
import PregnancyWeeksCard from '@/components/home/PregnancyWeeksCard';
import TryingToConceiveCard from '@/components/home/TryingToConceiveCard';
import MenopauseCard from '@/components/home/MenopauseCard';
import RecipeOfTheDayCard from '@/components/home/RecipeOfTheDayCard';

import TutorialOverlay from '@/components/tutorial/TutorialOverlay';
import { homeTutorialSteps } from '@/components/tutorial/tutorialSteps';
import { useCycle } from '@/contexts/CycleContext';
import { useSelectedDate } from '@/contexts/SelectedDateContext';
import { useContraceptive } from '@/hooks/useContraceptive';
import { useLifePhase } from '@/hooks/useLifePhase';
import { isPillMethod, hasExpirationDate, isHormonalMethod } from '@/data/contraceptiveMethods';

const Index: React.FC = () => {
  const { getPhaseInfo, hasDUM, isLate } = useCycle();
  const { isToday } = useSelectedDate();
  const { contraceptive_type } = useContraceptive();
  const { lifePhase, pregnancyWeeks, pregnancyStartDate, isTryingToConceive, age, loading: lifePhaseLoading } = useLifePhase();
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
      <div className="hero-gradient pt-12 pb-6">
        <motion.div
          className="text-center mb-6 px-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header with Streak and Calendar */}
          <div className="flex items-center justify-between mb-4">
            <GardenStreak streak={3} />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              <Calendar className="w-5 h-5 text-primary" />
            </Button>
          </div>
          
          <h1 className="text-2xl font-bold text-foreground">Plenya</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isToday 
              ? isPregnant 
                ? 'Acompanhando sua gestação' 
                : isMenopause 
                  ? 'Seu bem-estar em primeiro lugar'
                  : 'Sinta-se em casa no seu corpo' 
              : 'Visualizando histórico'}
          </p>
        </motion.div>

        {/* Calendar Dropdown */}
        <AnimatePresence>
          {showCalendar && (
            <div className="px-4 mb-4">
              <HistoryCalendar onClose={() => setShowCalendar(false)} />
            </div>
          )}
        </AnimatePresence>

        {/* Show CycleWheel only for menstruating users viewing today */}
        {isToday && isMenstruating && <CycleWheel />}
        
        {/* Cycle Sync Insight Card - Right below the wheel for menstruating users */}
        {isToday && isMenstruating && <CycleSyncInsightCard />}
      </div>

      <div className="space-y-4 mt-4">
        {/* === PREGNANT MODE === */}
        {isToday && isPregnant && pregnancyWeeks !== null && pregnancyStartDate && (
          <PregnancyWeeksCard weeks={pregnancyWeeks} pregnancyStartDate={pregnancyStartDate} />
        )}

        {/* === MENOPAUSE MODE === */}
        {isToday && isMenopause && (
          <MenopauseCard age={age} />
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
                  // No DUM registered - show awaiting card
                  <AwaitingPeriodCard />
                ) : isLate ? (
                  // Period is late - show late card
                  <LatePeriodCard />
                ) : (
                  // Normal state - show next period prediction
                  <NextPeriodCard />
                )}
              </>
            )}
          </>
        )}

        {/* Show historical data summary when viewing past dates */}
        {!isToday && <DayDataSummary />}
        
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
            
            {/* Intimacy & Health Card - Menstruating and Menopause */}
            {(isMenstruating || isMenopause) && (
              <div className="px-4">
                <IntimacyCard />
              </div>
            )}
            
            {/* Insight Card - Menstruating only */}
            {isMenstruating && <InsightCard />}
            
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
