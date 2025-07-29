import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// import { loadStripe } from '@stripe/stripe-js';
// import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe with environment variable
// const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const PaymentFormContent = ({ amount, rentalRequestId, purpose, onSuccess, onError }) => {
  // const [clientSecret, setClientSecret] = useState('');
  // const [loading, setLoading] = useState(true);
  // const [processing, setProcessing] = useState(false);
  // const [error, setError] = useState('');
  // const [success, setSuccess] = useState(false);

  // const stripe = useStripe();
  // const elements = useElements();
  // const { api } = useAuth();

    // useEffect(() => {
  //   createPaymentIntent();
  // }, [amount, rentalRequestId, purpose]);

  // const createPaymentIntent = async () => {
  //   try {
  //     setLoading(true);
  //     setError('');

  //     const response = await api.post('/create-payment-intent', {
  //       amount,
  //       rentalRequestId,
  //       purpose
  //     });

  //     setClientSecret(response.data.client_secret);
  //   } catch (error) {
  //     setError(error.response?.data?.error || 'Failed to create payment intent');
  //     onError?.(error.response?.data?.error || 'Failed to create payment intent');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

    // const handleSubmit = async (event) => {
  //   event.preventDefault();

  //   if (!stripe || !elements || !clientSecret) {
  //     return;
  //   }

  //   setProcessing(true);
  //   setError('');

  //   const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  //     payment_method: {
  //       card: elements.getElement(CardElement),
  //     }
  //   });

  //   if (stripeError) {
  //     setError(stripeError.message || 'Payment failed');
  //     onError?.(stripeError.message || 'Payment failed');
  //     } else if (paymentIntent.status === 'succeeded') {
  //       setSuccess(true);
  //       onSuccess?.(paymentIntent);

  //       // Redirect to dashboard after a short delay
  //       setTimeout(() => {
  //         window.location.href = '/dashboard';
  //       }, 2000);
  //     }

  //   setProcessing(false);
  // };

  // const formatCurrency = (amount) => {
  //   return new Intl.NumberFormat('pl-PL', {
  //     style: 'currency',
  //     currency: 'PLN'
  //   }).format(amount);
  // };

  // const cardElementOptions = {
  //   style: {
  //     base: {
  //       fontSize: '16px',
  //       color: '#424770',
  //       '::placeholder': {
  //         color: '#aab7c4',
  //       },
  //     },
  //     invalid: {
  //       color: '#9e2146',
  //     },
  //   },
  // };

  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center py-8">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
  //         <p className="mt-2 text-gray-600">Setting up payment...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // if (success) {
  //   return (
  //     <div className="bg-green-50 border border-green-200 rounded-md p-4">
  //       <div className="flex">
  //         <div className="flex-shrink-0">
  //           <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
  //             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  //           </svg>
  //         </div>
  //         <div className="ml-3">
  //           <h3 className="text-sm font-medium text-green-800">
  //             Payment Successful!
  //           </h3>
  //           <p className="mt-1 text-sm text-green-700">
  //             Redirecting to dashboard...
  //           </p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  // return (
  //   <div className="max-w-md mx-auto">
  //     <div className="bg-white shadow-lg rounded-lg p-6">
  //       <div className="mb-6">
  //         <h2 className="text-xl font-semibold text-gray-900 mb-2">
  //           Payment Details
  //         </h2>
  //         <div className="bg-gray-50 rounded-md p-4 mb-4">
  //           <div className="flex justify-between items-center">
  //             <span className="text-gray-600">Amount:</span>
  //             <span className="font-semibold text-gray-900">{formatCurrency(amount)}</span>
  //           </div>
  //           <div className="flex justify-between items-center mt-2">
  //             <span className="text-gray-600">Purpose:</span>
  //             <span className="font-semibold text-gray-900 capitalize">{purpose}</span>
  //           </div>
  //         </div>
  //       </div>

  //       {error && (
  //         <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
  //           {error}
  //         </div>
  //       )}

  //       <form onSubmit={handleSubmit}>
  //         <div className="mb-6">
  //           <label className="block text-sm font-medium text-gray-700 mb-2">
  //             Card Information
  //           </label>
  //           <div className="border border-gray-300 rounded-md p-3">
  //             <CardElement options={cardElementOptions} />
  //           </div>
  //         </div>

  //         <button
  //           type="submit"
  //           disabled={!stripe || processing}
  //           className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:cursor-not-allowed"
  //         >
  //           {processing ? 'Processing...' : `Pay ${formatCurrency(amount)}`}
  //         </button>
  //       </form>

  //       <div className="mt-4 text-xs text-gray-500 text-center">
  //         <p>Your payment is secured by Stripe</p>
  //         <p className="mt-1">Test card: 4242 4242 4242 4242</p>
  //       </div>
  //     </div>
  //   </div>
  // );

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <h3 className="text-lg font-medium text-yellow-900 mb-2">
        Payment Form Content (Temporarily Disabled)
      </h3>
      <p className="text-yellow-700">
        Payment form content is temporarily disabled. Stripe integration has been commented out.
      </p>
    </div>
  );
};

const PaymentForm = ({ amount, rentalRequestId, purpose, onSuccess, onError }) => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <h3 className="text-lg font-medium text-yellow-900 mb-2">
        Payment Form (Temporarily Disabled)
      </h3>
      <p className="text-yellow-700">
        Payment form is temporarily disabled. Stripe integration has been commented out.
      </p>
    </div>
    // <Elements stripe={stripePromise}>
    //   <PaymentFormContent
    //     amount={amount}
    //     rentalRequestId={rentalRequestId}
    //     purpose={purpose}
    //     onSuccess={onSuccess}
    //     onError={onError}
    //   />
    // </Elements>
  );
};

export default PaymentForm; 