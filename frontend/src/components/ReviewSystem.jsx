import React, { useState, useEffect } from 'react';
import {
  Star,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Building,
  MessageSquare,
} from 'lucide-react';
import ReviewCardWithChips from './ReviewCardWithChips';
import RatingDisplay from './RatingDisplay';

const ReviewSystem = ({ userId, isLandlord = false }) => {
  const [pendingReviews, setPendingReviews] = useState([]);
  const [myRating, setMyRating] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

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
        } else {
          console.warn('Failed to fetch user rank:', rankResponse.status);
          // Don't set error for rank failure, just log it
        }
      } catch (rankError) {
        console.warn('Error fetching user rank:', rankError);
        // Don't set error for rank failure, just log it
      }
    } catch (err) {
      setError('Failed to load review data');
      console.error('Error fetching review data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWriteReview = review => {
    setSelectedReview(review);
    setShowReviewForm(true);
  };

  const getStageInfo = stage => {
    switch (stage) {
      case 'MOVE_IN':
        return {
          name: 'Move-in Experience',
          description: 'Review after moving in',
          icon: <Building className='w-5 h-5 text-blue-500' />,
          color: 'blue',
          label: 'Move-in check (no score impact)',
          affectsScore: false,
        };
      case 'END_OF_LEASE':
        return {
          name: 'Lease End',
          description: 'Final review after lease ends',
          icon: <Clock className='w-5 h-5 text-purple-500' />,
          color: 'purple',
          label: 'Lease end review (affects score)',
          affectsScore: true,
        };
      default:
        return {
          name: 'Initial',
          description: 'Starting rating',
          icon: <Star className='w-5 h-5 text-gray-400' />,
          color: 'gray',
          label: 'Initial rating (minimal impact)',
          affectsScore: true,
        };
    }
  };

  const getReviewTargetName = review => {
    if (isLandlord) {
      return review.tenant?.name || 'Tenant';
    } else {
      return review.landlord?.name || 'Landlord';
    }
  };

  const getReviewTargetRole = () => {
    return isLandlord ? 'Tenant' : 'Landlord';
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
        <div className='flex items-center'>
          <AlertCircle className='w-5 h-5 text-red-500 mr-2' />
          <span className='text-red-700'>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Top Row - Rating and Rank Side by Side */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* My Current Rating */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            My Current Rating
          </h3>

          <div className='flex items-center space-x-4 mb-4'>
            <RatingDisplay
              averageRating={myRating?.averageRating}
              totalReviews={myRating?.totalReviews}
              size='large'
              className='text-3xl font-bold text-gray-900'
            />
          </div>

          <div className='flex items-center text-sm text-gray-600'>
            <CheckCircle className='w-4 h-4 text-green-500 mr-2' />
            <span>Based on authentic rental experiences</span>
          </div>
          <p className='text-sm text-gray-600 mt-1'>
            {isLandlord
              ? 'Your rating reflects real feedback from tenants across all rental stages'
              : 'Your rating reflects real feedback from landlords across all rental stages'}
          </p>
        </div>

        {/* User Rank */}
        {userRank && userRank.rankInfo ? (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
              <span className='text-2xl mr-2'>
                {userRank.rankInfo.icon || '⭐'}
              </span>
              Your Current Rank: {userRank.rankInfo.name || 'New User'}
            </h3>

            <div className='mb-4'>
              <div className='inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-3'>
                {isLandlord ? 'Trusted by tenants' : 'Trusted by landlords'}
              </div>
              <div className='flex items-center space-x-6'>
                <div className='text-sm'>
                  <span className='font-medium text-gray-600'>
                    Rank Points:
                  </span>
                  <span className='ml-2 text-lg font-bold text-green-600'>
                    {userRank.rankPoints || 0}
                  </span>
                </div>
                <div className='text-sm'>
                  <span className='font-medium text-gray-600'>
                    Total Reviews:
                  </span>
                  <span className='ml-2 text-lg font-bold text-gray-900'>
                    {userRank.totalReviews || 1}
                  </span>
                </div>
              </div>
            </div>

            {userRank.nextRankRequirements && userRank.nextRankInfo && (
              <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                <h4 className='font-medium text-gray-900 mb-2'>
                  Next Rank: {userRank.nextRankInfo.name || 'Next Level'}
                </h4>
                <p className='text-sm text-gray-600 mb-3'>
                  {userRank.nextRankInfo.description ||
                    'Keep going to reach the next rank!'}
                </p>
                <div className='flex items-center justify-between'>
                  <div className='text-sm text-gray-600'>
                    <span>Points needed: </span>
                    <span className='font-medium'>
                      {userRank.nextRankRequirements.pointsNeeded -
                        userRank.rankPoints}
                    </span>
                  </div>
                  <div className='w-32 bg-gray-200 rounded-full h-2'>
                    <div
                      className='bg-blue-500 h-2 rounded-full transition-all duration-300'
                      style={{
                        width: `${Math.min(100, (userRank.rankPoints / userRank.nextRankRequirements.pointsNeeded) * 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div className='mt-4 text-xs text-gray-500'>
              <p>
                • Ranks are automatically updated based on your activity and
                reviews
              </p>
              <p>• Complete more rental stages to earn higher ranks</p>
            </div>
          </div>
        ) : (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
              <span className='text-2xl mr-2'>⭐</span>
              Your Current Rank: New User
            </h3>

            <div className='mb-4'>
              <div className='inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-3'>
                {isLandlord ? 'New landlord' : 'New tenant'}
              </div>
              <div className='flex items-center space-x-6'>
                <div className='text-sm'>
                  <span className='font-medium text-gray-600'>
                    Rank Points:
                  </span>
                  <span className='ml-2 text-lg font-bold text-green-600'>
                    0
                  </span>
                </div>
                <div className='text-sm'>
                  <span className='font-medium text-gray-600'>
                    Total Reviews:
                  </span>
                  <span className='ml-2 text-lg font-bold text-gray-900'>
                    1
                  </span>
                </div>
              </div>
            </div>

            <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
              <h4 className='font-medium text-gray-900 mb-2'>
                Next Rank: Bronze {isLandlord ? 'Landlord' : 'Tenant'}
              </h4>
              <p className='text-sm text-gray-600 mb-3'>
                Complete 3 reviews and earn {isLandlord ? '50' : '75'} points to
                reach the next rank
              </p>
              <div className='flex items-center justify-between'>
                <div className='text-sm text-gray-600'>
                  <span>Points needed: </span>
                  <span className='font-medium'>
                    {isLandlord ? '50' : '75'}
                  </span>
                </div>
                <div className='w-32 bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-blue-500 h-2 rounded-full transition-all duration-300'
                    style={{ width: '0%' }}
                  ></div>
                </div>
              </div>
            </div>

            <div className='mt-4 text-xs text-gray-500'>
              <p>
                • Ranks are automatically updated based on your activity and
                reviews
              </p>
              <p>• Complete more rental stages to earn higher ranks</p>
            </div>
          </div>
        )}
      </div>

      {/* Pending Reviews - What I Need to Review */}
      {pendingReviews.length > 0 ? (
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Pending Reviews - Review Your {getReviewTargetRole()}
          </h3>
          <p className='text-sm text-gray-600 mb-6'>
            {isLandlord
              ? 'Complete these reviews to help build trust with your tenants and improve your landlord reputation.'
              : 'Complete these reviews to help build trust with your landlords and improve your tenant reputation.'}
          </p>

          <div className='space-y-4'>
            {pendingReviews.map(review => (
              <ReviewCardWithChips
                key={review.id}
                review={review}
                isLandlord={isLandlord}
                currentUserId={userId}
                onWriteReview={handleWriteReview}
                showWriteReviewButton={true}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className='bg-green-50 border border-green-200 rounded-lg p-6 text-center'>
          <CheckCircle className='w-8 h-8 text-green-500 mx-auto mb-3' />
          <h3 className='text-lg font-semibold text-green-900 mb-2'>
            All Caught Up!
          </h3>
          <p className='text-green-700 text-sm'>
            You don't have any pending reviews right now. Reviews will appear
            here as you complete rental stages.
          </p>
        </div>
      )}

      {/* Review History */}
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <h4 className='font-medium text-gray-900 mb-6 text-lg flex items-center'>
          <MessageSquare className='w-5 h-5 mr-2 text-gray-600' />
          {isLandlord ? 'Tenant Reviews' : 'Landlord Reviews'}
        </h4>
        <p className='text-sm text-gray-600 mb-6'>
          {isLandlord
            ? "View reviews from your tenants and reviews you've given to tenants"
            : "View reviews from your landlords and reviews you've given to landlords"}
        </p>

        <div className='flex space-x-1 border-b border-gray-200 mb-6'>
          <button className='px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600'>
            {isLandlord
              ? 'Reviews from Tenants (2)'
              : 'Reviews from Landlords (2)'}
          </button>
          <button className='px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700'>
            {isLandlord
              ? "Reviews I've Given to Tenants (1)"
              : "Reviews I've Given to Landlords (1)"}
          </button>
        </div>

        <div className='space-y-4'>
          {/* Demo Review 1 */}
          <ReviewCardWithChips
            review={{
              id: 'demo-1',
              reviewerId: 'demo-user-1',
              reviewStage: 'MOVE_IN',
              status: 'PUBLISHED',
              rating: 5,
              comment: isLandlord
                ? 'Excellent tenant! Very responsible and communicative during the move-in process. All paperwork was handled efficiently.'
                : 'Great landlord! Very helpful and professional during move-in. Highly recommend!',
              createdAt: new Date(
                Date.now() - 2 * 24 * 60 * 60 * 1000
              ).toISOString(),
              publishedAt: new Date(
                Date.now() - 2 * 24 * 60 * 60 * 1000
              ).toISOString(),
              property: {
                name: isLandlord ? 'Demo Property' : 'Sunset Apartments',
              },
              tenant: { name: 'Demo Tenant', profileImage: null },
              landlord: { name: 'Mike Johnson', profileImage: null },
            }}
            isLandlord={isLandlord}
            currentUserId={userId}
            onWriteReview={() => {}}
            showWriteReviewButton={false}
          />

          {/* Demo Review 2 */}
          <ReviewCardWithChips
            review={{
              id: 'demo-2',
              reviewerId: 'demo-user-2',
              reviewStage: 'MOVE_IN',
              status: 'PUBLISHED',
              rating: 4,
              comment: isLandlord
                ? 'Great property and smooth move-in process. The landlord was helpful with the setup and provided all necessary information.'
                : 'Responsible tenant who takes good care of the property. Communication has been excellent throughout the process.',
              createdAt: new Date(
                Date.now() - 7 * 24 * 60 * 60 * 1000
              ).toISOString(),
              publishedAt: new Date(
                Date.now() - 7 * 24 * 60 * 60 * 1000
              ).toISOString(),
              property: {
                name: isLandlord ? 'Sunset Apartments' : 'Downtown Lofts',
              },
              tenant: { name: 'Sarah Johnson', profileImage: null },
              landlord: { name: 'Anna Lee', profileImage: null },
            }}
            isLandlord={isLandlord}
            currentUserId={userId}
            onWriteReview={() => {}}
            showWriteReviewButton={false}
          />

          {/* Demo Blind Review */}
          <ReviewCardWithChips
            review={{
              id: 'demo-3',
              reviewerId: 'demo-user-3',
              reviewStage: 'END_OF_LEASE',
              status: 'SUBMITTED',
              rating: 5,
              comment:
                "This is a blind review that will be published later. The content is hidden from the counterpart until it's published.",
              createdAt: new Date(
                Date.now() - 1 * 24 * 60 * 60 * 1000
              ).toISOString(),
              submittedAt: new Date(
                Date.now() - 1 * 24 * 60 * 60 * 1000
              ).toISOString(),
              publishAfter: new Date(
                Date.now() + 13 * 24 * 60 * 60 * 1000
              ).toISOString(), // 13 days from now
              property: { name: 'Demo Property' },
              tenant: { name: 'Demo Tenant', profileImage: null },
              landlord: { name: 'Demo Landlord', profileImage: null },
            }}
            isLandlord={isLandlord}
            currentUserId={userId}
            onWriteReview={() => {}}
            showWriteReviewButton={false}
          />
        </div>
      </div>

      {/* How Reviews Work */}
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <h4 className='font-medium text-gray-900 mb-6 text-lg flex items-center'>
          <User className='w-5 h-5 mr-2 text-gray-600' />
          {isLandlord
            ? 'How the 2-Stage Review System Works for Landlords'
            : 'How the 2-Stage Review System Works for Tenants'}
        </h4>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='text-center'>
            <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3'>
              <span className='text-xl font-bold text-blue-600'>1</span>
            </div>
            <h5 className='font-medium text-blue-900 mb-2'>
              Move-in Experience
            </h5>
            <p className='text-sm text-blue-800'>
              {isLandlord
                ? 'Review your tenant after move-in (no score impact)'
                : 'Review your landlord after moving in (no score impact)'}
            </p>
            <div className='mt-2'>
              <span className='inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full'>
                Move-in check (no score impact)
              </span>
            </div>
          </div>
          <div className='text-center'>
            <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3'>
              <span className='text-xl font-bold text-purple-600'>2</span>
            </div>
            <h5 className='font-medium text-purple-900 mb-2'>Lease End</h5>
            <p className='text-sm text-purple-800'>
              {isLandlord
                ? 'Final review of your tenant (affects score)'
                : 'Final review of your landlord (affects score)'}
            </p>
            <div className='mt-2'>
              <span className='inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full'>
                Lease end review (affects score)
              </span>
            </div>
          </div>
        </div>

        <div className='mt-6 p-4 bg-blue-100 rounded-lg'>
          <p className='text-sm text-blue-900'>
            <strong>Note:</strong>{' '}
            {isLandlord
              ? "As a landlord, you'll review your tenants at each stage, and they'll review you too. This mutual feedback system helps build trust and improves the rental experience for everyone."
              : "As a tenant, you'll review your landlords at each stage, and they'll review you too. This mutual feedback system helps build trust and improves the rental experience for everyone."}
          </p>
        </div>
      </div>

      {/* Review Form Modal */}
      {showReviewForm && selectedReview && (
        <ReviewFormModal
          review={selectedReview}
          isLandlord={isLandlord}
          onClose={() => {
            setShowReviewForm(false);
            setSelectedReview(null);
          }}
          onSubmit={() => {
            setShowReviewForm(false);
            setSelectedReview(null);
            fetchReviewData(); // Refresh data
          }}
        />
      )}
    </div>
  );
};

// Review Form Modal Component
const ReviewFormModal = ({ review, isLandlord, onClose, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          leaseId: review.leaseId,
          rating,
          comment,
          reviewStage: review.reviewStage,
          targetUserId: isLandlord ? review.tenantId : review.landlordId,
        }),
      });

      if (response.ok) {
        onSubmit();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getTargetName = () => {
    if (isLandlord) {
      return review.tenant?.name || 'Tenant';
    } else {
      return review.landlord?.name || 'Landlord';
    }
  };

  const getStageName = stage => {
    switch (stage) {
      case 'MOVE_IN':
        return 'Move-in Experience';
      case 'END_OF_LEASE':
        return 'Lease End';
      default:
        return 'General';
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          Review {getTargetName()}
        </h3>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Stage: {getStageName(review.reviewStage)}
            </label>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Rating
            </label>
            <div className='flex items-center space-x-1'>
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  type='button'
                  onClick={() => setRating(i + 1)}
                  className='focus:outline-none'
                >
                  <Star
                    className={`w-8 h-8 ${
                      i < rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    } hover:text-yellow-400 transition-colors`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Comment
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              placeholder={`Share your experience with ${getTargetName()}...`}
              required
            />
          </div>

          <div className='flex space-x-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={submitting}
              className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50'
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewSystem;
