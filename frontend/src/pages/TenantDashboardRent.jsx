import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const TenantDashboardRent = () => {
  const [rentData, setRentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { api } = useAuth();

  // Fetch rent payment history on component mount
  useEffect(() => {
    fetchRentPayments();
  }, []);

  const fetchRentPayments = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching rent payments...');
      const response = await api.get('/my-rents');
      console.log('Rent payments response:', response.data);
      
      setRentData(response.data.rentData || []);
    } catch (error) {
      console.error('Error fetching rent payments:', error);
      setError(error.response?.data?.error || 'Failed to fetch rent payments');
    } finally {
      setLoading(false);
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
          Overdue
        </span>
      );
    }

    const statusConfig = {
      PENDING: {
        className: 'bg-yellow-100 text-yellow-800',
        text: 'Pending'
      },
      SUCCEEDED: {
        className: 'bg-green-100 text-green-800',
        text: 'Paid'
      },
      FAILED: {
        className: 'bg-red-100 text-red-800',
        text: 'Failed'
      }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const isPaymentOverdue = (payment) => {
    if (payment.status !== 'PENDING') return false;
    const today = new Date();
    const due = new Date(payment.dueDate);
    return today > due;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading rent payments...</p>
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
            My Rent Payments
          </h1>
          <p className="text-gray-600">
            View and manage your rent payment history for all your rental properties.
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
            onClick={fetchRentPayments}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Refresh Payments
          </button>
        </div>

        {/* Rent Data */}
        {rentData.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              No rent payments found.
            </div>
            <p className="text-gray-400 mt-2">
              You'll see rent payments here once you have accepted offers and leases have started.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {rentData.map((rental) => (
              <div key={rental.offerId} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Rental Property Header */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {rental.rentalRequest.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {rental.rentalRequest.location}
                      </p>
                      <p className="text-sm text-gray-500">
                        Monthly Rent: {formatCurrency(rental.rentAmount)}
                      </p>
                    </div>
                    <div className="text-right">
                      {rental.rentalRequest.isLocked && (
                        <div className="mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            🔒 LOCKED
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        Lease: {formatDate(rental.leaseStartDate)} - {formatDate(rental.leaseEndDate)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Locked Message */}
                  {rental.rentalRequest.isLocked && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">
                        ⚠️ This rental is locked due to overdue rent payments. Please contact your landlord to resolve this issue.
                      </p>
                    </div>
                  )}
                </div>

                {/* Rent Payments */}
                <div className="px-6 py-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Payment History
                  </h4>
                  
                  {rental.rentPayments.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      No rent payments recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {rental.rentPayments.map((payment) => (
                        <div 
                          key={payment.id} 
                          className={`p-4 rounded-lg border ${
                            isPaymentOverdue(payment) 
                              ? 'bg-red-50 border-red-200' 
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <span className="text-sm font-medium text-gray-900">
                                  {getMonthName(payment.month)} {payment.year}
                                </span>
                                {getPaymentStatusBadge(payment.status, payment.dueDate)}
                              </div>
                              
                              <div className="mt-1 text-sm text-gray-600">
                                <span>Due: {formatDate(payment.dueDate)}</span>
                                {payment.paidDate && (
                                  <span className="ml-4">Paid: {formatDate(payment.paidDate)}</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-lg font-semibold text-gray-900">
                                {formatCurrency(payment.amount)}
                              </div>
                              {isPaymentOverdue(payment) && (
                                <div className="text-xs text-red-600 mt-1">
                                  {Math.floor((new Date() - new Date(payment.dueDate)) / (1000 * 60 * 60 * 24))} days overdue
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantDashboardRent; 