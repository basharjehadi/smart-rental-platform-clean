import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface Message {
  id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'DOCUMENT';
  createdAt: string;
  sender: {
    id: string;
    name: string;
    profileImage?: string;
  };
  isRead: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
}

interface ChatWindowProps {
  messages: Message[];
  typingUsers: string[];
  currentUserId: string;
  conversationTitle?: string;
  isLoading?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  typingUsers,
  currentUserId,
  conversationTitle = 'Chat',
  isLoading = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-900">{conversationTitle}</h2>
        <p className="text-sm text-gray-500">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-center">No messages yet</p>
            <p className="text-sm text-gray-400">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwnMessage={message.sender.id === currentUserId}
              showSender={shouldShowSender(index)}
            />
          ))
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


