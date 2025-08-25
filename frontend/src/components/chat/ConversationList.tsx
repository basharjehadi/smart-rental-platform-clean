import React from 'react';
import { Conversation } from '../../hooks/useChatRealtime';
import { Clock } from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
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

  // Get conversation title (other participant's name)
  const getConversationTitle = (conversation: Conversation) => {
    const other = conversation.participants.find(p => p.user.id !== currentUserId);
    return other?.user?.name || 'Unknown User';
  };

  // Get conversation subtitle (property name)
  const getConversationSubtitle = (conversation: Conversation) => {
    return conversation.property?.name || 'No property';
  };

  const getAvatar = (conversation: Conversation) => {
    const other = conversation.participants.find(p => p.user.id !== currentUserId);
    const name = other?.user?.name || 'U';
    const initial = name.charAt(0).toUpperCase();
    
    if (other?.user?.profileImage) {
      const profileImage = other.user.profileImage;
      
      let src;
      if (profileImage.startsWith('http')) {
        src = profileImage;
      } else if (profileImage.startsWith('/uploads/')) {
        src = `http://localhost:3001${profileImage}`;
      } else if (profileImage.startsWith('uploads/')) {
        src = `http://localhost:3001/${profileImage}`;
      } else {
        src = `http://localhost:3001/uploads/profile_images/${profileImage}`;
      }
      
      return src;
    }
    
    return null;
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

  const formatLastMessageTime = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
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

  return (
    <div className="w-full bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p className="text-center text-lg font-medium mb-2">No conversations yet</p>
            <p className="text-sm text-gray-400 text-center">Start a conversation to begin messaging with landlords or tenants</p>
            <p className="text-xs text-gray-400 text-center mt-2">Use the "New Chat" button to get started</p>
          </div>
        ) : (
          conversations.map((conversation) => {
            return (
              <div
                key={conversation.id}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversationId === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-start space-x-3">
                  {/* User Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                      {getAvatar(conversation) ? (
                        <img
                          src={getAvatar(conversation)}
                          alt={getConversationTitle(conversation)}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-white font-medium text-lg">
                          {getConversationTitle(conversation).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getConversationTitle(conversation)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatLastMessageTime(conversation.updatedAt) || 'No recent activity'}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {getConversationSubtitle(conversation)}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {getLastMessagePreview(conversation)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;


