import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ContractViewer from '../components/ContractViewer';

const MyOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingOffer, setUpdatingOffer] = useState(null);
  const [contractEligibility, setContractEligibility] = useState({});

  const { api } = useAuth();
  const navigate = useNavigate();

  // Fetch offers on component mount
  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching my offers...');
      const response = await api.get('/offers/my');
      console.log('Offers response:', response.data);
      
      const offersData = response.data.offers || response.data || [];
      setOffers(offersData);
      
      // Check contract eligibility for accepted offers
      const eligibilityChecks = {};
      for (const offer of offersData) {
        if (offer.status === 'ACCEPTED' || offer.status === 'PAID') {
          try {
            const eligibilityResponse = await api.get(`/contracts/${offer.rentalRequestId}/eligibility`);
            eligibilityChecks[offer.rentalRequestId] = eligibilityResponse.data;
          } catch (error) {
            console.error('Error checking contract eligibility:', error);
            eligibilityChecks[offer.rentalRequestId] = { canGenerate: false, reason: 'Error checking eligibility' };
          }
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
    if (!offer.propertyAddress) return null;

    const propertyImages = offer.propertyImages ? JSON.parse(offer.propertyImages) : [];
    const propertyAmenities = offer.propertyAmenities ? JSON.parse(offer.propertyAmenities) : [];

    return (
      <div className="mb-6 border-t pt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Property Information</h4>
        
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-700">Address:</span>
            <p className="text-sm text-gray-600">{offer.propertyAddress}</p>
          </div>
          
          {offer.propertyType && (
            <div>
              <span className="text-sm font-medium text-gray-700">Type:</span>
              <span className="text-sm text-gray-600 ml-2">{offer.propertyType}</span>
            </div>
          )}
          
          {offer.propertySize && (
            <div>
              <span className="text-sm font-medium text-gray-700">Size:</span>
              <span className="text-sm text-gray-600 ml-2">{offer.propertySize}</span>
            </div>
          )}
          
          {propertyAmenities.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-700">Amenities:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {propertyAmenities.map((amenity, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {propertyImages.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-700">Images:</span>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {propertyImages.slice(0, 6).map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Property ${index + 1}`}
                      className="w-full h-20 object-cover rounded border cursor-pointer"
                      onClick={() => window.open(imageUrl, '_blank')}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    {index === 5 && propertyImages.length > 6 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-xs font-medium rounded">
                        +{propertyImages.length - 6}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {propertyImages.length > 6 && (
                <button
                  onClick={() => {
                    const imageUrls = propertyImages.join('\n');
                    const newWindow = window.open();
                    newWindow.document.write(`
                      <html>
                        <head><title>Property Images</title></head>
                        <body style="margin: 0; padding: 20px; background: #f5f5f5;">
                          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                            ${propertyImages.map(url => `
                              <img src="${url}" style="width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
                            `).join('')}
                          </div>
                        </body>
                      </html>
                    `);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                >
                  View all {propertyImages.length} images →
                </button>
              )}
            </div>
          )}
          
          {offer.propertyVideo && (
            <div>
              <span className="text-sm font-medium text-gray-700">Video:</span>
              <div className="mt-2">
                <video
                  src={offer.propertyVideo}
                  controls
                  className="w-full h-48 object-cover rounded border"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div style={{ display: 'none' }} className="text-sm text-gray-500 mt-1">
                  Video not available. <a href={offer.propertyVideo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">Try direct link →</a>
                </div>
              </div>
            </div>
          )}
          
          {offer.propertyDescription && (
            <div>
              <span className="text-sm font-medium text-gray-700">Description:</span>
              <p className="text-sm text-gray-600 mt-1">{offer.propertyDescription}</p>
            </div>
          )}
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

        {offers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No offers found</h3>
            <p className="text-gray-600">You haven't received any offers yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <div key={offer.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {offer.rentalRequest.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {offer.rentalRequest.location}
                    </p>
                  </div>
                  {getStatusBadge(offer.status)}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rent:</span>
                    <span className="font-semibold">{formatCurrency(offer.rentAmount)}</span>
                  </div>
                  {offer.depositAmount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deposit:</span>
                      <span className="font-semibold">{formatCurrency(offer.depositAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-semibold">{offer.leaseDuration} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available:</span>
                    <span className="font-semibold">{formatDate(offer.availableFrom)}</span>
                  </div>
                </div>

                {offer.description && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Landlord's Message:</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {offer.description}
                    </p>
                  </div>
                )}

                {/* Property Information */}
                {renderPropertyInfo(offer)}

                {offer.status === 'PENDING' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleOfferAction(offer.id, 'ACCEPTED')}
                      disabled={updatingOffer === offer.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {updatingOffer === offer.id ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleOfferAction(offer.id, 'REJECTED')}
                      disabled={updatingOffer === offer.id}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {updatingOffer === offer.id ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                )}

                {offer.status === 'ACCEPTED' && !offer.paymentIntentId && (
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate(`/payment/${offer.id}`)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Pay Deposit
                    </button>
                  </div>
                )}

                {offer.status === 'ACCEPTED' && offer.paymentIntentId && (
                  <div className="space-y-2">
                    <div className="text-center text-sm text-green-600 font-medium">
                      Payment completed on {formatDate(offer.updatedAt)}
                    </div>
                    {contractEligibility[offer.rentalRequestId]?.canGenerate ? (
                      <button
                        onClick={() => handleViewContract(offer.rentalRequestId)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Contract
                      </button>
                    ) : (
                      <div className="text-center text-sm text-gray-500 bg-gray-50 p-2 rounded">
                        {contractEligibility[offer.rentalRequestId]?.reason || 'Contract not available yet'}
                      </div>
                    )}
                  </div>
                )}

                {offer.status === 'PAID' && (
                  <div className="space-y-2">
                    <div className="text-center text-sm text-blue-600 font-medium">
                      PAID
                    </div>
                    {contractEligibility[offer.rentalRequestId]?.canGenerate ? (
                      <button
                        onClick={() => handleViewContract(offer.rentalRequestId)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Contract
                      </button>
                    ) : (
                      <div className="text-center text-sm text-gray-500 bg-gray-50 p-2 rounded">
                        {contractEligibility[offer.rentalRequestId]?.reason || 'Contract not available yet'}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>From: {offer.landlord.name}</span>
                    <span>{formatDate(offer.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOffers; 