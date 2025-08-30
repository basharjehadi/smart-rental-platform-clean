import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Conversation, Message } from './useChatRealtime';

interface UseChatReturn {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  joinConversation: (conversationId: string) => void;
  leaveConversation: () => void;
  sendMessage: (content: string, replyToId?: string) => Promise<void>;
  loadMessages: (conversationId: string, page?: number) => Promise<void>;
  loadConversations: () => Promise<void>;
  loadUnreadCount: () => Promise<void>;
}

export const useChat = (): UseChatReturn => {
  const { token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesPollRef = useRef<number | null>(null);
  const conversationsPollRef = useRef<number | null>(null);

  const API_BASE =
    (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

  // Load conversations from API
  const loadConversations = useCallback(async () => {
    console.log('🔍 loadConversations called');
    console.log('🔍 token exists:', !!token);

    if (!token) {
      console.log('❌ No token, returning early');
      return;
    }

    try {
      console.log('🔄 Setting loading state...');
      setIsLoading(true);

      const url = `${API_BASE}/messaging/conversations`;
      console.log('🔍 Fetching from URL:', url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 Response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to load conversations');
      }

      const data = await response.json();
      console.log('✅ Conversations data received:', data);
      console.log('✅ Number of conversations:', data.length);

      setConversations(data);
      console.log('✅ Conversations state updated');
    } catch (err) {
      console.error('❌ Error in loadConversations:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load conversations'
      );
    } finally {
      console.log('🔄 Setting loading to false');
      setIsLoading(false);
    }
  }, [token]);

  // Load messages for a conversation
  const loadMessages = useCallback(
    async (conversationId: string, page = 1) => {
      if (!token) return;

      try {
        const response = await fetch(
          `${API_BASE}/messaging/conversations/${conversationId}/messages?page=${page}&limit=50`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) throw new Error('Failed to load messages');

        const data = await response.json();

        if (page === 1) {
          setMessages(data);
        } else {
          setMessages(prev => [...data, ...prev]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load messages'
        );
      }
    },
    [token]
  );

  // Load messages for active conversation
  useEffect(() => {
    if (messagesPollRef.current) {
      clearInterval(messagesPollRef.current);
      messagesPollRef.current = null;
    }

    if (!activeConversation || !token) return;

    // Initial fetch only - no polling needed
    loadMessages(activeConversation.id).catch(() => {});

    // Removed polling - unnecessary backend calls
  }, [activeConversation?.id, token, loadMessages]);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE}/messaging/conversations/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to load unread count');

      const data = await response.json();
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  }, [token]);

  // Load conversations and unread count
  useEffect(() => {
    if (conversationsPollRef.current) {
      clearInterval(conversationsPollRef.current);
      conversationsPollRef.current = null;
    }

    if (!token) return;

    // Initial refresh only - no polling needed
    loadConversations().catch(() => {});
    loadUnreadCount().catch(() => {});

    // Removed polling - unnecessary backend calls
  }, [token, loadConversations, loadUnreadCount]);

  // Join a specific conversation
  const joinConversation = useCallback(
    (conversationId: string) => {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setActiveConversation(conversation);
        loadMessages(conversationId);
      }
    },
    [conversations, loadMessages]
  );

  // Leave conversation
  const leaveConversation = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
  }, []);

  // Send text message
  const sendMessage = useCallback(
    async (content: string, replyToId?: string) => {
      if (!activeConversation || !token || !content.trim()) return;

      try {
        const response = await fetch(
          `${API_BASE}/messaging/conversations/${activeConversation.id}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: content.trim(),
              replyToId,
            }),
          }
        );

        if (!response.ok) throw new Error('Failed to send message');

        const message = await response.json();
        setMessages(prev => [...prev, message]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
      }
    },
    [activeConversation, token]
  );

  return {
    conversations,
    activeConversation,
    messages,
    unreadCount,
    isLoading,
    error,
    joinConversation,
    leaveConversation,
    sendMessage,
    loadMessages,
    loadConversations,
    loadUnreadCount,
  };
};
