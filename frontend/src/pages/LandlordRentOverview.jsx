import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LandlordRentOverview = () => {
  const [rentOverview, setRentOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);

  const { api } = useAuth();

  // Fetch rent overview on component mount
  useEffect(() => {
    fetchRentOverview();
  }, []);

  const fetchRentOverview = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching landlord rent overview...');
      const response = await api.get('/landlord-rents');
      console.log('Rent overview response:', response.data);
      
      setRentOverview(response.data.rentOverview || []);
    } catch (error) {
      console.error('Error fetching rent overview:', error);
      setError(error.response?.data?.error || 'Failed to fetch rent overview');
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      PAID: {
        className: 'bg-green-100 text-green-800',
        text: 'Paid',
        icon: '✅'
      },
      UNPAID: {
        className: 'bg-yellow-100 text-yellow-800',
        text: 'Unpaid',
        icon: '⏳'
      },
      OVERDUE: {
        className: 'bg-red-100 text-red-800',
        text: 'Overdue',
        icon: '⚠️'
      }
    };

    const config = statusConfig[status] || statusConfig.UNPAID;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.icon} {config.text}
      </span>
    );
  };

  const getPaymentStatusBadge = (status, dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const isOverdue = status === 'PENDING' && today > due;

    if (isOverdue) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
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
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.icon} {config.text}
      </span>
    );
  };

  const calculateDaysOverdue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    return Math.floor((today - due) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading rent overview...</p>
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
            Rent Overview
          </h1>
          <p className="text-gray-600">
            Monitor rent payments from all your tenants and track payment status.
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
            onClick={fetchRentOverview}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Refresh Overview
          </button>
        </div>

        {/* Summary Statistics */}
        {rentOverview.length > 0 && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Total Tenants</div>
              <div className="text-2xl font-bold text-gray-900">{rentOverview.length}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Paid This Month</div>
              <div className="text-2xl font-bold text-green-600">
                {rentOverview.filter(r => r.currentStatus === 'PAID').length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Unpaid</div>
              <div className="text-2xl font-bold text-yellow-600">
                {rentOverview.filter(r => r.currentStatus === 'UNPAID').length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Overdue</div>
              <div className="text-2xl font-bold text-red-600">
                {rentOverview.filter(r => r.currentStatus === 'OVERDUE').length}
              </div>
            </div>
          </div>
        )}

        {/* Rent Overview */}
        {rentOverview.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              No active tenants found.
            </div>
            <p className="text-gray-400 mt-2">
              You'll see tenant information here once they accept your offers and leases begin.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {rentOverview.map((rental) => (
              <div key={rental.offerId} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Tenant Header */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {rental.tenant.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {rental.tenant.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        Property: {rental.rentalRequest.title} - {rental.rentalRequest.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="mb-2">
                        {getStatusBadge(rental.currentStatus)}
                      </div>
                      <p className="text-sm text-gray-500">
                        Monthly Rent: {formatCurrency(rental.rentAmount)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Lease: {formatDate(rental.leaseStartDate)} - {formatDate(rental.leaseEndDate)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current Month Status */}
                <div className="px-6 py-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Current Month Status
                  </h4>
                  
                  {rental.currentPayment ? (
                    <div className={`p-4 rounded-lg border ${
                      rental.currentStatus === 'OVERDUE' 
                        ? 'bg-red-50 border-red-200' 
                        : rental.currentStatus === 'PAID'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-gray-900">
                              {getMonthName(rental.currentPayment.month)} {rental.currentPayment.year}
                            </span>
                            {getPaymentStatusBadge(rental.currentPayment.status, rental.currentPayment.dueDate)}
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            <span>Due: {formatDate(rental.currentPayment.dueDate)}</span>
                            {rental.currentPayment.paidDate && (
                              <span className="ml-4">Paid: {formatDate(rental.currentPayment.paidDate)}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(rental.currentPayment.amount)}
                          </div>
                          {rental.currentStatus === 'OVERDUE' && (
                            <div className="text-xs text-red-600 mt-1">
                              {calculateDaysOverdue(rental.currentPayment.dueDate)} days overdue
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600">
                        No payment record for current month yet.
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment Statistics */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{rental.totalPayments}</div>
                      <div className="text-xs text-gray-500">Total Payments</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-600">{rental.paidPayments}</div>
                      <div className="text-xs text-gray-500">Paid</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-yellow-600">{rental.pendingPayments}</div>
                      <div className="text-xs text-gray-500">Pending</div>
                    </div>
                  </div>
                </div>

                {/* Overdue Payments Warning */}
                {rental.overduePayments.length > 0 && (
                  <div className="px-6 py-4 bg-red-50 border-t border-red-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-red-600">⚠️</span>
                      <span className="text-sm font-medium text-red-800">
                        {rental.overduePayments.length} overdue payment(s)
                      </span>
                    </div>
                    <p className="text-xs text-red-600 mt-1">
                      Consider contacting the tenant about overdue payments.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LandlordRentOverview; 