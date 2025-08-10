import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Shield, CreditCard, Building, Wallet, MessageCircle, RefreshCw, Home, MapPin, Calendar, User, HelpCircle } from 'lucide-react';

const PaymentPage = () => {
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('credit-card');
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '1234 5678 9012 3456',
    cardholderName: 'Anna Kowalski',
    expiryDate: '',
    cvv: '123'
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [processingStep, setProcessingStep] = useState(1);
  
  const { api } = useAuth();
  const navigate = useNavigate();
  const { offerId } = useParams();
  const location = useLocation();

  useEffect(() => {
    if (offerId) {
      fetchOfferById(offerId);
    } else if (location.state?.offer) {
      setOffer(location.state.offer);
      setLoading(false);
      // If coming from PropertyDetailsView, refresh the offer data to get updated status
      if (location.state.fromPropertyDetails) {
        fetchOfferById(location.state.offer.id);
      }
    } else {
      fetchAcceptedOffer();
    }
  }, [offerId, location.state]);

  const fetchOfferById = async (id) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get(`/tenant/offer/${id}`);
      const offerData = response.data.offer;
      
      if (offerData) {
        setOffer(offerData);
      } else {
        setError('Offer not found. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching offer:', error);
      setError('Failed to fetch offer details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAcceptedOffer = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tenant/offers');
      const acceptedOffer = response.data.offers.find(o => o.status === 'ACCEPTED');
      
      if (acceptedOffer) {
        setOffer(acceptedOffer);
      } else {
        setError('No accepted offer found. Please accept an offer first.');
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      setError('Failed to fetch offers');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handleInputChange = (field, value) => {
    setPaymentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePaySecurely = async () => {
    if (!agreedToTerms) {
      alert('Please agree to the Terms of Service and Safety Protection Policy.');
      return;
    }

    console.log('Starting payment process for offer:', offer?.id);
    console.log('Current offer status:', offer?.status);

    setIsProcessing(true);
    setShowProcessingModal(true);
    setProcessingStep(1);

    try {
      console.log('Step 1: Payment authorized - starting...');
      // Step 1: Payment authorized
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProcessingStep(2);
      console.log('Step 1: Payment authorized - completed');

      console.log('Step 2: Funds moved to secure escrow - starting...');
      // Step 2: Funds moved to secure escrow
      await new Promise(resolve => setTimeout(resolve, 2000));
      setProcessingStep(3);
      console.log('Step 2: Funds moved to secure escrow - completed');

      console.log('Step 3: Confirming with landlord - starting...');
      // Step 3: Confirming with landlord
      await new Promise(resolve => setTimeout(resolve, 2500));
      console.log('Step 3: Confirming with landlord - completed');
      
          console.log('Updating offer status to PAID...');
      // Update offer status to paid with payment timestamp
      const paymentTimestamp = new Date().toISOString();
      const response = await api.patch(`/tenant/offer/${offer.id}`, { 
            status: 'PAID',
        paymentDate: paymentTimestamp
      });
      console.log('Offer status update response:', response.data);
      
      // Close modal and navigate to success page
      setShowProcessingModal(false);
      console.log('Navigating to payment success page...');
      navigate('/payment-success', { 
        state: { 
          offer: offer
        } 
      });
    } catch (error) {
      console.error('Payment error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      setShowProcessingModal(false);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

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

  // Get property type display name
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

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
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

  // Calculate first month rent (prorated only if not moving in on the 1st)
  const calculateFirstMonthRent = () => {
    if (!offer.availableFrom || !offer.rentAmount) return 0;
    
    const moveInDate = new Date(offer.availableFrom);
    const moveInDay = moveInDate.getDate();
    
    // If moving in on the 1st of the month, it's a full month
    if (moveInDay === 1) {
      return offer.rentAmount;
    }
    
    // Otherwise, calculate prorated amount
    const daysInMonth = new Date(moveInDate.getFullYear(), moveInDate.getMonth() + 1, 0).getDate();
    const daysFromMoveIn = daysInMonth - moveInDay + 1; // Days from move-in to end of month
    
    return Math.round((offer.rentAmount * daysFromMoveIn) / daysInMonth);
  };

  // Check if first month is prorated
  const isFirstMonthProrated = () => {
    if (!offer.availableFrom) return false;
    const moveInDate = new Date(offer.availableFrom);
    return moveInDate.getDate() !== 1;
  };

  const firstMonthRent = calculateFirstMonthRent();
  const securityDeposit = offer.depositAmount || offer.rentAmount || 0;
  const totalAmount = firstMonthRent + securityDeposit;
  const serviceFee = Math.round(totalAmount * 0.03); // 3% service fee
  const finalTotal = totalAmount + serviceFee;

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
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
              <h1 className="text-xl font-semibold text-gray-900">Complete Your Payment</h1>
              <p className="text-sm text-gray-600">Secure your rental with our 100% protected payment system</p>
            </div>
          </div>
        </div>
      </header>

      {/* Top Banner */}
      <div className="bg-green-50 border-b border-green-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="flex items-center space-x-2 text-green-700">
              <MessageCircle className="w-4 h-4" />
              <div>
                <div className="font-medium">24/7 Support</div>
                <div className="text-xs">Expert help when you need it</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-green-700">
              <RefreshCw className="w-4 h-4" />
              <div>
                <div className="font-medium">Easy Disputes</div>
                <div className="text-xs">Simple resolution process</div>
          </div>
          </div>
            <div className="flex items-center space-x-2 text-green-700">
              <Home className="w-4 h-4" />
              <div>
                <div className="font-medium">How it works</div>
                <div className="text-xs">Your payment is held in secure escrow. After check-in, you have 24 hours to report any issues. If the property doesn't match what was advertised, we'll help resolve the issue or provide a full refund.</div>
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Payment Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Protection Card */}
            <div className="card-modern border-green-200 bg-green-50">
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Shield className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-green-900">Your Payment is 100% Protected</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 font-bold">$</span>
                    </div>
                    <div>
                      <div className="font-medium text-green-900">Secure Escrow</div>
                      <div className="text-sm text-green-700">Money held safely until check-in</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 font-bold">24h</span>
                    </div>
                    <div>
                      <div className="font-medium text-green-900">24h Protection</div>
                      <div className="text-sm text-green-700">Full refund if property differs</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-green-900">24/7 Support</div>
                      <div className="text-sm text-green-700">Expert help when you need it</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-green-900">Easy Disputes</div>
                      <div className="text-sm text-green-700">Simple resolution process</div>
                    </div>
                  </div>
          </div>
                <div className="border-t border-green-200 pt-4">
                  <p className="text-sm text-green-800">
                    <strong>How it works:</strong> Your payment is held in secure escrow. After check-in, you have 24 hours to report any issues. If the property doesn't match what was advertised, we'll help resolve the issue or provide a full refund.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="card-modern">
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Choose Payment Method</h2>
          </div>

                {/* Payment Method Options */}
                <div className="grid grid-cols-3 gap-4 mb-6">
          <button
                    onClick={() => handlePaymentMethodChange('credit-card')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      selectedPaymentMethod === 'credit-card'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-5 h-5 text-gray-600" />
                      <span className="font-medium">Credit Card</span>
                    </div>
          </button>
                  
                  <button
                    onClick={() => handlePaymentMethodChange('bank-transfer')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      selectedPaymentMethod === 'bank-transfer'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Building className="w-5 h-5 text-gray-600" />
                      <span className="font-medium">Bank Transfer</span>
        </div>
                  </button>
                  
                  <button
                    onClick={() => handlePaymentMethodChange('digital-wallet')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      selectedPaymentMethod === 'digital-wallet'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Wallet className="w-5 h-5 text-gray-600" />
                      <span className="font-medium">Digital Wallet</span>
      </div>
                  </button>
    </div>

                {/* Credit Card Form */}
                {selectedPaymentMethod === 'credit-card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                      <input
                        type="text"
                        value={paymentForm.cardNumber}
                        onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                        <input
                          type="text"
                          value={paymentForm.cardholderName}
                          onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Anna Kowalski"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                          <input
                            type="text"
                            value={paymentForm.expiryDate}
                            onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="MM/YY"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                          <input
                            type="text"
                            value={paymentForm.cvv}
                            onChange={(e) => handleInputChange('cvv', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="123"
                          />
                        </div>
          </div>
        </div>
      </div>
                )}
              </div>
            </div>

            {/* Payment Protection Steps */}
            <div className="card-modern">
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Shield className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">How Your Payment is Protected</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">1</div>
                    <div>
                      <div className="font-medium text-gray-900">Payment goes to secure escrow</div>
                      <div className="text-sm text-gray-600">Your money is held safely, not sent to landlord immediately</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">2</div>
                    <div>
                      <div className="font-medium text-gray-900">You check in and inspect the property</div>
                      <div className="text-sm text-gray-600">Take your time to ensure everything matches the offer</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">3</div>
                    <div>
                      <div className="font-medium text-gray-900">24-hour protection window begins</div>
                      <div className="text-sm text-gray-600">Report any issues or get automatic release to landlord</div>
                    </div>
                  </div>
          </div>
        </div>
      </div>

            {/* Terms Agreement */}
            <div className="card-modern">
              <div className="p-6">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the Terms of Service and Safety Protection Policy. I understand that my payment is held in escrow and protected for 24 hours after check-in.
                  </span>
                </label>
              </div>
            </div>

            {/* Pay Securely Button */}
            <button
              onClick={handlePaySecurely}
              disabled={!agreedToTerms || isProcessing}
              className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shield className="w-5 h-5" />
              <span>{isProcessing ? 'Processing Payment...' : `Pay Securely - ${formatCurrency(finalTotal)}`}</span>
            </button>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            {/* Property Details */}
            <div className="card-modern">
              <div className="p-6">
                <div className="w-full h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {offer?.property?.images ? (
                    (() => {
                      try {
                        const images = typeof offer.property.images === 'string' ? JSON.parse(offer.property.images) : offer.property.images;
                        return images && images.length > 0 ? (
                          <img 
                            src={getImageUrl(images[0])} 
                            alt="Property" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Home className="w-8 h-8 text-gray-400" />
                        );
                      } catch (error) {
                        return <Home className="w-8 h-8 text-gray-400" />;
                      }
                    })()
                  ) : (
                    <Home className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {offer.propertyTitle || offer.property?.name || 'Modern apartment in central Warsaw'}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {getPropertyTypeDisplay(offer.property?.propertyType || offer.propertyType)}, {offer.property?.bedrooms || 2} rooms
                </p>
                <div className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium mb-4">
                  Accepted
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {(() => {
                        if (!offer.propertyAddress) return 'ul. Krakowska ***, Warszawa';
                        
                        // Format address to show only street, district, and city (privacy)
                        const parts = offer.propertyAddress.split(',').map(part => part.trim()).filter(part => part.length > 0);
                        
                        if (parts.length >= 3) {
                          // Extract street name (remove house number), postcode, and city
                          let street = parts[0];
                          const city = parts[2];
                          
                          // Remove house number from street (e.g., "Jarochowskiego 97/19" -> "Jarochowskiego")
                          street = street.replace(/\s+\d+.*$/, '');
                          
                          // Try to get district from property data if available
                          const district = offer.property?.district || '';
                          
                          return district ? `${street}, ${district}, ${city}` : `${street}, ${city}`;
                        } else if (parts.length === 2) {
                          // If only 2 parts, assume it's street and city
                          let street = parts[0];
                          const city = parts[1];
                          
                          // Remove house number from street
                          street = street.replace(/\s+\d+.*$/, '');
                          
                          return `${street}, ${city}`;
                        } else {
                          // If only 1 part, remove house number and return
                          let street = parts[0];
                          street = street.replace(/\s+\d+.*$/, '');
                          return street;
                        }
                      })()}
                    </span>
                    <span className="text-blue-600 text-xs">Protected</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Home className="w-4 h-4" />
                    <span>{offer.propertyAddress?.split(',')[2]?.trim() || 'Warszawa, Mokotów'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Move-in: {formatDate(offer.availableFrom)}</span>
          </div>
        </div>
      </div>
        </div>

        {/* Payment Breakdown */}
            <div className="card-modern">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
                    <span className="text-gray-600">
                      {isFirstMonthProrated() ? 'First month (prorated)' : 'First month rent'}
                    </span>
                    <span className="font-semibold">{formatCurrency(firstMonthRent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Security deposit</span>
                    <span className="font-semibold">{formatCurrency(securityDeposit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service fee</span>
                    <span className="font-semibold">{formatCurrency(serviceFee)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-900 font-semibold">Total amount</span>
                      <span className="text-green-600 font-bold">{formatCurrency(finalTotal)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-900">Protected by Escrow</span>
                  </div>
                  <p className="text-sm text-green-800">
                    This amount will be held safely in escrow and only released to the landlord 24 hours after your successful check-in.
                  </p>
                </div>
              </div>
            </div>

            {/* Landlord */}
            <div className="card-modern">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Landlord</h3>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {offer.landlord?.name?.split(' ').map(n => n.charAt(0)).join('') || 'J'}.***
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-blue-600">Verified landlord</div>
                  <div className="text-sm text-blue-600">Contact after payment</div>
                </div>
              </div>
            </div>

            {/* Need Help */}
            <div className="card-modern">
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <HelpCircle className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Need Help?</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Our support team is available 24/7 to help with your rental.
                </p>
                <button className="w-full text-blue-600 hover:text-blue-700 font-medium text-sm">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Processing Modal */}
      {showProcessingModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            {/* Loading Spinner */}
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Processing Your Payment
            </h2>
            
            {/* Description */}
            <p className="text-gray-600 text-center mb-6">
              Securing your rental and setting up escrow protection...
            </p>

            {/* Processing Steps */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  processingStep >= 1 ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  {processingStep >= 1 ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <span className={`text-sm ${processingStep >= 1 ? 'text-gray-900' : 'text-gray-500'}`}>
                  Payment authorized
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  processingStep >= 2 ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  {processingStep >= 2 ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <span className={`text-sm ${processingStep >= 2 ? 'text-gray-900' : 'text-gray-500'}`}>
                  Funds moved to secure escrow
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  processingStep >= 3 ? 'bg-blue-500' : 'bg-gray-300'
                }`}>
                  {processingStep >= 3 ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <span className={`text-sm ${processingStep >= 3 ? 'text-gray-900' : 'text-gray-500'}`}>
                  Confirming with landlord...
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage; 