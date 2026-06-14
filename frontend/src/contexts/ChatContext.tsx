// frontend/src/contexts/ChatContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import * as chatService from '../services/chat.service';
import type { Product } from '../services/product.service';
import { useAuth } from './AuthContext';

export interface ChatMessage {
  _id: string;
  sessionId: string;
  sender: 'user' | 'ai';
  message: string;
  createdAt: string;
  triggeredSearch?: boolean;
  searchResults?: Product[];
}

export interface ChatSession {
  sessionId: string;
  lastMessage: string;
  lastMessageDate: string;
  messageCount: number;
}

export interface ChatContextType {
  currentSessionId: string | null;
  messages: ChatMessage[];
  sessions: ChatSession[];
  isLoading: boolean;
  isSending: boolean;
  sendMessage: (message: string, imageBase64?: string) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  createNewSession: () => void;
  deleteSession: (sessionId: string) => Promise<void>;
  clearAllHistory: () => Promise<void>;
}

interface RawChatMessage {
  _id: string;
  sessionId: string;
  sender: 'user' | 'ai';
  message: string;
  createdAt: string;
  triggeredSearch?: boolean;
  searchResults?: Array<{ productId: string; score: number } | Product>;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const isFullProduct = (item: unknown): item is Product => {
    return item !== null && typeof item === 'object' && 'name' in item && 'price' in item;
  };

  const enrichMessage = async (msg: RawChatMessage): Promise<ChatMessage> => {
    if (!msg.triggeredSearch || !msg.searchResults?.length) {
      return msg as ChatMessage;
    }

    const firstItem = msg.searchResults[0];
    if (firstItem && isFullProduct(firstItem)) {
      return msg as ChatMessage;
    }

    const productIds = msg.searchResults
      .map(item => (item && typeof item === 'object' && 'productId' in item) ? item.productId : null)
      .filter(Boolean) as string[];
    
    if (productIds.length === 0) {
      return { ...msg, searchResults: [] };
    }

    try {
      const products = await Promise.all(
        productIds.map(async (id) => {
          try {
            // getProductById returns Product directly, not { data: Product }
            const product = await chatService.getProductById(id);
            return product;
          } catch {
            return null;
          }
        })
      );
      const validProducts = products.filter((p): p is Product => p !== null);
      return { ...msg, searchResults: validProducts };
    } catch (error) {
      console.error('Failed to enrich search results:', error);
      return { ...msg, searchResults: [] };
    }
  };

  const loadSessions = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await chatService.getUserSessions();
      setSessions(res.data);
      if (res.data.length && !currentSessionId) {
        setCurrentSessionId(res.data[0]?.sessionId || null);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  }, [isAuthenticated, currentSessionId]);

  const loadSession = useCallback(async (sessionId: string) => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await chatService.getConversationHistory(sessionId);
      const enrichedMessages = await Promise.all(res.data.map(enrichMessage));
      setMessages(enrichedMessages);
      setCurrentSessionId(sessionId);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const sendMessage = useCallback(async (message: string, imageBase64?: string) => {
    if (!isAuthenticated) return;
    const trimmed = message.trim();
    if (!trimmed && !imageBase64) return;
    setIsSending(true);
    try {
      const res = await chatService.sendMessage(trimmed, currentSessionId || undefined, imageBase64);
      const { sessionId, userMessage, aiMessage } = res;
      if (!currentSessionId) setCurrentSessionId(sessionId);
      const enrichedAiMessage = await enrichMessage(aiMessage as RawChatMessage);
      setMessages(prev => [...prev, userMessage as ChatMessage, enrichedAiMessage]);
      await loadSessions();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  }, [isAuthenticated, currentSessionId, loadSessions]);

  const createNewSession = useCallback(() => {
    setCurrentSessionId(null);
    setMessages([]);
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    if (!isAuthenticated) return;
    try {
      await chatService.deleteSession(sessionId);
      if (sessionId === currentSessionId) {
        const remaining = sessions.filter(s => s.sessionId !== sessionId);
        if (remaining.length) {
          await loadSession(remaining[0]?.sessionId || '');
        } else {
          setCurrentSessionId(null);
          setMessages([]);
        }
      }
      await loadSessions();
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  }, [isAuthenticated, currentSessionId, sessions, loadSession, loadSessions]);

  const clearAllHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      await chatService.clearAllHistory();
      setSessions([]);
      setCurrentSessionId(null);
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadSessions();
    } else {
      setSessions([]);
      setMessages([]);
      setCurrentSessionId(null);
    }
  }, [isAuthenticated, loadSessions]);

  const value: ChatContextType = {
    currentSessionId,
    messages,
    sessions,
    isLoading,
    isSending,
    sendMessage,
    loadSession,
    createNewSession,
    deleteSession,
    clearAllHistory,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};