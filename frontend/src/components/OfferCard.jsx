import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import ConfirmationModal from './ConfirmationModal';

const OfferCard = ({
  propertyTitle,
  location,
  rent,
  deposit,
  availableFrom,
  duration,
  amenities = [],
  terms,
  status,
  onAccept,
  onDecline,
  propertyImage,
  landlordName,
  landlordRating,
  propertyType,
  rooms,
  area,
  bathrooms,
  furnishing,
  parking,
  landlordEmail,
  landlordPhone,
  isPaid = false,
  offerId
}) => {
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

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

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await onAccept(offerId);
      setShowAcceptModal(false);
    } catch (error) {
      console.error('Error accepting offer:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    try {
      await onDecline(offerId);
      setShowDeclineModal(false);
    } catch (error) {
      console.error('Error declining offer:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const shouldShowLandlordInfo = status === 'ACCEPTED' && isPaid;

  return (
    <div className="card-modern bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Orange notification bar */}
      <div className="bg-orange-50 border-b border-orange-100 px-6 py-3">
        <div className="flex items-center text-orange-700 text-sm">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          1 other tenant is currently viewing this offer
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          {/* Left side - Property details */}
          <div className="flex-1 pr-6">
            {/* Title and landlord info */}
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{propertyTitle}</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2">by {landlordName || 'Landlord'}</span>
                  <svg className="w-4 h-4 text-blue-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-blue-600 text-sm font-medium">Protected</span>
                </div>
                {landlordRating && (
                  <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-medium">{landlordRating}</span>
                    <span className="text-gray-500 ml-1">(127 reviews)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Property details grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-lg font-semibold text-gray-900">{location}</div>
                <div className="text-xs text-gray-500">Location</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="text-lg font-semibold text-gray-900">{formatCurrency(rent)}</div>
                <div className="text-xs text-gray-500">Monthly rent</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="text-lg font-semibold text-gray-900">{rooms} rooms</div>
                <div className="text-xs text-gray-500">{propertyType}, {rooms} rooms</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="text-lg font-semibold text-gray-900">{area} m²</div>
                <div className="text-xs text-gray-500">Area</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-lg font-semibold text-gray-900">{bathrooms} bath</div>
                <div className="text-xs text-gray-500">Bathrooms</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="text-lg font-semibold text-gray-900">{furnishing}</div>
                <div className="text-xs text-gray-500">Furnishing</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div className="text-lg font-semibold text-gray-900">{parking}</div>
                <div className="text-xs text-gray-500">Parking</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-lg font-semibold text-gray-900">{formatDate(availableFrom)}</div>
                <div className="text-xs text-gray-500">Available from</div>
              </div>
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {amenities.slice(0, 4).map((amenity, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      {amenity}
                    </span>
                  ))}
                  {amenities.length > 4 && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      +{amenities.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Landlord Contact Info - Only show if accepted and paid */}
            {shouldShowLandlordInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Landlord Contact Information</h4>
                <div className="text-sm text-blue-800">
                  <div className="flex items-center mb-1">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    {landlordEmail}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    {landlordPhone}
                  </div>
                </div>
              </div>
            )}

            {status === 'ACCEPTED' && !isPaid && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="text-sm text-yellow-800">
                  Contact details available after payment
                </div>
              </div>
            )}
          </div>

          {/* Right side - Property image */}
          <div className="relative w-32 h-32 flex-shrink-0">
            {propertyImage ? (
              <img
                src={propertyImage}
                alt={propertyTitle}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
            {/* Status badge */}
            <div className="absolute -top-2 -left-2">
              <span className="badge-warning">
                {status.toLowerCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {status === 'PENDING' && (
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => navigate(`/property/${offerId}`)}
              className="flex-1 px-4 py-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              View Details
            </button>
            <button
              onClick={() => setShowDeclineModal(true)}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Decline'}
            </button>
            <button
              onClick={() => setShowAcceptModal(true)}
              disabled={isProcessing}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Accept Offer'}
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        onConfirm={handleAccept}
        title="Accept Offer"
        message="Are you sure you want to accept this offer? This action cannot be undone and will mark the offer as accepted."
        confirmText="Accept Offer"
        cancelText="Cancel"
        confirmColor="bg-green-600 hover:bg-green-700"
      />

      <ConfirmationModal
        isOpen={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        onConfirm={handleDecline}
        title="Decline Offer"
        message="Are you sure you want to decline this offer? This action cannot be undone."
        confirmText="Decline Offer"
        cancelText="Cancel"
        confirmColor="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

export default OfferCard; 