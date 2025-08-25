import React, { useState, useEffect } from 'react';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import MessageInput from './MessageInput';
import UnreadBadge from './UnreadBadge';
import { useChat } from '../../hooks/useChatRealtime';
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
  const [showPropertyPanel, setShowPropertyPanel] = useState(true);
  
  // Use external selected conversation ID if provided, otherwise use internal state
  const selectedConversationId = externalSelectedConversationId || internalSelectedConversationId;
  const { user } = useAuth();

  const {
    conversations,
    messages,
    unreadCount,
    sendMessage,
    startTyping,
    stopTyping,
    typingUsers,
    hasMore,
    loadOlderMessages,
    joinConversation,
    activeConversation,
    isLoading,
    error,
    loadConversations
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

  // Also refresh conversations when the component re-renders (e.g., after new conversation creation)
  useEffect(() => {
    if (selectedConversationId && conversations.length === 0) {
      // If we have a selected conversation but no conversations loaded, try to load them
      console.log('🔄 No conversations loaded, attempting to refresh...');
      // This will trigger the useChat hook to reload conversations
    }
  }, [selectedConversationId, conversations.length]);

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

  // Handle sending messages
  const handleSendMessage = async (content: string, file?: File) => {
    if (!content.trim() && !file) return;

    try {
      // Simple hook: only supports text messages
        sendMessage(content);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle typing indicators
  const handleTyping = (isTyping: boolean) => {
    if (isTyping) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  // Handle conversation selection
  const handleSelectConversation = (conversationId: string) => {
    setInternalSelectedConversationId(conversationId);
    if (onConversationSelect) {
      onConversationSelect(conversationId);
    }
  };

  // Get conversation title for display
  const getConversationTitle = () => {
    if (!selectedConversationId) return 'Select a conversation';
    
    const conversation = conversations.find(c => c.id === selectedConversationId);
    if (!conversation) return 'Unknown conversation';
    
    // Force Airbnb-style: show participant names only, not stored conversation title/property name
    
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

  // Get conversation avatar for display
  const getConversationAvatar = () => {
    if (!selectedConversationId) return null;

    const conversation = conversations.find(c => c.id === selectedConversationId);
    if (!conversation) return null;

    const otherParticipants = conversation.participants.filter(
      p => p.userId !== user?.id
    );

    const profileImage = otherParticipants[0]?.user?.profileImage;
    if (!profileImage) return null;

    if (profileImage.startsWith('http')) return profileImage;
    if (profileImage.startsWith('/uploads/')) return `http://localhost:3001${profileImage}`;
    if (profileImage.startsWith('uploads/')) return `http://localhost:3001/${profileImage}`;
    return `http://localhost:3001/uploads/profile_images/${profileImage}`;
  };

  // Get property images for display
  const getPropertyImages = () => {
    if (!activeConversation || !activeConversation.property || !activeConversation.property.images) return [];
    const imgs = activeConversation.property.images as any;
    try {
      if (Array.isArray(imgs)) return imgs;
      if (typeof imgs === 'string') return JSON.parse(imgs);
      return [];
    } catch {
      return [];
    }
  };

  const isChatDisabled = conversationStatus !== 'ACTIVE';

  return (
    <div className={`flex bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Conversation List */}
      <div className="w-80 border-r border-gray-200">
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId || null}
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
                Chat is Locked
              </h3>
              <p className="text-gray-600 mb-4">
                {conversationStatus !== 'ACTIVE' 
                  ? 'This conversation is not active yet.'
                  : 'Please complete payment to unlock this chat.'
                }
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header removed here; ChatWindow renders its own header */}

            {/* Chat Messages */}
            <ChatWindow
              messages={messages}
              typingUsers={typingUsers}
              currentUserId={user?.id || ''}
              conversationTitle={getConversationTitle()}
              conversationAvatar={getConversationAvatar() || undefined}
              onLoadOlder={loadOlderMessages}
              hasMore={hasMore}
              onMarkAsRead={async (messageIds: string[]) => {
                if (!selectedConversationId || messageIds.length === 0) return;
                try {
                  await fetch(`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:3001'}/api/messaging/conversations/${selectedConversationId}/messages/read`, {
                    method: 'PUT',
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ messageIds })
                  });
                  // Notify global chat badge provider to refresh immediately
                  try { window.dispatchEvent(new Event('chat-unread-refresh')); } catch {}
                } catch {
                  // ignore
                }
              }}
              showPropertyButton={!showPropertyPanel && !!(activeConversation && activeConversation.property)}
              onShowProperty={() => setShowPropertyPanel(true)}
            />

            {/* Message Input */}
            <MessageInput
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              disabled={isChatDisabled}
            />
          </>
        )}
      </div>

      {/* Property Details Panel (Right Side) */}
      {showPropertyPanel && ((activeConversation && activeConversation.property) || selectedConversationId) ? (
        <div className="w-80 border-l border-gray-200 bg-white">
          <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Property</h3>
              <button 
                onClick={() => setShowPropertyPanel(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-4">
            {activeConversation && activeConversation.property ? (
              <div className="space-y-4">
                {/* Property Image */}
                <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
                  {getPropertyImages().length > 0 ? (
                    <img
                      src={`http://localhost:3001${getPropertyImages()[0]}`}
                      alt={activeConversation.property.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('Failed to load property image');
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                </div>
                {/* Property Details */}
                <div className="space-y-3">
                  <h4 className="text-lg font-medium text-gray-900">
                    {activeConversation.property.name}
                  </h4>
                  {/* Full Address */}
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      {activeConversation.property.address}
                    </p>
                    <p className="text-sm text-gray-600">
                      {activeConversation.property.district && `${activeConversation.property.district}, `}
                      {activeConversation.property.city}
                      {activeConversation.property.zipCode && `, ${activeConversation.property.zipCode}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {activeConversation.property.country}
                    </p>
                  </div>
                  {/* Property Specifications */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-gray-500">Type:</span>
                      <p className="font-medium text-gray-900 capitalize">
                        {activeConversation.property.propertyType?.toLowerCase()}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-gray-500">Size:</span>
                      <p className="font-medium text-gray-900">
                        {activeConversation.property.size ? `${activeConversation.property.size}m²` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  {/* Rental Information */}
                  <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                    <h5 className="text-sm font-medium text-blue-800">Rental Details</h5>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-blue-600">Monthly Rent:</span>
                        <p className="font-medium text-blue-900">
                          {activeConversation.offer?.rentAmount ? `${activeConversation.offer.rentAmount} PLN` : 
                           activeConversation.property.monthlyRent ? `${activeConversation.property.monthlyRent} PLN` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-blue-600">Deposit:</span>
                        <p className="font-medium text-blue-900">
                          {activeConversation.offer?.depositAmount ? `${activeConversation.offer.depositAmount} PLN` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>Select a conversation to view property details</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Chat;
