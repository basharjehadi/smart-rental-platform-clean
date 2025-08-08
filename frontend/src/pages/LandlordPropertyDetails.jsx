import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LandlordPropertyDetails = () => {
  const { user, logout, api } = useAuth();
  const navigate = useNavigate();
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPropertyDetails();
  }, [propertyId]);

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/properties/${propertyId}`);

      if (response.data.success) {
        setProperty(response.data.property);
      } else {
        setError('Failed to fetch property details');
      }
    } catch (error) {
      console.error('Error fetching property details:', error);
      setError('Failed to fetch property details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'OCCUPIED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'RENTED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'UNAVAILABLE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAbsoluteUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `http://localhost:3001${url}`;
    return `http://localhost:3001/${url}`;
  };

  const parseImages = (images) => {
    if (!images) return [];
    try {
      const parsed = JSON.parse(images);
      return parsed.map(url => getAbsoluteUrl(url));
    } catch {
      return [];
    }
  };

  const parseVideos = (videos) => {
    if (!videos) return [];
    try {
      const parsed = JSON.parse(videos);
      return parsed.map(url => getAbsoluteUrl(url));
    } catch {
      return [];
    }
  };

  const parseAmenities = (houseRules) => {
    if (!houseRules) return [];
    try {
      return JSON.parse(houseRules);
    } catch {
      return [];
    }
  };

  const formatAddress = (property) => {
    const parts = [property.address, property.district, property.city, property.zipCode];
    return parts.filter(Boolean).join(', ');
  };

  // Check if property is locked (occupied or rented)
  const isPropertyLocked = (property) => {
    return property && ['OCCUPIED', 'RENTED'].includes(property.status);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
            <p className="text-gray-600 mb-6">{error || 'Property not found'}</p>
          <button
            onClick={() => navigate('/landlord-my-property')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Back to My Properties
          </button>
          </div>
        </div>
      </div>
    );
  }

  const propertyImages = parseImages(property.images);
  const propertyVideos = parseVideos(property.videos);
  const amenities = parseAmenities(property.houseRules);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Property Header Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
            {/* Back Button */}
            <div className="mb-6">
              <button
                onClick={() => navigate('/landlord-my-property')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to My Properties</span>
              </button>
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(property.status)}`}>
                    {isPropertyLocked(property) && <span className="mr-1">🔒</span>}
                    {property.status}
                  </span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">{property.propertyType}</span>
          </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.name}</h1>
                <div className="flex items-center space-x-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{formatAddress(property)}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                                  <div className="text-right">
                    <p className="text-sm text-gray-500">Monthly Rent</p>
                    <p className="text-3xl font-bold text-gray-900">{property.monthlyRent} zł</p>
                  </div>
                  <button
                    onClick={() => navigate(`/landlord-edit-property/${propertyId}`)}
                  disabled={isPropertyLocked(property)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors duration-200 shadow-md ${
                    isPropertyLocked(property)
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  title={isPropertyLocked(property) ? 'Cannot edit occupied/rented property' : 'Edit Property'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>{isPropertyLocked(property) ? 'Property Locked' : 'Edit Property'}</span>
                  </button>
                
                {/* Warning Message for Locked Properties */}
                {isPropertyLocked(property) && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700 flex items-center">
                      <span className="mr-2">🔒</span>
                      This property is {property.status.toLowerCase()}. Editing is disabled to protect tenant data and rental agreements.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">Bedrooms</p>
                <p className="text-lg font-semibold text-gray-900">{property.bedrooms || 'N/A'}</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">Bathrooms</p>
                <p className="text-lg font-semibold text-gray-900">{property.bathrooms || 'N/A'}</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">Size</p>
                <p className="text-lg font-semibold text-gray-900">{property.size ? `${property.size} m²` : 'N/A'}</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">Floor</p>
                <p className="text-lg font-semibold text-gray-900">{property.floor || 'N/A'}</p>
                </div>
              </div>
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Property Images Gallery */}
                {propertyImages.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>Property Gallery</span>
                      <span className="text-sm text-gray-500">({propertyImages.length} photos)</span>
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {propertyImages.map((image, index) => (
                        <div 
                          key={index} 
                          className="aspect-square bg-gray-200 rounded-xl overflow-hidden shadow-md"
                        >
                          <img 
                            src={image} 
                            alt={`Property ${index + 1}`} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      ))}
                    </div>
                    </div>
                  </div>
                )}

              {/* Virtual Tour Videos */}
                {propertyVideos.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Virtual Tour</span>
                      <span className="text-sm text-gray-500">({propertyVideos.length} video{propertyVideos.length > 1 ? 's' : ''})</span>
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-6">
                      {propertyVideos.map((video, index) => (
                        <div key={index} className="aspect-video bg-gray-200 rounded-xl overflow-hidden shadow-lg">
                          <video 
                            controls 
                            className="w-full h-full object-cover"
                            poster={propertyImages[0]}
                          >
                            <source src={video} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      ))}
                    </div>
                    </div>
                  </div>
                )}

                {/* Property Description */}
                {property.description && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Property</h2>
                  <p className="text-gray-700 leading-relaxed text-lg">{property.description}</p>
                  </div>
                )}

              {/* Amenities & Features */}
              {amenities.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Amenities & Features</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        <span className="text-gray-700 font-medium">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
            <div className="space-y-8">
              {/* Property Features */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Features</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      <span className="text-gray-700">Furnished</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${property.furnished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {property.furnished ? 'Yes' : 'No'}
                      </span>
                    </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-700">Parking</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${property.parking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {property.parking ? 'Available' : 'Not Available'}
                    </span>
                </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <span className="text-gray-700">Pets Allowed</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${property.petsAllowed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {property.petsAllowed ? 'Yes' : 'No'}
                      </span>
                    </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-700">Smoking Allowed</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${property.smokingAllowed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {property.smokingAllowed ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Property Timeline */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Timeline</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="font-medium text-gray-900">
                        {new Date(property.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="font-medium text-gray-900">
                        {new Date(property.updatedAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  
                    {property.availableFrom && (
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-500">Available From</p>
                        <p className="font-medium text-gray-900">
                          {new Date(property.availableFrom).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      </div>
                    )}
                  </div>
                </div>

              {/* Rental Statistics */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Rental Statistics</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <span className="text-gray-700">Monthly Rent</span>
                    </div>
                                           <span className="text-lg font-bold text-blue-600">{property.monthlyRent} zł</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <span className="text-gray-700">Current Tenants</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">{property.currentTenants || 0}/{property.maxTenants || 1}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-gray-700">Total Floors</span>
                    </div>
                    <span className="text-lg font-bold text-purple-600">{property.totalFloors || 'N/A'}</span>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </main>
    </div>
  );
};

export default LandlordPropertyDetails; 