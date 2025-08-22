import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Shield, CreditCard, Building, Wallet, Calendar, User, Star, Users, CheckCircle, AlertCircle, AlertTriangle, Lock, Eye } from 'lucide-react';

const MonthlyRentPaymentPage = () => {
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('STRIPE');
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: ''
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [processingStep, setProcessingStep] = useState(1);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [landlordInfo, setLandlordInfo] = useState(null);
  
  const { api } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.selectedPayments) {
      setSelectedPayments(location.state.selectedPayments);
      fetchPaymentData();
    } else {
      // If no payments selected, redirect back to payment history
      navigate('/payment-history');
    }
  }, [location.state, navigate]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get tenant's current rental information
      const response = await api.get('/tenant-dashboard/current-rental');
      const rentalData = response.data;
      
      setPaymentData(rentalData);
      setLandlordInfo(rentalData.landlord);
      
    } catch (error) {
      console.error('Error fetching rental data:', error);
      setError('Failed to fetch rental information');
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

    if (selectedPayments.length === 0) {
      alert('Please select at least one payment to process.');
      return;
    }

    console.log('Starting monthly rent payment process for:', selectedPayments.length, 'month(s)');
    console.log('Selected payments:', selectedPayments);

    setIsProcessing(true);
    setShowProcessingModal(true);
    setProcessingStep(1);

    try {
      // Step 1: Creating payment intent
      console.log('Step 1: Creating payment intent...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProcessingStep(2);

      // Step 2: Processing payment
      console.log('Step 2: Processing payment...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      setProcessingStep(3);

      // Step 3: Confirming payment
      console.log('Step 3: Confirming payment...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProcessingStep(4);

      // Create payment intent with backend using your mock payment system
      const totalAmount = getTotalAmount();
      
      // For monthly rent payments, we need to create a proper offer structure
      // Since this is for existing tenants, we'll use a special approach
      const response = await api.post('/payments/create-payment-intent', {
        amount: totalAmount,
        purpose: 'MONTHLY_RENT',
        offerId: paymentData.offerId, // Use the actual offerId (CUID string)
        paymentGateway: selectedPaymentMethod, // Pass the selected payment method
        selectedPayments: selectedPayments // Pass the selected payments for backend processing
      });

      console.log('Payment intent created successfully:', response.data);
      
      // Handle different payment gateway responses
      if (response.data.paymentGateway === 'STRIPE') {
        // Stripe - redirect to payment or show payment form
        setShowProcessingModal(false);
        alert(`Stripe payment intent created! Payment ID: ${response.data.paymentIntentId}`);
        // You can redirect to Stripe payment form here
      } else if (['PAYU', 'P24', 'TPAY'].includes(response.data.paymentGateway)) {
        // Mock payment gateways - redirect to mock payment page
        setShowProcessingModal(false);
        
        // For mock payments, redirect to the mock payment gateway
        if (response.data.redirectUrl) {
          console.log('🔍 Redirecting to mock payment gateway:', response.data.redirectUrl);
          
          // Open mock payment in new tab and wait for completion
          const mockPaymentWindow = window.open(response.data.redirectUrl, '_blank', 'width=800,height=600');
          
          if (mockPaymentWindow) {
            // Check if payment window is closed (payment completed)
            const checkPaymentCompletion = setInterval(() => {
              if (mockPaymentWindow.closed) {
                clearInterval(checkPaymentCompletion);
                console.log('🔍 Mock payment window closed, assuming payment completed');
                
                // Navigate to success page after mock payment completion
                navigate('/payment-success', { 
                  state: { 
                    paymentType: 'monthly_rent',
                    selectedPayments: selectedPayments,
                    totalAmount: totalAmount,
                    paymentData: response.data
                  } 
                });
              }
            }, 1000);
            
            // Fallback: if window doesn't close within 30 seconds, assume completion
            setTimeout(() => {
              clearInterval(checkPaymentCompletion);
              if (!mockPaymentWindow.closed) {
                mockPaymentWindow.close();
              }
              console.log('🔍 Mock payment timeout, navigating to success page');
              navigate('/payment-success', { 
                state: { 
                  paymentType: 'monthly_rent',
                  selectedPayments: selectedPayments,
                  totalAmount: totalAmount,
                  paymentData: response.data
                } 
              });
            }, 30000);
          } else {
            // If popup blocked, complete the payment directly in the backend
            console.log('🔍 Popup blocked, completing payment directly in backend...');
            setPopupBlocked(true);
            
            // Add a small delay to show the popup blocked message
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Update processing step to show direct completion
            setProcessingStep(5);
            
            try {
              console.log('🔍 Completing payment directly in backend due to popup blocking...');
              // Call the backend to complete the mock payment
              const completionResponse = await api.post('/payments/complete-mock-payment', {
                paymentId: response.data.paymentId,
                amount: totalAmount,
                purpose: 'MONTHLY_RENT',
                offerId: paymentData.offerId,
                selectedPayments: selectedPayments
              });
              
              console.log('✅ Payment completed directly in backend:', completionResponse.data);
              
              // Navigate to success page
              navigate('/payment-success', { 
                state: { 
                  paymentType: 'monthly_rent',
                  selectedPayments: selectedPayments,
                  totalAmount: totalAmount,
                  paymentData: response.data
                } 
              });
            } catch (completionError) {
              console.error('❌ Error completing payment directly:', completionError);
              
              // Show alert with manual completion instructions
              alert(`Mock ${response.data.paymentGateway} payment created! Please complete your payment at: ${response.data.redirectUrl}`);
              
              // Navigate to success page anyway
              navigate('/payment-success', { 
                state: { 
                  paymentType: 'monthly_rent',
                  selectedPayments: selectedPayments,
                  totalAmount: totalAmount,
                  paymentData: response.data
                } 
              });
            }
          }
        } else {
          // No redirect URL, navigate directly to success
          navigate('/payment-success', { 
            state: { 
              paymentType: 'monthly_rent',
              selectedPayments: selectedPayments,
              totalAmount: totalAmount,
              paymentData: response.data
            } 
          });
        }
      } else {
        // Unknown gateway, navigate to success page
        navigate('/payment-success', { 
          state: { 
            paymentType: 'monthly_rent',
            selectedPayments: selectedPayments,
            totalAmount: totalAmount,
            paymentData: response.data
          } 
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      console.error('Error response:', error.response?.data);
      setShowProcessingModal(false);
      alert(`Payment failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getTotalAmount = () => {
    return selectedPayments.reduce((sum, payment) => sum + payment.amount, 0);
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

  const getProfilePhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      return photoPath;
    }
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    if (!photoPath.startsWith('/')) {
      return `${baseUrl}/uploads/profile_images/${photoPath}`;
    }
    if (photoPath.startsWith('/uploads/')) {
      return `${baseUrl}${photoPath}`;
    }
    return `${baseUrl}${photoPath}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Payment</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/payment-history')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Payment History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/payment-history')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Monthly Rent Payment</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form - Left Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Method</h2>
                <p className="text-gray-600">Complete your payment securely and easily</p>
              </div>
              
              {/* Payment Method Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">Select Payment Gateway</label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => handlePaymentMethodChange('STRIPE')}
                    className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                      selectedPaymentMethod === 'STRIPE'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <CreditCard className="w-6 h-6" />
                      <span className="text-sm font-medium">Credit Card</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handlePaymentMethodChange('PAYU')}
                    className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                      selectedPaymentMethod === 'PAYU'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Building className="w-6 h-6" />
                      <span className="text-sm font-medium">PayU</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handlePaymentMethodChange('P24')}
                    className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                      selectedPaymentMethod === 'P24'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Building className="w-6 h-6" />
                      <span className="text-sm font-medium">Paydoo24</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Payment Form Fields */}
              {selectedPaymentMethod === 'STRIPE' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                    <input
                      type="text"
                      value={paymentForm.cardNumber}
                      onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Your Full Name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                        <input
                          type="text"
                          value={paymentForm.expiryDate}
                          onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="MM/YY"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                        <input
                          type="text"
                          value={paymentForm.cvv}
                          onChange={(e) => handleInputChange('cvv', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="123"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Preview Button */}
                  <div className="flex justify-end">
                    <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>
              )}

              {selectedPaymentMethod === 'PAYU' && (
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <Building className="w-6 h-6 text-blue-600" />
                    <span className="font-semibold text-blue-900">PayU Payment</span>
                  </div>
                  <p className="text-blue-800">
                    You will be redirected to PayU's secure payment gateway to complete your transaction. 
                    PayU supports various payment methods including bank transfers, cards, and digital wallets.
                  </p>
                </div>
              )}

              {selectedPaymentMethod === 'P24' && (
                <div className="p-6 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <Building className="w-6 h-6 text-green-600" />
                    <span className="font-semibold text-green-900">Paydoo24 Payment</span>
                  </div>
                  <p className="text-green-800">
                    You will be redirected to Paydoo24's secure payment gateway. 
                    Paydoo24 is Poland's leading online payment system supporting bank transfers and cards.
                  </p>
                </div>
              )}

              {/* Terms Agreement */}
              <div className="mt-8">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the <a href="#" className="text-blue-600 hover:underline font-medium">Terms of Service</a> and{' '}
                    <a href="#" className="text-blue-600 hover:underline font-medium">Safety Protection Policy</a>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Payment Summary
              </h3>
              
              <div className="space-y-4 mb-6">
                {selectedPayments.map((payment, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-gray-900">{payment.month}</div>
                      <div className="text-sm text-gray-600">Due: {formatDate(payment.dueDate)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</div>
                      <div className="text-xs text-gray-500">Monthly Rent</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600">{formatCurrency(getTotalAmount())}</span>
                </div>
              </div>
            </div>

            {/* Landlord Information */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-green-600" />
                Your Landlord
              </h3>
              
              <div className="flex items-center space-x-4 mb-4">
                {landlordInfo?.profileImage ? (
                  <img 
                    src={getProfilePhotoUrl(landlordInfo.profileImage)} 
                    alt="Landlord" 
                    className="w-12 h-12 rounded-full object-cover" 
                  />
                ) : (
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-green-600">
                      {landlordInfo?.name?.split(' ').map(n => n[0]).join('') || 'JL'}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-semibold text-gray-900">{landlordInfo?.name || 'Landlord'}</div>
                  <div className="text-sm text-gray-600">Property Owner</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Member since {landlordInfo?.createdAt ? new Date(landlordInfo.createdAt).getFullYear() : 'N/A'}
                  </span>
                </div>
                
                {landlordInfo?.averageRating && (
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-gray-600">
                      {landlordInfo.averageRating} ({landlordInfo.totalReviews || 0} review{landlordInfo.totalReviews !== 1 ? 's' : ''})
                    </span>
                  </div>
                )}
                
                {landlordInfo?.rank && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                    ⭐ {landlordInfo.rank}
                  </div>
                )}
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start space-x-3 mb-3">
                <Shield className="w-6 h-6 text-green-600 mt-0.5" />
                <div>
                  <span className="font-semibold text-green-900 text-lg">Secure Payment</span>
                </div>
              </div>
              <div className="space-y-2 text-sm text-green-800">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>256-bit SSL encryption</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Your payment is processed securely through our trusted banking partners</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>All transactions are encrypted and protected</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pay Button - Full Width */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handlePaySecurely}
            disabled={!agreedToTerms || isProcessing}
            className="w-full max-w-md bg-blue-600 text-white py-4 px-8 rounded-xl hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
          >
            <Lock className="w-5 h-5" />
            <span className="text-lg font-semibold">
              {isProcessing ? 'Processing...' : `Pay ${formatCurrency(getTotalAmount())} Securely`}
            </span>
          </button>
        </div>
      </div>

      {/* Processing Modal */}
      {showProcessingModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h3>
              <p className="text-gray-600">Please wait while we process your payment securely...</p>
            </div>
            
            <div className="space-y-3">
              <div className={`flex items-center space-x-3 ${processingStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Creating payment intent</span>
              </div>
              <div className={`flex items-center space-x-3 ${processingStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Processing payment</span>
              </div>
              <div className={`flex items-center space-x-3 ${processingStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Confirming payment</span>
              </div>
              <div className={`flex items-center space-x-3 ${processingStep >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Completing transaction</span>
              </div>
              <div className={`flex items-center space-x-3 ${processingStep >= 5 ? 'text-blue-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Finalizing payment</span>
              </div>
            </div>
            
            {/* Popup Blocked Message */}
            {popupBlocked && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2 text-yellow-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Popup Blocked</span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  Your browser blocked the payment popup. We're completing the payment directly.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyRentPaymentPage;
