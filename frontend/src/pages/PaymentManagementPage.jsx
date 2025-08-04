import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PaymentManagementPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, succeeded, failed

  const { user, api } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/payments/my-payments');
      setPayments(response.data.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPayments = () => {
    if (filter === 'all') return payments;
    return payments.filter(payment => payment.status.toLowerCase() === filter);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      'SUCCEEDED': { color: 'bg-green-100 text-green-800', text: 'Succeeded' },
      'FAILED': { color: 'bg-red-100 text-red-800', text: 'Failed' },
      'CANCELLED': { color: 'bg-gray-100 text-gray-800', text: 'Cancelled' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getPurposeBadge = (purpose) => {
    const purposeConfig = {
      'DEPOSIT': { color: 'bg-blue-100 text-blue-800', text: 'Deposit' },
      'RENT': { color: 'bg-green-100 text-green-800', text: 'Rent' },
      'DEPOSIT_AND_FIRST_MONTH': { color: 'bg-purple-100 text-purple-800', text: 'Deposit + First Month' },
      'UTILITIES': { color: 'bg-orange-100 text-orange-800', text: 'Utilities' }
    };

    const config = purposeConfig[purpose] || { color: 'bg-gray-100 text-gray-800', text: purpose };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getPaymentGatewayIcon = (gateway) => {
    const icons = {
      'stripe': '💳',
      'payu': '🏦',
      'p24': '📱',
      'tpay': '💳'
    };
    return icons[gateway?.toLowerCase()] || '💳';
  };

  const handleRetryPayment = async (paymentId) => {
    try {
      setLoading(true);
      setError('');
      
      // Navigate to payment page with the payment ID
      navigate(`/payment/retry/${paymentId}`);
    } catch (error) {
      console.error('Error retrying payment:', error);
      setError('Failed to retry payment');
    } finally {
      setLoading(false);
    }
  };

  const handleViewContract = (rentalRequestId) => {
    navigate(`/contracts?request=${rentalRequestId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading payments...</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredPayments = getFilteredPayments();

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                💳 Payment Management
              </h1>
              <p className="mt-2 text-gray-600">
                View and manage your payment history
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex">
              <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800">{success}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 00-1.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Payment Statistics */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">💳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payments.filter(p => p.status === 'SUCCEEDED').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payments.filter(p => p.status === 'PENDING').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <span className="text-2xl">❌</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payments.filter(p => p.status === 'FAILED').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'pending' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('succeeded')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'succeeded' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Succeeded
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'failed' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Failed
            </button>
          </div>
        </div>

        {/* Payments List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">💳</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Payments Found
              </h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'You don\'t have any payments yet. Make a payment to see it here.'
                  : `No ${filter} payments found.`
                }
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <li key={payment.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">
                              {getPaymentGatewayIcon(payment.preferredPaymentGateway)}
                            </span>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {formatCurrency(payment.amount)}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {payment.rentalRequest?.title || 'Rental Payment'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                            <span>Date: {formatDate(payment.createdAt)}</span>
                            <span>Purpose: {getPurposeBadge(payment.purpose)}</span>
                            <span>Status: {getStatusBadge(payment.status)}</span>
                            {payment.preferredPaymentGateway && (
                              <span>Gateway: {payment.preferredPaymentGateway.toUpperCase()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {payment.status === 'FAILED' && (
                            <button
                              onClick={() => handleRetryPayment(payment.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                            >
                              Retry
                            </button>
                          )}
                          {payment.status === 'SUCCEEDED' && payment.rentalRequestId && (
                            <button
                              onClick={() => handleViewContract(payment.rentalRequestId)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                            >
                              View Contract
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentManagementPage; 