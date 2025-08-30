import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle,
  CreditCard,
  Building,
  Shield,
  Loader,
} from 'lucide-react';
import api from '../utils/api';

const MockPaymentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState('processing');
  const [countdown, setCountdown] = useState(5);

  const paymentId = searchParams.get('paymentId') || 'unknown';
  const amount = searchParams.get('amount') || '0';
  const gateway = searchParams.get('gateway') || 'PAYU';

  // Debug logging
  console.log('🔍 MockPaymentPage loaded with params:', {
    paymentId,
    amount,
    gateway,
    offerId: searchParams.get('offerId'),
    selectedPayments: searchParams.get('selectedPayments'),
  });

  useEffect(() => {
    // Extract values we need from search params
    const offerId = searchParams.get('offerId');
    const selectedPaymentsStr = searchParams.get('selectedPayments');

    console.log('🔍 MockPaymentPage useEffect - offerId:', offerId);
    console.log(
      '🔍 MockPaymentPage useEffect - selectedPayments:',
      selectedPaymentsStr
    );

    // Simulate payment processing
    const timer = setTimeout(async () => {
      setPaymentStatus('success');

      // Complete the payment in the backend
      try {
        console.log('🔍 Calling backend complete-mock-payment...');

        const response = await api.post('/payments/complete-mock-payment', {
          paymentId: paymentId,
          amount: parseFloat(amount),
          purpose: 'MONTHLY_RENT',
          offerId: offerId,
          selectedPayments: JSON.parse(selectedPaymentsStr || '[]'),
        });

        console.log('✅ Mock payment completed in backend:', response.data);
      } catch (error) {
        console.error('❌ Error completing mock payment in backend:', error);
        console.error('❌ Error details:', error.response?.data);
        console.error('❌ Error status:', error.response?.status);
      }

      // Countdown to auto-close
      const countdownTimer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            window.close(); // Close the popup window
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 3000);

    return () => clearTimeout(timer);
  }, [paymentId, amount]);

  const handleCompletePayment = () => {
    window.close(); // Close the popup window
  };

  const testBackendCall = async () => {
    console.log('🧪 Testing backend call manually...');
    try {
      const response = await api.post('/payments/complete-mock-payment', {
        paymentId: 'test_manual_' + Date.now(),
        amount: 3500,
        purpose: 'MONTHLY_RENT',
        offerId: searchParams.get('offerId'),
        selectedPayments: JSON.parse(
          searchParams.get('selectedPayments') || '[]'
        ),
      });
      console.log('✅ Manual test successful:', response.data);
    } catch (error) {
      console.error('❌ Manual test failed:', error);
      console.error('❌ Error details:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
    }
  };

  const getGatewayIcon = () => {
    switch (gateway) {
      case 'PAYU':
        return <Building className='w-8 h-8 text-blue-600' />;
      case 'P24':
        return <Building className='w-8 h-8 text-green-600' />;
      case 'TPAY':
        return <Building className='w-8 h-8 text-purple-600' />;
      default:
        return <CreditCard className='w-8 h-8 text-gray-600' />;
    }
  };

  const getGatewayName = () => {
    switch (gateway) {
      case 'PAYU':
        return 'PayU';
      case 'P24':
        return 'Przelewy24';
      case 'TPAY':
        return 'TPay';
      default:
        return 'Payment Gateway';
    }
  };

  if (paymentStatus === 'processing') {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center'>
          <div className='mb-6'>
            <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Loader className='w-8 h-8 text-blue-600 animate-spin' />
            </div>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>
              Processing Payment
            </h2>
            <p className='text-gray-600'>
              Please wait while we process your payment...
            </p>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <span className='text-sm text-gray-600'>Payment Gateway:</span>
              <span className='font-medium text-gray-900'>
                {getGatewayName()}
              </span>
            </div>
            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <span className='text-sm text-gray-600'>Amount:</span>
              <span className='font-semibold text-gray-900'>{amount} zł</span>
            </div>
            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <span className='text-sm text-gray-600'>Payment ID:</span>
              <span className='font-mono text-xs text-gray-500'>
                {paymentId}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center'>
        <div className='mb-6'>
          <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <CheckCircle className='w-8 h-8 text-green-600' />
          </div>
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            Payment Successful!
          </h2>
          <p className='text-gray-600'>
            Your payment has been processed successfully.
          </p>
        </div>

        <div className='space-y-3 mb-6'>
          <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
            <span className='text-sm text-gray-600'>Payment Gateway:</span>
            <div className='flex items-center space-x-2'>
              {getGatewayIcon()}
              <span className='font-medium text-gray-900'>
                {getGatewayName()}
              </span>
            </div>
          </div>
          <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
            <span className='text-sm text-gray-600'>Amount:</span>
            <span className='font-semibold text-gray-900'>{amount} zł</span>
          </div>
          <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
            <span className='text-sm text-gray-600'>Payment ID:</span>
            <span className='font-mono text-xs text-gray-500'>{paymentId}</span>
          </div>
        </div>

        <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-6'>
          <div className='flex items-center space-x-2 mb-2'>
            <Shield className='w-4 h-4 text-green-600' />
            <span className='font-medium text-green-900'>
              Payment Confirmed
            </span>
          </div>
          <p className='text-sm text-green-800'>
            Your monthly rent payment has been confirmed and will be processed
            within 24 hours.
          </p>
        </div>

        <div className='text-center'>
          <p className='text-sm text-gray-500 mb-4'>
            This window will close automatically in {countdown} seconds
          </p>
          <button
            onClick={handleCompletePayment}
            className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors mb-3'
          >
            Complete Payment
          </button>

          <button
            onClick={testBackendCall}
            className='w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors text-sm'
          >
            🧪 Test Backend Call
          </button>
        </div>
      </div>
    </div>
  );
};

export default MockPaymentPage;
