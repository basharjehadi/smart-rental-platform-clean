import React, { useState, useEffect } from 'react';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import MessageInput from './MessageInput';
import UnreadBadge from './UnreadBadge';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../contexts/AuthContext';

interface ChatProps {
  conversationStatus?: 'ACTIVE' | 'INACTIVE';
  paymentStatus?: 'PAID' | 'UNPAID';
  className?: string;
}

const Chat: React.FC<ChatProps> = ({
  conversationStatus = 'ACTIVE',
  paymentStatus = 'PAID',
  className = ''
}) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();

  const {
    conversations,
    messages,
    typingUsers,
    unreadCount,
    sendMessage,
    sendFile,
    markAsRead,
    startTyping,
    stopTyping,
    createConversation,
    joinConversation,
    activeConversation,
    isConnected,
    isLoading,
    error
  } = useChat();

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  // Join conversation when selected
  useEffect(() => {
    if (selectedConversationId) {
      joinConversation(selectedConversationId);
    }
  }, [selectedConversationId, joinConversation]);

  const handleSendMessage = async (content: string, file?: File) => {
    if (!activeConversation) return;

    try {
      if (file) {
        await sendFile(file);
      } else {
        sendMessage(content);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleTyping = (isTyping: boolean) => {
    setIsTyping(isTyping);
    if (isTyping) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const getConversationTitle = () => {
    if (!selectedConversationId) return 'Select a conversation';
    
    const conversation = conversations.find(c => c.id === selectedConversationId);
    if (!conversation) return 'Unknown conversation';
    
    if (conversation.title) return conversation.title;
    
    const otherParticipants = conversation.participants.filter(
      p => p.userId !== user?.id
    );
    
    if (otherParticipants.length === 1) {
      return otherParticipants[0].user.name;
    } else if (otherParticipants.length > 1) {
      return `${otherParticipants[0].user.name} +${otherParticipants.length - 1}`;
    }
    
    return 'Unknown';
  };

  const isChatDisabled = conversationStatus !== 'ACTIVE' || paymentStatus !== 'PAID';

  return (
    <div className={`flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Conversation List */}
      <div className="w-80 border-r border-gray-200">
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
          currentUserId={user?.id || ''}
        />
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {isChatDisabled ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chat Unavailable
              </h3>
              <p className="text-gray-600 mb-4">
                {conversationStatus !== 'ACTIVE' 
                  ? 'This conversation is not active.'
                  : 'Payment is required to access chat features.'
                }
              </p>
              <p className="text-sm text-gray-500">
                Please contact support if you believe this is an error.
              </p>
            </div>
          </div>
        ) : selectedConversationId ? (
          <>
            <ChatWindow
              messages={messages}
              typingUsers={typingUsers.map(u => u.userId)}
              currentUserId={user?.id || ''}
              conversationTitle={getConversationTitle()}
            />
            <MessageInput
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              disabled={isTyping}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-600">
                Choose a conversation from the list to start messaging.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Unread Badge */}
      <UnreadBadge 
        conversationId={selectedConversationId}
        className="absolute top-4 right-4"
      />
    </div>
  );
};

export default Chat;
