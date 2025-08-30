import React, { useState, useEffect } from 'react';
import {
  Star,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Building,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReviewStatusChip from './ReviewStatusChip';
import RatingDisplay from './RatingDisplay';

const ReviewCard = ({ userId, isLandlord = false }) => {
  const [pendingReviews, setPendingReviews] = useState([]);
  const [myRating, setMyRating] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      fetchReviewData();
    }
  }, [userId]);

  const fetchReviewData = async () => {
    try {
      setLoading(true);

      // Fetch pending reviews that this user needs to give
      const pendingResponse = await fetch(`/api/reviews/pending/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingReviews(pendingData.data || []);
      }

      // Fetch this user's current rating
      const ratingResponse = await fetch(
        `/api/reviews/user/${userId}/summary`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (ratingResponse.ok) {
        const ratingData = await ratingResponse.json();
        setMyRating(ratingData.data);
      }

      // Fetch user rank information
      try {
        const rankResponse = await fetch(`/api/users/${userId}/rank`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (rankResponse.ok) {
          const rankData = await rankResponse.json();
          setUserRank(rankData.data);
        }
      } catch (rankError) {
        console.warn('Error fetching user rank:', rankError);
      }
    } catch (err) {
      console.error('Error fetching review data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 rounded w-1/3 mb-4'></div>
          <div className='h-6 bg-gray-200 rounded w-1/2 mb-4'></div>
          <div className='h-4 bg-gray-200 rounded w-2/3'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold text-gray-900'>
          {isLandlord ? 'Tenant Reviews' : 'Landlord Reviews'}
        </h3>
        <button
          onClick={() => navigate('/reviews')}
          className='p-1 hover:bg-gray-100 rounded transition-colors'
        >
          <ChevronRight className='w-4 h-4 text-gray-400' />
        </button>
      </div>

      <div className='space-y-4'>
        {/* Current Rating */}
        <div className='flex items-center justify-between'>
          <span className='text-sm text-gray-600'>Current Rating</span>
          <RatingDisplay
            averageRating={myRating?.averageRating}
            totalReviews={myRating?.totalReviews}
            size='default'
          />
        </div>

        {/* Rank */}
        <div className='flex items-center justify-between'>
          <span className='text-sm text-gray-600'>Rank</span>
          <div className='flex items-center space-x-2'>
            <span className='text-2xl'>{userRank?.rankInfo?.icon || '⭐'}</span>
            <span className='text-sm font-medium text-gray-900'>
              {userRank?.rankInfo?.name || 'New User'}
            </span>
          </div>
        </div>

        {/* Pending Reviews */}
        <div className='flex items-center justify-between'>
          <span className='text-sm text-gray-600'>Pending Reviews</span>
          <div className='flex items-center space-x-2'>
            {pendingReviews.length > 0 ? (
              <AlertCircle className='w-4 h-4 text-red-500' />
            ) : (
              <CheckCircle className='w-4 h-4 text-green-500' />
            )}
            <span
              className={`text-sm font-medium ${pendingReviews.length > 0 ? 'text-red-600' : 'text-green-600'}`}
            >
              {pendingReviews.length > 0
                ? `${pendingReviews.length} pending`
                : 'All caught up'}
            </span>
          </div>
        </div>

        {/* Review Status Summary */}
        {pendingReviews.length > 0 && (
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-600'>Status Summary</span>
            <div className='flex items-center space-x-2'>
              {pendingReviews.map((review, index) => (
                <ReviewStatusChip
                  key={review.id || index}
                  status={review.status}
                  publishAfter={review.publishAfter}
                  isBlind={review.status === 'SUBMITTED' && review.publishAfter}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View Full Review System Button */}
      <button
        onClick={() => navigate('/reviews')}
        className='w-full mt-6 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors'
      >
        {isLandlord
          ? 'View Full Tenant Review System'
          : 'View Full Landlord Review System'}
      </button>
    </div>
  );
};

export default ReviewCard;
