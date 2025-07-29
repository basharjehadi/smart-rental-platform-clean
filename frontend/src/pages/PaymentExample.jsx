import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentForm from '../components/PaymentForm';

const PaymentExample = () => {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    amount: 2500,
    purpose: 'rent',
    rentalRequestId: 'example-request-123'
  });
  
  const navigate = useNavigate();

  const handlePaymentSuccess = (paymentIntent) => {
    console.log('Payment successful:', paymentIntent);
    // You can add additional logic here, like updating the rental request status
    alert('Payment successful! Redirecting to dashboard...');
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
    alert(`Payment failed: ${error}`);
  };

  const handleRentPayment = () => {
    setPaymentDetails({
      amount: 2500,
      purpose: 'rent',
      rentalRequestId: 'example-request-123'
    });
    setShowPayment(true);
  };

  const handleDepositPayment = () => {
    setPaymentDetails({
      amount: 5000,
      purpose: 'deposit',
      rentalRequestId: 'example-request-123'
    });
    setShowPayment(true);
  };

  if (showPayment) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button
              onClick={() => setShowPayment(false)}
              className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to options
            </button>
          </div>
          
          <PaymentForm
            amount={paymentDetails.amount}
            rentalRequestId={paymentDetails.rentalRequestId}
            purpose={paymentDetails.purpose}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Rental Payment Options
          </h1>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Monthly Rent Payment
              </h3>
              <p className="text-gray-600 mb-4">
                Pay your monthly rent of 2,500 PLN
              </p>
              <button
                onClick={handleRentPayment}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Pay Rent
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Security Deposit
              </h3>
              <p className="text-gray-600 mb-4">
                Pay your security deposit of 5,000 PLN
              </p>
              <button
                onClick={handleDepositPayment}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              >
                Pay Deposit
              </button>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-md">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Integration Example:</h3>
            <pre className="text-xs text-blue-800 overflow-x-auto">
{`// In your component:
const [showPayment, setShowPayment] = useState(false);

const handlePaymentSuccess = (paymentIntent) => {
  // Handle successful payment
  navigate('/dashboard');
};

<PaymentForm
  amount={2500}
  rentalRequestId="request-123"
  purpose="rent"
  onSuccess={handlePaymentSuccess}
  onError={(error) => alert(error)}
/>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentExample; 