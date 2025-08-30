import React from 'react';

/**
 * TrustLevelBadge component displays a user's trust level with appropriate styling
 * @param {Object} props - Component props
 * @param {string} props.level - The trust level string (e.g., 'New User', 'Reliable', 'Trusted', 'Excellent')
 * @param {string} props.className - Additional CSS classes for styling
 * @param {string} props.size - Size variant ('small', 'medium', 'large')
 * @returns {JSX.Element} Styled trust level badge
 */
const TrustLevelBadge = ({ level, className = '', size = 'medium' }) => {
  // Define trust level configurations
  const trustLevelConfig = {
    New: {
      label: 'New User',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-200',
    },
    Reliable: {
      label: 'Reliable',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
    },
    Trusted: {
      label: 'Trusted',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
    },
    Excellent: {
      label: 'Excellent',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
    },
  };

  // Get configuration for the current trust level, default to 'New' if not found
  const config = trustLevelConfig[level] || trustLevelConfig['New'];

  // Define size classes
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base',
  };

  // Combine all classes
  const badgeClasses = `
    inline-flex items-center justify-center
    font-medium rounded-full border
    ${config.bgColor} ${config.textColor} ${config.borderColor}
    ${sizeClasses[size]}
    ${className}
  `.trim();

  return <span className={badgeClasses}>{config.label}</span>;
};

export default TrustLevelBadge;
