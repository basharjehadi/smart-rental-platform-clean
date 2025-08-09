import React, { useEffect, useState } from 'react';
import { MessageCircle, Clock } from 'lucide-react';

interface Conversation {
  id: string;
  title?: string;
  type: 'DIRECT' | 'GROUP';
  participants: Array<{
    id: string;
    name: string;
    email: string;
    profileImage?: string;
  }>;
  lastMessage?: {
    content: string;
    type: 'TEXT' | 'IMAGE' | 'DOCUMENT';
    createdAt: string;
    sender: {
      id: string;
      name: string;
    };
  };
  unreadCount: number;
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
      p => p.id !== currentUserId
    );
    
    if (otherParticipants.length === 1) {
      return otherParticipants[0].name;
    } else if (otherParticipants.length > 1) {
      return `${otherParticipants[0].name} +${otherParticipants.length - 1}`;
    }
    
    return 'Unknown';
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.lastMessage) return 'No messages yet';
    
    const { content, type, sender } = conversation.lastMessage;
    const isOwnMessage = sender.id === currentUserId;
    
    let preview = '';
    switch (type) {
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
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {getConversationTitle(conversation)}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {conversation.lastMessage && (
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(conversation.lastMessage.createdAt)}
                        </span>
                      )}
                      {conversation.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
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


