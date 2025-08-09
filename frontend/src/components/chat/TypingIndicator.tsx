import React from 'react';

interface TypingIndicatorProps {
  typingUsers: string[];
  currentUserId: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers, currentUserId }) => {
  // Filter out the current user from typing users
  const otherTypingUsers = typingUsers.filter(userId => userId !== currentUserId);

  if (otherTypingUsers.length === 0) return null;

  const getTypingMessage = () => {
    if (otherTypingUsers.length === 1) {
      return 'Someone is typing...';
    } else if (otherTypingUsers.length === 2) {
      return 'Two people are typing...';
    } else {
      return 'Several people are typing...';
    }
  };

  return (
    <div className="flex items-center space-x-2 p-3 text-gray-500">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-sm italic">{getTypingMessage()}</span>
    </div>
  );
};

export default TypingIndicator;


