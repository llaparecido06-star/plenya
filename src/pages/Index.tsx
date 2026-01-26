import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageLayout from '@/components/layout/PageLayout';
import CycleWheel from '@/components/cycle/CycleWheel';
import InsightCard from '@/components/cycle/InsightCard';
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
import TutorialOverlay from '@/components/tutorial/TutorialOverlay';
import { homeTutorialSteps } from '@/components/tutorial/tutorialSteps';
import { useCycle } from '@/contexts/CycleContext';
import { useSelectedDate } from '@/contexts/SelectedDateContext';
import { useContraceptive } from '@/hooks/useContraceptive';
import { isPillMethod, hasExpirationDate, isHormonalMethod } from '@/data/contraceptiveMethods';

const Index: React.FC = () => {
  const { getPhaseInfo } = useCycle();
  const { isToday } = useSelectedDate();
  const { contraceptive_type } = useContraceptive();
  const phaseInfo = getPhaseInfo();
  const [showCalendar, setShowCalendar] = useState(false);

  const showPillTracker = isPillMethod(contraceptive_type);
  const showDeviceExpiration = hasExpirationDate(contraceptive_type);
  const usesHormonal = isHormonalMethod(contraceptive_type);

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
            {isToday ? 'Sinta-se em casa no seu corpo' : 'Visualizando histórico'}
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

        {/* Show CycleWheel only for today */}
        {isToday && <CycleWheel />}
      </div>

      <div className="space-y-6 mt-6">
        {/* Show historical data summary when viewing past dates */}
        {!isToday && <DayDataSummary />}
        
        {/* Show current day components when viewing today */}
        {isToday && (
          <>
            {/* Adaptive Home Card - Shows based on contraceptive method */}
            <AdaptiveHomeCard />
            
            {/* Water Tracker */}
            <WaterTracker />
            {showPillTracker && (
              <div className="px-4">
                <PillTracker />
              </div>
            )}

            {/* Device Expiration Card (DIU/Implant) */}
            {showDeviceExpiration && (
              <div className="px-4">
                <DeviceExpirationCard />
              </div>
            )}
            
            {/* Chef Suggestion */}
            <ChefSuggestion />
            
            {/* Intimacy & Health Card */}
            <div className="px-4">
              <IntimacyCard />
            </div>
            
            {/* Insight Card */}
            <InsightCard />
            
            {/* Quick Log */}
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
