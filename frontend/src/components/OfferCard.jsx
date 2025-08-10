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
  petsAllowed,
  smokingAllowed,
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

  // Show landlord name (unmasked for paid offers, masked for others)
  const getLandlordName = (fullName) => {
    if (!fullName) return 'Landlord';
    
    // If offer is paid, show full name
    if (isPaid) {
      return fullName;
    }
    
    // Otherwise, mask the last name for privacy
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

  return (
    <div className="card-modern bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
      <div className="p-6">
        {/* Header with title and status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{propertyTitle}</h3>
            <div className="flex items-center text-sm text-gray-600">
              <span>by {getLandlordName(landlordName)}</span>
              <span className="mx-2">•</span>
              <span>{location}</span>
            </div>
          </div>
          <StatusBadge status={isPaid ? 'PAID' : status} />
        </div>

        {/* Key information */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(rent)}
            <span className="text-sm font-normal text-gray-500 ml-1">/month</span>
          </div>
          <div className="text-sm text-gray-600">
            Available from {new Date(availableFrom).toLocaleDateString('pl-PL')}
          </div>
        </div>

        {/* Action Buttons */}
        {status === 'PENDING' && !isPaid && (
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

        {isPaid && (
          <>
            {/* Contact Information for Paid Offers */}
            {(landlordEmail || landlordPhone) && (
              <div className="pt-4 border-t border-gray-200 mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Landlord Contact</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  {landlordEmail && (
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Email:</span>
                      <span>{landlordEmail}</span>
                    </div>
                  )}
                  {landlordPhone && (
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Phone:</span>
                      <span>{landlordPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => navigate(`/property/${offerId}`)}
                className="flex-1 px-4 py-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                View Offer
              </button>
              <button
                onClick={() => navigate('/tenant-dashboard')}
                className="flex-1 px-4 py-2 text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </>
        )}

        {status === 'ACCEPTED' && !isPaid && (
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => navigate(`/property/${offerId}`)}
              className="flex-1 px-4 py-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              View Offer
            </button>
            <button
              onClick={() => navigate('/payment')}
              className="flex-1 px-4 py-2 text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              Proceed to Payment
            </button>
          </div>
        )}

        {status === 'DECLINED' && (
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => navigate(`/property/${offerId}`)}
              className="flex-1 px-4 py-2 text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              View Details
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
