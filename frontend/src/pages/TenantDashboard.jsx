import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import CreateRentalRequestModal from '../components/CreateRentalRequestModal';
import TenantSidebar from '../components/TenantSidebar';
import { LogOut } from 'lucide-react';

const TenantDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [requests, setRequests] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requestToEdit, setRequestToEdit] = useState(null);
  const [requestToDelete, setRequestToDelete] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/my-requests');
      setRequests(response.data.rentalRequests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRequestCreated = () => {
    fetchRequests();
  };

  const handleEditClick = (request) => {
    setRequestToEdit(request);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setRequestToEdit(null);
    fetchRequests();
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
    setRequestToEdit(null);
  };

  const handleDeleteClick = (request) => {
    setRequestToDelete(request);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/rental-request/${requestToDelete.id}`);
      setShowDeleteModal(false);
      setRequestToDelete(null);
      fetchRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      setError('Failed to delete request');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setRequestToDelete(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const getProfilePhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    
    // If it's already a full URL, return as is
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      return photoPath;
    }
    
    // If it's a relative path, construct full URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    return `${baseUrl}${photoPath}`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { text: 'Active', color: 'bg-green-100 text-green-800' },
      LOCKED: { text: 'Locked', color: 'bg-yellow-100 text-yellow-800' },
      COMPLETED: { text: 'Completed', color: 'bg-blue-100 text-blue-800' },
      CANCELLED: { text: 'Expired', color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status] || statusConfig.CANCELLED;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // Filter and sort requests
  const filteredAndSortedRequests = requests
    .filter(request => {
      // Status filter
      if (statusFilter !== 'all' && request.status !== statusFilter) {
        return false;
      }
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          request.title?.toLowerCase().includes(searchLower) ||
          request.description?.toLowerCase().includes(searchLower) ||
          request.location?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
    });

  useEffect(() => {
    fetchRequests();
  }, []);

  // Separate useEffect for profile data fetching (like other working pages)
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        console.log('Fetching profile data from /users/profile...');
        const response = await api.get('/users/profile');
        console.log('Profile response on dashboard:', response.data);
        console.log('Profile user data:', response.data.user);
        console.log('Profile image field:', response.data.user?.profileImage);
        console.log('Profile image type:', typeof response.data.user?.profileImage);
        console.log('Profile image length:', response.data.user?.profileImage?.length);
        console.log('Full profile user object:', JSON.stringify(response.data.user, null, 2));
        setProfileData(response.data.user);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        console.error('Profile error response:', error.response?.data);
        setProfileData(null);
      } finally {
        setProfileLoading(false);
      }
    };
    
    fetchProfileData();
  }, []);

  useEffect(() => {
    console.log('Profile data changed on dashboard:', profileData);
  }, [profileData]);

  useEffect(() => {
    console.log('Profile loading state changed on dashboard:', profileLoading);
  }, [profileLoading]);

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Sidebar */}
      <TenantSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-900">{user?.name || 'Tenant'}</span>
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-md overflow-hidden">
                  {profileLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : profileData && profileData.profileImage ? (
                    <img
                      src={getProfilePhotoUrl(profileData.profileImage)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Profile image failed to load on dashboard:', e.target.src);
                        console.log('Profile data:', profileData);
                        console.log('Profile image path:', profileData.profileImage);
                        console.log('Constructed URL:', e.target.src);
                      }}
                      onLoad={() => {
                        console.log('Profile image loaded successfully on dashboard');
                        console.log('Loaded image URL:', getProfilePhotoUrl(profileData.profileImage));
                      }}
                    />
                  ) : (
                    <span className="text-base font-bold text-white">
                      {user?.name?.charAt(0) || 'T'}
                    </span>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Your rental requests</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Request
              </button>
            </div>

            {/* Search and Filter Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Search by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="LOCKED">Locked</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Expired</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>

                {/* Results Count */}
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">
                    {filteredAndSortedRequests.length} of {requests.length} requests
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your requests...</p>
              </div>
            ) : filteredAndSortedRequests.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <div className="text-gray-400 text-4xl mb-4">📝</div>
                <p className="text-gray-600 text-lg mb-4">
                  {searchTerm || statusFilter !== 'all' ? 'No matching requests found' : 'You don\'t have any requests yet.'}
                </p>
                {searchTerm || statusFilter !== 'all' ? (
                  <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria.</p>
                ) : (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create first request
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedRequests.map((request) => (
                  <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{request.title}</h3>
                        <p className="text-gray-600 mb-3">{request.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Location:</span>
                            <p className="font-medium">{request.location}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Budget:</span>
                            <p className="font-medium">{formatCurrency(request.budget)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Move-in:</span>
                            <p className="font-medium">{formatDate(request.moveInDate)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Status:</span>
                            <div className="mt-1">
                              {getStatusBadge(request.status)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Created Date and Time */}
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-500">
                            Created: {formatDate(request.createdAt)} at {formatTime(request.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEditClick(request)}
                          disabled={request.status === 'CANCELLED'}
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-200 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(request)}
                          disabled={request.status === 'CANCELLED'}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 font-medium border border-red-200 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Rental Request Modal */}
      <CreateRentalRequestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleRequestCreated}
      />

      {/* Edit Request Modal */}
      {showEditModal && requestToEdit && (
        <CreateRentalRequestModal
          isOpen={showEditModal}
          onClose={handleEditCancel}
          onSuccess={handleEditSuccess}
          editMode={true}
          requestData={requestToEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && requestToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Delete Rental Request</h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete the rental request "{requestToDelete.title}"? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantDashboard;