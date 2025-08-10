import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import ToastNotification from './ToastNotification';

const ToastContainer: React.FC = () => {
  const { notifications } = useNotifications();
  const [activeToasts, setActiveToasts] = useState<string[]>([]);

  // Show new notifications as toasts
  useEffect(() => {
    const newNotifications = notifications.filter(
      notif => !notif.isRead && !activeToasts.includes(notif.id)
    );

    if (newNotifications.length > 0) {
      // Add new notification IDs to active toasts
      setActiveToasts(prev => [...prev, ...newNotifications.map(n => n.id)]);
    }
  }, [notifications, activeToasts]);

  const handleCloseToast = (id: string) => {
    setActiveToasts(prev => prev.filter(toastId => toastId !== id));
  };

  // Get unread notifications that should be shown as toasts
  const unreadNotifications = notifications.filter(
    notif => !notif.isRead && activeToasts.includes(notif.id)
  );

  if (unreadNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {unreadNotifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            transform: `translateY(${index * 80}px)`,
            zIndex: 50 - index
          }}
        >
          <ToastNotification
            notification={notification}
            onClose={handleCloseToast}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
