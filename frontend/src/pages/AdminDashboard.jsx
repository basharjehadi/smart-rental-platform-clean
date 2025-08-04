import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const { user, api } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [healthMetrics, setHealthMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingKYC, setPendingKYC] = useState([]);
  const [rentalRequests, setRentalRequests] = useState([]);
  const [payments, setPayments] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter states
  const [userFilter, setUserFilter] = useState({ role: '', status: '', search: '' });
  const [requestFilter, setRequestFilter] = useState({ status: '', search: '' });
  const [paymentFilter, setPaymentFilter] = useState({ status: '', purpose: '' });

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchDashboardData();
    }
  }, [user, activeTab, currentPage, userFilter, requestFilter, paymentFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      switch (activeTab) {
        case 'overview':
          await Promise.all([
            fetchAnalytics(),
            fetchHealthMetrics()
          ]);
          break;
        case 'users':
          await fetchUsers();
          break;
        case 'kyc':
          await fetchPendingKYC();
          break;
        case 'rentals':
          await fetchRentalRequests();
          break;
        case 'payments':
          await fetchPayments();
          break;
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    const response = await api.get('/admin/analytics?period=30d');
    setAnalytics(response.data);
  };

  const fetchHealthMetrics = async () => {
    const response = await api.get('/admin/health');
    setHealthMetrics(response.data.healthMetrics);
  };

  const fetchUsers = async () => {
    const params = new URLSearchParams({
      page: currentPage,
      limit: 20,
      ...userFilter
    });
    const response = await api.get(`/admin/users?${params}`);
    setUsers(response.data.users);
    setTotalPages(response.data.pagination.pages);
  };

  const fetchPendingKYC = async () => {
    const response = await api.get('/admin/users/pending-kyc');
    setPendingKYC(response.data.users);
  };

  const fetchRentalRequests = async () => {
    const params = new URLSearchParams({
      page: currentPage,
      limit: 20,
      ...requestFilter
    });
    const response = await api.get(`/admin/rental-requests?${params}`);
    setRentalRequests(response.data.rentalRequests);
    setTotalPages(response.data.pagination.pages);
  };

  const fetchPayments = async () => {
    const params = new URLSearchParams({
      page: currentPage,
      limit: 20,
      ...paymentFilter
    });
    const response = await api.get(`/admin/payments?${params}`);
    setPayments(response.data.payments);
    setTotalPages(response.data.pagination.pages);
  };

  const handleKYCVerification = async (userId, isApproved, rejectionReason = '') => {
    try {
      setLoading(true);
      await api.put(`/admin/users/${userId}/kyc`, {
        isApproved,
        rejectionReason
      });

      setSuccess(`KYC ${isApproved ? 'approved' : 'rejected'} successfully`);
      setTimeout(() => setSuccess(''), 3000);

      // Refresh KYC data
      await fetchPendingKYC();
    } catch (error) {
      console.error('Error verifying KYC:', error);
      setError('Failed to verify KYC');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSuspension = async (userId, isSuspended, reason = '') => {
    try {
      setLoading(true);
      await api.put(`/admin/users/${userId}/suspension`, {
        isSuspended,
        reason
      });

      setSuccess(`User ${isSuspended ? 'suspended' : 'unsuspended'} successfully`);
      setTimeout(() => setSuccess(''), 3000);

      // Refresh users data
      await fetchUsers();
    } catch (error) {
      console.error('Error toggling user suspension:', error);
      setError('Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemMaintenance = async (action) => {
    try {
      setLoading(true);
      const response = await api.post('/admin/maintenance', { action });
      setSuccess(response.data.message);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error triggering maintenance:', error);
      setError('Failed to trigger maintenance');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const getStatusBadge = (status, type = 'default') => {
    const configs = {
      user: {
        'verified': { color: 'bg-green-100 text-green-800', text: 'Verified' },
        'unverified': { color: 'bg-yellow-100 text-yellow-800', text: 'Unverified' },
        'suspended': { color: 'bg-red-100 text-red-800', text: 'Suspended' }
      },
      request: {
        'ACTIVE': { color: 'bg-green-100 text-green-800', text: 'Active' },
        'LOCKED': { color: 'bg-red-100 text-red-800', text: 'Locked' },
        'EXPIRED': { color: 'bg-gray-100 text-gray-800', text: 'Expired' }
      },
      payment: {
        'SUCCEEDED': { color: 'bg-green-100 text-green-800', text: 'Succeeded' },
        'PENDING': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
        'FAILED': { color: 'bg-red-100 text-red-800', text: 'Failed' }
      },
      default: {
        'active': { color: 'bg-green-100 text-green-800', text: 'Active' },
        'inactive': { color: 'bg-gray-100 text-gray-800', text: 'Inactive' }
      }
    };

    const config = configs[type]?.[status] || configs.default[status] || { color: 'bg-gray-100 text-gray-800', text: status };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.analytics.totalUsers}</p>
                <p className="text-sm text-green-600">+{analytics.analytics.newUsers} new</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">🏠</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rental Requests</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.analytics.totalRentalRequests}</p>
                <p className="text-sm text-green-600">+{analytics.analytics.newRentalRequests} new</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">💳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.analytics.totalRevenue)}</p>
                <p className="text-sm text-green-600">{analytics.analytics.totalPayments} payments</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending KYC</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.analytics.pendingKYC}</p>
                <p className="text-sm text-yellow-600">Needs review</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Health */}
      {healthMetrics && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">User Activity</p>
              <p className="text-lg font-semibold">{healthMetrics.users.activePercentage}% active</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Success Rate</p>
              <p className="text-lg font-semibold">{healthMetrics.payments.successRate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">System Uptime</p>
              <p className="text-lg font-semibold">{healthMetrics.system.uptime}h</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex space-x-4">
          <button
            onClick={() => handleSystemMaintenance('cleanup_expired_requests')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Cleanup Expired Requests
          </button>
          <button
            onClick={() => handleSystemMaintenance('generate_missing_contracts')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Generate Missing Contracts
          </button>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={userFilter.role}
            onChange={(e) => setUserFilter({ ...userFilter, role: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Roles</option>
            <option value="TENANT">Tenant</option>
            <option value="LANDLORD">Landlord</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            value={userFilter.status}
            onChange={(e) => setUserFilter({ ...userFilter, status: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
          <input
            type="text"
            placeholder="Search users..."
            value={userFilter.search}
            onChange={(e) => setUserFilter({ ...userFilter, search: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{user.role}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.isVerified ? 'verified' : 'unverified', 'user')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user._count.rentalRequests} requests, {user._count.offers} offers
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleUserSuspension(user.id, !user.isSuspended, 'Admin action')}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderKYC = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Pending KYC Verification</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingKYC.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{user.role}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a
                      href={`http://localhost:3001/${user.identityDocument}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View Document
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleKYCVerification(user.id, true)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Enter rejection reason:');
                        if (reason) handleKYCVerification(user.id, false, reason);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRentals = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={requestFilter.status}
            onChange={(e) => setRequestFilter({ ...requestFilter, status: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="LOCKED">Locked</option>
            <option value="EXPIRED">Expired</option>
          </select>
          <input
            type="text"
            placeholder="Search requests..."
            value={requestFilter.search}
            onChange={(e) => setRequestFilter({ ...requestFilter, search: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      {/* Rental Requests List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Rental Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Offer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rentalRequests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{request.title}</div>
                      <div className="text-sm text-gray-500">{request.budget} PLN</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{request.tenant.name}</div>
                      <div className="text-sm text-gray-500">{request.tenant.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.poolStatus, 'request')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.offer ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{request.offer.landlord.name}</div>
                        <div className="text-sm text-gray-500">{request.offer.status}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No offer</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(request.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={paymentFilter.status}
            onChange={(e) => setPaymentFilter({ ...paymentFilter, status: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="SUCCEEDED">Succeeded</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
          <select
            value={paymentFilter.purpose}
            onChange={(e) => setPaymentFilter({ ...paymentFilter, purpose: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Purposes</option>
            <option value="DEPOSIT">Deposit</option>
            <option value="RENT">Rent</option>
            <option value="DEPOSIT_AND_FIRST_MONTH">Deposit + First Month</option>
          </select>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Payments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{payment.purpose}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(payment.status, 'payment')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{payment.rentalRequest.tenant.name}</div>
                      <div className="text-sm text-gray-500">{payment.rentalRequest.tenant.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(payment.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="mt-2 text-gray-600">You don't have permission to access the admin dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🔧 Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage users, verify KYC, and monitor system health</p>
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

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'users', name: 'Users', icon: '👥' },
              { id: 'kyc', name: 'KYC Verification', icon: '📋' },
              { id: 'rentals', name: 'Rental Requests', icon: '🏠' },
              { id: 'payments', name: 'Payments', icon: '💳' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'kyc' && renderKYC()}
            {activeTab === 'rentals' && renderRentals()}
            {activeTab === 'payments' && renderPayments()}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 