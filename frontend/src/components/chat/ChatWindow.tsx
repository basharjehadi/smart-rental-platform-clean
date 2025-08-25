import React, { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

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

interface ChatWindowProps {
  messages: Message[];
  typingUsers: { userId: string; userName: string }[];
  currentUserId: string;
  conversationTitle?: string;
  conversationAvatar?: string; // Add this prop for the other user's avatar
  isLoading?: boolean;
  onLoadOlder?: () => void;
  hasMore?: boolean;
  showPropertyButton?: boolean;
  onShowProperty?: () => void;
  onMarkAsRead?: (messageIds: string[]) => void; // Add this prop for marking messages as read
  userRole?: string; // Add userRole prop
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  typingUsers,
  currentUserId,
  conversationTitle = 'Chat',
  conversationAvatar,
  isLoading = false,
  onLoadOlder,
  hasMore = false,
  showPropertyButton,
  onShowProperty,
  onMarkAsRead,
  userRole
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Lightweight presence derived from message timestamps (UI-only)
  const getPresenceText = () => {
    if (!messages || messages.length === 0) return '';

    // Consider only messages from the other participant (non-system if present)
    let lastOtherTs = 0;
    for (const msg of messages) {
      if (msg.senderId !== currentUserId && msg.messageType !== 'SYSTEM') {
        const t = Date.parse(msg.updatedAt || msg.createdAt);
        if (!Number.isNaN(t)) lastOtherTs = Math.max(lastOtherTs, t);
      }
    }

    if (!lastOtherTs) return '';

    const diffMs = Date.now() - lastOtherTs;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < 3 * minute) return 'Active now';
    if (diffMs < hour) return `Last seen ${Math.round(diffMs / minute)} min ago`;
    if (diffMs < day) return `Last seen ${Math.round(diffMs / hour)} hr ago`;
    const days = Math.round(diffMs / day);
    return `Last seen ${days} day${days !== 1 ? 's' : ''} ago`;
  };

  // Ensure scroll event listener is properly bound
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      console.log('🔍 Binding scroll event to messages container');
      container.addEventListener('scroll', handleScroll);
      
      return () => {
        console.log('🔍 Removing scroll event from messages container');
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive (only if user hasn't scrolled up)
  useEffect(() => {
    console.log('🔍 Auto-scroll effect triggered:', {
      shouldAutoScroll,
      messagesLength: messages.length,
      hasMessagesEndRef: !!messagesEndRef.current,
      userScrolledUp: !shouldAutoScroll
    });
    
    // Only auto-scroll if user is at bottom AND we have messages
    if (shouldAutoScroll && messagesEndRef.current && messages.length > 0) {
      console.log('✅ Auto-scrolling to bottom');
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      console.log('❌ Auto-scroll blocked:', {
        shouldAutoScroll,
        hasMessagesEndRef: !!messagesEndRef.current,
        messagesLength: messages.length,
        reason: !shouldAutoScroll ? 'User scrolled up' : 'No messages or ref'
      });
    }
  }, [messages, shouldAutoScroll]);

  // Mark messages as read when they come into view
  useEffect(() => {
    if (!onMarkAsRead || messages.length === 0) return;
    
    // Get unread messages that are not sent by the current user
    const unreadMessageIds = messages
      .filter(msg => !msg.isRead && msg.senderId !== currentUserId)
      .map(msg => msg.id);
    
    if (unreadMessageIds.length > 0) {
      console.log('📖 Marking messages as read:', unreadMessageIds);
      onMarkAsRead(unreadMessageIds);
    }
  }, [messages, currentUserId, onMarkAsRead]);

  // Check if user is near bottom to determine if auto-scroll should be enabled
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10; // Within 10px of bottom (more strict)
    
    console.log('🔍 Scroll detected:', {
      scrollTop,
      scrollHeight,
      clientHeight,
      isAtBottom,
      shouldAutoScroll: isAtBottom
    });
    
    // Only enable auto-scroll if user is at the very bottom
    setShouldAutoScroll(isAtBottom);
  };

  // Reset auto-scroll when user manually scrolls to bottom
  const scrollToBottom = () => {
    console.log('✅ User clicked scroll to bottom, re-enabling auto-scroll');
    setShouldAutoScroll(true);
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const shouldShowSender = (currentIndex: number) => {
    if (currentIndex === 0) return true;
    
    const currentMessage = messages[currentIndex];
    const previousMessage = messages[currentIndex - 1];
    
    return currentMessage.sender.id !== previousMessage.sender.id;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div>
            <p className="text-lg font-medium mb-2">
              {userRole === 'LANDLORD'
                ? 'Send your first message to your tenant'
                : userRole === 'TENANT'
                ? 'Send your first message to your landlord'
                : 'Send your first message to start chatting'}
            </p>
            <p className="text-sm text-gray-400">
              {conversationTitle === 'Select a conversation'
                ? 'Choose a conversation from the list on the left'
                : 'Start the conversation!'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 mt-2 mx-2 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
              {conversationAvatar ? (
                <img
                  src={conversationAvatar}
                  alt={conversationTitle}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.log('Failed to load header avatar:', conversationAvatar);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-white font-medium text-sm">
                  {conversationTitle.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{conversationTitle}</h2>
              <p className="text-sm text-gray-500">
                {messages.length} message{messages.length !== 1 ? 's' : ''}
                {(() => {
                  const presence = getPresenceText();
                  return presence ? ` • ${presence}` : '';
                })()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {hasMore && (
              <button
                onClick={onLoadOlder}
                className="text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
              >
                Load older
              </button>
            )}
            {showPropertyButton && (
              <button
                onClick={onShowProperty}
                className="text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
              >
                Show Property
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4" style={{ maxHeight: 'calc(100vh - 280px)' }} ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-center text-lg font-medium mb-2">
              {userRole === 'LANDLORD'
                ? 'Send your first message to your tenant'
                : userRole === 'TENANT'
                ? 'Send your first message to your landlord'
                : 'Send your first message to start chatting'}
            </p>
            <p className="text-sm text-gray-400">
              {conversationTitle === 'Select a conversation'
                ? 'Choose a conversation from the list on the left'
                : 'Start the conversation!'}
            </p>
          </div>
        ) : (
          <>
            {/* Messages list */}
            <div className="space-y-4">
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={message.sender.id === currentUserId}
                  showSender={shouldShowSender(index)}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Typing indicator */}
        <TypingIndicator
          typingUsers={typingUsers}
          currentUserId={currentUserId}
        />
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;


