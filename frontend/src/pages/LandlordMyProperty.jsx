import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const LandlordMyProperty = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteProperty, setDeleteProperty] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await api.get('/properties/landlord-properties');
      setProperties(response.data.properties || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProperties = () => {
    let filtered = [...properties];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(property => property.propertyType === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'price-high':
        filtered.sort((a, b) => b.monthlyRent - a.monthlyRent);
        break;
      case 'price-low':
        filtered.sort((a, b) => a.monthlyRent - b.monthlyRent);
        break;
      default:
        break;
    }

    return filtered;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleEditProperty = (property) => {
    navigate(`/landlord-edit-property/${property.id}`);
  };

  const handleDeleteProperty = (property) => {
    setDeleteProperty(property);
    setShowDeleteModal(true);
  };

  const confirmDeleteProperty = async () => {
    if (!deleteProperty) return;

    try {
      await api.delete(`/properties/properties/${deleteProperty.id}`);
      setProperties(properties.filter(p => p.id !== deleteProperty.id));
      setShowDeleteModal(false);
      setDeleteProperty(null);
    } catch (error) {
      console.error('Error deleting property:', error);
      setError('Failed to delete property');
    }
  };

  const getPropertyTypes = () => {
    const types = [...new Set(properties.map(p => p.propertyType))];
    return types;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredProperties = filterAndSortProperties();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">RentPlatform Poland</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <Link
              to="/tenant-rental-requests"
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                location.pathname === '/tenant-rental-requests' 
                  ? 'text-black bg-gray-100' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Rental Requests
            </Link>
            
            <Link
              to="/landlord-my-property"
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                location.pathname === '/landlord-my-property' 
                  ? 'text-black bg-gray-100' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              My Properties
            </Link>
            
            <Link
              to="/landlord-profile"
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                location.pathname === '/landlord-profile' 
                  ? 'text-black bg-gray-100' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </Link>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
              <p className="text-gray-600 mt-1">Manage your property listings and view rental requests</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-900">{user?.name || 'Test Landlord'}</span>
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.name?.charAt(0) || 'L'}
                  </span>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-gray-700 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h1 className="text-3xl font-bold text-gray-900">My Properties</h1>
                </div>
                <button 
                  onClick={() => navigate('/landlord-add-property')}
                  className="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  + Add Property
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Filters and Search */}
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Search properties..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Filter by Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    {getPropertyTypes().map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="price-low">Price: Low to High</option>
                  </select>
                </div>

                {/* Results Count */}
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">
                    {filteredProperties.length} of {properties.length} properties
                  </div>
                </div>
              </div>
            </div>

            {/* Properties List */}
            {loading ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading properties...</p>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <div className="text-gray-400 text-4xl mb-4">🏠</div>
                <p className="text-gray-600 text-lg mb-4">No properties found</p>
                <p className="text-gray-500 mb-4">
                  {properties.length === 0 
                    ? "You haven't added any properties yet. Start by adding your first property listing."
                    : "No properties match your current filters. Try adjusting your search criteria."
                  }
                </p>
                <button 
                  onClick={() => navigate('/landlord-add-property')}
                  className="inline-flex items-center px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Your First Property
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <div key={property.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Property Image */}
                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                      {property.images && property.images.length > 0 ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      )}
                    </div>

                    {/* Property Details */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{property.title}</h3>
                        <span className="text-lg font-bold text-blue-600">{formatCurrency(property.monthlyRent)}</span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{property.address}, {property.city}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                        <span>{property.bedrooms} beds</span>
                        <span>{property.bathrooms} baths</span>
                        <span>{property.propertyType}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>Available: {formatDate(property.availableFrom)}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          property.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {property.status}
                        </span>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/landlord-property-details/${property.id}`)}
                          className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleEditProperty(property)}
                          className="px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProperty(property)}
                          className="px-3 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Property</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{deleteProperty?.title}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProperty}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
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

export default LandlordMyProperty; 