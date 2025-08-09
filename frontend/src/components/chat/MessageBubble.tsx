import React from 'react';
import { Check, CheckCheck, Download, Image as ImageIcon, FileText } from 'lucide-react';

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

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showSender: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  showSender
}) => {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'TEXT':
        return (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        );
      
      case 'IMAGE':
        return (
          <div className="space-y-2">
            <img
              src={message.attachmentUrl}
              alt="Shared image"
              className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.attachmentUrl, '_blank')}
            />
            {message.content && (
              <p className="text-sm text-gray-600">{message.content}</p>
            )}
          </div>
        );
      
      case 'DOCUMENT':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border">
              <FileText className="w-5 h-5 text-gray-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {message.attachmentName}
                </p>
                <p className="text-xs text-gray-500">Document</p>
              </div>
              <button
                onClick={() => window.open(message.attachmentUrl, '_blank')}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Download document"
              >
                <Download className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            {message.content && (
              <p className="text-sm text-gray-600">{message.content}</p>
            )}
          </div>
        );
      
      default:
        return <p className="text-sm">{message.content}</p>;
    }
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-xs lg:max-w-md`}>
        {!isOwnMessage && showSender && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {message.sender.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}
        
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          {!isOwnMessage && showSender && (
            <p className="text-xs text-gray-500 mb-1 ml-1">
              {message.sender.name}
            </p>
          )}
          
          <div
            className={`px-4 py-2 rounded-lg ${
              isOwnMessage
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            {renderMessageContent()}
          </div>
          
          <div className={`flex items-center space-x-1 mt-1 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-xs text-gray-500">
              {formatTime(message.createdAt)}
            </span>
            
            {isOwnMessage && (
              <span className="text-xs">
                {message.isRead ? (
                  <CheckCheck className="w-3 h-3 text-blue-500" />
                ) : (
                  <Check className="w-3 h-3 text-gray-400" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;


