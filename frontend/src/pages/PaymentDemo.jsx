import { useState } from 'react';
import PaymentForm from '../components/PaymentForm';

const PaymentDemo = () => {
  const [selectedPurpose, setSelectedPurpose] = useState('rent');
  const [amount, setAmount] = useState(2500);
  const [rentalRequestId, setRentalRequestId] = useState('demo-request-123');

  const handleSuccess = paymentIntent => {
    console.log('Payment successful:', paymentIntent);
  };

  const handleError = error => {
    console.error('Payment error:', error);
  };

  return (
    <div className='min-h-screen bg-gray-100 py-8'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-4'>
            Payment Form Demo
          </h1>
          <p className='text-gray-600'>
            This demo shows how to use the PaymentForm component with different
            configurations.
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Configuration Panel */}
          <div className='bg-white shadow-lg rounded-lg p-6'>
            <h2 className='text-xl font-semibold text-gray-900 mb-4'>
              Configuration
            </h2>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Purpose
                </label>
                <select
                  value={selectedPurpose}
                  onChange={e => setSelectedPurpose(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value='rent'>Rent</option>
                  <option value='deposit'>Deposit</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Amount (PLN)
                </label>
                <input
                  type='number'
                  value={amount}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  placeholder='2500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Rental Request ID
                </label>
                <input
                  type='text'
                  value={rentalRequestId}
                  onChange={e => setRentalRequestId(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  placeholder='demo-request-123'
                />
              </div>
            </div>

            <div className='mt-6 p-4 bg-blue-50 rounded-md'>
              <h3 className='text-sm font-medium text-blue-900 mb-2'>
                Usage Example:
              </h3>
              <pre className='text-xs text-blue-800 overflow-x-auto'>
                {`<PaymentForm
  amount={${amount}}
  rentalRequestId="${rentalRequestId}"
  purpose="${selectedPurpose}"
  onSuccess={handleSuccess}
  onError={handleError}
/>`}
              </pre>
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <div className='bg-yellow-50 border border-yellow-200 rounded-md p-4'>
              <h3 className='text-lg font-medium text-yellow-900 mb-2'>
                Payment Form (Temporarily Disabled)
              </h3>
              <p className='text-yellow-700'>
                Payment form is temporarily disabled for debugging. The rest of
                the page should be visible.
              </p>
            </div>
            {/* <PaymentForm
              amount={amount}
              rentalRequestId={rentalRequestId}
              purpose={selectedPurpose}
              onSuccess={handleSuccess}
              onError={handleError}
            /> */}
          </div>
        </div>

        {/* Documentation */}
        <div className='mt-8 bg-white shadow-lg rounded-lg p-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Component Documentation
          </h2>

          <div className='space-y-4'>
            <div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>Props</h3>
              <ul className='space-y-2 text-sm text-gray-600'>
                <li>
                  <strong>amount</strong> (number): Payment amount in PLN
                </li>
                <li>
                  <strong>rentalRequestId</strong> (string): ID of the rental
                  request
                </li>
                <li>
                  <strong>purpose</strong> (string): "deposit" or "rent"
                </li>
                <li>
                  <strong>onSuccess</strong> (function): Callback when payment
                  succeeds
                </li>
                <li>
                  <strong>onError</strong> (function): Callback when payment
                  fails
                </li>
              </ul>
            </div>

            <div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                Features
              </h3>
              <ul className='space-y-2 text-sm text-gray-600'>
                <li>• Automatic payment intent creation on mount</li>
                <li>• Stripe Elements integration with custom styling</li>
                <li>• Real-time payment processing</li>
                <li>• Success/error handling with callbacks</li>
                <li>• Automatic redirect to dashboard on success</li>
                <li>• Loading and processing states</li>
                <li>• Responsive design with Tailwind CSS</li>
              </ul>
            </div>

            <div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                Environment Setup
              </h3>
              <p className='text-sm text-gray-600 mb-2'>
                Add your Stripe publishable key to your environment variables:
              </p>
              <code className='text-xs bg-gray-100 px-2 py-1 rounded'>
                REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDemo;
