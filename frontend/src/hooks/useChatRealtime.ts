import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

export interface Message {
  id: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'SYSTEM';
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
  isRead: boolean;
  readAt?: string;
  senderId: string;
  sender: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  replyTo?: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  title?: string;
  type: 'DIRECT' | 'GROUP' | 'PROPERTY';
  propertyId?: string;
  offerId?: string;
  status: 'PENDING' | 'ACTIVE' | 'ARCHIVED';
  property?: {
    id: string;
    name: string;
    address: string;
    city: string;
    district?: string;
    zipCode: string;
    country: string;
    propertyType: string;
    monthlyRent: number;
    depositAmount?: number;
    bedrooms?: number;
    bathrooms?: number;
    size?: number;
    images?: string | string[];
  };
  offer?: {
    id: string;
    status: 'PAID' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
    rentAmount?: number;
    depositAmount?: number;
  };
  participants: {
    id: string;
    userId: string;
    role: 'ADMIN' | 'MEMBER' | 'READONLY';
    user: {
      id: string;
      name: string;
      email: string;
      profileImage?: string;
      role: string;
    };
  }[];
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface UseChatReturn {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  hasMore: boolean;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  joinConversation: (conversationId: string) => void;
  leaveConversation: () => void;
  sendMessage: (
    content: string,
    file?: File,
    replyToId?: string
  ) => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  typingUsers: { userId: string; userName: string }[];
  loadMessages: (conversationId: string, page?: number) => Promise<void>;
  loadOlderMessages: () => Promise<void>;
  loadConversations: () => Promise<void>;
  loadUnreadCount: () => Promise<void>;
}

export const useChat = (): UseChatReturn => {
  const { token } = useAuth();
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagePage, setMessagePage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<
    { userId: string; userName: string }[]
  >([]);
  const hasJoinedRef = useRef(false);
  const activeConversationRef = useRef<Conversation | null>(null);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  const API_BASE =
    (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

  // Load conversations via REST
  const loadConversations = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/messaging/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to load conversations');
      const data = await res.json();
      setConversations(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load conversations'
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Load messages via REST
  const loadMessages = useCallback(
    async (conversationId: string, page = 1) => {
      if (!token) return;
      try {
        const limit = 50;
        const res = await fetch(
          `${API_BASE}/messaging/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (!res.ok) throw new Error('Failed to load messages');
        const data = await res.json();

        if (page === 1) {
          setMessages(data);
          setHasMore(Array.isArray(data) && data.length === limit);
        } else {
          setMessages(prev => [...data, ...prev]);
          setHasMore(Array.isArray(data) && data.length === limit);
        }

        setMessagePage(page);

        // Mark as read for messages not sent by current user
        try {
          const unreadIds = (Array.isArray(data) ? data : [])
            .filter(
              m =>
                m.senderId &&
                m.senderId !== (activeConversation as any)?.currentUserId &&
                !m.isRead
            )
            .map(m => m.id);
          if (unreadIds.length > 0) {
            await fetch(
              `${API_BASE}/messaging/conversations/${conversationId}/messages/read`,
              {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messageIds: unreadIds }),
              }
            );
          }
        } catch (_) {
          // soft fail
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load messages'
        );
      }
    },
    [token, activeConversation]
  );

  const loadOlderMessages = useCallback(async () => {
    if (!activeConversation || !hasMore) {
      return;
    }

    await loadMessages(activeConversation.id, messagePage + 1);

    // If we got fewer messages than expected, we've reached the end
    if (messages.length < 50) {
      setHasMore(false);
    }
  }, [activeConversation, hasMore, messagePage, loadMessages, messages.length]);

  // Unread count via REST
  const loadUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(
        `${API_BASE}/messaging/conversations/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) throw new Error('Failed to load unread count');
      const data = await res.json();
      setUnreadCount(data.unreadCount ?? data.totalUnread ?? 0);
    } catch (err) {
      // soft-fail
    }
  }, [token]);

  // Join conversation
  const joinConversation = useCallback(
    (conversationId: string) => {
      const convo = conversations.find(c => c.id === conversationId);

      if (!convo) {
        return;
      }

      setActiveConversation(convo);
      setMessages([]);
      setMessagePage(1);
      setHasMore(true);
      loadMessages(conversationId, 1);
      if (socket && isConnected) {
        socket.emit('join-conversation', conversationId);
      }
    },
    [conversations, loadMessages, socket, isConnected]
  );

  const leaveConversation = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
  }, []);

  // Send message with de-dupe (no optimistic to avoid duplicates with socket)
  const sendMessage = useCallback(
    async (content: string, file?: File, replyToId?: string) => {
      if (!activeConversation || !token || (!content.trim() && !file)) return;

      try {
        const url = `${API_BASE}/messaging/conversations/${activeConversation.id}/messages`;

        let res: Response;
        if (file) {
          const form = new FormData();
          if (content && content.trim()) form.append('content', content.trim());
          if (replyToId) form.append('replyToId', replyToId);
          form.append('attachment', file);
          res = await fetch(url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: form,
          });
        } else {
          res = await fetch(url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: content.trim(), replyToId }),
          });
        }

