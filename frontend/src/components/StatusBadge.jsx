import React from 'react';

const StatusBadge = ({ status, size = 'default' }) => {
  const getStatusConfig = (status) => {
    const configs = {
      ACTIVE: {
        text: 'Active',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: '🟢',
        iconColor: 'text-green-600'
      },
      ACCEPTED: {
        text: 'Accepted',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '✅',
        iconColor: 'text-blue-600'
      },
      DECLINED: {
        text: 'Declined',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: '❌',
        iconColor: 'text-red-600'
      },
      EXPIRED: {
        text: 'Expired',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: '⚪',
        iconColor: 'text-gray-600'
      },
      PENDING: {
        text: 'Pending',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '⏳',
        iconColor: 'text-yellow-600'
      }
    };
    
    return configs[status] || configs.PENDING;
  };

  const config = getStatusConfig(status);
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    default: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${config.color} ${sizeClasses[size]}`}>
      <span className={`text-sm ${config.iconColor}`}>
        {config.icon}
      </span>
      {config.text}
    </span>
  );
};

export default StatusBadge; 