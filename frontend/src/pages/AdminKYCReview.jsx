import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminKYCReview = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [pendingKYC, setPendingKYC] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingKYC();
  }, []);

  const fetchPendingKYC = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/admin/kyc/pending');
      setPendingKYC(response.data.data);
    } catch (error) {
      console.error('Error fetching pending KYC:', error);
      setError('Failed to fetch pending KYC submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (userId, action) => {
    try {
      setReviewing(true);
      
      const reviewData = {
        userId,
        action
      };

      if (action === 'REJECTED' && rejectionReason.trim()) {
        reviewData.rejectionReason = rejectionReason.trim();
      }

      await api.post('/users/admin/kyc/review', reviewData);
      
      // Refresh the list
      await fetchPendingKYC();
      
      // Reset form
      setSelectedUser(null);
      setRejectionReason('');
      
      alert(`KYC ${action.toLowerCase()} successfully`);
    } catch (error) {
      console.error('Error reviewing KYC:', error);
      alert(`Failed to ${action.toLowerCase()} KYC: ${error.response?.data?.message || error.message}`);
    } finally {
      setReviewing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">KYC Review</h1>
              <p className="text-gray-600">Review pending identity verification submissions</p>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Admin
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {pendingKYC.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending KYC Submissions</h3>
            <p className="text-gray-600">All identity verification requests have been reviewed.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingKYC.map((user) => (
              <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-500">
                          Submitted: {formatDate(user.kycSubmittedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Document Information</h4>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Document:</span> {user.identityDocument}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">GDPR Consent:</span> {user.gdprConsent ? 'Yes' : 'No'}
                        </p>
                        {user.gdprConsentDate && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Consent Date:</span> {formatDate(user.gdprConsentDate)}
                          </p>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Account Information</h4>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Member Since:</span> {formatDate(user.createdAt)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Status:</span> 
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 ml-2">
                            Pending Review
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-6">
                    <button
                      onClick={() => handleReview(user.id, 'APPROVED')}
                      disabled={reviewing}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {reviewing ? 'Approving...' : 'Approve'}
                    </button>
                    
                    <button
                      onClick={() => setSelectedUser(user)}
                      disabled={reviewing}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reject KYC for {selectedUser.firstName} {selectedUser.lastName}
              </h3>
              
              <div className="mb-4">
                <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection
                </label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Please provide a reason for rejection..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleReview(selectedUser.id, 'REJECTED')}
                  disabled={reviewing || !rejectionReason.trim()}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {reviewing ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setRejectionReason('');
                  }}
                  disabled={reviewing}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminKYCReview; 