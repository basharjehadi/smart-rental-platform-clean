import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

interface ChatBadgeContextType {
  unreadCount: number;
  offersUnread: number;
  rentalRequestsUnread: number;
  refreshAll: () => Promise<void>;
}

const ChatBadgeContext = createContext<ChatBadgeContextType | undefined>(
  undefined
);

export const useChatBadge = (): ChatBadgeContextType => {
  const ctx = useContext(ChatBadgeContext);
  if (!ctx)
    throw new Error('useChatBadge must be used within ChatBadgeProvider');
  return ctx;
};

export const ChatBadgeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token } = useAuth();
  const { socket, isConnected } = useSocket();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [offersUnread, setOffersUnread] = useState<number>(0);
  const [rentalRequestsUnread, setRentalRequestsUnread] = useState<number>(0);

  const API_BASE =
    (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

  const refreshUnread = useMemo(
    () => async () => {
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
        if (!res.ok) return;
        const data = await res.json();
        setUnreadCount(data.unreadCount ?? data.totalUnread ?? 0);
      } catch {
        // ignore
      }
    },
    [token]
  );

  // Offers and rental requests counts via existing notifications API
  const refreshOfferAndRequestCounts = useMemo(
    () => async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/notifications/unread-counts`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        // NotificationContext returns { rentalRequests, offers, total }
        if (typeof data.offers === 'number') setOffersUnread(data.offers);
        if (typeof data.rentalRequests === 'number')
          setRentalRequestsUnread(data.rentalRequests);
      } catch {
        // ignore
      }
    },
    [token]
  );

  // Initial fetch and when token changes
  useEffect(() => {
    refreshUnread();
    refreshOfferAndRequestCounts();
  }, [refreshUnread, refreshOfferAndRequestCounts]);

  // Socket-driven updates
  useEffect(() => {
    if (!socket || !token) return;

    const handleNewMessage = () => {
      refreshUnread();
    };
    const handleMessageRead = () => {
      // Defer slightly to allow REST write to commit
      setTimeout(() => refreshUnread(), 150);
    };
    const handleConversationsLoaded = () => {
      refreshUnread();
    };

    if (isConnected) {
      // Join conversations once so we receive room-scoped events (new-message/message-read)
      socket.emit('join-conversations');
      refreshUnread();
      refreshOfferAndRequestCounts();
    }

    socket.on('new-message', handleNewMessage);
    socket.on('message-read', handleMessageRead);
    socket.on('conversations-loaded', handleConversationsLoaded);

    // Fallback: listen for manual refresh triggers from other parts of the app
    const handleWindowRefresh = () => {
      refreshUnread();
    };
    window.addEventListener('chat-unread-refresh', handleWindowRefresh as any);
    window.addEventListener('notif-unread-refresh', handleWindowRefresh as any);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message-read', handleMessageRead);
      socket.off('conversations-loaded', handleConversationsLoaded);
      window.removeEventListener(
        'chat-unread-refresh',
        handleWindowRefresh as any
      );
      window.removeEventListener(
        'notif-unread-refresh',
        handleWindowRefresh as any
      );
    };
  }, [socket, token, isConnected, refreshUnread, refreshOfferAndRequestCounts]);

  const value: ChatBadgeContextType = {
    unreadCount,
    offersUnread,
    rentalRequestsUnread,
    refreshAll: async () => {
      await refreshUnread();
      await refreshOfferAndRequestCounts();
    },
  };

  return (
    <ChatBadgeContext.Provider value={value}>
      {children}
    </ChatBadgeContext.Provider>
  );
};
