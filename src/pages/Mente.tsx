import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ChatInterface from '@/components/mind/ChatInterface';
import EmotionalCheckin from '@/components/mind/EmotionalCheckin';
import BreathingCard from '@/components/mind/BreathingCard';
import LifePhaseBreathingCard from '@/components/mind/LifePhaseBreathingCard';
import TutorialOverlay from '@/components/tutorial/TutorialOverlay';
import { mindTutorialSteps } from '@/components/tutorial/tutorialSteps';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { useLifePhase } from '@/hooks/useLifePhase';
import { Brain } from 'lucide-react';

const Mente: React.FC = () => {
  const { t } = useTranslation();
  const { lifePhase } = useLifePhase();
  const isPregnant = lifePhase === 'pregnant';
  const isMenopause = lifePhase === 'menopause';
  const isPostpartum = lifePhase === 'postpartum';

  const getSubtitle = () => {
    if (isPregnant) return t('mind.subtitle_pregnant');
    if (isMenopause) return t('mind.subtitle_menopause');
    if (isPostpartum) return t('mind.subtitle_postpartum', 'Saúde emocional no pós-parto');
    return t('mind.subtitle');
  };

  return (
    <PageLayout>
      <div className="px-5 pt-10 pb-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-1"
        >
          <div className="p-2 rounded-xl bg-primary/10">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('mind.title')}</h1>
            <p className="text-sm text-muted-foreground">{getSubtitle()}</p>
          </div>
        </motion.div>
      </div>

      <div className="px-4 mb-3">
        <BreathingCard />
      </div>

      {(isPregnant || isMenopause || isPostpartum) && (
        <div className="px-4 mb-3">
          <LifePhaseBreathingCard />
        </div>
      )}

      <Tabs defaultValue="checkin" className="px-4">
        <TabsList className="grid w-full grid-cols-2 mb-3 rounded-xl h-10">
          <TabsTrigger value="checkin" className="rounded-lg text-sm">{t('mind.checkin_tab')}</TabsTrigger>
          <TabsTrigger value="chat" className="rounded-lg text-sm">{t('mind.chat_tab')}</TabsTrigger>
        </TabsList>
        <TabsContent value="checkin">
          <EmotionalCheckin />
        </TabsContent>
        <TabsContent value="chat" className="-mx-4">
          <ChatInterface />
        </TabsContent>
      </Tabs>

      <TutorialOverlay tutorialKey="mind" steps={mindTutorialSteps} />
    </PageLayout>
  );
};

export default Mente;
