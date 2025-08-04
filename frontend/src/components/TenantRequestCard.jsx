import React from 'react';

const TenantRequestCard = ({ request, onSendOffer, onDecline }) => {
  const { tenant, budgetRange, preferredMoveIn, location, matchedProperty, requirements, status, otherLandlordsInterest, offerDetails, offerExpired } = request;

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <svg key="half" className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="halfStar">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#D1D5DB" />
            </linearGradient>
          </defs>
          <path fill="url(#halfStar)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    return stars;
  };

  // Mask contact information
  const maskEmail = (email) => {
    const [localPart, domain] = email.split('@');
    return `${localPart.substring(0, 2)}****@${domain}`;
  };

  const maskPhone = (phone) => {
    return phone.replace(/(\+\d{2}\s\d{3}\s)\d{3}(\s\d{3})/, '$1***$2');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Privacy Protected Banner */}
      <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
        <div className="flex items-center">
          <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-sm text-blue-800 font-medium">
            Privacy Protected. Full contact details will be revealed after tenant accepts your offer and completes payment.
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Tenant Profile Section */}
        <div className="flex items-start space-x-4 mb-6">
          {/* Profile Picture */}
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-lg">
            {tenant.name.split(' ').map(n => n[0]).join('')}
          </div>

          {/* Tenant Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-xl font-semibold text-gray-900">{tenant.name}</h3>
              {tenant.verified && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex items-center">
                {renderStars(tenant.rating)}
              </div>
              <span className="text-sm text-gray-600">
                {tenant.rating} ({tenant.reviewCount} reviews)
              </span>
            </div>

            {/* Review Quote */}
            <p className="text-sm text-gray-600 italic mb-3">"{tenant.review}"</p>

            {/* Contact Information (Masked) */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-600">{maskEmail(tenant.email)}</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-gray-600">{maskPhone(tenant.phone)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tenant Preferences */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Age & Occupation</span>
            <p className="text-sm font-medium text-gray-900">{tenant.age} years, {tenant.occupation}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Budget Range</span>
            <p className="text-sm font-medium text-gray-900">{budgetRange.min} zł - {budgetRange.max} zł</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Preferred Move-in</span>
            <p className="text-sm font-medium text-gray-900">{formatDate(preferredMoveIn)}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Location</span>
            <p className="text-sm font-medium text-gray-900">{location}</p>
          </div>
        </div>

        {/* Matched Property */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-green-800">Matched with your property</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-green-600">Address</span>
              <p className="font-medium text-gray-900">{matchedProperty.address}</p>
            </div>
            <div>
              <span className="text-green-600">Rent</span>
              <p className="font-medium text-gray-900">{matchedProperty.rent} zł</p>
            </div>
            <div>
              <span className="text-green-600">Available</span>
              <p className="font-medium text-gray-900">{formatDate(matchedProperty.availableFrom)}</p>
            </div>
          </div>
        </div>

        {/* Tenant Requirements */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Tenant Requirements</h4>
          <p className="text-sm text-gray-600">{requirements}</p>
        </div>

        {/* Other Landlords Interest */}
        {status === 'active' && otherLandlordsInterest > 0 && (
          <div className="flex items-center text-sm text-gray-600 mb-6">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {otherLandlordsInterest} other landlord{otherLandlordsInterest !== 1 ? 's' : ''} have shown interest
          </div>
        )}

        {/* Offer Status */}
        {status === 'offered' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium text-blue-800">Offer Sent</span>
              </div>
              {offerExpired && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  ▲ Expired
                </span>
              )}
            </div>
            <div className="mt-2 text-sm text-blue-700">
              <p>Property: {matchedProperty.address} • Rent: {offerDetails?.monthlyRent || matchedProperty.rent} zł</p>
              <p>Sent: {formatDate(request.offerSentAt)}</p>
              <p className="mt-1">Full tenant contact details will be shared once they accept your offer.</p>
            </div>
          </div>
        )}

        {/* Declined Status */}
        {status === 'declined' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-sm font-medium text-red-800">Request Declined</span>
            </div>
            <p className="text-sm text-red-700 mt-1">This request has been declined and removed from active listings.</p>
          </div>
        )}

        {/* Action Buttons */}
        {status === 'active' && (
          <div className="flex space-x-3">
            <button
              onClick={() => onSendOffer(request)}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send Offer
            </button>
            <button
              onClick={() => onDecline(request)}
              className="px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantRequestCard; 