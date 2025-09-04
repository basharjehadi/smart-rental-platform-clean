import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import api from '../utils/api';

interface NotificationCounts {
  rentalRequests: number;
  offers: number;
  total: number;
}

interface Notification {
  id: string;
  type:
    | 'NEW_RENTAL_REQUEST'
    | 'NEW_OFFER'
    | 'PAYMENT_CONFIRMED'
    | 'PAYMENT_FAILED'
    | 'CONTRACT_UPDATED'
    | 'CONTRACT_SIGNED'
    | 'KYC_APPROVED'
    | 'KYC_REJECTED'
    | 'PROPERTY_STATUS_CHANGED'
    | 'SYSTEM_ANNOUNCEMENT'
    | 'ACCOUNT_UPDATED'
    | 'MOVE_IN_ISSUE_REPORTED'
    | 'MOVE_IN_ISSUE_UPDATED';
  entityId: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  counts: NotificationCounts;
  notifications: Notification[];
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markByTypeAsRead: (
    type:
      | 'NEW_RENTAL_REQUEST'
      | 'NEW_OFFER'
      | 'PAYMENT_CONFIRMED'
      | 'PAYMENT_FAILED'
      | 'CONTRACT_UPDATED'
      | 'CONTRACT_SIGNED'
      | 'KYC_APPROVED'
      | 'KYC_REJECTED'
      | 'PROPERTY_STATUS_CHANGED'
      | 'SYSTEM_ANNOUNCEMENT'
      | 'ACCOUNT_UPDATED'
  ) => Promise<void>;
  refreshCounts: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [counts, setCounts] = useState<NotificationCounts>({
    rentalRequests: 0,
    offers: 0,
    total: 0,
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch initial notification counts (all unread)
  const fetchCounts = async () => {
    if (!user) return;

    try {
      const response = await api.get('/notifications/unread-counts');
      if (response.data.success) {
        setCounts({
          rentalRequests: response.data.rentalRequests,
          offers: response.data.offers,
          total: response.data.total,
        });
      }
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const response = await api.get('/notifications?limit=20');
      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
      // Refresh counts
      await fetchCounts();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      // Update local state
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
      // Reset counts
      setCounts({ rentalRequests: 0, offers: 0, total: 0 });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Mark notifications by type as read
  const markByTypeAsRead = async (
    type:
      | 'NEW_RENTAL_REQUEST'
      | 'NEW_OFFER'
      | 'PAYMENT_CONFIRMED'
      | 'PAYMENT_FAILED'
      | 'CONTRACT_UPDATED'
      | 'CONTRACT_SIGNED'
      | 'KYC_APPROVED'
      | 'KYC_REJECTED'
      | 'PROPERTY_STATUS_CHANGED'
      | 'SYSTEM_ANNOUNCEMENT'
      | 'ACCOUNT_UPDATED'
  ) => {
    try {
      await api.put(`/notifications/read-by-type/${type}`);
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.type === type ? { ...notif, isRead: true } : notif
        )
      );
      // Refresh counts
      await fetchCounts();
    } catch (error) {
      console.error('Error marking notifications by type as read:', error);
    }
  };

  // Refresh counts
  const refreshCounts = async () => {
    await fetchCounts();
  };

  // Socket.IO event handlers
  useEffect(() => {
    if (!socket || !user) return;

    // Listen for new notifications
    socket.on('notification:new', (notification: Notification) => {
      console.log('🔔 New notification received:', notification);
      setNotifications(prev => [notification, ...prev]);
      // Refresh counts
      fetchCounts();
    });

    // Listen for move-in issue notifications
    socket.on('move-in-issue:reported', (data: any) => {
      console.log('🚨 Move-in issue reported:', data);
      // Refresh notifications to show the new issue
      fetchNotifications();
    });

    socket.on('move-in-issue:updated', (data: any) => {
      console.log('🔄 Move-in issue updated:', data);
      // Refresh notifications
      fetchNotifications();
    });

    // Listen for updated counts
    socket.on('notification:counts', (newCounts: NotificationCounts) => {
      console.log('🔔 Notification counts updated:', newCounts);
      setCounts(newCounts);
    });

    // Listen for notification errors
    socket.on('notification-error', (error: any) => {
      console.error('🔔 Notification error:', error);
    });

    // Fetch notifications via socket
    socket.emit('fetch-notifications');

    return () => {
      socket.off('notification:new');
      socket.off('notification:counts');
      socket.off('notification-error');
      socket.off('move-in-issue:reported');
      socket.off('move-in-issue:updated');
    };
  }, [socket, user]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchCounts();
      fetchNotifications();
    }
  }, [user]);

  const value: NotificationContextType = {
    counts,
    notifications,
    markAsRead,
    markAllAsRead,
    markByTypeAsRead,
    refreshCounts,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
