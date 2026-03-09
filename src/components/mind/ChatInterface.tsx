import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { useCycle } from '@/contexts/CycleContext';
import { useLifePhase } from '@/hooks/useLifePhase';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useAIBrain } from '@/hooks/useAIBrain';
import { usePregnancyDiarySymptoms } from '@/hooks/usePregnancyDiarySymptoms';
import PremiumGate from '@/components/subscription/PremiumGate';

const ChatInterface: React.FC = () => {
  const { t } = useTranslation();
  const { messages, loading, addMessage } = useChatMessages();
  const { chat, loading: aiLoading } = useAIBrain();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getPhaseInfo } = useCycle();
  const { lifePhase, pregnancyWeeks, postpartumWeeks } = useLifePhase();
  const { symptoms: pregnancySymptoms } = usePregnancyDiarySymptoms();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || aiLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Save user message
    await addMessage('user', userMessage);
    setIsTyping(true);

    // Build conversation history for context
    const history = messages.slice(-10).map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    const phaseInfo = getPhaseInfo();
    const trimester = pregnancyWeeks ? (pregnancyWeeks <= 12 ? 1 : pregnancyWeeks <= 27 ? 2 : 3) : null;

    // Call AI Brain
    const response = await chat({
      message: userMessage,
      history,
      life_phase: lifePhase,
      pregnancy_weeks: pregnancyWeeks,
      pregnancy_trimester: lifePhase === 'pregnant' ? trimester : null,
      pregnancy_symptoms: lifePhase === 'pregnant' ? pregnancySymptoms : null,
      phase_name: phaseInfo.name,
      postpartum_weeks: lifePhase === 'postpartum' ? postpartumWeeks : null,
    });

    setIsTyping(false);

    if (response) {
      await addMessage('assistant', response);
    } else {
      // Fallback response if AI fails
      await addMessage('assistant', t('chat.error_fallback'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <motion.div
          className="p-4 rounded-full phase-gradient"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-6 h-6 text-white" />
        </motion.div>
      </div>
    );
  }

  return (
    <PremiumGate feature="Chat com IA Plenya" mode="banner">
    <div id="chat-interface" className="flex flex-col h-[calc(100vh-200px)]">
      {/* Chat header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <div className="p-2 rounded-xl phase-gradient">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{t('chat.title')}</h3>
          <p className="text-xs text-muted-foreground">
            {lifePhase === 'pregnant' 
              ? t('chat.subtitle_pregnant')
              : lifePhase === 'menopause'
              ? t('chat.subtitle_menopause')
              : t('chat.subtitle_default')}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex gap-2 max-w-[85%]">
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-phase-secondary flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={
                    message.role === 'user'
                      ? 'chat-bubble-user'
                      : 'chat-bubble-assistant'
                  }
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2"
          >
            <div className="w-8 h-8 rounded-full bg-phase-secondary flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="chat-bubble-assistant">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('chat.typing')}</span>
                <div className="flex gap-1">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-primary"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 rounded-full bg-primary"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 rounded-full bg-primary"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/50">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('chat.placeholder')}
            className="flex-1 rounded-full bg-secondary border-none"
            disabled={aiLoading}
          />
          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || aiLoading}
            className="p-3 rounded-full phase-gradient text-white disabled:opacity-50"
            whileTap={{ scale: 0.95 }}
          >
            {aiLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
    </PremiumGate>
  );
};

export default ChatInterface;
