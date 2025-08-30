import React from 'react';
import { Star, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const RatingDisplay = ({
  averageRating,
  totalReviews,
  showStars = true,
  showReviews = true,
  size = 'default',
  className = '',
}) => {
  const { t } = useTranslation();
  // Check if we should show "New" badge
  const shouldShowNewBadge = !averageRating || totalReviews < 3;

  // Don't show rating if it's null/undefined or if there are fewer than 3 reviews
  const shouldShowRating = averageRating && totalReviews >= 3;

  // Size classes
  const sizeClasses = {
    small: {
      star: 'w-3 h-3',
      text: 'text-xs',
      badge: 'text-xs px-2 py-1',
    },
    default: {
      star: 'w-4 h-4',
      text: 'text-sm',
      badge: 'text-xs px-2 py-1',
    },
    large: {
      star: 'w-5 h-5',
      text: 'text-base',
      badge: 'text-sm px-3 py-1',
    },
  };

  const currentSize = sizeClasses[size];

  if (shouldShowNewBadge) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showStars && (
          <div className='flex items-center space-x-1'>
            <Shield className={`${currentSize.star} text-blue-600`} />
          </div>
        )}
        <div
          className={`inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium ${currentSize.badge}`}
        >
          <Shield className='w-3 h-3 mr-1' />
          {t('badges.newVerified')}
        </div>
      </div>
    );
  }

  if (!shouldShowRating) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showStars && (
        <div className='flex items-center space-x-1'>
          <Star
            className={`${currentSize.star} text-yellow-400 fill-current`}
          />
          <span className={`font-medium text-gray-900 ${currentSize.text}`}>
            {averageRating}
          </span>
        </div>
      )}
      {showReviews && totalReviews > 0 && (
        <span className={`text-gray-600 ${currentSize.text}`}>
          ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  );
};

export default RatingDisplay;
