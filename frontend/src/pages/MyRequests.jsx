import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingRequest, setEditingRequest] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    location: '',
    budget: '',
    moveInDate: '',
    bedrooms: '',
    bathrooms: '',
    furnished: false,
    parking: false,
    petsAllowed: false,
    additionalRequirements: '',
    preferredNeighborhood: '',
    maxCommuteTime: '',
    mustHaveFeatures: '',
    flexibleOnMoveInDate: false
  });

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
    setEditingRequest(request.id);
    setEditForm({
      title: request.title,
      description: request.description,
      location: request.location,
      budget: request.budget.toString(),
      moveInDate: request.moveInDate.split('T')[0],
      bedrooms: request.bedrooms?.toString() || '',
      bathrooms: request.bathrooms?.toString() || '',
      furnished: request.furnished || false,
      parking: request.parking || false,
      petsAllowed: request.petsAllowed || false,
      additionalRequirements: request.additionalRequirements || '',
      preferredNeighborhood: request.preferredNeighborhood || '',
      maxCommuteTime: request.maxCommuteTime || '',
      mustHaveFeatures: request.mustHaveFeatures || '',
      flexibleOnMoveInDate: request.flexibleOnMoveInDate || false
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/rental-request/${editingRequest}`, editForm);
      if (response.status === 200) {
        setEditingRequest(null);
        fetchMyRequests(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating request:', error);
      setError('Failed to update rental request');
    }
  };

  const handleCancelEdit = () => {
    setEditingRequest(null);
    setEditForm({
      title: '',
      description: '',
      location: '',
      budget: '',
      moveInDate: '',
      bedrooms: '',
      bathrooms: '',
      furnished: false,
      parking: false,
      petsAllowed: false,
      additionalRequirements: '',
      preferredNeighborhood: '',
      maxCommuteTime: '',
      mustHaveFeatures: '',
      flexibleOnMoveInDate: false
    });
  };

  const handleDeleteRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this rental request?')) {
      try {
        await api.delete(`/rental-request/${requestId}`);
        fetchMyRequests(); // Refresh the list
      } catch (error) {
        console.error('Error deleting request:', error);
        setError('Failed to delete rental request');
      }
    }
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
      INACTIVE: { color: 'bg-gray-100 text-gray-800', text: 'Inactive' },
      EXPIRED: { color: 'bg-red-100 text-red-800', text: 'Expired' }
    };
    
    const config = statusConfig[status] || statusConfig.INACTIVE;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

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
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Rental Requests</h1>
              <p className="mt-2 text-gray-600">
                Manage and edit your rental requests to attract more landlords
              </p>
            </div>
            <Link
              to="/post-request"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Request
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">🏠</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Rental Requests Found
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't created any rental requests yet. Create your first request to start finding your perfect home.
            </p>
            <Link
              to="/post-request"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Your First Request
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <div key={request.id} className="bg-white shadow rounded-lg overflow-hidden">
                {editingRequest === request.id ? (
                  <form onSubmit={handleEditSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location *
                        </label>
                        <input
                          type="text"
                          value={editForm.location}
                          onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Budget (PLN) *
                        </label>
                        <input
                          type="number"
                          value={editForm.budget}
                          onChange={(e) => setEditForm({...editForm, budget: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Move-in Date *
                        </label>
                        <input
                          type="date"
                          value={editForm.moveInDate}
                          onChange={(e) => setEditForm({...editForm, moveInDate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bedrooms
                        </label>
                        <input
                          type="number"
                          value={editForm.bedrooms}
                          onChange={(e) => setEditForm({...editForm, bedrooms: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bathrooms
                        </label>
                        <input
                          type="number"
                          value={editForm.bathrooms}
                          onChange={(e) => setEditForm({...editForm, bathrooms: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description *
                        </label>
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Additional Requirements
                        </label>
                        <textarea
                          value={editForm.additionalRequirements}
                          onChange={(e) => setEditForm({...editForm, additionalRequirements: e.target.value})}
                          rows={2}
                          placeholder="Any specific requirements or preferences..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Preferred Neighborhood
                        </label>
                        <input
                          type="text"
                          value={editForm.preferredNeighborhood}
                          onChange={(e) => setEditForm({...editForm, preferredNeighborhood: e.target.value})}
                          placeholder="e.g., Downtown, Old Town, etc."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Commute Time (minutes)
                        </label>
                        <input
                          type="number"
                          value={editForm.maxCommuteTime}
                          onChange={(e) => setEditForm({...editForm, maxCommuteTime: e.target.value})}
                          placeholder="e.g., 30"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Must-Have Features
                        </label>
                        <input
                          type="text"
                          value={editForm.mustHaveFeatures}
                          onChange={(e) => setEditForm({...editForm, mustHaveFeatures: e.target.value})}
                          placeholder="e.g., Balcony, Elevator, Security, etc."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="md:col-span-2 space-y-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="furnished"
                            checked={editForm.furnished}
                            onChange={(e) => setEditForm({...editForm, furnished: e.target.checked})}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="furnished" className="ml-2 block text-sm text-gray-900">
                            Furnished apartment
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="parking"
                            checked={editForm.parking}
                            onChange={(e) => setEditForm({...editForm, parking: e.target.checked})}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="parking" className="ml-2 block text-sm text-gray-900">
                            Parking available
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="petsAllowed"
                            checked={editForm.petsAllowed}
                            onChange={(e) => setEditForm({...editForm, petsAllowed: e.target.checked})}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="petsAllowed" className="ml-2 block text-sm text-gray-900">
                            Pets allowed
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="flexibleOnMoveInDate"
                            checked={editForm.flexibleOnMoveInDate}
                            onChange={(e) => setEditForm({...editForm, flexibleOnMoveInDate: e.target.checked})}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="flexibleOnMoveInDate" className="ml-2 block text-sm text-gray-900">
                            Flexible on move-in date
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{request.title}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        
                        <p className="text-gray-600 mb-4">{request.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <span className="text-sm font-medium text-gray-500">Location:</span>
                            <p className="text-sm text-gray-900">{request.location}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Budget:</span>
                            <p className="text-sm text-gray-900">{formatCurrency(request.budget)}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Move-in Date:</span>
                            <p className="text-sm text-gray-900">{formatDate(request.moveInDate)}</p>
                          </div>
                        </div>
                        
                        {request.bedrooms && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <span className="text-sm font-medium text-gray-500">Bedrooms:</span>
                              <p className="text-sm text-gray-900">{request.bedrooms}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Bathrooms:</span>
                              <p className="text-sm text-gray-900">{request.bathrooms}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Requirements:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {request.furnished && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">Furnished</span>}
                                {request.parking && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Parking</span>}
                                {request.petsAllowed && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">Pets</span>}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {request.additionalRequirements && (
                          <div className="mb-4">
                            <span className="text-sm font-medium text-gray-500">Additional Requirements:</span>
                            <p className="text-sm text-gray-900 mt-1">{request.additionalRequirements}</p>
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-500">
                          Created: {formatDate(request.createdAt)}
                          {request.offer && (
                            <span className="ml-4 text-green-600">
                              • {request.offer.status === 'ACCEPTED' ? 'Offer Accepted' : 'Offer Received'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditClick(request)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(request.id)}
                          className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRequests; 