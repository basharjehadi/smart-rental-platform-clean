import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ContractViewer from '../components/ContractViewer';
import PropertyMediaViewer from '../components/PropertyMediaViewer';

const MyOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingOffer, setUpdatingOffer] = useState(null);
  const [contractEligibility, setContractEligibility] = useState({});
  const [expandedOffers, setExpandedOffers] = useState(new Set());
  const [showPaymentGatewayModal, setShowPaymentGatewayModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedPaymentGateway, setSelectedPaymentGateway] = useState('');
  const [showContractPreviewModal, setShowContractPreviewModal] = useState(false);
  const [contractPreviewHtml, setContractPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showSignContractModal, setShowSignContractModal] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [signingContract, setSigningContract] = useState(false);

  const { api } = useAuth();
  const navigate = useNavigate();

  // Fetch offers on component mount
  useEffect(() => {
    fetchOffers();
  }, []);

  // Refresh offers when page is focused (e.g., after payment)
  useEffect(() => {
    const handleFocus = () => {
      fetchOffers();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching my offers...');
      const response = await api.get('/offers/my');
      console.log('Offers response:', response.data);
      
      const offersData = response.data.offers || response.data || [];
      
      // Show all offers (PENDING, ACCEPTED, REJECTED, PAID)
      const filteredOffers = offersData.filter(offer => 
        offer.status === 'PENDING' || offer.status === 'ACCEPTED' || offer.status === 'REJECTED' || offer.status === 'PAID'
      );
      
      console.log('All offers:', offersData);
      console.log('Filtered offers:', filteredOffers);
      console.log('Offer statuses:', filteredOffers.map(o => ({ id: o.id, status: o.status, paymentIntentId: o.paymentIntentId })));
      
      setOffers(filteredOffers);
      
      // Check contract eligibility for accepted and paid offers
      const eligibilityChecks = {};
      for (const offer of filteredOffers) {
        try {
          const eligibilityResponse = await api.get(`/contracts/${offer.rentalRequestId}/eligibility`);
          eligibilityChecks[offer.rentalRequestId] = eligibilityResponse.data;
          console.log(`Contract eligibility for offer ${offer.id}:`, eligibilityResponse.data);
        } catch (error) {
          console.error('Error checking contract eligibility:', error);
          eligibilityChecks[offer.rentalRequestId] = { canGenerate: false, reason: 'Error checking eligibility' };
        }
      }
      setContractEligibility(eligibilityChecks);
      
    } catch (error) {
      console.error('Error fetching offers:', error);
      setError(error.response?.data?.error || 'Failed to fetch offers');
    } finally {
      setLoading(false);
    }
  };

  const handleOfferAction = async (offerId, status) => {
    try {
      setUpdatingOffer(offerId);
      
      if (status === 'ACCEPTED') {
        // Show payment gateway selection modal
        const offer = offers.find(o => o.id === offerId);
        setSelectedOffer(offer);
        setShowPaymentGatewayModal(true);
        setUpdatingOffer(null);
        return;
      }
      
      console.log(`Updating offer ${offerId} to status: ${status}`);
      const response = await api.put(`/offers/${offerId}/status`, {
        status: status
      });
      
      console.log('Offer updated successfully:', response.data);
      
      // Refresh the offers list
      await fetchOffers();
      
    } catch (error) {
      console.error('Error updating offer:', error);
      setError(error.response?.data?.error || 'Failed to update offer');
    } finally {
      setUpdatingOffer(null);
    }
  };

  const handleAcceptOfferWithPaymentGateway = async () => {
    if (!selectedPaymentGateway) {
      setError('Please select a payment method');
      return;
    }

    try {
      setUpdatingOffer(selectedOffer.id);
      
      console.log(`Accepting offer ${selectedOffer.id} with payment gateway: ${selectedPaymentGateway}`);
      const response = await api.put(`/offers/${selectedOffer.id}/status`, {
        status: 'ACCEPTED',
        preferredPaymentGateway: selectedPaymentGateway
      });
      
      console.log('Offer accepted successfully:', response.data);
      
      // Close modal and reset state
      setShowPaymentGatewayModal(false);
      setSelectedOffer(null);
      setSelectedPaymentGateway('');
      
      // Refresh the offers list
      await fetchOffers();
      
    } catch (error) {
      console.error('Error accepting offer:', error);
      setError(error.response?.data?.error || 'Failed to accept offer');
    } finally {
      setUpdatingOffer(null);
    }
  };

  const handleCancelPaymentGatewaySelection = () => {
    setShowPaymentGatewayModal(false);
    setSelectedOffer(null);
    setSelectedPaymentGateway('');
    setUpdatingOffer(null);
  };

  const handlePreviewContract = async (offerId) => {
    try {
      setPreviewLoading(true);
      setShowContractPreviewModal(true);
      setContractPreviewHtml('');

      console.log('🔍 Previewing contract for offer:', offerId);
      const response = await api.get(`/contracts/preview/${offerId}`, {
        responseType: 'text'
      });

      setContractPreviewHtml(response.data);
      console.log('✅ Contract preview loaded successfully');

    } catch (error) {
      console.error('❌ Error previewing contract:', error);
      setError(error.response?.data?.error || 'Failed to load contract preview');
      setShowContractPreviewModal(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCloseContractPreview = () => {
    setShowContractPreviewModal(false);
    setContractPreviewHtml('');
    setPreviewLoading(false);
  };

  const handleSignContract = (contractId) => {
    setSelectedContractId(contractId);
    setShowSignContractModal(true);
  };

  const handleConfirmSignContract = async () => {
    try {
      setSigningContract(true);
      
      console.log('✍️ Signing contract:', selectedContractId);
      const response = await api.post(`/contracts/sign/${selectedContractId}`);
      
      console.log('✅ Contract signed successfully:', response.data);
      
      // Refresh offers to update the UI
      await fetchOffers();
      
      // Close modal and reset state
      setShowSignContractModal(false);
      setSelectedContractId(null);
      setSigningContract(false);
      
      // Show success message
      setSuccess('Contract signed successfully!');
      
    } catch (error) {
      console.error('❌ Error signing contract:', error);
      setError(error.response?.data?.error || 'Failed to sign contract');
      setSigningContract(false);
    }
  };

  const handleCancelSignContract = () => {
    setShowSignContractModal(false);
    setSelectedContractId(null);
    setSigningContract(false);
  };

  const handleViewContract = async (rentalRequestId) => {
    try {
      const response = await api.get(`/contracts/${rentalRequestId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rental-contract-${rentalRequestId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading contract:', error);
      setError('Failed to download contract. Please try again.');
    }
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: {
        className: 'bg-yellow-100 text-yellow-800',
        text: 'Pending'
      },
      ACCEPTED: {
        className: 'bg-green-100 text-green-800',
        text: 'Accepted'
      },
      REJECTED: {
        className: 'bg-red-100 text-red-800',
        text: 'Rejected'
      },
      PAID: {
        className: 'bg-blue-100 text-blue-800',
        text: 'Paid'
      }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const renderPropertyInfo = (offer) => {
    const hasPropertyInfo = offer.propertyAddress || offer.propertyImages || offer.propertyVideo || offer.propertyType || offer.propertySize || offer.propertyAmenities || offer.propertyDescription;
    
    if (!hasPropertyInfo) {
      return null;
    }

    const isExpanded = expandedOffers.has(offer.id);

    return (
      <div className="mb-4">
        <button
          onClick={() => {
            const newExpanded = new Set(expandedOffers);
            if (isExpanded) {
              newExpanded.delete(offer.id);
            } else {
              newExpanded.add(offer.id);
            }
            setExpandedOffers(newExpanded);
          }}
          className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <span className="text-sm font-medium text-blue-900">
            📷 View Property Details
          </span>
          <svg 
            className={`w-4 h-4 text-blue-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isExpanded && (
          <div className="mt-3">
            <PropertyMediaViewer
              propertyImages={offer.propertyImages}
              propertyVideo={offer.propertyVideo}
              propertyAddress={offer.propertyAddress}
              propertyType={offer.propertyType}
              propertySize={offer.propertySize}
              propertyAmenities={offer.propertyAmenities}
              propertyDescription={offer.propertyDescription}
            />
          </div>
        )}
      </div>
    );
  };

  const renderHouseRules = (offer) => {
    const hasRules = offer.rulesText || offer.rulesPdf;
    
    if (!hasRules) {
      return null;
    }

    return (
      <div className="mb-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium text-amber-800 mb-2">
                🏠 House Rules
              </h4>
              
              {/* Rules Text */}
              {offer.rulesText && (
                <div className="mb-3">
                  <div className="bg-white border border-amber-200 rounded-md p-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {offer.rulesText}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Rules PDF */}
              {offer.rulesPdf && (
                <div className="mb-3">
                  <a
                    href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/rules/${offer.rulesPdf}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 border border-amber-300 rounded-md text-sm font-medium text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Rules Document
                  </a>
                  <p className="text-xs text-amber-600 mt-1">
                    Opens in new tab • {offer.rulesPdf.split('.').pop().toUpperCase()} file
                  </p>
                </div>
              )}
              
              {/* Warning Message */}
              <div className="bg-amber-100 border border-amber-300 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-2">
                    <p className="text-sm text-amber-800 font-medium">
                      ⚠️ By accepting this offer, you agree to follow the house rules provided by the landlord.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading offers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Offers</h1>
          <p className="mt-2 text-gray-600">Manage your rental offers and applications</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {offers.length > 0 ? (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div key={offer.id} className="bg-white rounded-lg shadow p-6">
                {/* Offer Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{offer.rentalRequest.title}</h4>
                    <p className="text-gray-600">{offer.rentalRequest.location}</p>
                  </div>
                  {getStatusBadge(offer.status)}
                </div>

                {/* Property Information */}
                {renderPropertyInfo(offer)}

                {/* House Rules */}
                {renderHouseRules(offer)}

                {/* Offer Details */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500">Monthly Rent:</span>
                    <span className="ml-2 font-medium">{formatCurrency(offer.rentAmount)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Deposit:</span>
                    <span className="ml-2 font-medium">{formatCurrency(offer.depositAmount || 0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Lease Duration:</span>
                    <span className="ml-2 font-medium">{offer.leaseDuration} months</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Available From:</span>
                    <span className="ml-2 font-medium">{formatDate(offer.availableFrom)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                {offer.status === 'PENDING' && (
                  <div className="space-y-2">
                    <div className="text-center text-sm text-blue-600 font-medium mb-3">
                      New offer received! Please review and take action.
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleOfferAction(offer.id, 'ACCEPTED')}
                        disabled={updatingOffer === offer.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {updatingOffer === offer.id ? 'Accepting...' : 'Accept Offer'}
                      </button>
                      <button
                        onClick={() => handleOfferAction(offer.id, 'REJECTED')}
                        disabled={updatingOffer === offer.id}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {updatingOffer === offer.id ? 'Rejecting...' : 'Reject Offer'}
                      </button>
                    </div>
                  </div>
                )}

                {offer.status === 'ACCEPTED' && (
                  <div className="space-y-2">
                    {/* Show house rules again before payment */}
                    {renderHouseRules(offer)}
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handlePreviewContract(offer.id)}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Preview Contract
                      </button>
                      <button
                        onClick={() => navigate(`/payment/${offer.id}`)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Pay Deposit + First Month
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Total: {formatCurrency((offer.depositAmount || 0) + (offer.rentAmount || 0))}
                    </p>
                  </div>
                )}

                {offer.status === 'PAID' && (
                  <div className="space-y-2">
                    <div className="text-center text-sm text-green-600 font-medium">
                      Payment completed on {formatDate(offer.updatedAt)}
                    </div>
                    
                    {/* Contract Status and Actions */}
                    {contractEligibility[offer.rentalRequestId]?.contractId ? (
                      <div className="space-y-3">
                        {/* Sign Contract Section */}
                        {!contractEligibility[offer.rentalRequestId]?.signedAt ? (
                          <div className="space-y-2">
                            <div className="text-center text-sm text-blue-600 font-medium">
                              Contract is ready for digital signature
                            </div>
                            <button
                              onClick={() => handleSignContract(contractEligibility[offer.rentalRequestId].contractId)}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              Sign Contract
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-center text-sm text-green-600 font-medium bg-green-50 p-2 rounded">
                              ✅ Contract signed on {formatDate(contractEligibility[offer.rentalRequestId].signedAt)}
                            </div>
                            {/* Download Signed Contract Button */}
                            <a
                              href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/contracts/download/${contractEligibility[offer.rentalRequestId].contractId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              📄 Download Signed Contract
                            </a>
                          </div>
                        )}
                        
                        {/* Download Contract Button (for unsigned contracts) */}
                        {!contractEligibility[offer.rentalRequestId]?.signedAt && (
                          <button
                            onClick={() => handleViewContract(offer.rentalRequestId)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Rental Contract
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-sm text-gray-500 bg-gray-50 p-2 rounded">
                        {contractEligibility[offer.rentalRequestId]?.reason || 'Contract not available yet'}
                      </div>
                    )}
                  </div>
                )}

                {/* Offer Footer */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>From: {offer.landlord.name}</span>
                    <span>{formatDate(offer.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No offers found</h3>
            <p className="text-gray-600">You haven't received any offers for your rental requests yet.</p>
          </div>
        )}
      </div>

      {/* Payment Gateway Selection Modal */}
      {showPaymentGatewayModal && selectedOffer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="mt-2 text-center">
                <h3 className="text-lg font-medium text-gray-900">Select Payment Method</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500 mb-4">
                    Choose your preferred payment method for this offer:
                  </p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method *
                    </label>
                    <select
                      value={selectedPaymentGateway}
                      onChange={(e) => setSelectedPaymentGateway(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a payment method</option>
                      <option value="STRIPE">Stripe</option>
                      <option value="PAYU">PayU</option>
                      <option value="P24">Przelewy24 (P24)</option>
                      <option value="TPAY">Tpay</option>
                    </select>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                    <p className="font-medium mb-1">Offer Details:</p>
                    <p>Rent: {formatCurrency(selectedOffer.rentAmount)}</p>
                    <p>Deposit: {formatCurrency(selectedOffer.depositAmount || 0)}</p>
                    <p>Total: {formatCurrency((selectedOffer.depositAmount || 0) + selectedOffer.rentAmount)}</p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={handleCancelPaymentGatewaySelection}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAcceptOfferWithPaymentGateway}
                  disabled={!selectedPaymentGateway || updatingOffer === selectedOffer.id}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingOffer === selectedOffer.id ? 'Accepting...' : 'Accept Offer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contract Preview Modal */}
      {showContractPreviewModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white" style={{ maxHeight: '90vh' }}>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Contract Preview</h3>
                <button
                  onClick={handleCloseContractPreview}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="border-t pt-4">
                {previewLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading contract preview...</p>
                  </div>
                ) : (
                  <div 
                    className="overflow-y-auto" 
                    style={{ maxHeight: '70vh' }}
                    dangerouslySetInnerHTML={{ __html: contractPreviewHtml }}
                  />
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCloseContractPreview}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contract Signing Confirmation Modal */}
      {showSignContractModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div className="mt-2 text-center">
                <h3 className="text-lg font-medium text-gray-900">Sign Contract</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500 mb-4">
                    Are you sure you want to digitally sign this rental contract?
                  </p>
                  <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                    <p className="font-medium mb-1">Digital Signature Details:</p>
                    <p>• This creates a legal digital signature</p>
                    <p>• Timestamp will be recorded</p>
                    <p>• Contract becomes legally binding</p>
                    <p>• Cannot be undone once signed</p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={handleCancelSignContract}
                  disabled={signingContract}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSignContract}
                  disabled={signingContract}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signingContract ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing...
                    </div>
                  ) : (
                    'Sign Contract'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOffers; 