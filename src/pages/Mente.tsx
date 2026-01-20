import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ChatInterface from '@/components/mind/ChatInterface';
import EmotionalCheckin from '@/components/mind/EmotionalCheckin';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Mente: React.FC = () => {
  return (
    <PageLayout>
      <div className="hero-gradient pt-12 pb-4 px-4">
        <motion.h1
          className="text-2xl font-bold text-foreground mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Mente
        </motion.h1>
        <p className="text-muted-foreground">Cuide do seu bem-estar emocional</p>
      </div>

      <Tabs defaultValue="chat" className="px-4">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="checkin">Check-in</TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="-mx-4">
          <ChatInterface />
        </TabsContent>
        <TabsContent value="checkin">
          <EmotionalCheckin />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default Mente;
