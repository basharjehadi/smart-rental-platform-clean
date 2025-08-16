import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, Clock, AlertCircle, User, Building, MessageSquare } from 'lucide-react';

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
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingReviews(pendingData.data || []);
      }

      // Fetch this user's current rating
      const ratingResponse = await fetch(`/api/reviews/user/${userId}/summary`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (ratingResponse.ok) {
        const ratingData = await ratingResponse.json();
        setMyRating(ratingData.data);
      }

      // Fetch user rank information
      try {
        const rankResponse = await fetch(`/api/users/${userId}/rank`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
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

  const handleWriteReview = (review) => {
    setSelectedReview(review);
    setShowReviewForm(true);
  };

  const getStageInfo = (stage) => {
    switch (stage) {
      case 'PAYMENT_COMPLETED':
        return {
          name: 'Payment Completed',
          description: 'Review after completing payment',
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          color: 'green'
        };
      case 'MOVE_IN':
        return {
          name: 'Move-in Experience',
          description: 'Review after moving in',
          icon: <Building className="w-5 h-5 text-blue-500" />,
          color: 'blue'
        };
      case 'LEASE_END':
        return {
          name: 'Lease End',
          description: 'Final review after lease ends',
          icon: <Clock className="w-5 h-5 text-purple-500" />,
          color: 'purple'
        };
      default:
        return {
          name: 'Initial',
          description: 'Starting rating',
          icon: <Star className="w-5 h-5 text-gray-400" />,
          color: 'gray'
        };
    }
  };

  const getReviewTargetName = (review) => {
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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Row - Rating and Rank Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Current Rating */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            My Current Rating
          </h3>
          
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`w-6 h-6 ${
                    i < (myRating?.averageRating || 5) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {myRating?.averageRating || 5.0}
            </div>
            <div className="text-sm text-gray-500">
              ({myRating?.totalReviews || 1} reviews)
            </div>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            <span>Based on authentic rental experiences</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {isLandlord 
              ? "Your rating reflects real feedback from tenants across all rental stages"
              : "Your rating reflects real feedback from landlords across all rental stages"
            }
          </p>
        </div>

        {/* User Rank */}
        {userRank && userRank.rankInfo ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">{userRank.rankInfo.icon || '⭐'}</span>
              Your Current Rank: {userRank.rankInfo.name || 'New User'}
            </h3>
            
            <div className="mb-4">
                        <div className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-3">
            {isLandlord ? "Trusted by tenants" : "Trusted by landlords"}
          </div>
              <div className="flex items-center space-x-6">
                <div className="text-sm">
                  <span className="font-medium text-gray-600">Rank Points:</span>
                  <span className="ml-2 text-lg font-bold text-green-600">{userRank.rankPoints || 0}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-600">Total Reviews:</span>
                  <span className="ml-2 text-lg font-bold text-gray-900">{userRank.totalReviews || 1}</span>
                </div>
              </div>
            </div>

            {userRank.nextRankRequirements && userRank.nextRankInfo && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Next Rank: {userRank.nextRankInfo.name || 'Next Level'}</h4>
                <p className="text-sm text-gray-600 mb-3">{userRank.nextRankInfo.description || 'Keep going to reach the next rank!'}</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span>Points needed: </span>
                    <span className="font-medium">{userRank.nextRankRequirements.pointsNeeded - userRank.rankPoints}</span>
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (userRank.rankPoints / userRank.nextRankRequirements.pointsNeeded) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 text-xs text-gray-500">
              <p>• Ranks are automatically updated based on your activity and reviews</p>
              <p>• Complete more rental stages to earn higher ranks</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">⭐</span>
              Your Current Rank: New User
            </h3>
            
            <div className="mb-4">
                        <div className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-3">
            {isLandlord ? "New landlord" : "New tenant"}
          </div>
              <div className="flex items-center space-x-6">
                <div className="text-sm">
                  <span className="font-medium text-gray-600">Rank Points:</span>
                  <span className="ml-2 text-lg font-bold text-green-600">0</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-600">Total Reviews:</span>
                  <span className="ml-2 text-lg font-bold text-gray-900">1</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Next Rank: Bronze {isLandlord ? 'Landlord' : 'Tenant'}</h4>
              <p className="text-sm text-gray-600 mb-3">Complete 3 reviews and earn {isLandlord ? '50' : '75'} points to reach the next rank</p>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span>Points needed: </span>
                  <span className="font-medium">{isLandlord ? '50' : '75'}</span>
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: '0%' }}></div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              <p>• Ranks are automatically updated based on your activity and reviews</p>
              <p>• Complete more rental stages to earn higher ranks</p>
            </div>
          </div>
        )}
      </div>

      {/* Pending Reviews - What I Need to Review */}
      {pendingReviews.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Reviews - Review Your {getReviewTargetRole()}
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            {isLandlord 
              ? "Complete these reviews to help build trust with your tenants and improve your landlord reputation."
              : "Complete these reviews to help build trust with your landlords and improve your tenant reputation."
            }
          </p>
          
          <div className="space-y-4">
            {pendingReviews.map((review) => {
              const stageInfo = getStageInfo(review.reviewStage);
              return (
                <div key={review.id} className="border border-gray-200 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {stageInfo.icon}
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          {getReviewTargetName(review)} • {stageInfo.description}
                        </div>
                        {review.property && (
                          <div className="text-xs text-gray-500 mt-1">
                            Property: {review.property.name || review.property.address}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleWriteReview(review)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Write Review</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            All Caught Up!
          </h3>
          <p className="text-green-700 text-sm">
            You don't have any pending reviews right now. Reviews will appear here as you complete rental stages.
          </p>
        </div>
      )}

      {/* Review History */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-6 text-lg flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-gray-600" />
          {isLandlord ? "Tenant Reviews" : "Landlord Reviews"}
        </h4>
        <p className="text-sm text-gray-600 mb-6">
          {isLandlord 
            ? "View reviews from your tenants and reviews you've given to tenants"
            : "View reviews from your landlords and reviews you've given to landlords"
          }
        </p>
        
        <div className="flex space-x-1 border-b border-gray-200 mb-6">
          <button className="px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
            {isLandlord ? "Reviews from Tenants (2)" : "Reviews from Landlords (2)"}
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            {isLandlord ? "Reviews I've Given to Tenants (1)" : "Reviews I've Given to Landlords (1)"}
          </button>
        </div>

        <div className="space-y-4">
          {/* Demo Review 1 */}
          <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-blue-600">{isLandlord ? 'DT' : 'MJ'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-gray-900">{isLandlord ? 'Demo Tenant' : 'Mike Johnson'}</span>
                <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">{isLandlord ? 'Tenant' : 'Landlord'}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{isLandlord ? 'Demo Property • Payment Completion' : 'Sunset Apartments • Payment Completion'}</p>
              <div className="flex items-center space-x-1 mb-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
                <span className="text-sm font-medium text-gray-900 ml-1">5</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">Posted 2 days ago</p>
              <p className="text-sm text-gray-700">
                {isLandlord 
                  ? "Excellent landlord! Very responsive and professional during the payment process. All paperwork was handled efficiently."
                  : "Great tenant! Very responsible with payments and communication. Highly recommend!"
                }
              </p>
            </div>
          </div>

          {/* Demo Review 2 */}
          <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-green-600">{isLandlord ? 'SJ' : 'AL'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="flex-1 min-w-0">
                  <span className="font-medium text-gray-900">{isLandlord ? 'Sarah Johnson' : 'Anna Lee'}</span>
                  <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded ml-2">{isLandlord ? 'Tenant' : 'Landlord'}</span>
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{isLandlord ? 'Sunset Apartments • Move-in' : 'Downtown Lofts • Move-in'}</p>
              <div className="flex items-center space-x-1 mb-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
                <Star className="w-4 h-4 text-gray-300" />
                <span className="text-sm font-medium text-gray-900 ml-1">4</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">Posted 1 week ago</p>
              <p className="text-sm text-gray-700">
                {isLandlord 
                  ? "Great property and smooth move-in process. The landlord was helpful with the setup and provided all necessary information."
                  : "Responsible tenant who takes good care of the property. Communication has been excellent throughout the process."
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How Reviews Work */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-6 text-lg flex items-center">
          <User className="w-5 h-5 mr-2 text-gray-600" />
          {isLandlord ? "How the 3-Stage Review System Works for Landlords" : "How the 3-Stage Review System Works for Tenants"}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold text-blue-600">1</span>
            </div>
            <h5 className="font-medium text-blue-900 mb-2">Payment Completion</h5>
            <p className="text-sm text-blue-800">
              {isLandlord 
                ? "Review your tenant after they complete payment"
                : "Review your landlord after completing payment"
              }
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold text-green-600">2</span>
            </div>
            <h5 className="font-medium text-green-900 mb-2">Move-in</h5>
            <p className="text-sm text-green-800">
              {isLandlord 
                ? "Review your tenant after move-in"
                : "Review your landlord after moving in"
              }
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold text-purple-600">3</span>
            </div>
            <h5 className="font-medium text-purple-900 mb-2">Lease End</h5>
            <p className="text-sm text-purple-800">
              {isLandlord 
                ? "Final review of your tenant"
                : "Final review of your landlord"
              }
            </p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-100 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> {isLandlord 
              ? "As a landlord, you'll review your tenants at each stage, and they'll review you too. This mutual feedback system helps build trust and improves the rental experience for everyone."
              : "As a tenant, you'll review your landlords at each stage, and they'll review you too. This mutual feedback system helps build trust and improves the rental experience for everyone."
            }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          leaseId: review.leaseId,
          rating,
          comment,
          reviewStage: review.reviewStage,
          targetUserId: isLandlord ? review.tenantId : review.landlordId
        })
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

  const getStageName = (stage) => {
    switch (stage) {
      case 'PAYMENT_COMPLETED': return 'Payment Completion';
      case 'MOVE_IN': return 'Move-in Experience';
      case 'LEASE_END': return 'Lease End';
      default: return 'General';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Review {getTargetName()}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stage: {getStageName(review.reviewStage)}
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <div className="flex items-center space-x-1">
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    } hover:text-yellow-400 transition-colors`}
                  />
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={`Share your experience with ${getTargetName()}...`}
              required
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
