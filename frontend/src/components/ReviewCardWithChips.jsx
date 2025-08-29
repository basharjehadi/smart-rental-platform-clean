import React from 'react';
import { Star, User, Building, MessageSquare, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReviewStatusChip from './ReviewStatusChip';

const ReviewCardWithChips = ({ 
  review, 
  isLandlord, 
  currentUserId, 
  onWriteReview,
  showWriteReviewButton = false 
}) => {
  const { t } = useTranslation();
  // Determine if this review is from the current user
  const isMyReview = review.reviewerId === currentUserId;
  
  // Determine if content should be hidden (blind review from counterpart)
  const shouldHideContent = !isMyReview && 
    review.status === 'SUBMITTED' && 
    review.publishAfter && 
    new Date(review.publishAfter) > new Date();

  // Get review target information
  const getReviewTargetInfo = () => {
    if (isLandlord) {
      return {
        name: review.tenant?.name || 'Tenant',
        role: 'Tenant',
        avatar: review.tenant?.profileImage || null
      };
    } else {
      return {
        name: review.landlord?.name || 'Landlord',
        role: 'Landlord',
        avatar: review.landlord?.profileImage || null
      };
    }
  };

  // Get stage information
  const getStageInfo = (stage) => {
    switch (stage) {
      case 'MOVE_IN':
        return {
          name: 'Move-in Experience',
          description: 'Review after moving in',
          color: 'blue',
          label: t('review.flow.moveInLabel'),
          affectsScore: false
        };
      case 'END_OF_LEASE':
        return {
          name: 'Lease End',
          description: 'Final review after lease ends',
          color: 'purple',
          label: t('review.flow.leaseEndLabel'),
          affectsScore: true
        };
      default:
        return {
          name: 'General',
          description: 'General review',
          color: 'gray',
          label: t('review.flow.initialLabel'),
          affectsScore: false
        };
    }
  };

  const targetInfo = getReviewTargetInfo();
  const stageInfo = getStageInfo(review.reviewStage);

  return (
    <div className="border border-gray-200 bg-white rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Avatar */}
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            {targetInfo.avatar ? (
              <img 
                src={targetInfo.avatar} 
                alt={targetInfo.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-gray-600">
                {targetInfo.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            )}
          </div>

          {/* Review Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-medium text-gray-900">{targetInfo.name}</span>
              <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                {targetInfo.role}
              </span>
            </div>

            {/* Property and Stage */}
            <p className="text-sm text-gray-600 mb-2">
              {review.property?.name || review.property?.address || 'Property'} • {stageInfo.description}
            </p>

            {/* Status Chip */}
            <div className="mb-2">
              <ReviewStatusChip 
                status={review.status} 
                publishAfter={review.publishAfter}
                isBlind={review.status === 'SUBMITTED' && review.publishAfter}
              />
            </div>

            {/* Stage Label */}
            <div className="mb-3">
              <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                stageInfo.affectsScore 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {stageInfo.label}
              </span>
            </div>

            {/* Rating */}
            {!shouldHideContent && review.rating && (
              <div className="flex items-center space-x-1 mb-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${
                      i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`} 
                  />
                ))}
                <span className="text-sm font-medium text-gray-900 ml-1">
                  {review.rating}
                </span>
              </div>
            )}

            {/* Comment */}
            {!shouldHideContent && review.comment && (
              <p className="text-sm text-gray-700 mb-2">
                {review.comment}
              </p>
            )}

            {/* Hidden Content Message */}
            {shouldHideContent && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-2">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-orange-800 font-medium">
                    {t('review.flow.blindNotice')}
                  </span>
                </div>
                <p className="text-xs text-orange-700 mt-1">
                  {t('review.flow.blindCountdown')} {review.publishAfter && <CountdownTimer targetDate={review.publishAfter} />}
                </p>
              </div>
            )}

            {/* Timestamps */}
            <div className="text-xs text-gray-500 space-y-1">
              {review.createdAt && (
                <p>Created: {new Date(review.createdAt).toLocaleDateString()}</p>
              )}
              {review.submittedAt && (
                <p>Submitted: {new Date(review.submittedAt).toLocaleDateString()}</p>
              )}
              {review.publishedAt && (
                <p>Published: {new Date(review.publishedAt).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {showWriteReviewButton && review.status === 'PENDING' && (
          <div className="flex-shrink-0 ml-4">
            <button 
              onClick={() => onWriteReview(review)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t('review.actions.writeReview')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewCardWithChips;
