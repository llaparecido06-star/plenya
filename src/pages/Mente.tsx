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

const Mente: React.FC = () => {
  const { t } = useTranslation();
  const { lifePhase } = useLifePhase();
  const isPregnant = lifePhase === 'pregnant';
  const isMenopause = lifePhase === 'menopause';
  const isPostpartum = lifePhase === 'postpartum';

  return (
    <PageLayout>
      <div className="hero-gradient pt-12 pb-4 px-4">
        <motion.h1
          className="text-2xl font-bold text-foreground mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {t('mind.title')}
        </motion.h1>
        <p className="text-muted-foreground">
          {isPregnant ? t('mind.subtitle_pregnant') : isMenopause ? t('mind.subtitle_menopause') : lifePhase === 'postpartum' ? t('mind.subtitle_postpartum', 'Saúde emocional no pós-parto') : t('mind.subtitle')}
        </p>
      </div>

      <div className="px-4 mb-4">
        <BreathingCard />
      </div>

      {/* Life-phase specific meditation/breathing tips */}
      {(isPregnant || isMenopause) && (
        <div className="px-4 mb-4">
          <LifePhaseBreathingCard />
        </div>
      )}

      <Tabs defaultValue="checkin" className="px-4">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="checkin">{t('mind.checkin_tab')}</TabsTrigger>
          <TabsTrigger value="chat">{t('mind.chat_tab')}</TabsTrigger>
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
