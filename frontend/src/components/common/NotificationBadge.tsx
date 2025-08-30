import React from 'react';

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  className = '',
}) => {
  if (count === 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[20px] ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default NotificationBadge;
