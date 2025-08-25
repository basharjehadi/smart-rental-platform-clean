import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Play, Star, Shield, Calendar, MapPin, Home, Users, Clock, X, ChevronLeft, ChevronRight, Sofa, Car, Bath, Building2, Square, Bed } from 'lucide-react';
import PropertyMapCard from '../components/PropertyMapCard';

const PropertyDetailsView = () => {
  const { offerId } = useParams();
  const { user, logout, api } = useAuth();
  const navigate = useNavigate();
  
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showLandlordReviews, setShowLandlordReviews] = useState(false);
  const [landlordReviews, setLandlordReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    fetchOfferDetails();
  }, [offerId]);

  const fetchOfferDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tenant/offer/${offerId}`);
      console.log('🔍 Offer details received:', response.data.offer);
      console.log('🔍 Property data:', response.data.offer?.property);
      console.log('🔍 Property images:', response.data.offer?.property?.images);
      console.log('🔍 Property videos:', response.data.offer?.property?.videos);
      setOffer(response.data.offer);
    } catch (error) {
      console.error('Error fetching offer details:', error);
      setError('Failed to load offer details');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async () => {
    console.log('🔍 handleAcceptOffer called with offerId:', offerId);
    console.log('🔍 Current offer:', offer);
    
    setIsProcessing(true);
    try {
      console.log('🔍 Attempting to accept offer...');
      // First, accept the offer
      const response = await api.patch(`/tenant/offer/${offerId}`, { status: 'ACCEPTED' });
      console.log('🔍 Offer accepted successfully:', response.data);
      
      console.log('🔍 Navigating to payment page...');
      // Then navigate to payment page with offer details
      navigate(`/payment/${offerId}`, { 
        state: { 
          offer: offer,
          fromPropertyDetails: true 
        } 
      });
      console.log('🔍 Navigation completed');
    } catch (error) {
      console.error('❌ Error accepting offer:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      setError('Failed to accept offer');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineOffer = async () => {
    setIsProcessing(true);
    try {
      await api.patch(`/tenant/offer/${offerId}`, { status: 'DECLINED' });
      navigate('/my-offers');
    } catch (error) {
      console.error('Error declining offer:', error);
      setError('Failed to decline offer');
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchLandlordReviews = async () => {
    try {
      setReviewsLoading(true);
      // TODO: Replace with API endpoint for landlord reviews
      const mock = [
        { id: 1, tenantName: 'Anna Nowak', propertyName: 'City Center Loft', rating: 5, comment: 'Very responsive and professional.', reviewDate: '2024-05-12', reviewStage: 'Lease End' },
        { id: 2, tenantName: 'Piotr Kowalski', propertyName: 'Green Park Flat', rating: 4, comment: 'Good experience overall, minor delays once.', reviewDate: '2024-03-18', reviewStage: 'Move-in' }
      ];
      setLandlordReviews(mock);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Use real property data instead of fallbacks
  const propertyData = offer?.property || {};
  console.log('🔍 Property data in component:', propertyData);
  console.log('🔍 Offer propertyId:', offer?.propertyId);
  console.log('🔍 Property has ID:', propertyData?.id);
  console.log('🔍 Property has images:', !!propertyData?.images);
  console.log('🔍 Property has videos:', !!propertyData?.videos);
  
  // Parse data early to avoid undefined errors
  const propertyImages = propertyData.images ? 
    (() => {
      try {
        const parsed = typeof propertyData.images === 'string' ? JSON.parse(propertyData.images) : propertyData.images;
        console.log('🖼️ Parsed property images:', parsed);
        return parsed;
      } catch (error) {
        console.warn('Failed to parse property images:', propertyData.images, error);
        return [];
      }
    })() : 
    [];

  const propertyVideo = propertyData.videos ? 
    (() => {
      try {
        const parsed = typeof propertyData.videos === 'string' ? JSON.parse(propertyData.videos) : propertyData.videos;
        console.log('🎥 Property video data:', parsed);
        console.log('🎥 Property video type:', typeof propertyData.videos);
        console.log('🎥 Property video raw:', propertyData.videos);
        return parsed;
      } catch (error) {
        console.warn('Failed to parse property videos:', propertyData.videos, error);
        return null;
      }
    })() : 
    null;
  
  // Parse amenities from property data or use empty array
  const amenities = propertyData.houseRules ? 
    (() => {
      try {
        return typeof propertyData.houseRules === 'string' ? JSON.parse(propertyData.houseRules) : propertyData.houseRules;
      } catch (error) {
        console.warn('Failed to parse property houseRules:', propertyData.houseRules, error);
        return [];
      }
    })() : 
    [];

  // Use real amenities or show "No amenities listed"
  const allAmenities = amenities.length > 0 ? amenities : [];

  // Helper function to get ordinal suffix
  const getOrdinalSuffix = (num) => {
    if (num >= 11 && num <= 13) return 'th';
    switch (num % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  // Mask landlord's last name for privacy
  const maskLandlordName = (fullName) => {
    if (!fullName) return 'Landlord';
    
    // If offer is paid, show full name
    if (offer?.status === 'PAID') {
      return fullName;
    }
    
    const nameParts = fullName.trim().split(' ');
    
    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      
      // Mask the last name (show first letter, rest as asterisks)
      const maskedLastName = lastName.charAt(0) + '*'.repeat(lastName.length - 1);
      
      return `${firstName} ${maskedLastName}`;
    } else {
      // If only one name, mask it partially
      const name = nameParts[0];
      if (name.length > 2) {
        return name.charAt(0) + '*'.repeat(name.length - 1);
      }
      return name;
    }
  };

  // Format address to show only street, district, and city (privacy)
  const formatAddress = (fullAddress) => {
    if (!fullAddress) return 'Location not specified';
    
    // If offer is paid, show full address
    if (offer?.status === 'PAID') {
      return fullAddress;
    }
    
    // Split the address by commas and filter out empty parts
    const parts = fullAddress.split(',').map(part => part.trim()).filter(part => part.length > 0);
    
    if (parts.length >= 3) {
      // Extract street name (remove house number), postcode, and city
      let street = parts[0];
      const postcode = parts[1];
      const city = parts[2];
      
      // Remove house number from street (e.g., "Jarochowskiego 97/19" -> "Jarochowskiego")
      street = street.replace(/\s+\d+.*$/, '');
      
      // Try to get district from property data if available
      const district = propertyData.district || '';
      
      return district ? `${street}, ${district}, ${city}` : `${street}, ${city}`;
    } else if (parts.length === 2) {
      // If only 2 parts, assume it's street and city
      let street = parts[0];
      const city = parts[1];
      
      // Remove house number from street
      street = street.replace(/\s+\d+.*$/, '');
      
      // Try to get district from property data if available
      const district = propertyData.district || '';
      
      return district ? `${street}, ${district}, ${city}` : `${street}, ${city}`;
    } else {
      // If only 1 part, remove house number and return
      let street = parts[0];
      street = street.replace(/\s+\d+.*$/, '');
      
      // Try to get district from property data if available
      const district = propertyData.district || '';
      const city = propertyData.city || '';
      
      if (district && city) {
        return `${street}, ${district}, ${city}`;
      } else {
        return street;
      }
    }
  };

  // Get real property specifications
  const propertySpecs = {
    bedrooms: propertyData.bedrooms || offer?.propertyType || 'Not specified',
    bathrooms: propertyData.bathrooms || 'Not specified',
    size: propertyData.size ? `${propertyData.size} m²` : 'Not specified',
    floor: propertyData.floor && propertyData.totalFloors ? 
      `${propertyData.floor}${getOrdinalSuffix(propertyData.floor)} floor of ${propertyData.totalFloors}` :
      propertyData.floor ? `${propertyData.floor}${getOrdinalSuffix(propertyData.floor)} floor` :
      'Floor not specified',
    furnished: propertyData.furnished ? 'Furnished' : 'Unfurnished',
    parking: propertyData.parking ? 'Available' : 'Not Available',
    petsAllowed: propertyData.petsAllowed || false,
    smokingAllowed: propertyData.smokingAllowed || false
  };

  // Get real landlord data
  const landlordData = {
    name: offer?.landlord?.name || 'Landlord information not available',
    email: offer?.landlord?.email || 'Email not available',
    phone: offer?.landlord?.phoneNumber || 'Phone not available',
    rating: offer?.landlord?.averageRating ?? 'No rating available',
    reviews: offer?.landlord?.totalReviews ?? 0,
    rank: offer?.landlord?.rank || 'NEW_USER',
    rankPoints: offer?.landlord?.rankPoints || 0,
    profileImage: offer?.landlord?.profileImage || null,
    memberSince: offer?.landlord?.createdAt ? new Date(offer.landlord.createdAt).getFullYear() : 'Not available',
    responseTime: offer?.landlord?.responseTime || 'Response time not available'
  };

  const openPhotoGallery = (index) => {
    setCurrentPhotoIndex(index);
    setPhotoGalleryOpen(true);
  };

  const closePhotoGallery = () => {
    setPhotoGalleryOpen(false);
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev === propertyImages.length - 1 ? 0 : prev + 1
    );
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev === 0 ? propertyImages.length - 1 : prev - 1
    );
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!photoGalleryOpen) return;
      
      if (e.key === 'Escape') {
        closePhotoGallery();
      } else if (e.key === 'ArrowRight') {
        nextPhoto();
      } else if (e.key === 'ArrowLeft') {
        prevPhoto();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [photoGalleryOpen, propertyImages.length]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If it's a relative path, construct full URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    return `${baseUrl}${imagePath}`;
  };

  // Build profile photo URL like rental request card logic
  const getProfilePhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    // Already full URL
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      return photoPath;
    }
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    // If just filename (no leading slash), point to uploads/profile_images
    if (!photoPath.startsWith('/')) {
      return `${baseUrl}/uploads/profile_images/${photoPath}`;
    }
    // If path starts with /uploads/, prefix base URL
    if (photoPath.startsWith('/uploads/')) {
      return `${baseUrl}${photoPath}`;
    }
    // Fallback: prefix base URL
    return `${baseUrl}${photoPath}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error || 'Offer not found'}</p>
          <button 
            onClick={() => navigate('/my-offers')}
            className="btn-primary"
          >
            Back to Offers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      {/* Main Content */}
      <div className="flex flex-col">
        {/* Top Header */}
        <header className="header-modern px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/my-offers')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Offers</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 line-clamp-1">
                  {offer.propertyTitle || propertyData.name || `${offer.propertyType || 'Apartment'} in ${offer.propertyAddress?.split(',')[2]?.trim() || 'the city'}`}
                </h1>
                <p className="text-sm text-gray-600 line-clamp-1">{formatAddress(offer.propertyAddress)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {offer?.status === 'PAID' ? (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">✅ Paid & Secured</span>
                </div>
              ) : offer?.status === 'ACCEPTED' ? (
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">✅ Offer Accepted - Complete Payment</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium">Protected</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-orange-600">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">1 other tenant viewing</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Paid Status Banner */}
        {offer?.status === 'PAID' && (
          <div className="bg-green-50 border-b border-green-200 px-6 py-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-center text-green-800">
                <Shield className="w-5 h-5 mr-2" />
                <span className="text-lg font-semibold">
                  🎉 Congratulations! You have successfully paid for this property and it is now yours!
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-6 pb-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Property Media and Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Property Description and Specifications */}
                <div className="card-modern">
                  <div className="p-6">
                    {!propertyData.id && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <div>
                            <div className="text-sm font-medium text-yellow-800">Property Information Pending</div>
                            <div className="text-xs text-yellow-600">This offer is based on your rental request. The landlord will provide detailed property information and photos after you accept this offer.</div>
                          </div>
                        </div>
                      </div>
                    )}
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Description</h2>
                    <p className="text-gray-700 leading-relaxed mb-6">
                      {propertyData.description || offer.propertyDescription || offer.description || 
                        `Modern ${propertySpecs.bedrooms} bedroom ${offer.propertyType || 'apartment'} in the heart of ${offer.propertyAddress?.split(',')[2]?.trim() || 'the city'}. 
                        This beautiful property features hardwood floors, large windows with natural light, fully equipped kitchen with modern appliances, and a spacious living area. 
                        Building amenities include elevator, parking garage, and 24/7 security.`}
                    </p>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Bed className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="text-lg font-semibold text-gray-900">{propertySpecs.bedrooms}</div>
                        <div className="text-xs text-gray-500">Rooms</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Square className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="text-lg font-semibold text-gray-900">{propertySpecs.size}</div>
                        <div className="text-xs text-gray-500">Area</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Sofa className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="text-lg font-semibold text-gray-900">{propertySpecs.furnished}</div>
                        <div className="text-xs text-gray-500">Furnishing</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Bath className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="text-lg font-semibold text-gray-900">{propertySpecs.bathrooms}</div>
                        <div className="text-xs text-gray-500">Bathrooms</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Building2 className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="text-lg font-semibold text-gray-900">{propertySpecs.floor}</div>
                        <div className="text-xs text-gray-500">Floor</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Car className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="text-lg font-semibold text-gray-900">{propertySpecs.parking}</div>
                        <div className="text-xs text-gray-500">Parking</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Property Policies */}
                {(propertySpecs.petsAllowed || propertySpecs.smokingAllowed) && (
                  <div className="card-modern">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Policies</h3>
                      <div className="space-y-3">
                        {propertySpecs.petsAllowed && (
                          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <div>
                              <div className="text-sm font-medium text-green-800">Pets Allowed</div>
                              <div className="text-xs text-green-600">This property welcomes pets</div>
                            </div>
                          </div>
                        )}
                        {propertySpecs.smokingAllowed && (
                          <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                            </svg>
                            <div>
                              <div className="text-sm font-medium text-orange-800">Smoking Allowed</div>
                              <div className="text-xs text-orange-600">Smoking is permitted in this property</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Available Amenities */}
                <div className="card-modern">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Amenities</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {allAmenities.length > 0 ? (
                        allAmenities.map((amenity, index) => (
                          <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                            <span className="text-sm text-gray-700 font-medium">{amenity}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 italic col-span-full text-center py-4">
                          {!propertyData.id ? 'Amenities will be provided after property details are available' : 'No amenities listed for this property'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Virtual Tour */}
                <div className="card-modern">
                  <div className="p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Play className="w-5 h-5 text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Virtual Tour</h2>
                    </div>
                    <p className="text-gray-600 mb-4">Take a virtual walk-through of this property.</p>
                    <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video">
                      {propertyVideo ? (
                        <video
                          src={getImageUrl(Array.isArray(propertyVideo) ? propertyVideo[0] : propertyVideo)}
                          className="w-full h-full object-cover"
                          controls
                          preload="metadata"
                          poster={propertyImages.length > 0 ? getImageUrl(propertyImages[0]) : undefined}
                        >
                          <source src={getImageUrl(Array.isArray(propertyVideo) ? propertyVideo[0] : propertyVideo)} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-400 mb-2">
                              {!propertyData.id ? 'Property Video Pending' : 'No Video Available'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {!propertyData.id ? 'Virtual tour will be available after property details are provided' : 'Property tour video not uploaded'}
                            </div>
                            <div className="mt-4">
                              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                                <Play className="w-4 h-4 inline mr-2" />
                                Contact Landlord
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>



                {/* Property Photos */}
                {propertyImages.length > 0 && (
                  <div className="card-modern">
                    <div className="p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        {propertyImages.length} high-quality images. Click to view full size
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {propertyImages.map((image, index) => (
                          <div 
                            key={index} 
                            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                            onClick={() => openPhotoGallery(index)}
                          >
                            <img
                              src={getImageUrl(image)}
                              alt={`Property image ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="w-8 h-8 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Actions and Key Information */}
              <div className="space-y-6">

                {/* Location Map */}
                <div className="card-modern">
                  <div className="p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Location</h3>
                    </div>
                    
                    <PropertyMapCard address={
                      (() => {
                        // For map, always use the actual property location, not the masked address
                        const mapAddress = `${propertyData.address}, ${propertyData.district}, ${propertyData.zipCode}, ${propertyData.city}`;
                        console.log('🗺️ Map address being passed:', mapAddress);
                        console.log('🗺️ propertyData:', propertyData);
                        return mapAddress;
                      })()
                    } />
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{formatAddress(offer.propertyAddress || `${propertyData.address}, ${propertyData.district}, ${propertyData.zipCode}, ${propertyData.city}`)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>5 min walk to tram stop</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Your Request */}
                <div className="card-modern">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Request</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Budget</span>
                        <span className="text-sm font-semibold">{formatCurrency(offer.rentalRequest?.budgetTo || offer.rentAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Preferred Move-in</span>
                        <span className="text-sm font-semibold">{formatDate(offer.rentalRequest?.moveInDate || offer.availableFrom)}</span>
                      </div>
                                              <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Property Type</span>
                          <span className="text-sm font-semibold">
                            {(() => {
                              const getPropertyTypeDisplay = (type) => {
                                if (!type) return 'Apartment';
                                
                                const typeMap = {
                                  'apartment': 'Apartment',
                                  'house': 'House',
                                  'studio': 'Studio',
                                  'room': 'Room',
                                  'shared room': 'Shared Room',
                                  'APARTMENT': 'Apartment',
                                  'HOUSE': 'House',
                                  'STUDIO': 'Studio',
                                  'ROOM': 'Room',
                                  'SHARED_ROOM': 'Shared Room'
                                };
                                return typeMap[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
                              };
                              return `${getPropertyTypeDisplay(propertyData.propertyType || offer.propertyType)}, ${propertySpecs.bedrooms} rooms`;
                            })()}
                          </span>
                        </div>
                    </div>
                  </div>
                </div>

                {/* Financial Terms */}
                <div className="card-modern">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Terms</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly Rent</span>
                        <span className="font-semibold">{formatCurrency(offer.rentAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Security Deposit</span>
                        <span className="font-semibold">{formatCurrency(offer.depositAmount || offer.rentAmount)}</span>
                      </div>
                      {/* Pro-rated First Month Rent */}
                      {(() => {
                        const moveInDate = new Date(offer.availableFrom);
                        const moveInDay = moveInDate.getDate();
                        const daysInMonth = 30; // Polish rental standard
                        const daysOccupied = daysInMonth - moveInDay + 1;
                        
                        // Only show pro-rated if not moving in on the 1st
                        if (moveInDay > 1) {
                          const proRatedRent = Math.round((offer.rentAmount / daysInMonth) * daysOccupied);
                          return (
                            <div className="flex justify-between">
                              <span className="text-gray-600">First Month (Pro-rated)</span>
                              <span className="font-semibold text-blue-600">
                                {formatCurrency(proRatedRent)}
                                <span className="text-xs text-gray-500 ml-1">
                                  ({daysOccupied}/{daysInMonth} days)
                                </span>
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      <div className="border-t pt-3">
                        <div className="flex justify-between">
                          <span className="text-gray-900 font-semibold">Total Initial Cost</span>
                          <span className="text-green-600 font-bold">
                            {(() => {
                              const moveInDate = new Date(offer.availableFrom);
                              const moveInDay = moveInDate.getDate();
                              const daysInMonth = 30;
                              const daysOccupied = daysInMonth - moveInDay + 1;
                              
                              let firstMonthRent = offer.rentAmount;
                              if (moveInDay > 1) {
                                firstMonthRent = Math.round((offer.rentAmount / daysInMonth) * daysOccupied);
                              }
                              
                              const deposit = offer.depositAmount || offer.rentAmount || 0;
                              return formatCurrency(firstMonthRent + deposit);
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lease Terms */}
                <div className="card-modern">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Lease Terms</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Available From:</span>
                        <span className="font-semibold">{formatDate(offer.availableFrom)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Lease Duration:</span>
                        <span className="font-semibold">{offer.leaseDuration} months</span>
                      </div>
                      {offer.description && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Additional Terms & Conditions</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            {offer.description.split('.').filter(term => term.trim()).map((term, index) => (
                              <div key={index} className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                <span>{term.trim()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Landlord Profile - Only show for unpaid offers */}
                {offer?.status !== 'PAID' && (
                  <div className="card-modern">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Landlord Profile</h3>
                      <div className="flex items-center space-x-3 mb-4">
                        {landlordData.profileImage ? (
                          <img src={getProfilePhotoUrl(landlordData.profileImage)} alt="Landlord" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">{maskLandlordName(landlordData.name)}</div>
                          <div className="text-sm text-gray-600">Contact details available after payment</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm">{landlordData.rating} ({landlordData.reviews} reviews)</span>
                        </div>
                        <div className="text-xs inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                          {offer?.landlord?.rankInfo?.icon || '⭐'} {offer?.landlord?.rankInfo?.name || String(landlordData.rank).replace('_',' ')}
                        </div>
                        <div className="text-sm text-gray-600">Since {landlordData.memberSince}</div>
                        {/* Removed response time per request */}
                      </div>
                      <button
                        onClick={() => { setShowLandlordReviews(true); fetchLandlordReviews(); }}
                        className="mt-3 text-sm text-blue-600 underline"
                      >
                        View reviews from previous tenants
                      </button>
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          Full contact details will be available after payment completion to protect both parties.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Protection Information - Only show for unpaid offers */}
                {offer?.status !== 'PAID' && (
                  <div className="card-modern border-green-200 bg-green-50">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-green-900 mb-2">You're Protected</h3>
                      <p className="text-sm text-green-800">
                        When you accept this offer, your payment will be held in secure escrow. 
                        You'll have 24 hours after check-in to ensure everything matches. 
                        Full refund if property doesn't match description.
                      </p>
                    </div>
                  </div>
                )}

                {/* Landlord Contact Information - Only show for paid offers */}
                {offer?.status === 'PAID' && (
                  <div className="card-modern">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Landlord Profile</h3>
                      <div className="flex items-center space-x-3 mb-4">
                        {landlordData.profileImage ? (
                          <img src={getProfilePhotoUrl(landlordData.profileImage)} alt="Landlord" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">{maskLandlordName(landlordData.name)}</div>
                          <div className="text-sm text-gray-600">Your landlord</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm">{landlordData.rating} ({landlordData.reviews} reviews)</span>
                        </div>
                        <div className="text-xs inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                          {offer?.landlord?.rankInfo?.icon || '⭐'} {offer?.landlord?.rankInfo?.name || String(landlordData.rank).replace('_',' ')}
                        </div>
                        <div className="text-sm text-gray-600">Since {landlordData.memberSince}</div>
                      </div>
                      <button
                        onClick={() => { setShowLandlordReviews(true); fetchLandlordReviews(); }}
                        className="mt-3 text-sm text-blue-600 underline"
                      >
                        View reviews from previous tenants
                      </button>
                      
                      {/* Contact Information - Now visible for paid offers */}
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="text-sm font-medium text-green-900 mb-2">Contact Information</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                            <span className="text-sm text-green-800">{landlordData.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                            <span className="text-sm text-green-800">{landlordData.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Fixed Bottom Bar */}
        {offer?.status === 'PAID' ? (
          <div className="fixed bottom-0 left-0 right-0 bg-green-50 border-t border-green-200 p-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center text-green-800">
                <Shield className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">
                  ✅ Payment Completed! This property is now yours.
                </span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/tenant-dashboard')}
                  className="btn-success"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => navigate('/my-offers')}
                  className="btn-secondary"
                >
                  Back to Offers
                </button>
              </div>
            </div>
          </div>
        ) : offer?.status === 'ACCEPTED' ? (
          <div className="fixed bottom-0 left-0 right-0 bg-blue-50 border-t border-blue-200 p-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center text-blue-800">
                <Shield className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">
                  ✅ Offer Accepted! Complete your payment to secure this property.
                </span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate(`/payment/${offerId}`, { 
                    state: { 
                      offer: offer,
                      fromPropertyDetails: true 
                    } 
                  })}
                  className="btn-success"
                >
                  Proceed to Payment
                </button>
                <button
                  onClick={() => navigate('/my-offers')}
                  className="btn-secondary"
                >
                  Back to Offers
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="text-sm text-gray-600">
                Ready to accept this offer? Your payment will be protected by our escrow system.
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleDeclineOffer}
                  disabled={isProcessing}
                  className="btn-secondary disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Decline Offer'}
                </button>
                <button
                  onClick={handleAcceptOffer}
                  disabled={isProcessing}
                  className="btn-success disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Accept with Protection'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Photo Gallery Modal */}
      {photoGalleryOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={closePhotoGallery}
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Navigation Buttons */}
            <button
              onClick={prevPhoto}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
            >
              <ChevronLeft className="w-12 h-12" />
            </button>

            <button
              onClick={nextPhoto}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
            >
              <ChevronRight className="w-12 h-12" />
            </button>

            {/* Main Image */}
            <div className="relative max-w-4xl max-h-full p-4">
              <img
                src={getImageUrl(propertyImages[currentPhotoIndex])}
                alt={`Property image ${currentPhotoIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              
              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full">
                {currentPhotoIndex + 1} / {propertyImages.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Landlord Reviews Modal */}
      {showLandlordReviews && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Reviews about this landlord</h3>
                <p className="text-sm text-gray-600">From previous tenants</p>
              </div>
              <button onClick={() => setShowLandlordReviews(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {reviewsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading reviews...</span>
                </div>
              ) : landlordReviews.length > 0 ? (
                <div className="space-y-4">
                  {landlordReviews.map(r => (
                    <div key={r.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-gray-900">{r.tenantName}</div>
                          <div className="text-sm text-gray-600">{r.propertyName}</div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-4 h-4 ${s <= r.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                          ))}
                          <span className="text-sm font-medium text-gray-900 ml-1">{r.rating}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 mb-1">{r.comment}</div>
                      <div className="text-xs text-gray-500">Posted on {new Date(r.reviewDate).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">No reviews yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetailsView;
