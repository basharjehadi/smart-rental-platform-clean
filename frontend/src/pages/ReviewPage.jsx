import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import ReviewSystem from '../components/ReviewSystem';
import { Star, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RatingDisplay from '../components/RatingDisplay';

const ReviewPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your reviews.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-blue-600" />
                </div>
                                 <div>
                   <h1 className="text-xl font-semibold text-gray-900">
                     {user.role === 'LANDLORD' ? 'Tenant Review System' : 'Landlord Review System'}
                   </h1>
                   <p className="text-sm text-gray-600">
                     {user.role === 'LANDLORD' ? 'Review and rate your tenants' : 'Review and rate your landlords'}
                   </p>
                 </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
                             <div className="text-right">
                 <p className="text-sm text-gray-600">
                   {user.role === 'LANDLORD' ? 'Landlord Rating' : 'Tenant Rating'}
                 </p>
                 <RatingDisplay 
                   averageRating={user.averageRating} 
                   totalReviews={user.totalReviews} 
                   size="large"
                 />
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Review System Component */}
        <ReviewSystem userId={user.id} isLandlord={user.role === 'LANDLORD'} />
      </div>
    </div>
  );
};

export default ReviewPage;
