import React, { useState } from 'react';

/**
 * Badge component for displaying user achievements
 * @param {Object} props - Component props
 * @param {string} props.name - Badge name
 * @param {string} props.description - Badge description
 * @param {string} props.icon - Badge icon (emoji or icon identifier)
 * @param {string} props.color - Badge color theme
 * @param {Date} props.earnedAt - When the badge was earned
 * @param {Object} props.metadata - Additional badge data
 */
const Badge = ({ name, description, icon, color = 'default', earnedAt, metadata }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Color schemes for different badge types
  const colorSchemes = {
    gold: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-500',
    green: 'bg-gradient-to-r from-green-400 to-green-600 text-white border-green-500',
    blue: 'bg-gradient-to-r from-blue-400 to-blue-600 text-white border-blue-500',
    purple: 'bg-gradient-to-r from-purple-400 to-purple-600 text-white border-purple-500',
    red: 'bg-gradient-to-r from-red-400 to-red-600 text-white border-red-500',
    default: 'bg-gradient-to-r from-gray-400 to-gray-600 text-white border-gray-500',
  };

  const colorScheme = colorSchemes[color] || colorSchemes.default;

  // Format the earned date
  const formatEarnedDate = (date) => {
    if (!date) return '';
    const earnedDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - earnedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Earned today';
    if (diffDays <= 7) return `Earned ${diffDays} days ago`;
    if (diffDays <= 30) return `Earned ${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays <= 365) return `Earned ${Math.floor(diffDays / 30)} months ago`;
    return `Earned ${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="relative inline-block">
      <div
        className={`
          inline-flex items-center justify-center w-12 h-12 rounded-full 
          border-2 shadow-lg cursor-pointer transition-all duration-200 
          hover:scale-110 hover:shadow-xl
          ${colorScheme}
        `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title={`${name} - ${description}`}
      >
        <span className="text-lg font-semibold">{icon}</span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap">
          <div className="text-center">
            <div className="font-semibold mb-1">{name}</div>
            <div className="text-gray-300 text-xs mb-1">{description}</div>
            {earnedAt && (
              <div className="text-gray-400 text-xs">
                {formatEarnedDate(earnedAt)}
              </div>
            )}
            {metadata && Object.keys(metadata).length > 0 && (
              <div className="text-gray-400 text-xs mt-1">
                {metadata.percentage && `${metadata.percentage}%`}
                {metadata.avgResponseTime && `${metadata.avgResponseTime}h avg`}
              </div>
            )}
          </div>
          
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default Badge;
