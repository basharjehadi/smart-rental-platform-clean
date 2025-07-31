import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const RequestForm = () => {
  const [formData, setFormData] = useState({
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

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      setRequestsLoading(true);
      const response = await api.get('/my-requests');
      // Filter to only show requests that haven't been accepted
      const activeRequests = (response.data.rentalRequests || []).filter(request => {
        return !request.offer || request.offer.status !== 'ACCEPTED';
      });
      setRequests(activeRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setRequestsLoading(false);
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
        setSuccess('Rental request updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error updating request:', error);
      setError('Failed to update rental request');
      setTimeout(() => setError(''), 5000);
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
        setSuccess('Rental request deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error deleting request:', error);
        setError('Failed to delete rental request');
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const requestData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        budget: parseFloat(formData.budget),
        moveInDate: formData.moveInDate,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        furnished: formData.furnished,
        parking: formData.parking,
        petsAllowed: formData.petsAllowed,
        additionalRequirements: formData.additionalRequirements.trim(),
        preferredNeighborhood: formData.preferredNeighborhood.trim(),
        maxCommuteTime: formData.maxCommuteTime.trim(),
        mustHaveFeatures: formData.mustHaveFeatures.trim(),
        flexibleOnMoveInDate: formData.flexibleOnMoveInDate
      };

      const response = await api.post('/rental-request', requestData);
      console.log('Response:', response);

      if (response.status === 201) {
        setSuccess('Rental request created successfully!');
        
        // Clear form data
        setFormData({
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
        
        // Refresh the requests list
        fetchMyRequests();
      }
    } catch (error) {
      console.error('Rental request creation error:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);

      if (error.response?.status === 401) {
        setError('You are not authorized. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Only tenants can create rental requests.');
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.message) {
        setError(`Network error: ${error.message}`);
      } else {
        setError('Failed to create rental request. Please try again.');
      }
    } finally {
      setLoading(false);
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

  const getStatusBadge = (request) => {
    if (request.offer) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Offer Received
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Rental Request</h1>
          <p className="mt-2 text-gray-600">
            Create a detailed rental request to help landlords find the perfect match for you
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create New Request Form */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Request</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Looking for 2-bedroom apartment in downtown"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what you're looking for..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Warsaw, Downtown"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget (PLN) *
                  </label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 3000"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Move-in Date *
                  </label>
                  <input
                    type="date"
                    value={formData.moveInDate}
                    onChange={(e) => setFormData({...formData, moveInDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Neighborhood
                  </label>
                  <input
                    type="text"
                    value={formData.preferredNeighborhood}
                    onChange={(e) => setFormData({...formData, preferredNeighborhood: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Old Town, Downtown"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({...formData, bedrooms: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({...formData, bathrooms: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Commute Time (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.maxCommuteTime}
                    onChange={(e) => setFormData({...formData, maxCommuteTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Must-Have Features
                  </label>
                  <input
                    type="text"
                    value={formData.mustHaveFeatures}
                    onChange={(e) => setFormData({...formData, mustHaveFeatures: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Balcony, Elevator, Security"
                  />
                </div>
              </div>



              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Requirements
                </label>
                <textarea
                  value={formData.additionalRequirements}
                  onChange={(e) => setFormData({...formData, additionalRequirements: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any specific requirements or preferences..."
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="furnished"
                    checked={formData.furnished}
                    onChange={(e) => setFormData({...formData, furnished: e.target.checked})}
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
                    checked={formData.parking}
                    onChange={(e) => setFormData({...formData, parking: e.target.checked})}
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
                    checked={formData.petsAllowed}
                    onChange={(e) => setFormData({...formData, petsAllowed: e.target.checked})}
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
                    checked={formData.flexibleOnMoveInDate}
                    onChange={(e) => setFormData({...formData, flexibleOnMoveInDate: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="flexibleOnMoveInDate" className="ml-2 block text-sm text-gray-900">
                    Flexible on move-in date
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Rental Request'}
              </button>
            </form>
          </div>

          {/* Active Requests Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Active Requests</h2>
            
            {requestsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading your requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Active Requests
                </h3>
                <p className="text-gray-600">
                  You haven't created any rental requests yet. Create your first request to start finding your perfect home.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    {editingRequest === request.id ? (
                      <form onSubmit={handleEditSubmit} className="space-y-4">
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
                            Description *
                          </label>
                          <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
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
                        </div>
                        


                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1 border border-transparent rounded text-sm text-white bg-blue-600 hover:bg-blue-700"
                          >
                            Save
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium text-gray-900">{request.title}</h3>
                              {getStatusBadge(request)}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                              <div>📍 {request.location}</div>
                              <div>💰 {formatCurrency(request.budget)}</div>
                              <div>📅 {formatDate(request.moveInDate)}</div>
                              {request.bedrooms && <div>🛏️ {request.bedrooms} bed</div>}
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEditClick(request)}
                              className="p-1 text-gray-400 hover:text-blue-600"
                              title="Edit"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteRequest(request.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Delete"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
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
      </div>
    </div>
  );
};

export default RequestForm; 