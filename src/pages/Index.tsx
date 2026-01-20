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
import { useCycle } from '@/contexts/CycleContext';
import { useSelectedDate } from '@/contexts/SelectedDateContext';

const Index: React.FC = () => {
  const { getPhaseInfo } = useCycle();
  const { isToday } = useSelectedDate();
  const phaseInfo = getPhaseInfo();
  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <PageLayout>
      <div className="hero-gradient pt-12 pb-6">
        <motion.div
          className="text-center mb-6 px-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Ciclos</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCalendar(!showCalendar)}
              className="ml-2"
            >
              <Calendar className="w-5 h-5 text-primary" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isToday ? 'Seu assistente de vida sincronizado' : 'Visualizando histórico'}
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
            <ChefSuggestion />
            <InsightCard />
            <QuickLog />
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default Index;
