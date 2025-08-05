import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import CreateRentalRequestModal from '../components/CreateRentalRequestModal';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requestToEdit, setRequestToEdit] = useState(null);
  const [requestToDelete, setRequestToDelete] = useState(null);
  
  // Filter and sort state
  const [sortBy, setSortBy] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { api } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/my-requests');
      setRequests(response.data.rentalRequests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to load your rental requests');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (request) => {
    setRequestToEdit(request);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setRequestToEdit(null);
    fetchMyRequests();
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
      fetchMyRequests();
      } catch (error) {
        console.error('Error deleting request:', error);
        setError('Failed to delete rental request');
      }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setRequestToDelete(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-green-100 text-green-800', text: 'Active' },
      LOCKED: { color: 'bg-yellow-100 text-yellow-800', text: 'Locked' },
      COMPLETED: { color: 'bg-blue-100 text-blue-800', text: 'Completed' },
      CANCELLED: { color: 'bg-red-100 text-red-800', text: 'Expired' }
    };
    
    const config = statusConfig[status] || statusConfig.CANCELLED;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // Parse location to extract city and district
  const parseLocation = (location) => {
    if (!location) return { city: '', district: '' };
    const parts = location.split(',').map(part => part.trim());
    if (parts.length >= 2) {
      return { district: parts[0], city: parts[1] };
    }
    return { city: location, district: '' };
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
        const { city, district } = parseLocation(request.location);
        return (
          request.title.toLowerCase().includes(searchLower) ||
          city.toLowerCase().includes(searchLower) ||
          district.toLowerCase().includes(searchLower) ||
          request.description.toLowerCase().includes(searchLower)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your rental requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Rental Requests</h1>
              <p className="mt-2 text-gray-600">
                Manage and track your rental requests
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Request
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by title, city, or description..."
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

        {/* Requests Grid */}
        {filteredAndSortedRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">🏠</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No Matching Requests' : 'No Rental Requests Found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'You haven\'t created any rental requests yet. Create your first request to start finding your perfect home.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Your First Request
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedRequests.map((request) => {
              const { city, district } = parseLocation(request.location);
              return (
                <div key={request.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    {/* Header with title and status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{request.title}</h3>
                        {getStatusBadge(request.status)}
                      </div>
                      </div>
                      
                    {/* Request details grid */}
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">City:</span>
                        <span className="text-sm text-gray-900">{city}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">District:</span>
                        <span className="text-sm text-gray-900">{district}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Budget:</span>
                        <span className="text-sm text-gray-900">{formatCurrency(request.budget)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Property Type:</span>
                        <span className="text-sm text-gray-900">{request.propertyType || 'Not specified'}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Number of Rooms:</span>
                        <span className="text-sm text-gray-900">{request.bedrooms || 'Not specified'}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Move-in Date:</span>
                        <span className="text-sm text-gray-900">{formatDate(request.moveInDate)}</span>
                      </div>
                    </div>
                    
                    {/* Description */}
                    {request.description && (
                          <div className="mb-4">
                        <span className="text-sm font-medium text-gray-500">Description:</span>
                        <p className="text-sm text-gray-900 mt-1 line-clamp-2">{request.description}</p>
                          </div>
                        )}
                        
                    {/* Created date */}
                    <div className="text-xs text-gray-500 mb-4">
                          Created: {formatDate(request.createdAt)}
                      </div>
                      
                    {/* Action buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditClick(request)}
                        disabled={request.status === 'CANCELLED'}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                        onClick={() => handleDeleteClick(request)}
                        disabled={request.status === 'CANCELLED'}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Request Modal */}
      {showCreateModal && (
        <CreateRentalRequestModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchMyRequests();
          }}
        />
      )}

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

export default MyRequests; 