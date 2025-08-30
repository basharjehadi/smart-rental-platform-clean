import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

interface UnreadBadgeProps {
  conversationId?: string;
  className?: string;
}

const UnreadBadge: React.FC<UnreadBadgeProps> = ({
  conversationId,
  className = '',
}) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(
          'http://localhost:3001/api/messaging/conversations/unread-count',
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.totalUnread || 0);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Set up WebSocket listener for real-time updates
    const handleNewMessage = (event: CustomEvent) => {
      const { conversationId: newMessageConversationId } = event.detail;

      // If this is a message in a different conversation, increment count
      if (conversationId && newMessageConversationId !== conversationId) {
        setUnreadCount(prev => prev + 1);
      }
    };

    window.addEventListener('message:new', handleNewMessage as EventListener);

    return () => {
      window.removeEventListener(
        'message:new',
        handleNewMessage as EventListener
      );
    };
  }, [conversationId]);

  if (unreadCount === 0) return null;

  return (
    <div className={`relative ${className}`}>
      <Bell className='w-5 h-5 text-gray-600' />
      <span className='absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]'>
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    </div>
  );
};

export default UnreadBadge;
