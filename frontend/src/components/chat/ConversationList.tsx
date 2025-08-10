import React, { useEffect, useState } from 'react';
import { MessageCircle, Clock } from 'lucide-react';

interface Conversation {
  id: string;
  title?: string;
  type: 'DIRECT' | 'GROUP' | 'PROPERTY';
  propertyId?: string;
  offerId?: string;
  status: 'PENDING' | 'ACTIVE' | 'ARCHIVED';
  property?: {
    id: string;
    name: string;
    address: string;
  };
  offer?: {
    id: string;
    status: 'PENDING' | 'ACCEPTED' | 'PAID' | 'REJECTED';
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
  messages: Array<{
    id: string;
    content: string;
    messageType: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'SYSTEM';
    createdAt: string;
    sender: {
      id: string;
      name: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  currentUserId: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  currentUserId
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title) return conversation.title;
    
    const otherParticipants = conversation.participants.filter(
      p => p.user.id !== currentUserId
    );
    
    if (otherParticipants.length === 1) {
      return otherParticipants[0].user.name;
    } else if (otherParticipants.length > 1) {
      return `${otherParticipants[0].user.name} +${otherParticipants.length - 1}`;
    }
    
    return 'Unknown';
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.messages || conversation.messages.length === 0) return 'No messages yet';
    
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const { content, messageType, sender } = lastMessage;
    const isOwnMessage = sender.id === currentUserId;
    
    let preview = '';
    switch (messageType) {
      case 'TEXT':
        preview = content.length > 50 ? `${content.substring(0, 50)}...` : content;
        break;
      case 'IMAGE':
        preview = '📷 Image';
        break;
      case 'DOCUMENT':
        preview = '📄 Document';
        break;
      default:
        preview = 'Message';
    }
    
    return isOwnMessage ? `You: ${preview}` : preview;
  };

  const isConversationLocked = (conversation: Conversation) => {
    if (conversation.status !== 'ACTIVE') return true;
    if (conversation.offer && conversation.offer.status !== 'PAID') return true;
    return false;
  };

  return (
    <div className="w-full bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
      </div>
      
      <div className="overflow-y-auto h-[calc(100vh-200px)]">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <MessageCircle className="w-12 h-12 mb-4" />
            <p className="text-center">No conversations yet</p>
            <p className="text-sm text-gray-400">Start a conversation to begin messaging</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedConversationId === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {getConversationTitle(conversation).charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {getConversationTitle(conversation)}
                      </h3>
                      {isConversationLocked(conversation) && (
                        <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Chat locked until payment">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {conversation.messages && conversation.messages.length > 0 && (
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(conversation.messages[conversation.messages.length - 1].createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {getLastMessagePreview(conversation)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;


