import React, { useState } from 'react';
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
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        {/* Property Image */}
        <div className="relative w-24 h-24 mr-4 flex-shrink-0">
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
          <div className="absolute -top-2 -right-2">
            <StatusBadge status={status} size="small" />
          </div>
        </div>

        {/* Property Details */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{propertyTitle}</h3>
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {location}
              </div>
            </div>
            
            {/* Landlord Info */}
            <div className="text-right">
              <div className="flex items-center justify-end mb-1">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                  <span className="text-xs font-medium text-gray-700">
                    {landlordName?.charAt(0) || 'L'}
                  </span>
                </div>
                <span className="text-sm text-gray-600">by {landlordName || 'Landlord'}</span>
              </div>
              {landlordRating && (
                <div className="flex items-center justify-end text-sm text-gray-500">
                  <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {landlordRating}
                </div>
              )}
              
              {/* Landlord Contact Info - Only show if accepted and paid */}
              {shouldShowLandlordInfo ? (
                <div className="mt-2 text-xs text-gray-600">
                  <div>📧 {landlordEmail}</div>
                  <div>📞 {landlordPhone}</div>
                </div>
              ) : status === 'ACCEPTED' && !isPaid ? (
                <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Contact details available after payment
                </div>
              ) : null}
            </div>
          </div>

          {/* Property Specs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <div>
              <span className="text-gray-500">Monthly Rent:</span>
              <p className="font-medium">{formatCurrency(rent)}</p>
            </div>
            <div>
              <span className="text-gray-500">Deposit:</span>
              <p className="font-medium">{formatCurrency(deposit)}</p>
            </div>
            <div>
              <span className="text-gray-500">Available From:</span>
              <p className="font-medium">{formatDate(availableFrom)}</p>
            </div>
            <div>
              <span className="text-gray-500">Duration:</span>
              <p className="font-medium">{duration} months</p>
            </div>
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-gray-600">{rooms} rooms</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-gray-600">{area} m²</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-600">{furnishing}</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span className="text-gray-600">{parking}</span>
            </div>
          </div>

          {/* Amenities */}
          {amenities.length > 0 && (
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700 mb-2 block">Amenities:</span>
              <div className="flex flex-wrap gap-2">
                {amenities.slice(0, 5).map((amenity, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {amenity}
                  </span>
                ))}
                {amenities.length > 5 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    +{amenities.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Terms */}
          {terms && (
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700 mb-2 block">Landlord's Note:</span>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {terms}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {status === 'ACTIVE' && (
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowDeclineModal(true)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Decline'}
              </button>
              <button
                onClick={() => setShowAcceptModal(true)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Accept Offer'}
              </button>
            </div>
          )}
        </div>
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