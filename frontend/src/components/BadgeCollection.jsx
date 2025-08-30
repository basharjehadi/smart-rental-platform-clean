import React from 'react';
import Badge from './Badge';

/**
 * BadgeCollection component for displaying multiple user badges
 * @param {Object} props - Component props
 * @param {Array} props.badges - Array of badge objects
 * @param {number} props.maxDisplay - Maximum number of badges to display (default: all)
 * @param {boolean} props.showTitle - Whether to show the "Achievements" title
 * @param {string} props.title - Custom title for the badge collection
 * @param {string} props.layout - Layout type: 'grid', 'horizontal', or 'compact'
 */
const BadgeCollection = ({ 
  badges = [], 
  maxDisplay, 
  showTitle = true, 
  title = 'Achievements',
  layout = 'grid'
}) => {
  if (!badges || badges.length === 0) {
    return null;
  }

  // Limit badges if maxDisplay is specified
  const displayBadges = maxDisplay ? badges.slice(0, maxDisplay) : badges;
  const hasMoreBadges = maxDisplay && badges.length > maxDisplay;

  const renderBadges = () => {
    switch (layout) {
      case 'horizontal':
        return (
          <div className="flex flex-wrap gap-3">
            {displayBadges.map((badge) => (
              <Badge
                key={badge.id}
                name={badge.name}
                description={badge.description}
                icon={badge.icon}
                color={badge.color}
                earnedAt={badge.earnedAt}
                metadata={badge.metadata}
              />
            ))}
          </div>
        );
      
      case 'compact':
        return (
          <div className="flex flex-wrap gap-2">
            {displayBadges.map((badge) => (
              <div
                key={badge.id}
                className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 text-white border-2 border-gray-500 flex items-center justify-center text-sm shadow-sm"
                title={`${badge.name} - ${badge.description}`}
              >
                {badge.icon}
              </div>
            ))}
          </div>
        );
      
      case 'grid':
      default:
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {displayBadges.map((badge) => (
              <div key={badge.id} className="flex flex-col items-center">
                <Badge
                  name={badge.name}
                  description={badge.description}
                  icon={badge.icon}
                  color={badge.color}
                  earnedAt={badge.earnedAt}
                  metadata={badge.metadata}
                />
                <span className="text-xs text-gray-600 mt-2 text-center font-medium">
                  {badge.name}
                </span>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {showTitle && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-600">
            {badges.length} achievement{badges.length !== 1 ? 's' : ''} earned
          </p>
        </div>
      )}
      
      {renderBadges()}
      
      {hasMoreBadges && (
        <div className="mt-3 text-center">
          <span className="text-sm text-gray-500">
            +{badges.length - maxDisplay} more achievement{badges.length - maxDisplay !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export default BadgeCollection;
