import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Play, Star, Shield, Calendar, MapPin, Home, Users, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';

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

  useEffect(() => {
    fetchOfferDetails();
  }, [offerId]);

  const fetchOfferDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tenant/offer/${offerId}`);
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Parse data early to avoid undefined errors
  const propertyImages = offer?.propertyImages ? 
    (typeof offer.propertyImages === 'string' ? JSON.parse(offer.propertyImages) : offer.propertyImages) : 
    [];

  const propertyVideo = offer?.propertyVideo ? 
    (typeof offer.propertyVideo === 'string' ? JSON.parse(offer.propertyVideo) : offer.propertyVideo) : 
    null;

  const amenities = offer?.propertyAmenities ? 
    (typeof offer.propertyAmenities === 'string' ? JSON.parse(offer.propertyAmenities) : offer.propertyAmenities) : 
    [];

  // Add some default amenities that are commonly shown in the screenshots
  const defaultAmenities = ['Balcony', 'Elevator', 'Internet (separate with roommates)', 'Intercom', 'Parking Space'];
  const allAmenities = amenities.length > 0 ? amenities : defaultAmenities;

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
                <h1 className="text-xl font-semibold text-gray-900 line-clamp-1">{offer.propertyTitle}</h1>
                <p className="text-sm text-gray-600 line-clamp-1">{offer.propertyAddress}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <Shield className="w-4 h-4" />
                <span className="font-medium">Protected</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-orange-600">
                <Users className="w-4 h-4" />
                <span className="font-medium">1 other tenant viewing</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 pb-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column - Property Media and Details */}
              <div className="lg:col-span-3 space-y-6">
                {/* Property Description and Specifications */}
                <div className="card-modern">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Description</h2>
                    <p className="text-gray-700 leading-relaxed mb-6">
                      {offer.propertyDescription || offer.description || 
                        `Modern ${offer.property?.bedrooms || 2}-bedroom apartment in the heart of ${offer.propertyAddress?.split(',')[2]?.trim() || 'the city'}. 
                        This beautiful property features hardwood floors, large windows with natural light, fully equipped kitchen with modern appliances, and a spacious living area. 
                        Building amenities include elevator, parking garage, and 24/7 security.`}
                    </p>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Home className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="text-lg font-semibold text-gray-900">{offer.property?.bedrooms || offer.propertySize || 2} rooms</div>
                        <div className="text-xs text-gray-500">Rooms</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <div className="w-6 h-6 border-2 border-dashed border-gray-400 rounded"></div>
                        </div>
                        <div className="text-lg font-semibold text-gray-900">{offer.property?.size || 65} m²</div>
                        <div className="text-xs text-gray-500">Area</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <div className="w-6 h-6 bg-gray-400 rounded"></div>
                        </div>
                        <div className="text-lg font-semibold text-gray-900">{offer.property?.furnished ? 'Furnished' : 'Unfurnished'}</div>
                        <div className="text-xs text-gray-500">Furnishing</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
                        </div>
                        <div className="text-lg font-semibold text-gray-900">{offer.property?.bathrooms || 1} bathrooms</div>
                        <div className="text-xs text-gray-500">Bathrooms</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Home className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="text-lg font-semibold text-gray-900">4th floor of 8</div>
                        <div className="text-xs text-gray-500">Floor</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <div className="w-6 h-6 bg-gray-400 rounded"></div>
                        </div>
                        <div className="text-lg font-semibold text-gray-900">{offer.property?.parking ? 'Available' : 'Not Available'}</div>
                        <div className="text-xs text-gray-500">Parking</div>
                      </div>
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
                        <iframe
                          src={Array.isArray(propertyVideo) ? propertyVideo[0] : propertyVideo}
                          className="w-full h-full"
                          title="Property Virtual Tour"
                          frameBorder="0"
                          allowFullScreen
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-400 mb-2">No Video Available</div>
                            <div className="text-sm text-gray-500">Property tour video not uploaded</div>
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
                              src={image}
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

              {/* Right Column - Summary and Actions */}
              <div className="space-y-6">
                {/* Property Summary */}
                <div className="card-modern">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Summary</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600">{offer.propertyAddress}</div>
                          <div className="text-xs text-blue-600">Full address after payment</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Home className="w-5 h-5 text-gray-400" />
                        <div className="text-sm text-gray-600">
                          {offer.propertyType}, {offer.property?.bedrooms || offer.propertySize || 2} rooms
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div className="text-sm text-gray-600">{formatDate(offer.availableFrom)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Available Amenities */}
                <div className="card-modern">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Amenities</h3>
                    <div className="space-y-3">
                      {allAmenities.map((amenity, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">{amenity}</span>
                        </div>
                      ))}
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
                        <span className="text-sm font-semibold">{formatDate(offer.availableFrom)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Property Type</span>
                        <span className="text-sm font-semibold">{offer.propertyType}, {offer.property?.bedrooms || offer.propertySize || 2} rooms</span>
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
                      <div className="border-t pt-3">
                        <div className="flex justify-between">
                          <span className="text-gray-900 font-semibold">Total Initial Cost</span>
                          <span className="text-green-600 font-bold">
                            {formatCurrency((offer.rentAmount || 0) + (offer.depositAmount || offer.rentAmount || 0))}
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

                {/* Landlord Profile */}
                <div className="card-modern">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Landlord Profile</h3>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{offer.landlord?.name || 'Landlord'}</div>
                        <div className="text-sm text-gray-600">Contact details available after payment</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm">4.8 (127 reviews)</span>
                      </div>
                      <div className="text-sm text-gray-600">Since 2019</div>
                      <div className="text-sm text-gray-600">Within 2 hours</div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Full contact details will be available after payment completion to protect both parties.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Protection Information */}
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
              </div>
            </div>
          </div>
        </main>

        {/* Fixed Bottom Bar */}
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
                src={propertyImages[currentPhotoIndex]}
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
    </div>
  );
};

export default PropertyDetailsView;
