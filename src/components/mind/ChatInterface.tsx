import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCycle } from '@/contexts/CycleContext';
import { useChatMessages } from '@/hooks/useChatMessages';

const ChatInterface: React.FC = () => {
  const { messages, loading, addMessage } = useChatMessages();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getPhaseInfo } = useCycle();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateResponse = (userMessage: string): string => {
    const phaseInfo = getPhaseInfo();
    const responses = [
      `Entendo como você se sente. Na fase ${phaseInfo.name}, é natural experimentar essas emoções. ${phaseInfo.insight}`,
      `Obrigada por compartilhar isso comigo. Lembre-se: você está na fase ${phaseInfo.name}, e seu corpo está passando por mudanças naturais. Seja gentil consigo mesma. 💜`,
      `Isso faz muito sentido. Uma técnica que pode ajudar agora é a respiração 4-7-8: inspire por 4 segundos, segure por 7 e expire por 8. Quer tentar juntas?`,
      `Você está fazendo um ótimo trabalho ao reconhecer e expressar seus sentimentos. Na fase ${phaseInfo.name}, pratique o autocuidado sem culpa.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // Save user message
    await addMessage('user', input);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(async () => {
      const response = generateResponse(input);
      await addMessage('assistant', response);
      setIsTyping(false);
    }, 1500);
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
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Chat header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <div className="p-2 rounded-xl phase-gradient">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Assistente de Bem-estar</h3>
          <p className="text-xs text-muted-foreground">Sempre aqui para você</p>
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
                  <p className="text-sm leading-relaxed">{message.content}</p>
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
              <div className="flex gap-1">
                <motion.div
                  className="w-2 h-2 rounded-full bg-muted-foreground"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 rounded-full bg-muted-foreground"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 rounded-full bg-muted-foreground"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                />
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
            placeholder="Digite sua mensagem..."
            className="flex-1 rounded-full bg-secondary border-none"
          />
          <motion.button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-3 rounded-full phase-gradient text-white disabled:opacity-50"
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
