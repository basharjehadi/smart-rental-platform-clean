import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

interface Message {
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

interface Conversation {
  id: string;
  title?: string;
  type: 'DIRECT' | 'GROUP' | 'PROPERTY';
  propertyId?: string;
  property?: {
    id: string;
    name: string;
    address: string;
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

interface TypingUser {
  userId: string;
  userName: string;
}

interface UseChatReturn {
  socket: Socket | null;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  typingUsers: TypingUser[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (content: string, replyToId?: string) => void;
  sendFile: (file: File, replyToId?: string) => Promise<void>;
  markAsRead: (messageIds: string[]) => void;
  startTyping: () => void;
  stopTyping: () => void;
  createConversation: (participantIds: string[], propertyId?: string, title?: string) => Promise<Conversation>;
  loadMessages: (conversationId: string, page?: number) => Promise<void>;
  loadConversations: () => Promise<void>;
  loadUnreadCount: () => Promise<void>;
}

export const useChat = (): UseChatReturn => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!token || !user) return;

    const newSocket = io(API_BASE.replace('/api', ''), {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      console.log('Connected to chat server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from chat server');
    });

    newSocket.on('connect_error', (err) => {
      setError('Failed to connect to chat server');
      console.error('Socket connection error:', err);
    });

    newSocket.on('conversations-loaded', (conversations: Conversation[]) => {
      setConversations(conversations);
    });

    newSocket.on('new-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      
      // Update conversation's last message
      setConversations(prev => prev.map(conv => 
        conv.id === message.conversationId 
          ? { ...conv, messages: [message], updatedAt: message.createdAt }
          : conv
      ));

      // Update unread count if not in active conversation
      if (activeConversation?.id !== message.conversationId) {
        setUnreadCount(prev => prev + 1);
      }
    });

    newSocket.on('message-read', ({ messageId, readAt }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true, readAt } : msg
      ));
    });

    newSocket.on('user-typing', (typingUser: TypingUser) => {
      setTypingUsers(prev => {
        const existing = prev.find(u => u.userId === typingUser.userId);
        if (existing) return prev;
        return [...prev, typingUser];
      });
    });

    newSocket.on('user-stop-typing', ({ userId }) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== userId));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, user, API_BASE]);

  // Join conversations on mount
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('join-conversations');
      loadUnreadCount();
    }
  }, [socket, isConnected]);

  // Load conversations from API
  const loadConversations = useCallback(async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/messaging/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to load conversations');
      
      const data = await response.json();
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [token, API_BASE]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string, page = 1) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE}/messaging/conversations/${conversationId}/messages?page=${page}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to load messages');
      
      const data = await response.json();
      
      if (page === 1) {
        setMessages(data);
      } else {
        setMessages(prev => [...data, ...prev]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    }
  }, [token, API_BASE]);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE}/messaging/conversations/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to load unread count');
      
      const data = await response.json();
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  }, [token, API_BASE]);

  // Join a specific conversation
  const joinConversation = useCallback((conversationId: string) => {
    if (!socket) return;
    
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setActiveConversation(conversation);
      socket.emit('join-conversation', conversationId);
      loadMessages(conversationId);
      
      // Mark messages as read
      const unreadMessages = messages.filter(m => 
        m.conversationId === conversationId && 
        !m.isRead && 
        m.senderId !== user?.id
      );
      
      if (unreadMessages.length > 0) {
        markAsRead(unreadMessages.map(m => m.id));
      }
    }
  }, [socket, conversations, messages, user, loadMessages]);

  // Leave conversation
  const leaveConversation = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
    setTypingUsers([]);
  }, []);

  // Send text message
  const sendMessage = useCallback((content: string, replyToId?: string) => {
    if (!socket || !activeConversation || !content.trim()) return;
    
    socket.emit('send-message', {
      conversationId: activeConversation.id,
      content: content.trim(),
      replyToId
    });
  }, [socket, activeConversation]);

  // Send file message
  const sendFile = useCallback(async (file: File, replyToId?: string) => {
    if (!activeConversation || !token) return;
    
    try {
      const formData = new FormData();
      formData.append('attachment', file);
      formData.append('content', `Sent ${file.name}`);
      if (replyToId) formData.append('replyToId', replyToId);
      
      const response = await fetch(`${API_BASE}/messaging/conversations/${activeConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) throw new Error('Failed to send file');
      
      const message = await response.json();
      setMessages(prev => [...prev, message]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send file');
    }
  }, [activeConversation, token, API_BASE]);

  // Mark messages as read
  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (!activeConversation || !token || messageIds.length === 0) return;
    
    try {
      await fetch(`${API_BASE}/messaging/conversations/${activeConversation.id}/messages/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messageIds })
      });
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        messageIds.includes(msg.id) ? { ...msg, isRead: true, readAt: new Date().toISOString() } : msg
      ));
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - messageIds.length));
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  }, [activeConversation, token, API_BASE]);

  // Create new conversation
  const createConversation = useCallback(async (participantIds: string[], propertyId?: string, title?: string): Promise<Conversation> => {
    if (!token) throw new Error('No authentication token');
    
    const response = await fetch(`${API_BASE}/messaging/conversations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ participantIds, propertyId, title })
    });
    
    if (!response.ok) throw new Error('Failed to create conversation');
    
    const conversation = await response.json();
    setConversations(prev => [conversation, ...prev]);
    return conversation;
  }, [token, API_BASE]);

  // Typing indicators
  const startTyping = useCallback(() => {
    if (!socket || !activeConversation) return;
    
    socket.emit('typing', activeConversation.id);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [socket, activeConversation]);

  const stopTyping = useCallback(() => {
    if (!socket || !activeConversation) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', activeConversation.id);
    }, 1000);
  }, [socket, activeConversation]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    socket,
    conversations,
    activeConversation,
    messages,
    typingUsers,
    unreadCount,
    isConnected,
    isLoading,
    error,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendFile,
    markAsRead,
    startTyping,
    stopTyping,
    createConversation,
    loadMessages,
    loadConversations,
    loadUnreadCount
  };
};
