import React from 'react';

interface TypingUser {
  userId: string;
  userName: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  currentUserId: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers, currentUserId }) => {
  // Filter out the current user from typing users
  const otherTypingUsers = typingUsers.filter(user => user.userId !== currentUserId);

  if (otherTypingUsers.length === 0) return null;

  const getTypingMessage = () => {
    if (otherTypingUsers.length === 1) {
      return `${otherTypingUsers[0].userName} is typing...`;
    } else if (otherTypingUsers.length === 2) {
      return `${otherTypingUsers[0].userName} and ${otherTypingUsers[1].userName} are typing...`;
    } else {
      const names = otherTypingUsers.slice(0, 2).map(u => u.userName).join(', ');
      return `${names} and ${otherTypingUsers.length - 2} others are typing...`;
    }
  };

  return (
    <div className="flex items-center space-x-2 p-3 text-gray-500 bg-gray-50 rounded-lg mx-4 mb-2">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-sm italic text-gray-600">{getTypingMessage()}</span>
    </div>
  );
};

export default TypingIndicator;


