import React from 'react';

const TenantRequestCard = ({ 
  tenant, 
  onSendOffer, 
  onDeclineRequest, 
  onPriceAdjustment,
  decliningRequest = false,
  offerSent = false,
  formatCurrencyDisplay,
  formatCurrencyWithDecimals,
  formatDate,
  getProfilePhotoUrl,
  t
}) => {
  // Calculate match score and indicators
  const calculateMatchScore = () => {
    // More robust property rent parsing
    let propertyRent = 0;
    try {
      if (tenant.propertyMatch.rent) {
        // Handle different formats: "1500 zł", "1500", "1,500 zł", etc.
        const rentString = tenant.propertyMatch.rent.toString();
        const rentNumber = rentString.replace(/[^\d.,]/g, '').replace(',', '.');
        propertyRent = parseFloat(rentNumber);
        
        if (isNaN(propertyRent)) {
          console.error('❌ Failed to parse property rent:', tenant.propertyMatch.rent);
          propertyRent = 0;
        }
      }
    } catch (error) {
      console.error('❌ Error parsing property rent:', error);
      propertyRent = 0;
    }
    
    const tenantMaxBudget = parseInt(tenant.budgetTo || tenant.budget) || 0;
    const tenantMinBudget = parseInt(tenant.budgetFrom || tenant.budget) || 0;
    
    // Debug logging
    console.log('🔍 calculateMatchScore debug:', {
      propertyRent,
      tenantMaxBudget,
      tenantMinBudget,
      propertyRentRaw: tenant.propertyMatch.rent,
      budgetTo: tenant.budgetTo,
      budget: tenant.budget,
      parsedBudgetTo: parseInt(tenant.budgetTo),
      parsedBudget: parseInt(tenant.budget)
    });
    
    let score = 0;
    let matchType = '';
    let budgetStatus = '';
    let needsPriceAdjustment = false;
    let actionMessage = '';
    let urgencyLevel = '';
    
    // Budget matching (40 points)
    if (propertyRent <= tenantMaxBudget && propertyRent >= tenantMinBudget) {
      score += 40;
      matchType = 'Perfect Match';
      budgetStatus = 'Your price fits their budget perfectly';
      actionMessage = 'Great match! Send an offer.';
      urgencyLevel = 'high';
      console.log('✅ Perfect match - no price adjustment needed');
    } else if (propertyRent <= tenantMaxBudget * 1.2) {
      score += 25;
      matchType = 'Good Match - Price Adjustment Needed';
      budgetStatus = `Your price: ${propertyRent} PLN, Their max: ${tenantMaxBudget} PLN`;
      actionMessage = 'Consider reducing your price by 10-15% to close this deal.';
      needsPriceAdjustment = true;
      urgencyLevel = 'medium';
      console.log('⚠️ Good match - price adjustment needed');
    } else if (propertyRent <= tenantMaxBudget * 1.5) {
      score += 15;
      matchType = 'Fair Match - Significant Price Cut Needed';
      budgetStatus = `Your price: ${propertyRent} PLN, Their max: ${tenantMaxBudget} PLN`;
      actionMessage = 'You\'ll need to reduce your price by 20-30% to match their budget.';
      needsPriceAdjustment = true;
      urgencyLevel = 'low';
      console.log('⚠️ Fair match - significant price cut needed');
    } else {
      score += 5;
      matchType = 'Poor Match - Price Too High';
      budgetStatus = `Your price: ${propertyRent} PLN, Their max: ${tenantMaxBudget} PLN`;
      actionMessage = 'Consider if this tenant is worth a major price reduction.';
      needsPriceAdjustment = true;
      urgencyLevel = 'very-low';
      console.log('⚠️ Poor match - price too high');
    }
    
    // Location matching (30 points)
    if (tenant.propertyMatch.address.includes(tenant.location)) {
      score += 30;
    } else if (tenant.propertyMatch.address.toLowerCase().includes(tenant.location.toLowerCase())) {
      score += 20;
    } else {
      score += 10;
    }
    
    // Property type matching (20 points)
    if (tenant.propertyType && tenant.propertyMatch.propertyType) {
      if (tenant.propertyType.toLowerCase() === tenant.propertyMatch.propertyType.toLowerCase()) {
        score += 20;
      } else {
        score += 10;
      }
    } else {
      score += 15;
    }
    
    // Date matching (10 points)
    const moveInDate = new Date(tenant.moveInDate);
    const availableDate = new Date(tenant.propertyMatch.available);
    const daysDiff = Math.abs((moveInDate - availableDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 7) {
      score += 10;
    } else if (daysDiff <= 30) {
      score += 7;
    } else if (daysDiff <= 90) {
      score += 5;
    } else {
      score += 2;
    }
    
    const result = { score, matchType, budgetStatus, needsPriceAdjustment, actionMessage, urgencyLevel };
    console.log('🔍 Final matchInfo:', result);
    return result;
  };

  const matchInfo = calculateMatchScore();
  
  // Mask contact information
  const maskEmail = (email) => {
    if (!email || email.includes('......') || email === '......@email.com') return '****@email.com';
    const [localPart, domain] = email.split('@');
    if (!domain) return '****@email.com';
    return `${localPart.substring(0, 2)}****@${domain}`;
  };

  const maskPhone = (phone) => {
    if (!phone || phone.includes('......') || phone === '+48 ...... 789') return '+48 *** *** 789';
    
    // Debug: log the actual phone format
    console.log('🔍 Masking phone:', phone, 'Type:', typeof phone);
    
    // Handle Polish phone format: +48 573 997 766 (without spaces)
    if (phone.startsWith('+48')) {
      // Format: +48XXXXXXXXX -> +48 *** *** XXX
      // Extract country code (+48) and last 3 digits, mask the middle
      const countryCode = phone.substring(0, 3); // +48
      const lastThree = phone.slice(-3); // Last 3 digits
      const masked = `${countryCode} *** *** ${lastThree}`;
      console.log('📱 Polish phone masked:', phone, '->', masked);
      return masked;
    }
    
    // For other formats, mask the middle part
    const masked = phone.replace(/(\+\d{1,3}\s?)(\d{1,3})(\s?\d{1,3})(\s?\d{1,3})/, '$1***$3$4');
    console.log('📱 Other format masked:', phone, '->', masked);
    return masked;
  };

  // Mask last name for privacy
  const maskLastName = (fullName) => {
    if (!fullName) return 'Tenant';
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length === 1) return nameParts[0];
    if (nameParts.length === 2) {
      const firstName = nameParts[0];
      const lastName = nameParts[1];
      return `${firstName} ${lastName.charAt(0)}****`;
    }
    // For names with more than 2 parts, mask all except first
    const firstName = nameParts[0];
    const maskedParts = nameParts.slice(1).map(part => `${part.charAt(0)}****`);
    return `${firstName} ${maskedParts.join(' ')}`;
  };

  // Get real data or show appropriate fallback
  const getDisplayAge = (age) => {
    if (age && age !== '25-34 years') return age;
    return 'Age not specified';
  };

  const getDisplayOccupation = (occupation) => {
    if (occupation && occupation !== 'Technology') return occupation;
    return 'Occupation not specified';
  };

  const getDisplayMoveInDate = (moveInDate) => {
    if (!moveInDate) return 'Date not specified';
    
    try {
      const date = new Date(moveInDate);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Date not specified';
    }
  };

  // Get match color based on score
  const getMatchColor = (score) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  };

  const matchColor = getMatchColor(matchInfo.score);

  return (
    <div className="card-modern overflow-hidden">
      {/* Match Score Banner */}
      <div className={`bg-${matchColor}-50 border-b border-${matchColor}-100 px-6 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`h-3 w-3 bg-${matchColor}-500 rounded-full`}></div>
            <span className={`text-sm font-medium text-${matchColor}-800`}>
              {matchInfo.matchType}
            </span>
          </div>
          <div className={`text-lg font-bold text-${matchColor}-600`}>
            {matchInfo.score}% Match
          </div>
        </div>
      </div>

      {/* Interest Indicator */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
        <div className="flex items-center text-sm text-gray-600">
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {tenant.interestCount > 0 
            ? `${tenant.interestCount} other landlord${tenant.interestCount === 1 ? ' has' : 's have'} shown interest.`
            : 'No other landlords have shown interest yet.'
          }
        </div>
      </div>

      {/* Privacy Banner */}
      <div className="bg-blue-50 px-6 py-3 border-b border-blue-100">
        <div className="flex items-center text-sm text-blue-800">
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Privacy Protected. Full contact details will be revealed after tenant accepts your offer and completes payment.
        </div>
      </div>

      {/* Tenant Information */}
      <div className="p-6">
        <div className="flex items-start space-x-4 mb-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">{tenant.initials}</span>
            </div>
          </div>

          {/* Tenant Details */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{maskLastName(tenant.name)}</h3>
              {tenant.verified && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center space-x-2 mb-3">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.floor(tenant.rating || 0)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {tenant.rating ? `${tenant.rating} (${tenant.reviews || 0} reviews)` : 'No rating yet'}
              </span>
            </div>

            {/* Contact Details (Masked) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email: {maskEmail(tenant.email)}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Phone: {maskPhone(tenant.phone)} {/* Debug: tenant.phone = {JSON.stringify(tenant.phone)} */}
              </div>
            </div>

            {/* Demographics and Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Age & Occupation</p>
                <p className="text-sm font-medium text-gray-900">
                  {getDisplayAge(tenant.age)}
                  {tenant.age && tenant.occupation && ', '}
                  {getDisplayOccupation(tenant.occupation)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Budget Range</p>
                <p className="text-sm font-medium text-gray-900">{tenant.budgetRange}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Preferred Move-in</p>
                <p className="text-sm font-medium text-gray-900">{getDisplayMoveInDate(tenant.moveInDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                <p className="text-sm font-medium text-gray-900">{tenant.location}</p>
              </div>
            </div>

            {/* Property Match with Budget Analysis */}
            <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">Matched with your property</span>
              </div>
              
              {/* Property Details */}
              <div className="mb-4">
                <p className="text-sm text-green-700 font-semibold mb-1">{tenant.propertyMatch.name}</p>
                <p className="text-sm text-green-700 font-medium">{tenant.propertyMatch.address}</p>
                <p className="text-sm text-green-700">
                  Rent: {tenant.propertyMatch.rent} • Available: {tenant.propertyMatch.available}
                </p>
              </div>
              
              {/* Budget Analysis - Actionable Information */}
              <div className="bg-white bg-opacity-70 rounded-lg p-3 border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-800">Budget Analysis</span>
                </div>
                
                {/* Budget Comparison */}
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Your Price</p>
                    <p className="text-lg font-bold text-red-600">{tenant.propertyMatch.rent}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Their Max Budget</p>
                    <p className="text-lg font-bold text-green-600">{tenant.budgetTo ? `${tenant.budgetTo} PLN` : `${tenant.budget} PLN`}</p>
                  </div>
                </div>
                
                {/* Action Message */}
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {matchInfo.actionMessage}
                  </p>
                  
                  {/* Urgency Badge */}
                  {matchInfo.urgencyLevel === 'high' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      High Priority
                    </span>
                  )}
                  {matchInfo.urgencyLevel === 'medium' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Good Opportunity
                    </span>
                  )}
                  {matchInfo.urgencyLevel === 'low' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Fair Opportunity
                    </span>
                  )}
                  {matchInfo.urgencyLevel === 'very-low' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Low Priority
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tenant Requirements */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Tenant Requirements</h4>
              <p className="text-sm text-gray-600">{tenant.requirements}</p>
            </div>

            {/* Action Buttons or Status */}
            {tenant.status?.toLowerCase() === 'active' ? (
              <div className="flex space-x-4">
                {matchInfo.needsPriceAdjustment ? (
                  <>
                    {/* Price Adjustment Button */}
                    <button 
                      onClick={() => onPriceAdjustment(tenant)}
                      className="btn-secondary flex-1 inline-flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Adjust Price & Send Offer
                    </button>
                  </>
                ) : (
                  /* Perfect Match - Just Send Offer */
                  <button 
                    onClick={() => onSendOffer(tenant)}
                    className="btn-primary flex-1 inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Offer
                  </button>
                )}
                
                {/* Decline Button */}
                <button 
                  onClick={() => onDeclineRequest(tenant)}
                  className="btn-danger inline-flex items-center justify-center bg-red-500 hover:bg-red-600 text-white"
                  disabled={decliningRequest}
                >
                  {decliningRequest ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  Decline
                </button>
              </div>
            ) : tenant.status?.toLowerCase() === 'offered' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2">
                  <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-800 font-medium">Offer Sent</span>
                </div>
                <p className="text-sm text-green-700 text-center mt-1">
                  Waiting for tenant response
                </p>
              </div>
            ) : tenant.status?.toLowerCase() === 'declined' ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2">
                  <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-800 font-medium">Request Declined</span>
                </div>
                <p className="text-sm text-red-700 text-center mt-1">
                  This request has been declined
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantRequestCard; 