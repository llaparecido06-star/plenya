import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const INITIAL_MESSAGE: Message = {
  id: 'initial',
  role: 'assistant',
  content: 'Olá! 💜 Sou sua assistente de bem-estar. Como você está se sentindo hoje? Posso ajudar com reflexões, técnicas de relaxamento ou simplesmente ouvir.',
  timestamp: new Date(),
};

export const useChatMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(true);

  // Load messages on mount
  useEffect(() => {
    if (!user) {
      setMessages([INITIAL_MESSAGE]);
      setLoading(false);
      return;
    }

    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const loadedMessages: Message[] = data.map(msg => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at),
          }));
          setMessages(loadedMessages);
        } else {
          // If no messages, keep the initial greeting
          setMessages([INITIAL_MESSAGE]);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([INITIAL_MESSAGE]);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [user]);

  const addMessage = useCallback(async (
    role: 'user' | 'assistant',
    content: string
  ): Promise<Message | null> => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    };

    // Optimistically update UI
    setMessages(prev => [...prev, newMessage]);

    // If user is authenticated, persist to database
    if (user) {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .insert({
            user_id: user.id,
            role,
            content,
          })
          .select()
          .single();

        if (error) throw error;

        // Update with real ID from database
        const persistedMessage: Message = {
          id: data.id,
          role: data.role as 'user' | 'assistant',
          content: data.content,
          timestamp: new Date(data.created_at),
        };

        setMessages(prev =>
          prev.map(m => (m.id === newMessage.id ? persistedMessage : m))
        );

        return persistedMessage;
      } catch (error) {
        console.error('Error saving message:', error);
        // Keep the optimistic update even if save fails
      }
    }

    return newMessage;
  }, [user]);

  const clearMessages = useCallback(async () => {
    if (!user) {
      setMessages([INITIAL_MESSAGE]);
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting messages:', error);
    }

    setMessages([INITIAL_MESSAGE]);
  }, [user]);

  return {
    messages,
    loading,
    addMessage,
    clearMessages,
    isAuthenticated: !!user,
  };
};
