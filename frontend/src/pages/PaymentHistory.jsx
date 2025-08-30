import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const PaymentHistory = () => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [leaseInfo, setLeaseInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchPaymentData();

    // Refresh data when page becomes visible (user returns from payment)
    const handleFocus = () => {
      console.log('🔍 PaymentHistory page focused, refreshing data...');
      fetchPaymentData();

      // Check if user is returning from a successful payment
      if (sessionStorage.getItem('paymentCompleted')) {
        setShowSuccessMessage(true);
        sessionStorage.removeItem('paymentCompleted');

        // Hide success message after 5 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 5000);
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch payment history with upcoming payments
      const historyResponse = await api.get(
        '/tenant-dashboard/payments/history'
      );
      setPaymentHistory(historyResponse.data.payments || []);
      setUpcomingPayments(historyResponse.data.upcomingPayments || []);
      setLeaseInfo(historyResponse.data.lease || null);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      setError('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = status => {
    const statusConfig = {
      SUCCEEDED: { color: 'bg-green-100 text-green-800', text: 'Paid' },
      PENDING: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      FAILED: { color: 'bg-red-100 text-red-800', text: 'Failed' },
      Paid: { color: 'bg-green-100 text-green-800', text: 'Paid' },
      Overdue: { color: 'bg-red-100 text-red-800', text: 'Overdue' },
    };

    const config = statusConfig[status] || {
      color: 'bg-gray-100 text-gray-800',
      text: status,
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  const isOverdue = dueDate => {
    return new Date(dueDate) < new Date();
  };

  const handlePaymentSelect = payment => {
    setSelectedPayments(prev => {
      const isSelected = prev.find(p => p.month === payment.month);
      if (isSelected) {
        return prev.filter(p => p.month !== payment.month);
      } else {
        return [...prev, payment];
      }
    });
  };

  const handlePaySelected = () => {
    if (selectedPayments.length === 0) return;
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async () => {
    console.log('🔍 handleProcessPayment called');
    console.log('🔍 Selected payments:', selectedPayments);
    console.log('🔍 Navigating to /monthly-rent-payment');

    // Navigate to the dedicated monthly rent payment page
    navigate('/monthly-rent-payment', {
      state: {
        selectedPayments: selectedPayments,
      },
    });

    console.log('🔍 Navigation completed');
  };

  const getTotalSelectedAmount = () => {
    return selectedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const handleSelectAll = () => {
    if (selectedPayments.length === upcomingPayments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments([...upcomingPayments]);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading payment history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg
              className='w-8 h-8 text-red-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Error Loading Payment History
          </h3>
          <p className='text-gray-600 mb-4'>{error}</p>
          <button
            onClick={() => navigate('/tenant-dashboard')}
            className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors'
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white shadow-sm border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center'>
              <button
                onClick={() => navigate('/tenant-dashboard')}
                className='mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors'
              >
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 19l-7-7 7-7'
                  />
                </svg>
              </button>
              <h1 className='text-2xl font-bold text-gray-900'>
                Payment History
              </h1>
            </div>
            <div className='flex items-center space-x-3'>
              <button
                onClick={fetchPaymentData}
                className='p-2 text-gray-400 hover:text-gray-600 transition-colors'
                title='Refresh payment data'
              >
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Success Message */}
        {showSuccessMessage && (
          <div className='mb-6 bg-green-50 border border-green-200 rounded-lg p-4'>
            <div className='flex items-center'>
              <svg
                className='w-5 h-5 text-green-600 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 13l4 4L19 7'
                />
              </svg>
              <span className='text-green-800 font-medium'>
                Payment completed successfully! Your payment history has been
                updated.
              </span>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                <svg
                  className='w-6 h-6 text-green-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
                  />
                </svg>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Total Paid</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {formatCurrency(
                    paymentHistory.reduce(
                      (sum, payment) => sum + (payment.amount || 0),
                      0
                    )
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                <svg
                  className='w-6 h-6 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>
                  Upcoming Payments
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {upcomingPayments.length}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center'>
              <div className='w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center'>
                <svg
                  className='w-6 h-6 text-yellow-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Next Due</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {upcomingPayments.length > 0
                    ? formatDate(upcomingPayments[0].dueDate)
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History Section */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 mb-8'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Payment History
            </h2>
            <p className='text-sm text-gray-600'>Your completed payments</p>
          </div>
          <div className='p-6'>
            {paymentHistory.length > 0 ? (
              <div className='space-y-4'>
                {paymentHistory.map((payment, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
                  >
                    <div className='flex items-center'>
                      <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4'>
                        <svg
                          className='w-5 h-5 text-green-600'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M5 13l4 4L19 7'
                          />
                        </svg>
                      </div>
                      <div>
                        <p className='text-sm font-medium text-gray-900'>
                          {payment.purpose === 'DEPOSIT_AND_FIRST_MONTH'
                            ? 'Deposit & First Month'
                            : payment.purpose === 'RENT'
                              ? 'Monthly Rent'
                              : payment.purpose}
                        </p>
                        <p className='text-xs text-gray-600'>
                          Paid on {formatDate(payment.date)}
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm font-medium text-gray-900'>
                        {formatCurrency(payment.amount)}
                      </p>
                      {getStatusBadge(payment.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-8'>
                <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <svg
                    className='w-8 h-8 text-gray-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
                    />
                  </svg>
                </div>
                <p className='text-gray-600'>
                  No payment history available yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Payments Section */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <h2 className='text-lg font-semibold text-gray-900'>
                  Upcoming Payments
                </h2>
                <p className='text-sm text-gray-600'>
                  Standard monthly payments due on the 10th of each month
                </p>
              </div>
              <div className='flex items-center space-x-3'>
                {upcomingPayments.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      selectedPayments.length === upcomingPayments.length
                        ? 'bg-gray-600 text-white hover:bg-gray-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {selectedPayments.length === upcomingPayments.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                )}
                {selectedPayments.length > 0 && (
                  <button
                    onClick={handlePaySelected}
                    className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium'
                  >
                    Pay {selectedPayments.length} Selected (
                    {formatCurrency(getTotalSelectedAmount())})
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className='p-6'>
            {upcomingPayments.length > 0 ? (
              <div className='space-y-4'>
                {upcomingPayments.map((payment, index) => {
                  const isSelected = selectedPayments.find(
                    p => p.month === payment.month
                  );
                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : isOverdue(payment.dueDate)
                            ? 'bg-red-50 border-red-200'
                            : 'bg-gray-50 border-transparent'
                      }`}
                    >
                      <div className='flex items-center'>
                        <input
                          type='checkbox'
                          checked={isSelected}
                          onChange={() => handlePaymentSelect(payment)}
                          className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3'
                        />
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                            isOverdue(payment.dueDate)
                              ? 'bg-red-100'
                              : 'bg-blue-100'
                          }`}
                        >
                          <svg
                            className={`w-5 h-5 ${
                              isOverdue(payment.dueDate)
                                ? 'text-red-600'
                                : 'text-blue-600'
                            }`}
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                            />
                          </svg>
                        </div>
                        <div>
                          <p className='text-sm font-medium text-gray-900'>
                            {payment.description || payment.month}
                          </p>
                          <p
                            className={`text-xs ${
                              isOverdue(payment.dueDate)
                                ? 'text-red-600'
                                : 'text-gray-600'
                            }`}
                          >
                            Due on {formatDate(payment.dueDate)}
                            {payment.isLastMonth && (
                              <span className='ml-1 text-blue-600'>
                                {payment.description.includes('days')
                                  ? `(${payment.description.split(' - ')[1]})`
                                  : '(Final month)'}
                              </span>
                            )}
                            {isOverdue(payment.dueDate) && ' (Overdue)'}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center space-x-3'>
                        <div className='text-right'>
                          <p className='text-sm font-medium text-gray-900'>
                            {formatCurrency(payment.amount)}
                          </p>
                          {getStatusBadge(
                            isOverdue(payment.dueDate)
                              ? 'Overdue'
                              : payment.status
                          )}
                        </div>
                        <button
                          onClick={() => handlePaymentSelect(payment)}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Pay Now'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className='text-center py-8'>
                <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <svg
                    className='w-8 h-8 text-gray-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                    />
                  </svg>
                </div>
                <p className='text-gray-600'>No upcoming payments scheduled.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className='fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Pay in Advance
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className='text-gray-400 hover:text-gray-600'
              >
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>

            <div className='mb-6'>
              <p className='text-sm text-gray-600 mb-4'>
                You're about to pay {selectedPayments.length} month(s) in
                advance:
              </p>

              <div className='space-y-2 mb-4'>
                {selectedPayments.map((payment, index) => (
                  <div key={index} className='flex justify-between text-sm'>
                    <span className='text-gray-700'>{payment.month}</span>
                    <span className='font-medium'>
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                ))}
              </div>

              <div className='border-t pt-3'>
                <div className='flex justify-between font-semibold'>
                  <span>Total Amount:</span>
                  <span className='text-blue-600'>
                    {formatCurrency(getTotalSelectedAmount())}
                  </span>
                </div>
              </div>
            </div>

            <div className='flex space-x-3'>
              <button
                onClick={() => setShowPaymentModal(false)}
                className='flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={handleProcessPayment}
                className='flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
              >
                Pay {formatCurrency(getTotalSelectedAmount())}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
