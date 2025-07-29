import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const TenantRentHistory = () => {
  const [rentData, setRentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(null);

  const { api } = useAuth();

  useEffect(() => {
    fetchRentHistory();
  }, []);

  const fetchRentHistory = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching tenant rent history...');
      const response = await api.get('/my-rents');
      console.log('Rent history response:', response.data);
      
      setRentData(response.data.rentData || []);
    } catch (error) {
      console.error('Error fetching rent history:', error);
      setError(error.response?.data?.error || 'Failed to fetch rent history');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (paymentId, amount) => {
    try {
      setProcessingPayment(paymentId);
      
      console.log('Creating payment intent for rent payment...');
      const response = await api.post('/create-payment-intent', {
        amount: amount,
        purpose: 'RENT',
        paymentId: paymentId
      });
      
      console.log('Payment intent created:', response.data);
      
      // For now, just show success message
      // In a real implementation, you would integrate with Stripe here
      alert(`Payment intent created for ${amount} PLN. Payment processing would be handled by Stripe.`);
      
      // Refresh the data after payment
      await fetchRentHistory();
      
    } catch (error) {
      console.error('Error creating payment intent:', error);
      alert('Failed to create payment intent. Please try again.');
    } finally {
      setProcessingPayment(null);
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

  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const getPaymentStatusBadge = (status, dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const isOverdue = status === 'PENDING' && today > due;

    if (isOverdue) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ⚠️ Overdue
        </span>
      );
    }

    const statusConfig = {
      PENDING: {
        className: 'bg-yellow-100 text-yellow-800',
        text: 'Pending',
        icon: '⏳'
      },
      SUCCEEDED: {
        className: 'bg-green-100 text-green-800',
        text: 'Paid',
        icon: '✅'
      },
      FAILED: {
        className: 'bg-red-100 text-red-800',
        text: 'Failed',
        icon: '❌'
      }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.icon} {config.text}
      </span>
    );
  };

  const calculateDaysOverdue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    return Math.floor((today - due) / (1000 * 60 * 60 * 24));
  };

  const isPaymentOverdue = (payment) => {
    if (payment.status !== 'PENDING') return false;
    const today = new Date();
    const dueDate = new Date(payment.dueDate);
    return today > dueDate;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading rent history...</p>
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
            My Rent History
          </h1>
          <p className="text-gray-600">
            View your complete rent payment history and manage pending payments.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Refresh Button */}
        <div className="mb-6">
          <button
            onClick={fetchRentHistory}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Refresh History
          </button>
        </div>

        {/* Rent History */}
        {rentData.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              No rent history found.
            </div>
            <p className="text-gray-400 mt-2">
              Your rent payment history will appear here once you have accepted offers and payments are recorded.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {rentData.map((rental) => (
              <div key={rental.offerId} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Rental Property Header */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {rental.rentalRequest.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {rental.rentalRequest.location}
                      </p>
                      <p className="text-sm text-gray-500">
                        Monthly Rent: {formatCurrency(rental.rentAmount)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Lease: {formatDate(rental.leaseStartDate)} - {formatDate(rental.leaseEndDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        Total Payments: {rental.rentPayments.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Locked Warning */}
                {rental.rentalRequest.isLocked && (
                  <div className="px-6 py-4 bg-red-50 border-b border-red-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-red-600">🔒</span>
                      <span className="text-sm font-medium text-red-800">
                        This rental is locked due to overdue rent payments
                      </span>
                    </div>
                    <p className="text-xs text-red-600 mt-1">
                      Please contact your landlord to resolve overdue payments and unlock the rental.
                    </p>
                  </div>
                )}

                {/* Payment History Table */}
                <div className="px-6 py-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Payment History</h4>
                  
                  {rental.rentPayments.length === 0 ? (
                    <p className="text-gray-500 text-sm">No rent payments recorded yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Month
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Due Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Paid Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {rental.rentPayments.map((payment) => (
                            <tr 
                              key={payment.id} 
                              className={`${isPaymentOverdue(payment) ? 'bg-red-50' : ''}`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {getMonthName(payment.month)} {payment.year}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(payment.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(payment.dueDate)}
                                {isPaymentOverdue(payment) && (
                                  <div className="text-xs text-red-600 mt-1">
                                    {calculateDaysOverdue(payment.dueDate)} days overdue
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getPaymentStatusBadge(payment.status, payment.dueDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {payment.paidDate ? formatDate(payment.paidDate) : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {(payment.status === 'PENDING' || payment.status === 'FAILED') && (
                                  <button
                                    onClick={() => handlePayNow(payment.id, payment.amount)}
                                    disabled={processingPayment === payment.id}
                                    className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md ${
                                      processingPayment === payment.id
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    }`}
                                  >
                                    {processingPayment === payment.id ? (
                                      <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                        Processing...
                                      </>
                                    ) : (
                                      'Pay Now'
                                    )}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Payment Summary */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {rental.rentPayments.length}
                      </div>
                      <div className="text-xs text-gray-500">Total Payments</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-600">
                        {rental.rentPayments.filter(p => p.status === 'SUCCEEDED').length}
                      </div>
                      <div className="text-xs text-gray-500">Paid</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-yellow-600">
                        {rental.rentPayments.filter(p => p.status === 'PENDING').length}
                      </div>
                      <div className="text-xs text-gray-500">Pending</div>
                    </div>
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

export default TenantRentHistory; 