import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import FileUpload from '../components/FileUpload';

const LandlordDashboard = () => {
  const [rentalRequests, setRentalRequests] = useState([]);
  const [acceptedOffers, setAcceptedOffers] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [offerData, setOfferData] = useState({
    rentAmount: '',
    depositAmount: '',
    leaseDuration: '',
    availableFrom: '',
    description: '',
    propertyAddress: '',
    propertyImages: [],
    propertyVideo: '',
    propertyType: '',
    propertySize: '',
    propertyAmenities: '',
    propertyDescription: ''
  });
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedVideo, setUploadedVideo] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [offerError, setOfferError] = useState('');
  const [offerSuccess, setOfferSuccess] = useState('');

  const { api } = useAuth();
  const { t } = useTranslation();

  // Fetch rental requests, accepted offers, and profile data on component mount
  useEffect(() => {
    // Add a small delay to ensure the component is fully mounted
    const timer = setTimeout(() => {
      fetchRentalRequests();
      fetchAcceptedOffers();
      fetchProfileData();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await api.get('/users/profile');
      setProfileData(response.data.user);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      // Don't set error for this as it's not critical
      // Set a default profile data to prevent undefined errors
      setProfileData({ name: 'Landlord' });
    }
  };

  const fetchRentalRequests = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/rental-requests');
      
      // The backend now returns all active requests with offer status
      const requests = response.data.rentalRequests || [];
      
      setRentalRequests(requests);
    } catch (error) {
      console.error('Error fetching rental requests:', error);
      
      // Set a user-friendly error message
      if (error.code === 'ERR_NETWORK') {
        setError('Unable to connect to server. Please check if the backend is running.');
      } else if (error.response?.status === 401) {
        setError('Please log in again to access this page.');
      } else {
        setError(error.response?.data?.error || 'Failed to fetch rental requests. Please try again.');
      }
      
      // Set empty array to prevent undefined errors
      setRentalRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcceptedOffers = async () => {
    try {
      const response = await api.get('/offers/landlord/accepted');
      setAcceptedOffers(response.data.offers || []);
    } catch (error) {
      console.error('Error fetching accepted offers:', error);
      // Don't set error for this as it's not critical, but set empty array
      setAcceptedOffers([]);
    }
  };

  // Get display name (firstName + lastName or fallback to name)
  const getDisplayName = () => {
    if (profileData?.firstName && profileData?.lastName) {
      return `${profileData.firstName} ${profileData.lastName}`;
    }
    return 'Landlord';
  };

  // Get profile image or fallback to initials
  const getProfileImage = () => {
    if (profileData?.profileImage) {
      return profileData.profileImage;
    }
    return null;
  };

  const handleSendOffer = (request) => {
    setSelectedRequest(request);
    setOfferData({
      rentAmount: '',
      depositAmount: '',
      leaseDuration: '',
      availableFrom: '',
      description: '',
      propertyAddress: '',
      propertyImages: [],
      propertyVideo: '',
      propertyType: '',
      propertySize: '',
      propertyAmenities: '',
      propertyDescription: ''
    });
    setUploadedImages([]);
    setUploadedVideo('');
    setOfferError('');
    setOfferSuccess('');
    setShowModal(true);
  };

  const handleViewOfferDetails = (request) => {
    // For now, we'll show the offer details in an alert
    // In the future, this could open a modal with detailed offer information
    const offer = request.myOffer;
    const statusMessages = {
      'PENDING': 'Your offer is pending tenant review',
      'ACCEPTED': 'Your offer has been accepted by the tenant',
      'REJECTED': 'Your offer was rejected by the tenant'
    };
    
    alert(`Offer Details:
Status: ${offer.status}
Rent Amount: ${formatCurrency(offer.rentAmount)}
Sent: ${formatDate(offer.createdAt)}
Last Updated: ${formatDate(offer.updatedAt)}

${statusMessages[offer.status] || 'Unknown status'}`);
  };

  const handleOfferChange = (e) => {
    const { name, value } = e.target;
    setOfferData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // File upload handlers
  const handleImagesUploaded = (imageUrls) => {
    setUploadedImages(imageUrls);
    setOfferData(prev => ({
      ...prev,
      propertyImages: imageUrls
    }));
  };

  const handleVideoUploaded = (videoUrl) => {
    setUploadedVideo(videoUrl);
    setOfferData(prev => ({
      ...prev,
      propertyVideo: videoUrl
    }));
  };

  const handleFileDeleted = (fileUrl, isVideo = false) => {
    if (isVideo) {
      setUploadedVideo('');
      setOfferData(prev => ({
        ...prev,
        propertyVideo: ''
      }));
    } else {
      const updatedImages = uploadedImages.filter(url => url !== fileUrl);
      setUploadedImages(updatedImages);
      setOfferData(prev => ({
        ...prev,
        propertyImages: updatedImages
      }));
    }
  };

  const validateOffer = () => {
    if (!offerData.rentAmount || offerData.rentAmount <= 0) {
      setOfferError('Rent amount is required and must be positive');
      return false;
    }
    if (!offerData.leaseDuration || offerData.leaseDuration <= 0) {
      setOfferError('Lease duration is required and must be positive');
      return false;
    }
    if (!offerData.availableFrom) {
      setOfferError('Available from date is required');
      return false;
    }
    return true;
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    setSubmittingOffer(true);
    setOfferError('');
    setOfferSuccess('');

    try {
      // Handle property images (now an array)
      const propertyImagesArray = Array.isArray(offerData.propertyImages) 
        ? offerData.propertyImages 
        : offerData.propertyImages
            .split('\n')
            .map(url => url.trim())
            .filter(url => url.length > 0);
      
      const propertyAmenitiesArray = offerData.propertyAmenities
        .split('\n')
        .map(amenity => amenity.trim())
        .filter(amenity => amenity.length > 0);

      const offerPayload = {
        ...offerData,
        propertyImages: propertyImagesArray,
        propertyAmenities: propertyAmenitiesArray
      };

      const response = await api.post(`/rental-request/${selectedRequest.id}/offer`, offerPayload);
      
      setOfferSuccess('Offer sent successfully!');
      setShowModal(false);
      setSelectedRequest(null);
      setOfferData({
        rentAmount: '',
        depositAmount: '',
        leaseDuration: '',
        availableFrom: '',
        description: '',
        propertyAddress: '',
        propertyImages: [],
        propertyVideo: '',
        propertyType: '',
        propertySize: '',
        propertyAmenities: '',
        propertyDescription: ''
      });
      setUploadedImages([]);
      setUploadedVideo('');
      
      // Refresh the rental requests list
      fetchRentalRequests();
    } catch (error) {
      console.error('Error submitting offer:', error);
      setOfferError(error.response?.data?.error || 'Failed to send offer. Please try again.');
    } finally {
      setSubmittingOffer(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setOfferData({
      rentAmount: '',
      depositAmount: '',
      leaseDuration: '',
      availableFrom: '',
      description: '',
      propertyAddress: '',
      propertyImages: [],
      propertyVideo: '',
      propertyType: '',
      propertySize: '',
      propertyAmenities: '',
      propertyDescription: ''
    });
    setUploadedImages([]);
    setUploadedVideo('');
    setOfferError('');
    setOfferSuccess('');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading rental requests...</p>
          </div>
        </div>
      </div>
    );
  }

  // Always render something, even if there are errors

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Profile Info */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {getProfileImage() ? (
                  <img
                    src={getProfileImage()}
                    alt="Profile"
                    className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {getDisplayName().charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  Requests
                </h1>
                <p className="text-gray-600">
                  Welcome back, {getDisplayName()}!
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={fetchRentalRequests}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Refresh Requests
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Error loading rental requests</p>
                <p className="text-sm mt-1">{error}</p>
                {process.env.NODE_ENV === 'development' && (
                  <p className="text-xs mt-2 text-red-600">
                    API Base URL: {api.defaults.baseURL}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setError('');
                  fetchRentalRequests();
                }}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Request Summary */}
        {rentalRequests.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Requests</p>
                  <p className="text-2xl font-semibold text-gray-900">{rentalRequests.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">New Requests</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {rentalRequests.filter(r => !r.hasMyOffer).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Pending Offers</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {rentalRequests.filter(r => r.hasMyOffer && r.myOffer.status === 'PENDING').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Accepted Offers</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {rentalRequests.filter(r => r.hasMyOffer && r.myOffer.status === 'ACCEPTED').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rental Requests Grid */}
        {rentalRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              No active rental requests found.
            </div>
            <p className="text-gray-400 mt-2">
              Check back later for new requests from tenants.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rentalRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {request.title}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span className="font-medium">Budget:</span>
                      <span className="text-green-600 font-semibold">
                        {formatCurrency(request.budget)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-medium">Location:</span>
                      <span>{request.location}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-medium">Move-in:</span>
                      <span>{formatDate(request.moveInDate)}</span>
                    </div>
                    
                    {request.bedrooms && (
                      <div className="flex justify-between">
                        <span className="font-medium">Bedrooms:</span>
                        <span>{request.bedrooms}</span>
                      </div>
                    )}
                    
                    {request.bathrooms && (
                      <div className="flex justify-between">
                        <span className="font-medium">Bathrooms:</span>
                        <span>{request.bathrooms}</span>
                      </div>
                    )}
                  </div>

                  {/* Additional Requirements */}
                  {(request.furnished || request.parking || request.petsAllowed) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Requirements:</h4>
                      <div className="flex flex-wrap gap-2">
                        {request.furnished && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Furnished
                          </span>
                        )}
                        {request.parking && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Parking
                          </span>
                        )}
                        {request.petsAllowed && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Pets Allowed
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tenant Info */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Tenant:</h4>
                    <p className="text-sm text-gray-600">{request.tenant.name}</p>
                  </div>

                  {/* Send Offer Button or Offer Status */}
                  <div className="mt-6">
                    {request.hasMyOffer ? (
                      <div className="space-y-3">
                        {/* Offer Status Badge */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">Your Offer:</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              request.myOffer.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              request.myOffer.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                              request.myOffer.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {request.myOffer.status}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-green-600">
                            {formatCurrency(request.myOffer.rentAmount)}
                          </span>
                        </div>
                        
                        {/* Offer Details */}
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Sent: {formatDate(request.myOffer.createdAt)}</div>
                          {request.myOffer.status === 'PENDING' && (
                            <div className="text-yellow-600">
                              Waiting for tenant response...
                            </div>
                          )}
                          {request.myOffer.status === 'ACCEPTED' && (
                            <div className="text-green-600">
                              ✅ Offer accepted by tenant
                            </div>
                          )}
                          {request.myOffer.status === 'REJECTED' && (
                            <div className="text-red-600">
                              ❌ Offer rejected by tenant
                            </div>
                          )}
                        </div>
                        
                        {/* View Offer Details Button */}
                        <button
                          onClick={() => handleViewOfferDetails(request)}
                          className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors text-sm"
                        >
                          View Offer Details
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSendOffer(request)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        Send Offer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Accepted Offers Section */}
        {acceptedOffers.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Accepted Offers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {acceptedOffers.map(offer => (
                <div key={offer.id} className="bg-white rounded-lg shadow-md overflow-hidden p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {offer.rentalRequest.title}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex justify-between">
                      <span className="font-medium">Rent:</span>
                      <span className="text-green-600 font-semibold">
                        {formatCurrency(offer.rentAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Deposit:</span>
                      <span>{offer.depositAmount ? formatCurrency(offer.depositAmount) : 'None'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Duration:</span>
                      <span>{offer.leaseDuration} months</span>
                    </div>
                                      <div className="flex justify-between">
                    <span className="font-medium">Tenant:</span>
                    <span>{offer.rentalRequest.tenant.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

        {/* Offer Modal */}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Send Offer for "{selectedRequest.title}"
                </h3>
                
                {offerError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {offerError}
                  </div>
                )}
                
                {offerSuccess && (
                  <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                    {offerSuccess}
                  </div>
                )}
                
                <form onSubmit={handleSubmitOffer} className="space-y-6">
                  {/* Basic Offer Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="rentAmount" className="block text-sm font-medium text-gray-700 mb-1">
                        Rent Amount (PLN) *
                      </label>
                      <input
                        type="number"
                        id="rentAmount"
                        name="rentAmount"
                        value={offerData.rentAmount}
                        onChange={handleOfferChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700 mb-1">
                        Deposit Amount (PLN)
                      </label>
                      <input
                        type="number"
                        id="depositAmount"
                        name="depositAmount"
                        value={offerData.depositAmount}
                        onChange={handleOfferChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="leaseDuration" className="block text-sm font-medium text-gray-700 mb-1">
                        Lease Duration (months) *
                      </label>
                      <input
                        type="number"
                        id="leaseDuration"
                        name="leaseDuration"
                        value={offerData.leaseDuration}
                        onChange={handleOfferChange}
                        required
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="availableFrom" className="block text-sm font-medium text-gray-700 mb-1">
                        Available From *
                      </label>
                      <input
                        type="date"
                        id="availableFrom"
                        name="availableFrom"
                        value={offerData.availableFrom}
                        onChange={handleOfferChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Property Information */}
                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Property Information</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="propertyAddress" className="block text-sm font-medium text-gray-700 mb-1">
                          Property Address *
                        </label>
                        <input
                          type="text"
                          id="propertyAddress"
                          name="propertyAddress"
                          value={offerData.propertyAddress}
                          onChange={handleOfferChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., ul. Marszałkowska 1, 00-001 Warsaw"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-1">
                          Property Type
                        </label>
                        <select
                          id="propertyType"
                          name="propertyType"
                          value={offerData.propertyType}
                          onChange={handleOfferChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select type</option>
                          <option value="Apartment">Apartment</option>
                          <option value="Studio">Studio</option>
                          <option value="House">House</option>
                          <option value="Room">Room</option>
                          <option value="Loft">Loft</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="propertySize" className="block text-sm font-medium text-gray-700 mb-1">
                          Property Size (m²)
                        </label>
                        <input
                          type="text"
                          id="propertySize"
                          name="propertySize"
                          value={offerData.propertySize}
                          onChange={handleOfferChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 45 m²"
                        />
                      </div>
                    </div>
                    
                    {/* File Upload Section */}
                    <div className="mt-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Property Media</h4>
                      <FileUpload
                        onImagesUploaded={handleImagesUploaded}
                        onVideoUploaded={handleVideoUploaded}
                        onFileDeleted={handleFileDeleted}
                        maxImages={10}
                        maxVideoSize={50 * 1024 * 1024} // 50MB
                        maxImageSize={10 * 1024 * 1024} // 10MB
                      />
                    </div>
                    
                    <div className="mt-4">
                      <label htmlFor="propertyAmenities" className="block text-sm font-medium text-gray-700 mb-1">
                        Property Amenities (one per line)
                      </label>
                      <textarea
                        id="propertyAmenities"
                        name="propertyAmenities"
                        value={offerData.propertyAmenities}
                        onChange={handleOfferChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Balcony&#10;Elevator&#10;Security&#10;Parking"
                      />
                    </div>
                    
                    <div className="mt-4">
                      <label htmlFor="propertyDescription" className="block text-sm font-medium text-gray-700 mb-1">
                        Property Description
                      </label>
                      <textarea
                        id="propertyDescription"
                        name="propertyDescription"
                        value={offerData.propertyDescription}
                        onChange={handleOfferChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Detailed description of the property, neighborhood, and what makes it special..."
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Offer Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={offerData.description}
                      onChange={handleOfferChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Additional details about the offer, terms, and conditions..."
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingOffer}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {submittingOffer ? 'Sending...' : 'Send Offer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandlordDashboard; 