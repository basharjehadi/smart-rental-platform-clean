import React from 'react';

interface TypingUser {
  userId: string;
  userName: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  currentUserId: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  currentUserId,
}) => {
  // Filter out the current user from typing users
  const otherTypingUsers = typingUsers.filter(
    user => user.userId !== currentUserId
  );

  if (otherTypingUsers.length === 0) return null;

  const getTypingMessage = () => {
    if (otherTypingUsers.length === 1) {
      return `${otherTypingUsers[0].userName} is typing...`;
    } else if (otherTypingUsers.length === 2) {
      return `${otherTypingUsers[0].userName} and ${otherTypingUsers[1].userName} are typing...`;
    } else {
      const names = otherTypingUsers
        .slice(0, 2)
        .map(u => u.userName)
        .join(', ');
      return `${names} and ${otherTypingUsers.length - 2} others are typing...`;
    }
  };

  return (
    <div className='inline-flex items-center space-x-2 px-3 py-2 text-gray-500 bg-gray-100 border border-gray-200 rounded-full mx-4 mb-2 sticky bottom-3 self-start shadow-sm'>
      <div className='flex space-x-1'>
        <div
          className='w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce'
          style={{ animationDelay: '0ms' }}
        ></div>
        <div
          className='w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce'
          style={{ animationDelay: '150ms' }}
        ></div>
        <div
          className='w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce'
          style={{ animationDelay: '300ms' }}
        ></div>
      </div>
      <span className='text-xs italic text-gray-600'>{getTypingMessage()}</span>
    </div>
  );
};

export default TypingIndicator;
