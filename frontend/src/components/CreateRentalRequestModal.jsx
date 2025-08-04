import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CreateRentalRequestModal = ({ isOpen, onClose, onSuccess, editMode = false, requestData = null }) => {
  const [originalRequestId, setOriginalRequestId] = useState(null);
  const [formData, setFormData] = useState({
    city: '',
    district: '',
    budgetFrom: '',
    budgetTo: '',
    propertyType: '',
    numberOfRooms: '',
    moveInDate: '',
    requirements: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { api } = useAuth();

  // Polish cities for dropdown
  const polishCities = [
    'Warsaw',
    'Krakow', 
    'Poznan',
    'Gdansk',
    'Wroclaw',
    'Lodz',
    'Szczecin',
    'Bydgoszcz',
    'Lublin',
    'Katowice',
    'Bialystok',
    'Gdynia',
    'Czestochowa',
    'Radom',
    'Sosnowiec',
    'Torun',
    'Kielce',
    'Rzeszow',
    'Gliwice',
    'Zabrze'
  ];

  // Property types
  const propertyTypes = [
    'Room',
    'Studio',
    'Apartment',
    'House',
    'Loft',
    'Penthouse',
    'Duplex',
    'Townhouse'
  ];

  // Number of rooms options
  const roomOptions = ['1', '2', '3', '4', '5', '6'];

  // Pre-fill form when in edit mode
  useEffect(() => {
    if (editMode && requestData) {
      const { city, district } = parseLocation(requestData.location);
      setFormData({
        city: city || '',
        district: district || '',
        budgetFrom: requestData.budget?.toString() || '',
        budgetTo: requestData.budget?.toString() || '',
        propertyType: requestData.propertyType || '',
        numberOfRooms: requestData.bedrooms?.toString() || '',
        moveInDate: requestData.moveInDate ? requestData.moveInDate.split('T')[0] : '',
        requirements: requestData.description || ''
      });
      // Store the original request ID for editing
      setOriginalRequestId(requestData.id);
    }
  }, [editMode, requestData]);

  // Parse location to extract city and district
  const parseLocation = (location) => {
    if (!location) return { city: '', district: '' };
    const parts = location.split(',').map(part => part.trim());
    if (parts.length >= 2) {
      return { district: parts[0], city: parts[1] };
    }
    return { city: location, district: '' };
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const requestData = {
        title: `Looking for ${formData.propertyType} in ${formData.city}`,
        description: formData.requirements,
        location: `${formData.district}, ${formData.city}`,
        budget: parseFloat(formData.budgetTo), // Using max budget as primary budget
        budgetFrom: parseFloat(formData.budgetFrom),
        budgetTo: parseFloat(formData.budgetTo),
        moveInDate: formData.moveInDate,
        bedrooms: parseInt(formData.numberOfRooms),
        propertyType: formData.propertyType,
        city: formData.city,
        district: formData.district,
        additionalRequirements: formData.requirements
      };

      let response;
      if (editMode) {
        // Update existing request
        response = await api.put(`/rental-request/${originalRequestId}`, requestData);
      } else {
        // Create new request
        response = await api.post('/rental-request', requestData);
      }

      if (response.status === 200 || response.status === 201) {
        // Reset form
        setFormData({
          city: '',
          district: '',
          budgetFrom: '',
          budgetTo: '',
          propertyType: '',
          numberOfRooms: '',
          moveInDate: '',
          requirements: ''
        });
        
        setOriginalRequestId(null);
        onSuccess && onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error creating/updating rental request:', error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError(`Failed to ${editMode ? 'update' : 'create'} rental request. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      city: '',
      district: '',
      budgetFrom: '',
      budgetTo: '',
      propertyType: '',
      numberOfRooms: '',
      moveInDate: '',
      requirements: ''
    });
    setError('');
    setOriginalRequestId(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editMode ? 'Edit Rental Request' : 'Create New Rental Request'}
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* City and District */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <select
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a city</option>
                {polishCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                District *
              </label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => handleInputChange('district', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Old Town, Downtown, Mokotow"
                required
              />
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget Range (PLN) *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="number"
                  value={formData.budgetFrom}
                  onChange={(e) => handleInputChange('budgetFrom', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="From"
                  min="0"
                  step="100"
                  required
                />
              </div>
              <div>
                <input
                  type="number"
                  value={formData.budgetTo}
                  onChange={(e) => handleInputChange('budgetTo', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="To"
                  min="0"
                  step="100"
                  required
                />
              </div>
            </div>
          </div>

          {/* Property Type and Number of Rooms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type *
              </label>
              <select
                value={formData.propertyType}
                onChange={(e) => handleInputChange('propertyType', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select property type</option>
                {propertyTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Rooms *
              </label>
              <select
                value={formData.numberOfRooms}
                onChange={(e) => handleInputChange('numberOfRooms', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select number of rooms</option>
                {roomOptions.map(rooms => (
                  <option key={rooms} value={rooms}>{rooms}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Move-in Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Move-in Date *
            </label>
            <input
              type="date"
              value={formData.moveInDate}
              onChange={(e) => handleInputChange('moveInDate', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Requirements Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements Description *
            </label>
            <textarea
              value={formData.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
              placeholder="Describe your requirements, preferences, and any specific needs (e.g., furnished, parking, pets allowed, etc.)"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {editMode ? 'Updating...' : 'Publishing...'}
                </>
              ) : (
                editMode ? 'Update Request' : 'Publish Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRentalRequestModal; 