        if (!res.ok) throw new Error('Failed to send message');

        const actualMessage = await res.json();

        // Append only if not already present (socket may have delivered it)
        setMessages(prev =>
          prev.some(m => m.id === actualMessage.id)
            ? prev
            : [...prev, actualMessage]
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
      }
    },
    [activeConversation, token]
  );

  // Typing helpers
  const startTyping = useCallback(() => {
    if (socket && isConnected && activeConversation) {
      socket.emit('typing', activeConversation.id);
    }
  }, [socket, isConnected, activeConversation]);

  const stopTyping = useCallback(() => {
    if (socket && isConnected && activeConversation) {
      socket.emit('stop-typing', activeConversation.id);
    }
  }, [socket, isConnected, activeConversation]);

  // Socket lifecycle with improved message handling
  useEffect(() => {
    if (!socket || !isConnected || !token) return;

    // Join only once per connection to avoid heavy repeated DB work
    if (!hasJoinedRef.current) {
      socket.emit('join-conversations');
      hasJoinedRef.current = true;
    }

    const handleConversationsLoaded = (data: Conversation[]) => {
      setConversations(data);

      // Update activeConversation if it exists to get latest data (including property details)
      if (activeConversationRef.current) {
        const updatedActive = data.find(
          c => c.id === activeConversationRef.current?.id
        );
        if (updatedActive) {
          setActiveConversation(updatedActive);
        }
      }
    };

    const handleNewMessage = (msg: Message & { conversationId?: string }) => {
      console.log('🔌 Socket: New message received:', msg);

      // If message belongs to active conversation, append if not already present
      const currentActive = activeConversationRef.current;
      if (currentActive && msg && msg.conversationId === currentActive.id) {
        console.log('✅ Adding message to active conversation');
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          if (prev.some(m => m.id === msg.id)) {
            console.log('⚠️ Message already exists, skipping');
            return prev;
          }
          console.log('✅ Adding new message to messages array');
          return [...prev, msg];
        });
      } else {
        console.log(
          '🔄 Message not for active conversation, refreshing conversations'
        );
        // Otherwise refresh counts and conversations list lightly
        loadUnreadCount();
        loadConversations();
      }
    };

    const handleUserTyping = (payload: {
      userId: string;
      userName: string;
    }) => {
      setTypingUsers(prev => {
        if (prev.some(p => p.userId === payload.userId)) return prev;
        return [...prev, payload];
      });
    };

    const handleUserStopTyping = (payload: { userId: string }) => {
      setTypingUsers(prev => prev.filter(p => p.userId !== payload.userId));
    };

    socket.on('conversations-loaded', handleConversationsLoaded);
    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stop-typing', handleUserStopTyping);
    socket.on(
      'message-read',
      (payload: { messageId: string; readAt?: string }) => {
        setMessages(prev =>
          prev.map(m =>
            m.id === payload.messageId
              ? { ...m, isRead: true, readAt: payload.readAt || m.readAt }
              : m
          )
        );
      }
    );

    const onDisconnect = () => {
      hasJoinedRef.current = false;
    };
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('conversations-loaded', handleConversationsLoaded);
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stop-typing', handleUserStopTyping);
      socket.off('message-read');
      socket.off('disconnect', onDisconnect);
    };
  }, [socket, isConnected, token, loadUnreadCount, loadConversations]);

  // Initial loads
  useEffect(() => {
    if (token) {
      loadConversations();
      loadUnreadCount();
    }
  }, [token, loadConversations, loadUnreadCount]);

  // Light fallback polling only when socket is disconnected
  useEffect(() => {
    if (!token) return;
    if (isConnected) return; // socket covers real-time, no polling

    const id = window.setInterval(() => {
      loadConversations().catch(() => {});
      const current = activeConversationRef.current;
      if (current) {
        loadMessages(current.id).catch(() => {});
      }
    }, 8000); // gentle 8s interval

    return () => {
      clearInterval(id);
    };
  }, [token, isConnected, loadConversations, loadMessages]);

  return {
    conversations,
    activeConversation,
    messages,
    hasMore,
    unreadCount,
    isLoading,
    error,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    typingUsers,
    loadMessages,
    loadOlderMessages,
    loadConversations,
    loadUnreadCount,
  };
};
