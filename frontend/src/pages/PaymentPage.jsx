import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Payment Form Component
const PaymentForm = ({ offer, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [paymentIntentReady, setPaymentIntentReady] = useState(false);
  
  const stripe = useStripe();
  const elements = useElements();
  const { api } = useAuth();
  const navigate = useNavigate();

  // Debug Stripe hooks
  console.log('PaymentForm - stripe:', stripe ? 'LOADED' : 'NOT LOADED');
  console.log('PaymentForm - elements:', elements ? 'LOADED' : 'NOT LOADED');

  // Create payment intent when component mounts
  useEffect(() => {
    if (offer) {
      console.log('Creating payment intent for offer:', offer.id);
      createPaymentIntent();
    }
  }, [offer]);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Creating payment intent for offer:', offer.id);
      console.log('Offer details:', { id: offer.id, depositAmount: offer.depositAmount });
      
      const response = await api.post('/create-payment-intent', {
        offerId: offer.id,
        amount: offer.depositAmount,
        purpose: 'DEPOSIT'
      });
      
      console.log('Payment intent response:', response.data);
      
      if (response.data.client_secret) {
        setClientSecret(response.data.client_secret);
        setPaymentIntent(response.data);
        setPaymentIntentReady(true);
        console.log('Client secret set successfully');
      } else {
        console.error('No client_secret in response');
        setError('Failed to create payment intent - no client secret received');
      }
      
    } catch (error) {
      console.error('Error creating payment intent:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.error || 'Failed to create payment intent');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    console.log('Submit button clicked');
    console.log('Stripe state:', { stripe: !!stripe, elements: !!elements, clientSecret: !!clientSecret });
    
    if (!stripe || !elements || !clientSecret) {
      console.error('Stripe not loaded or client secret missing');
      setError('Payment form not ready. Please try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Starting payment confirmation...');
      
      // Get the card element
      const cardElement = elements.getElement(CardElement);
      console.log('Card element:', cardElement);
      
      // Confirm the payment
      const { error: paymentError, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: offer.rentalRequest?.title || 'Rental Deposit',
            },
          },
        }
      );

      console.log('Payment result:', { paymentError, confirmedPayment });

      if (paymentError) {
        console.error('Payment error:', paymentError);
        setError(paymentError.message || 'Payment failed');
      } else if (confirmedPayment.status === 'succeeded') {
        console.log('Payment successful:', confirmedPayment);
        setError('');
        
        // Update offer status to PAID (simplified approach)
        try {
          console.log('Payment completed successfully');
          // For now, we'll just log the success
          // The offer will remain as ACCEPTED but payment is complete
        } catch (updateError) {
          console.error('Error logging payment completion:', updateError);
        }
        
        // Call success callback
        if (onPaymentSuccess) {
          onPaymentSuccess(confirmedPayment);
        }
        
        // Show success message and redirect
        alert('Payment successful! Redirecting to dashboard...');
        navigate('/dashboard');
      } else {
        console.log('Payment not succeeded, status:', confirmedPayment.status);
        setError('Payment was not completed. Please try again.');
      }
    } catch (error) {
      console.error('Payment submission error:', error);
      setError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && !paymentIntentReady) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Preparing payment...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Payment Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Summary</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Rental Property:</span>
            <span className="text-gray-900">{offer.rentalRequest?.title}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Location:</span>
            <span className="text-gray-900">{offer.rentalRequest?.location}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Lease Duration:</span>
            <span className="text-gray-900">{offer.leaseDuration} months</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Available From:</span>
            <span className="text-gray-900">{formatDate(offer.availableFrom)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Monthly Rent:</span>
            <span className="text-green-600 font-semibold">
              {formatCurrency(offer.rentAmount)}
            </span>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Deposit Amount:</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(offer.depositAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h3>
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div className="border border-gray-300 rounded-md p-3 min-h-[40px]">
              {stripe && elements ? (
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                      invalid: {
                        color: '#9e2146',
                      },
                    },
                  }}
                  onReady={() => console.log('CardElement ready')}
                  onChange={(event) => console.log('CardElement change:', event)}
                  onFocus={() => console.log('CardElement focused')}
                  onBlur={() => console.log('CardElement blurred')}
                />
              ) : (
                <div className="text-gray-500 text-center py-2">
                  Loading payment form...
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !stripe || !elements || !paymentIntentReady}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={() => console.log('Button clicked')}
          >
            {loading ? 'Processing Payment...' : `Pay Deposit (${formatCurrency(offer.depositAmount)})`}
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-500 text-center">
          Your payment is secured by Stripe. You will be redirected to the dashboard after successful payment.
        </div>
      </div>
    </div>
  );
};

// Main Payment Page Component
const PaymentPage = () => {
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { api } = useAuth();
  const navigate = useNavigate();

  // Fetch accepted offer on component mount
  useEffect(() => {
    fetchAcceptedOffer();
  }, []);

  const fetchAcceptedOffer = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching accepted offer...');
      const response = await api.get('/offers/my?status=ACCEPTED');
      console.log('Accepted offers response:', response.data);
      
      const offers = response.data.offers || response.data || [];
      const acceptedOffer = offers.find(o => o.status === 'ACCEPTED');
      
      if (acceptedOffer) {
        console.log('Found accepted offer:', acceptedOffer);
        setOffer(acceptedOffer);
      } else {
        console.log('No accepted offer found');
        setError('No accepted offer found. Please accept an offer first.');
      }
    } catch (error) {
      console.error('Error fetching accepted offer:', error);
      setError(error.response?.data?.error || 'Failed to fetch accepted offer');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentResult) => {
    console.log('Payment successful:', paymentResult);
    // Additional success handling if needed
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading payment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded max-w-md mx-auto">
              {error}
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-gray-500 text-lg">
              No accepted offer found.
            </div>
            <p className="text-gray-400 mt-2">
              Please accept an offer first before making a payment.
            </p>
            <button
              onClick={() => navigate('/my-offers')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              View My Offers
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment
          </h1>
          <p className="text-gray-600">
            Complete your deposit payment for the accepted rental offer.
          </p>
        </div>

        {/* Payment Form */}
        <PaymentForm 
          offer={offer} 
          onPaymentSuccess={handlePaymentSuccess}
        />
      </div>
    </div>
  );
};

export default PaymentPage; 