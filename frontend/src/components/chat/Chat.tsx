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
  selectedConversationId?: string;
  onConversationSelect?: (conversationId: string) => void;
}

const Chat: React.FC<ChatProps> = ({
  conversationStatus: initialConversationStatus = 'ACTIVE',
  paymentStatus: initialPaymentStatus = 'PAID',
  className = '',
  selectedConversationId: externalSelectedConversationId,
  onConversationSelect
}) => {
  const [internalSelectedConversationId, setInternalSelectedConversationId] = useState<string | undefined>();
  const [isTyping, setIsTyping] = useState(false);
  const [conversationStatus, setConversationStatus] = useState<'PENDING' | 'ACTIVE' | 'ARCHIVED'>('PENDING');
  const [offerStatus, setOfferStatus] = useState<'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PAID'>('PENDING');
  
  // Use external selected conversation ID if provided, otherwise use internal state
  const selectedConversationId = externalSelectedConversationId || internalSelectedConversationId;
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
    error,
    chatError,
    clearChatError
  } = useChat();

  // Fetch conversation and offer status when conversation is selected
  useEffect(() => {
    const fetchConversationStatus = async () => {
      if (!selectedConversationId) return;

      try {
        const response = await fetch(`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:3001'}/api/messaging/conversations/${selectedConversationId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const conversation = await response.json();
          setConversationStatus(conversation.status);
          
          // If conversation has an offer, fetch its status
          if (conversation.offerId) {
            const offerResponse = await fetch(`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:3001'}/api/tenant/offer/${conversation.offerId}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            if (offerResponse.ok) {
              const offer = await offerResponse.json();
              setOfferStatus(offer.status);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching conversation status:', error);
      }
    };

    fetchConversationStatus();
  }, [selectedConversationId]);

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      const firstConversationId = conversations[0].id;
      if (onConversationSelect) {
        onConversationSelect(firstConversationId);
      } else {
        setInternalSelectedConversationId(firstConversationId);
      }
    }
  }, [conversations, selectedConversationId, onConversationSelect]);

  // Join conversation when selected
  useEffect(() => {
    if (selectedConversationId) {
      joinConversation(selectedConversationId);
    }
  }, [selectedConversationId, joinConversation]);

  // Handle external conversation ID changes
  useEffect(() => {
    if (externalSelectedConversationId && externalSelectedConversationId !== internalSelectedConversationId) {
      setInternalSelectedConversationId(externalSelectedConversationId);
    }
  }, [externalSelectedConversationId, internalSelectedConversationId]);

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
    if (onConversationSelect) {
      onConversationSelect(conversationId);
    } else {
      setInternalSelectedConversationId(conversationId);
    }
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

  const isChatDisabled = conversationStatus !== 'ACTIVE' || offerStatus !== 'PAID';

  return (
    <div className={`flex bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chat Locked
              </h3>
              <p className="text-gray-600 mb-4">
                {conversationStatus !== 'ACTIVE' 
                  ? 'This conversation is not active.'
                  : 'Payment is required to access chat features.'
                }
              </p>
              <p className="text-sm text-gray-500">
                Chat will unlock automatically once payment is completed.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {getConversationTitle()}
                  </h2>
                  {isChatDisabled && (
                    <div className="flex items-center space-x-1 text-yellow-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-xs font-medium">Locked</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-500">
                    {isConnected ? 'Connected' : 'Connecting...'}
                  </p>
                  <UnreadBadge />
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <ChatWindow
              messages={messages}
              typingUsers={typingUsers.map(user => user.userName)}
              currentUserId={user?.id || ''}
            />

            {/* Message Input */}
            <MessageInput
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              disabled={!isConnected || isChatDisabled}
            />
          </>
        )}
      </div>

      {/* Chat Error Display */}
      {chatError && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <strong className="font-bold">Chat Error:</strong>
              <span className="ml-2">{chatError.error}</span>
              <div className="text-sm text-red-600">Code: {chatError.errorCode}</div>
            </div>
            <button
              onClick={clearChatError}
              className="ml-4 text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
