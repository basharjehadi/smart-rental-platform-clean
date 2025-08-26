import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import LandlordSidebar from '../components/LandlordSidebar';
import NotificationHeader from '../components/common/NotificationHeader';
import { LogOut, Search, Filter, Plus, Eye, Edit, Trash2, Building, AlertTriangle } from 'lucide-react';

const LandlordMyProperty = () => {
  const { user, logout, api } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteProperty, setDeleteProperty] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Convert relative URLs to absolute URLs
  const getAbsoluteUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url; // Already absolute
    if (url.startsWith('/')) return `http://localhost:3001${url}`; // Add server URL
    return `http://localhost:3001/${url}`; // Add server URL and leading slash
  };

  // Parse images array
  const parseImages = (images) => {
    if (!images) return [];
    try {
      const parsed = typeof images === 'string' ? JSON.parse(images) : images;
      return parsed.map(url => getAbsoluteUrl(url));
    } catch {
      return [];
    }
  };

  useEffect(() => {
    fetchProperties();
    fetchProfileData();
  }, []);

  // Listen for move-in verification updates
  useEffect(() => {
    if (!socket) return;

    const handleMoveInVerificationUpdate = (data) => {
      console.log('🏠 Move-in verification update received in properties:', data);
      // Refresh properties data when move-in status changes
      fetchProperties();
    };

    socket.on('movein-verification:update', handleMoveInVerificationUpdate);

    return () => {
      socket.off('movein-verification:update', handleMoveInVerificationUpdate);
    };
  }, [socket]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await api.get('/properties');
      setProperties(response.data.properties || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileData = async () => {
    try {
      setProfileLoading(true);
      const response = await api.get('/users/profile');
      setProfileData(response.data.user);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const getProfilePhotoUrl = (profileImage) => {
    if (!profileImage) return null;
    if (profileImage.startsWith('/')) {
      return `http://localhost:3001${profileImage}`;
    }
    return `http://localhost:3001/uploads/profile_images/${profileImage}`;
  };

  const filterAndSortProperties = () => {
    let filtered = [...properties];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(property => property.propertyType === filterType);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(property => property.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(property =>
        property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city?.toLowerCase().includes(searchTerm.toLowerCase())
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
    // Prevent editing locked properties
    if (isPropertyLocked(property)) {
      return;
    }
    navigate(`/landlord-edit-property/${property.id}`);
  };

  const handleDeleteProperty = (property) => {
    // Prevent deleting locked properties
    if (isPropertyLocked(property)) {
      return;
    }
    setDeleteProperty(property);
    setShowDeleteModal(true);
  };

  const confirmDeleteProperty = async () => {
    if (!deleteProperty) return;

    try {
      await api.delete(`/properties/${deleteProperty.id}`);
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

  const getPropertyStatuses = () => {
    const statuses = [...new Set(properties.map(p => p.status))];
    return statuses;
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

  // Check if property is locked (rented)
  const isPropertyLocked = (property) => {
    return ['RENTED'].includes(property.status);
  };

  const [moveInStatusByProperty, setMoveInStatusByProperty] = useState({});

  // Fetch latest paid offer verification status for each property
  const loadMoveInStatuses = async () => {
    try {
      const entries = await Promise.all(properties.map(async (p) => {
        try {
          const res = await api.get(`/move-in/property/${p.id}/latest-paid-status`);
          return [p.id, res.data?.data || null];
        } catch {
          return [p.id, null];
        }
      }));
      setMoveInStatusByProperty(Object.fromEntries(entries));
    } catch {}
  };

  useEffect(() => {
    if (properties.length > 0) {
      loadMoveInStatuses();
    }
  }, [properties]);

  // Light polling to reflect admin decisions without manual refresh
  useEffect(() => {
    if (properties.length === 0) return;
    const id = setInterval(() => {
      loadMoveInStatuses();
    }, 10000); // every 10s
    return () => clearInterval(id);
  }, [properties]);

  const filteredProperties = filterAndSortProperties();

  return (
    <div className="min-h-screen bg-gradient-primary flex">
      {/* Left Sidebar */}
      <LandlordSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="header-modern px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">My Properties</h1>
            
            <div className="flex items-center space-x-4">
              <NotificationHeader />
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
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 animate-fade-in-up">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 font-poppins">Property Management</h2>
                <p className="text-gray-600 mt-1">
                  You have {properties.length} properties listed
                </p>
              </div>
              
              <Link
                to="/landlord-add-property"
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Property</span>
              </Link>
            </div>

            {/* Filters and Search */}
            <div className="card-modern p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search properties..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-modern pl-10"
                  />
                </div>

                {/* Property Type Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="input-modern"
                >
                  <option value="all">All Types</option>
                  {getPropertyTypes().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-modern"
                >
                  <option value="all">All Status</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="RENTED">Rented</option>
                </select>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-modern"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="price-low">Price: Low to High</option>
                </select>

                {/* Results Count */}
                <div className="flex items-center justify-center px-4 py-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-600">
                    {filteredProperties.length} of {properties.length} properties
                  </span>
                </div>
              </div>


            </div>

            {/* Properties Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg font-medium">Loading your properties...</p>
              </div>
            ) : error ? (
              <div className="card-modern p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={fetchProperties}
                  className="btn-primary flex items-center space-x-2"
                >
                  <span>Try Again</span>
                </button>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="card-modern p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Building className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No properties found</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Get started by adding your first property listing'
                  }
                </p>
                <Link
                  to="/landlord-add-property"
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Your First Property</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                {filteredProperties.map((property, index) => {
                  const propertyImages = parseImages(property.images);
                  return (
                    <div key={property.id} className="card-elevated overflow-hidden animate-fade-in-up" style={{ animationDelay: `${0.3 + index * 0.1}s` }}>
                      {/* Property Image */}
                      <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                        {propertyImages.length > 0 ? (
                          <img
                            src={propertyImages[0]}
                            alt={property.title || property.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Status Badge */}
                        <div className="absolute top-3 left-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            property.status === 'AVAILABLE' 
                              ? 'bg-green-100 text-green-700' 
                              : property.status === 'RENTED'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {isPropertyLocked(property) && <span className="mr-1">🔒</span>}
                            {property.status}
                          </span>
                        </div>
                        
                        {/* Price Badge */}
                        <div className="absolute top-3 right-3">
                          <span className="px-3 py-1 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-full text-sm font-bold shadow-lg">
                            {formatCurrency(property.monthlyRent)}
                          </span>
                        </div>
                      </div>

                      {/* Property Details */}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 mr-3">{property.title}</h3>
                        </div>
                        
                        <p className="text-gray-600 mb-4 text-sm">{property.address}, {property.city}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                          <span className="flex items-center">
                            <Building className="w-4 h-4 mr-1" />
                            {property.bedrooms} beds
                          </span>
                          <span>{property.bathrooms} baths</span>
                          <span className="badge-primary">{property.propertyType}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                          <span>Available: {formatDate(property.availableFrom)}</span>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                          <button
                            onClick={() => navigate(`/landlord-property-details/${property.id}`)}
                            className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Details</span>
                          </button>
                          
                          {/* Edit Button - Disabled for occupied/rented properties */}
                          <button
                            onClick={() => handleEditProperty(property)}
                            disabled={isPropertyLocked(property)}
                            className={`px-4 py-2 rounded-xl transition-colors duration-200 ${
                              isPropertyLocked(property)
                                ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                            }`}
                            title={isPropertyLocked(property) ? 'Cannot edit rented property' : 'Edit Property'}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          {/* Delete Button - Disabled for occupied/rented properties */}
                          <button
                            onClick={() => handleDeleteProperty(property)}
                            disabled={isPropertyLocked(property)}
                            className={`px-4 py-2 rounded-xl transition-colors duration-200 ${
                              isPropertyLocked(property)
                                ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                : 'text-red-600 bg-red-50 hover:bg-red-100'
                            }`}
                            title={isPropertyLocked(property) ? 'Cannot delete rented property' : 'Delete Property'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Warning Message for Locked Properties */}
                        {isPropertyLocked(property) && (
                          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-xs text-yellow-700 flex items-center">
                              <span className="mr-1">🔒</span>
                              This property is {property.status.toLowerCase()}. Edit and delete actions are disabled.
                            </p>
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                              <div className="text-xs text-blue-900 font-medium">Tenant move-in verification</div>
                              {(() => {
                                const s = moveInStatusByProperty[property.id] || property._moveIn || null;
                                if (s) {
                                  const deadline = s.deadline ? new Date(s.deadline) : null;
                                  const now = new Date();
                                  let chip = 'PENDING';
                                  if (s.status === 'SUCCESS') chip = 'SUCCESS';
                                  else if (s.status === 'ISSUE_REPORTED') chip = 'ISSUE';
                                  else if (s.status === 'CANCELLED') chip = 'CANCELLED';

                                  // Only show countdown while waiting (PENDING)
                                  let countdown = '';
                                  if (s.status === 'PENDING' && deadline) {
                                    const diffMs = Math.max(0, deadline.getTime() - now.getTime());
                                    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
                                    const days = Math.floor(totalHours / 24);
                                    const hours = totalHours % 24;
                                    countdown = `${days}d ${hours}h left`;
                                  }

                                  return (
                                    <div className="text-xs text-blue-800 mt-1 flex items-center space-x-2">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                        chip === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                                        chip === 'ISSUE' ? 'bg-red-100 text-red-700' :
                                        chip === 'CANCELLED' ? 'bg-gray-200 text-gray-700' :
                                        'bg-yellow-100 text-yellow-700'
                                      }`}>{chip}</span>
                                      {countdown && <span>{countdown}</span>}
                                    </div>
                                  );
                                }
                                // If no status payload, default to Pending until tenant confirms/admin decides/cron finalizes
                                return (
                                  <div className="text-xs text-blue-800 mt-1">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-100 text-yellow-700">PENDING</span>
                                    <span className="ml-2">Awaiting tenant move-in verification…</span>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card-modern p-8 max-w-md w-full mx-4 animate-fade-in-up">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Property</h3>
              <p className="text-gray-600 mb-8">
                Are you sure you want to delete "{deleteProperty?.title}"? This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteProperty}
                  className="flex-1 btn-danger"
                >
                  Delete Property
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandlordMyProperty; 