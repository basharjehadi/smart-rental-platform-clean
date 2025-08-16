import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import ReviewSystem from '../components/ReviewSystem';
import { Star, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
                  <h1 className="text-xl font-semibold text-gray-900">Review System</h1>
                  <p className="text-sm text-gray-600">
                    {user.role === 'LANDLORD' ? 'Landlord' : 'Tenant'} Rating & Reviews
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Current Rating</p>
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-lg font-semibold text-gray-900">
                    {user.averageRating || 5.0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">
              How the 3-Stage Review System Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="font-medium text-blue-900 mb-2">Payment Completion</h3>
                <p className="text-sm text-blue-800">
                  First review stage after you complete payment for a property
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-blue-600">2</span>
                </div>
                <h3 className="font-medium text-blue-900 mb-2">Move-in</h3>
                <p className="text-sm text-blue-800">
                  Second review stage after you move into the property
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-blue-600">3</span>
                </div>
                <h3 className="font-medium text-blue-900 mb-2">Lease End</h3>
                <p className="text-sm text-blue-800">
                  Final review stage after your lease term ends
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Review System Component */}
        <ReviewSystem userId={user.id} isLandlord={user.role === 'LANDLORD'} />
      </div>
    </div>
  );
};

export default ReviewPage;
