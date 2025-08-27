import React, { useState, useEffect } from 'react';

const TenantRequestCard = ({ 
  tenant, 
  onSendOffer, 
  onDeclineRequest,
  decliningRequest = false,
  offerSent = false,
  formatCurrencyDisplay,
  formatCurrencyWithDecimals,
  formatDate,
  getProfilePhotoUrl,
  t
}) => {
  const [tenantRank, setTenantRank] = useState(null);
  const [rankLoading, setRankLoading] = useState(true);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [tenantReviews, setTenantReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Check if this is a business request or group request
  const isBusinessRequest = tenant.isBusinessRequest;
  const isGroupRequest = tenant.isGroupRequest;
  const organization = tenant.organization;
  const tenantGroupMembers = tenant.tenantGroupMembers || [];

  // Get request type display info
  const getRequestTypeInfo = () => {
    if (isBusinessRequest && organization) {
      return {
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
          </svg>
        ),
        title: organization.name,
        subtitle: 'Business Request',
        type: 'business'
      };
    } else if (isGroupRequest && tenantGroupMembers.length > 1) {
      return {
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        ),
        title: tenant.tenantGroup?.name || 'Group Request',
        subtitle: `${tenantGroupMembers.length} occupants`,
        type: 'group'
      };
    } else {
      return {
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
        title: tenant.name,
        subtitle: 'Individual Request',
        type: 'individual'
      };
    }
  };

  const requestTypeInfo = getRequestTypeInfo();

  // Fetch tenant rank information
  useEffect(() => {
    const fetchTenantRank = async () => {
      if (!tenant.id) return;
      
      try {
        setRankLoading(true);
        const response = await fetch(`/api/users/${tenant.id}/rank`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const rankData = await response.json();
          setTenantRank(rankData.data);
        }
      } catch (error) {
        console.warn('Error fetching tenant rank:', error);
      } finally {
        setRankLoading(false);
      }
    };

    fetchTenantRank();
  }, [tenant.id]);

  // Fetch tenant reviews when modal opens
  const fetchTenantReviews = async () => {
    if (!tenant.id) return;
    
    try {
      setReviewsLoading(true);
      // TODO: Replace with actual API call to get tenant reviews
      // const response = await fetch(`/api/tenants/${tenant.id}/reviews`);
      // const reviewsData = await response.json();
      // setTenantReviews(reviewsData.data);
      
      // Mock data for now
      const mockReviews = [
        {
          id: 1,
          landlordName: 'Maria Kowalska',
          propertyName: 'Sunset Apartments',
          rating: 5,
          comment: 'Excellent tenant! Always paid rent on time, kept the property clean, and was very respectful. Highly recommend.',
          reviewDate: '2024-01-15',
          reviewStage: 'Lease End'
        },
        {
          id: 2,
          landlordName: 'Jan Nowak',
          propertyName: 'City Center Loft',
          rating: 4,
          comment: 'Good tenant overall. Quiet and responsible. Minor issues with late rent once, but resolved quickly.',
          reviewDate: '2023-11-20',
          reviewStage: 'Move-in'
        }
      ];
      setTenantReviews(mockReviews);
    } catch (error) {
      console.warn('Error fetching tenant reviews:', error);
      setTenantReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };
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

  // One-line budget analysis sentence (below / exact / slightly above / above)
  const deriveBudgetSentence = () => {
    // Parse rent
    let propertyRent = 0;
    try {
      const rentString = (tenant.propertyMatch?.rent || '').toString();
      propertyRent = parseFloat(rentString.replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
    } catch {}

    const tenantMaxBudget = parseInt(tenant.budgetTo || tenant.budget) || 0;
    if (!tenantMaxBudget || !propertyRent) return '';

    if (propertyRent < tenantMaxBudget) {
      return 'Your price is below their budget. You can offer your current price or adjust in the offer modal.';
    }
    if (propertyRent === tenantMaxBudget) {
      return 'Perfect match: your price equals their max budget.';
    }

    const diff = propertyRent - tenantMaxBudget;
    const suggested = Math.max(0, tenantMaxBudget);
    if (propertyRent <= tenantMaxBudget * 1.1) {
      return `Slightly above their budget by ${diff.toLocaleString('pl-PL')} PLN. Consider lowering to ${suggested.toLocaleString('pl-PL')} PLN.`;
    }
    return `Above their budget by ${diff.toLocaleString('pl-PL')} PLN. Lower to ${suggested.toLocaleString('pl-PL')} PLN to be eligible.`;
  };

  const budgetSentence = deriveBudgetSentence();
  
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
    <div className="card-modern overflow-hidden p-4">

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
        <div className="flex items-start space-x-3 mb-4">
          {/* Request Type Icon and Title */}
          <div className="flex-shrink-0">
            <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
              {requestTypeInfo.icon}
            </div>
          </div>

          {/* Request Details */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{requestTypeInfo.title}</h3>
              {tenant.verified && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
            </div>

            {/* Request Type Subtitle */}
            <div className="mb-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {requestTypeInfo.subtitle}
              </span>
            </div>

            {/* For Business Requests: Show occupants */}
            {isBusinessRequest && organization && (
              <div className="mb-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Company:</span> {organization.name}
                </p>
                {tenantGroupMembers.length > 0 && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Occupants:</span> {tenantGroupMembers.map(member => 
                      `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.trim()
                    ).filter(name => name).join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* For Group Requests: Show member profiles */}
            {isGroupRequest && tenantGroupMembers.length > 1 && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Group Members:</span>
                </p>
                <div className="flex items-center space-x-2">
                  {tenantGroupMembers.slice(0, 3).map((member, index) => (
                    <div key={member.id} className="flex items-center space-x-1">
                      {member.user?.profileImage ? (
                        <img
                          src={member.user.profileImage.startsWith('http') ? member.user.profileImage : `http://localhost:3001/uploads/profile_images/${member.user.profileImage}`}
                          alt={`${member.user?.firstName || 'Member'} ${member.user?.lastName || ''}`}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-xs text-gray-600">
                            {member.user?.firstName?.charAt(0) || 'M'}
                          </span>
                        </div>
                      )}
                      {index < 2 && <span className="text-gray-400">•</span>}
                    </div>
                  ))}
                  {tenantGroupMembers.length > 3 && (
                    <span className="text-sm text-gray-500 font-medium">
                      +{tenantGroupMembers.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* For Individual Requests: Show traditional tenant info */}
            {!isBusinessRequest && !isGroupRequest && (
              <>
                {/* Rating and Rank */}
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
                  {/* Rank Badge */}
                  {tenantRank && tenantRank.rankInfo ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {tenantRank.rankInfo.icon || '⭐'} {tenantRank.rankInfo.name || 'New User'}
                    </span>
                  ) : tenant.rank ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {tenant.rank.icon || '⭐'} {tenant.rank.name || 'New User'}
                    </span>
                  ) : rankLoading ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600 mr-1"></div>
                      Loading...
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      ⭐ New User
                    </span>
                  )}
                </div>

                {/* Simple Review Link */}
                <div className="mb-4">
                  <button 
                    onClick={() => {
                      setShowReviewsModal(true);
                      fetchTenantReviews();
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium underline flex items-center space-x-1"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>View reviews from previous landlords</span>
                  </button>
                </div>
              </>
            )}


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
                Phone: {maskPhone(tenant.phone)}
              </div>
            </div>

            {/* For Business Requests: Show additional company info */}
            {isBusinessRequest && organization && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                  </svg>
                  <span className="text-sm font-medium text-blue-800">Company Information</span>
                </div>
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Company:</span> {organization.name}
                </p>
                {tenantGroupMembers.length > 0 && (
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Primary Contact:</span> {tenantGroupMembers.find(m => m.isPrimary)?.user?.firstName || ''} {tenantGroupMembers.find(m => m.isPrimary)?.user?.lastName || ''}
                  </p>
                )}
              </div>
            )}

            {/* For Group Requests: Show group leader info */}
            {isGroupRequest && tenantGroupMembers.length > 1 && (
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <span className="text-sm font-medium text-purple-800">Group Information</span>
                </div>
                <p className="text-sm text-purple-700">
                  <span className="font-medium">Group Leader:</span> {tenantGroupMembers.find(m => m.isPrimary)?.user?.firstName || ''} {tenantGroupMembers.find(m => m.isPrimary)?.user?.lastName || ''}
                </p>
                <p className="text-sm text-purple-700">
                  <span className="font-medium">Total Members:</span> {tenantGroupMembers.length}
                </p>
              </div>
            )}

            {/* Demographics and Preferences */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {isBusinessRequest ? 'Company Type' : isGroupRequest ? 'Group Size' : 'Age & Occupation'}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {isBusinessRequest ? 'Business' : 
                   isGroupRequest ? `${tenantGroupMembers.length} members` :
                   `${getDisplayAge(tenant.age)}${tenant.age && tenant.occupation && ', '}${getDisplayOccupation(tenant.occupation)}`}
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
            <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-4 text-sm">
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
              
              {/* Budget Analysis - One-line guidance */}
              <div className="bg-white bg-opacity-70 rounded-lg p-2 border border-green-200">
                <div className="grid grid-cols-3 gap-2 items-center text-sm">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Your Price</p>
                    <p className="text-lg font-bold text-gray-900">{tenant.propertyMatch.rent}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Analysis</p>
                    <p className="text-sm font-medium text-gray-700">{budgetSentence}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Their Max Budget</p>
                    <p className="text-lg font-bold text-green-600">{tenant.budgetTo ? `${tenant.budgetTo} PLN` : `${tenant.budget} PLN`}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tenant Requirements */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Tenant Requirements</h4>
              <p className="text-sm text-gray-600">{tenant.requirements}</p>
            </div>

            {/* Action Buttons or Status */}
            {(() => { const s = (tenant.status || 'active').toLowerCase(); return s === 'active' || s === 'pending'; })() ? (
              <div className="flex space-x-4">
                <button 
                  onClick={() => onSendOffer(tenant)}
                  className="btn-primary flex-1 inline-flex items-center justify-center"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send Offer
                </button>
                
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
                         ) : tenant.status?.toLowerCase() === 'accepted' ? (
               <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                 <div className="flex items-center justify-center space-x-2">
                   <svg className="h-5 w-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                   </svg>
                   <span className="text-purple-800 font-medium">Property rented - Request accepted</span>
                 </div>
                 <p className="text-sm text-purple-700 text-center mt-1">
                   Tenant has paid. Property is now locked.
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

       {/* Tenant Reviews Modal */}
       {showReviewsModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
             {/* Modal Header */}
             <div className="flex items-center justify-between p-6 border-b border-gray-200">
               <div className="flex items-center space-x-3">
                 <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                 </svg>
                 <div>
                   <h2 className="text-xl font-semibold text-gray-900">
                     Reviews for {tenant.name}
                   </h2>
                   <p className="text-sm text-gray-600">
                     Feedback from previous landlords
                   </p>
                 </div>
               </div>
               <button
                 onClick={() => setShowReviewsModal(false)}
                 className="text-gray-400 hover:text-gray-600 transition-colors"
               >
                 <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

             {/* Modal Content */}
             <div className="p-6">
               {reviewsLoading ? (
                 <div className="flex items-center justify-center py-8">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                   <span className="ml-3 text-gray-600">Loading reviews...</span>
                 </div>
               ) : tenantReviews.length > 0 ? (
                 <div className="space-y-4">
                   {tenantReviews.map((review) => (
                     <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                       <div className="flex items-start justify-between mb-3">
                         <div>
                           <h4 className="font-medium text-gray-900">{review.landlordName}</h4>
                           <p className="text-sm text-gray-600">{review.propertyName}</p>
                         </div>
                         <div className="text-right">
                           <div className="flex items-center space-x-1 mb-1">
                             {[1, 2, 3, 4, 5].map((star) => (
                               <svg
                                 key={star}
                                 className={`h-4 w-4 ${
                                   star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                 }`}
                                 fill="currentColor"
                                 viewBox="0 0 20 20"
                               >
                                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                               </svg>
                             ))}
                             <span className="text-sm font-medium text-gray-900 ml-1">{review.rating}</span>
                           </div>
                           <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                             {review.reviewStage}
                           </span>
                         </div>
                       </div>
                       <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
                       <p className="text-xs text-gray-500">Posted on {new Date(review.reviewDate).toLocaleDateString()}</p>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-8">
                   <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                   </svg>
                   <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                   <p className="text-gray-500">This tenant doesn't have any reviews from previous landlords yet.</p>
                 </div>
               )}
             </div>

             {/* Modal Footer */}
             <div className="flex items-center justify-end p-6 border-t border-gray-200">
               <button
                 onClick={() => setShowReviewsModal(false)}
                 className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
               >
                 Close
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default TenantRequestCard; 