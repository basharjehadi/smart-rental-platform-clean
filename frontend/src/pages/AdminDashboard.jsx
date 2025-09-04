import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import NotificationHeader from '../components/common/NotificationHeader';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
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
  const [overduePayments, setOverduePayments] = useState([]);
  const [overdueSummary, setOverdueSummary] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [contractSummary, setContractSummary] = useState(null);

  const [evidencePreview, setEvidencePreview] = useState({ url: '', type: '' });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter states
  const [userFilter, setUserFilter] = useState({
    role: '',
    status: '',
    search: '',
  });
  const [requestFilter, setRequestFilter] = useState({
    status: '',
    search: '',
  });
  const [paymentFilter, setPaymentFilter] = useState({
    status: '',
    purpose: '',
  });
  const [overdueFilter, setOverdueFilter] = useState({
    search: '',
    daysOverdue: '',
  });
  const [contractFilter, setContractFilter] = useState({
    status: '',
    search: '',
  });

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchDashboardData();
    }
  }, [
    user,
    activeTab,
    currentPage,
    userFilter,
    requestFilter,
    paymentFilter,
    overdueFilter,
    contractFilter,
  ]);

  // Sync active tab from query param (e.g., /admin?tab=movein)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      switch (activeTab) {
        case 'overview':
          await Promise.all([
            fetchAnalytics(),
            fetchHealthMetrics(),
            fetchOverduePayments(),
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
        case 'overdue':
          await fetchOverduePayments();
          break;
        case 'contracts':
          await fetchContracts();
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
    try {
      const response = await api.get('/admin/analytics?period=30d');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchHealthMetrics = async () => {
    try {
      const response = await api.get('/admin/health');
      setHealthMetrics(response.data.healthMetrics);
    } catch (error) {
      console.error('Error fetching health metrics:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...userFilter,
      });
      const response = await api.get(`/admin/users?${params}`);
      setUsers(response.data.users);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchPendingKYC = async () => {
    try {
      const response = await api.get('/admin/users/pending-kyc');
      setPendingKYC(response.data.users);
    } catch (error) {
      console.error('Error fetching pending KYC:', error);
    }
  };

  const fetchRentalRequests = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...requestFilter,
      });
      const response = await api.get(`/admin/rental-requests?${params}`);
      setRentalRequests(response.data.rentalRequests);
    } catch (error) {
      console.error('Error fetching rental requests:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...paymentFilter,
      });
      const response = await api.get(`/admin/payments?${params}`);
      setPayments(response.data.payments);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchOverduePayments = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...overdueFilter,
      });
      const response = await api.get(`/admin/payments/overdue?${params}`);
      setOverduePayments(response.data.overduePayments);
      setOverdueSummary(response.data.summary);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching overdue payments:', error);
    }
  };

  const fetchContracts = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...contractFilter,
      });
      const response = await api.get(`/admin/contracts?${params}`);
      setContracts(response.data.contracts);
      setContractSummary(response.data.summary);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };



  const handleKYCVerification = async (
    userId,
    isApproved,
    rejectionReason = ''
  ) => {
    try {
      await api.put(`/admin/users/${userId}/kyc`, {
        isApproved,
        rejectionReason,
      });
      setSuccess(`KYC ${isApproved ? 'approved' : 'rejected'} successfully`);
      fetchPendingKYC();
    } catch (error) {
      console.error('Error updating KYC status:', error);
      setError('Failed to update KYC status');
    }
  };

  const handleUserSuspension = async (userId, isSuspended, reason = '') => {
    try {
      await api.put(`/admin/users/${userId}/suspension`, {
        isSuspended,
        reason,
      });
      setSuccess(
        `User ${isSuspended ? 'suspended' : 'unsuspended'} successfully`
      );
      fetchUsers();
    } catch (error) {
      console.error('Error updating user suspension:', error);
      setError('Failed to update user suspension');
    }
  };

  const handleSystemMaintenance = async action => {
    try {
      await api.post('/admin/system/maintenance', { action });
      setSuccess(`System maintenance ${action} initiated successfully`);
    } catch (error) {
      console.error('Error initiating system maintenance:', error);
      setError('Failed to initiate system maintenance');
    }
  };

  const handleDownloadContract = async contractId => {
    try {
      const response = await api.get(
        `/admin/contracts/${contractId}/download`,
        {
          responseType: 'blob',
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `admin-contract-${contractId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading contract:', error);
      setError('Failed to download contract');
    }
  };

  const handleViewContract = async contractId => {
    try {
      const response = await api.get(`/admin/contracts/${contractId}`);
      if (response.data.contract?.pdfUrl) {
        // Open contract in new tab - use the backend URL directly
        const contractUrl = `http://localhost:3001${response.data.contract.pdfUrl}`;
        console.log('Opening contract URL:', contractUrl);
        window.open(contractUrl, '_blank');
      } else {
        setError('Contract PDF not available');
      }
    } catch (error) {
      console.error('Error viewing contract:', error);
      setError('Failed to view contract');
    }
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status, type = 'default') => {
    const configs = {
      default: {
        ACTIVE: {
          bg: 'bg-green-100',
          textColor: 'text-green-800',
          label: 'Active',
        },
        SUSPENDED: {
          bg: 'bg-red-100',
          textColor: 'text-red-800',
          label: 'Suspended',
        },
        PENDING: {
          bg: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          label: 'Pending',
        },
        APPROVED: {
          bg: 'bg-green-100',
          textColor: 'text-green-800',
          label: 'Approved',
        },
        REJECTED: {
          bg: 'bg-red-100',
          textColor: 'text-red-800',
          label: 'Rejected',
        },
        SIGNED: {
          bg: 'bg-green-100',
          textColor: 'text-green-800',
          label: 'Signed',
        },
        COMPLETED: {
          bg: 'bg-blue-100',
          textColor: 'text-blue-800',
          label: 'Completed',
        },
        EXPIRED: {
          bg: 'bg-red-100',
          textColor: 'text-red-800',
          label: 'Expired',
        },
        CANCELLED: {
          bg: 'bg-gray-100',
          textColor: 'text-gray-800',
          label: 'Cancelled',
        },
      },
    };

    const config = configs[type]?.[status] ||
      configs.default[status] || {
        bg: 'bg-gray-100',
        textColor: 'text-gray-800',
        label: status,
      };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.textColor}`}
      >
        {config.label}
      </span>
    );
  };

  // Calculate counts for overview
  const getOverviewCounts = () => {
    return {
      totalUsers: analytics?.totalUsers || 0,
      totalRequests: analytics?.totalRequests || 0,
      totalPayments: analytics?.totalPayments || 0,
      pendingKYC: pendingKYC.length,
    };
  };

  const renderOverview = () => (
    <div className='space-y-6'>
      {/* Status Overview Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6'>
        <div className='bg-white border border-gray-200 rounded-lg p-6'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-5 h-5 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
                  />
                </svg>
              </div>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>Total Users</p>
              <p className='text-2xl font-semibold text-gray-900'>
                {getOverviewCounts().totalUsers}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white border border-gray-200 rounded-lg p-6'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
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
                    d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                  />
                </svg>
              </div>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>
                Total Requests
              </p>
              <p className='text-2xl font-semibold text-gray-900'>
                {getOverviewCounts().totalRequests}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white border border-gray-200 rounded-lg p-6'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <div className='w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-5 h-5 text-purple-600'
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
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>
                Total Payments
              </p>
              <p className='text-2xl font-semibold text-gray-900'>
                {getOverviewCounts().totalPayments}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white border border-gray-200 rounded-lg p-6'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <div className='w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-5 h-5 text-yellow-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>Pending KYC</p>
              <p className='text-2xl font-semibold text-gray-900'>
                {getOverviewCounts().pendingKYC}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white border border-gray-200 rounded-lg p-6'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <div className='w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-5 h-5 text-red-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
              </div>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>
                Overdue Payments
              </p>
              <p className='text-2xl font-semibold text-red-600'>
                {overdueSummary?.total || 0}
              </p>
              <p className='text-xs text-red-600'>
                {overdueSummary?.critical || 0} critical
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      {healthMetrics && (
        <div className='bg-white border border-gray-200 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            System Health
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='text-center'>
              <p className='text-sm text-gray-600'>Active Users</p>
              <p className='text-lg font-semibold text-green-600'>
                {healthMetrics.users?.active || 0}
              </p>
              <p className='text-xs text-gray-500'>
                {healthMetrics.users?.activePercentage || 0}% of total
              </p>
            </div>
            <div className='text-center'>
              <p className='text-sm text-gray-600'>Active Requests</p>
              <p className='text-lg font-semibold text-blue-600'>
                {healthMetrics.requests?.active || 0}
              </p>
              <p className='text-xs text-gray-500'>
                {healthMetrics.requests?.activePercentage || 0}% of total
              </p>
            </div>
            <div className='text-center'>
              <p className='text-sm text-gray-600'>Payment Success</p>
              <p className='text-lg font-semibold text-purple-600'>
                {healthMetrics.payments?.successRate || 0}%
              </p>
              <p className='text-xs text-gray-500'>
                {healthMetrics.payments?.successful || 0} successful
              </p>
            </div>
            <div className='text-center'>
              <p className='text-sm text-gray-600'>System Uptime</p>
              <p className='text-lg font-semibold text-gray-900'>
                {healthMetrics.system?.uptime || 0}h
              </p>
              <p className='text-xs text-green-600'>
                {healthMetrics.system?.status || 'unknown'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold text-gray-900'>User Management</h2>
        <div className='flex space-x-3'>
          <input
            type='text'
            placeholder='Search users...'
            value={userFilter.search}
            onChange={e =>
              setUserFilter({ ...userFilter, search: e.target.value })
            }
            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
          />
          <select
            value={userFilter.role}
            onChange={e =>
              setUserFilter({ ...userFilter, role: e.target.value })
            }
            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
          >
            <option value=''>All Roles</option>
            <option value='TENANT'>Tenant</option>
            <option value='LANDLORD'>Landlord</option>
            <option value='ADMIN'>Admin</option>
          </select>
        </div>
      </div>

      <div className='bg-white border border-gray-200 rounded-lg overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  User
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Role
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Joined
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {users.map(user => (
                <tr key={user.id}>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center'>
                      <div className='w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center'>
                        <span className='text-sm font-medium text-gray-700'>
                          {user.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className='ml-4'>
                        <div className='text-sm font-medium text-gray-900'>
                          {user.name}
                        </div>
                        <div className='text-sm text-gray-500'>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className='text-sm text-gray-900'>{user.role}</span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    {getStatusBadge(user.isSuspended ? 'SUSPENDED' : 'ACTIVE')}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {formatDate(user.createdAt)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                    <button
                      onClick={() =>
                        handleUserSuspension(user.id, !user.isSuspended)
                      }
                      className={`text-${user.isSuspended ? 'green' : 'red'}-600 hover:text-${user.isSuspended ? 'green' : 'red'}-900`}
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
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold text-gray-900'>
          Pending KYC Verifications
        </h2>
      </div>

      <div className='bg-white border border-gray-200 rounded-lg overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  User
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Documents
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Submitted
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {pendingKYC.map(user => (
                <tr key={user.id}>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center'>
                      <div className='w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center'>
                        <span className='text-sm font-medium text-gray-700'>
                          {user.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className='ml-4'>
                        <div className='text-sm font-medium text-gray-900'>
                          {user.name}
                        </div>
                        <div className='text-sm text-gray-500'>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className='text-sm text-gray-900'>
                      {user.identityDocument ? 'ID Document' : 'No documents'}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {formatDate(user.updatedAt)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2'>
                    <button
                      onClick={() => handleKYCVerification(user.id, true)}
                      className='text-green-600 hover:text-green-900'
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        handleKYCVerification(
                          user.id,
                          false,
                          'Documents not sufficient'
                        )
                      }
                      className='text-red-600 hover:text-red-900'
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
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold text-gray-900'>Rental Requests</h2>
        <div className='flex space-x-3'>
          <input
            type='text'
            placeholder='Search requests...'
            value={requestFilter.search}
            onChange={e =>
              setRequestFilter({ ...requestFilter, search: e.target.value })
            }
            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
          />
          <select
            value={requestFilter.status}
            onChange={e =>
              setRequestFilter({ ...requestFilter, status: e.target.value })
            }
            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
          >
            <option value=''>All Statuses</option>
            <option value='ACTIVE'>Active</option>
            <option value='LOCKED'>Locked</option>
            <option value='COMPLETED'>Completed</option>
            <option value='CANCELLED'>Cancelled</option>
          </select>
        </div>
      </div>

      <div className='bg-white border border-gray-200 rounded-lg overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Request
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Tenant
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Budget
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Created
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {rentalRequests.map(request => (
                <tr key={request.id}>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div>
                      <div className='text-sm font-medium text-gray-900'>
                        {request.title}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {request.location}
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className='text-sm text-gray-900'>
                      {request.tenant?.name}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className='text-sm text-gray-900'>
                      {formatCurrency(request.budgetFrom)} -{' '}
                      {formatCurrency(request.budgetTo)}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    {getStatusBadge(request.status)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
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
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold text-gray-900'>Payment History</h2>
        <div className='flex space-x-3'>
          <select
            value={paymentFilter.status}
            onChange={e =>
              setPaymentFilter({ ...paymentFilter, status: e.target.value })
            }
            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
          >
            <option value=''>All Statuses</option>
            <option value='PENDING'>Pending</option>
            <option value='COMPLETED'>Completed</option>
            <option value='FAILED'>Failed</option>
          </select>
          <select
            value={paymentFilter.purpose}
            onChange={e =>
              setPaymentFilter({ ...paymentFilter, purpose: e.target.value })
            }
            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
          >
            <option value=''>All Purposes</option>
            <option value='RENT'>Rent</option>
            <option value='DEPOSIT'>Deposit</option>
            <option value='SERVICE_FEE'>Service Fee</option>
          </select>
        </div>
      </div>

      <div className='bg-white border border-gray-200 rounded-lg overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Payment
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  User
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Amount
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Purpose
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Date
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {payments.map(payment => (
                <tr key={payment.id}>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm font-medium text-gray-900'>
                      #{payment.paymentIntentId}
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className='text-sm text-gray-900'>
                      {payment.user?.name}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className='text-sm font-medium text-gray-900'>
                      {formatCurrency(payment.amount)}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className='text-sm text-gray-900'>
                      {payment.purpose}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
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

  const renderOverduePayments = () => (
    <div className='space-y-6'>
      {/* Summary Cards */}
      {overdueSummary && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
          <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
            <div className='flex items-center'>
              <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
                <svg
                  className='w-6 h-6 text-red-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-red-600'>
                  Critical Overdue
                </p>
                <p className='text-2xl font-bold text-red-900'>
                  {overdueSummary.critical}
                </p>
                <p className='text-xs text-red-600'>
                  {formatCurrency(overdueSummary.criticalAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-orange-50 border border-orange-200 rounded-lg p-6'>
            <div className='flex items-center'>
              <div className='w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center'>
                <svg
                  className='w-6 h-6 text-orange-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-orange-600'>
                  Severe Overdue
                </p>
                <p className='text-2xl font-bold text-orange-900'>
                  {overdueSummary.severe}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-6'>
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
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-yellow-600'>
                  Moderate Overdue
                </p>
                <p className='text-2xl font-bold text-yellow-900'>
                  {overdueSummary.moderate}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-gray-50 border border-gray-200 rounded-lg p-6'>
            <div className='flex items-center'>
              <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center'>
                <svg
                  className='w-6 h-6 text-gray-600'
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
                <p className='text-sm font-medium text-gray-600'>
                  Total Overdue
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {overdueSummary.total}
                </p>
                <p className='text-xs text-gray-600'>
                  {formatCurrency(overdueSummary.totalAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold text-gray-900'>
          Overdue Payments
        </h2>
        <div className='flex space-x-3'>
          <input
            type='text'
            placeholder='Search by tenant name or email...'
            value={overdueFilter.search}
            onChange={e =>
              setOverdueFilter({ ...overdueFilter, search: e.target.value })
            }
            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
          />
          <select
            value={overdueFilter.daysOverdue}
            onChange={e =>
              setOverdueFilter({
                ...overdueFilter,
                daysOverdue: e.target.value,
              })
            }
            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
          >
            <option value=''>All Overdue</option>
            <option value='7'>7+ Days Overdue</option>
            <option value='15'>15+ Days Overdue</option>
            <option value='30'>30+ Days Overdue</option>
          </select>
        </div>
      </div>

      {/* Overdue Payments Table */}
      <div className='bg-white border border-gray-200 rounded-lg overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Tenant
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Property
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Landlord
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Due Date
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Days Overdue
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Amount
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {overduePayments.map(payment => (
                <tr
                  key={payment.id}
                  className={
                    payment.isCritical
                      ? 'bg-red-50'
                      : payment.isSevere
                        ? 'bg-orange-50'
                        : payment.isModerate
                          ? 'bg-yellow-50'
                          : ''
                  }
                >
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div>
                      <div className='text-sm font-medium text-gray-900'>
                        {payment.rentalRequest?.tenant?.firstName}{' '}
                        {payment.rentalRequest?.tenant?.lastName}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {payment.rentalRequest?.tenant?.email}
                      </div>
                      <div className='text-xs text-gray-400'>
                        {payment.rentalRequest?.tenant?.phoneNumber}
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm text-gray-900'>
                      {payment.rentalRequest?.offers?.[0]?.property?.title ||
                        'N/A'}
                    </div>
                    <div className='text-xs text-gray-500'>
                      {payment.rentalRequest?.offers?.[0]?.property?.address},{' '}
                      {payment.rentalRequest?.offers?.[0]?.property?.city}
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm text-gray-900'>
                      {payment.rentalRequest?.offers?.[0]?.landlord?.name ||
                        'N/A'}
                    </div>
                    <div className='text-xs text-gray-500'>
                      {payment.rentalRequest?.offers?.[0]?.landlord?.email}
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm text-gray-900'>
                      {formatDate(payment.dueDate)}
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payment.isCritical
                          ? 'bg-red-100 text-red-800'
                          : payment.isSevere
                            ? 'bg-orange-100 text-orange-800'
                            : payment.isModerate
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {payment.daysOverdue} days
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className='text-sm font-medium text-gray-900'>
                      {formatCurrency(payment.amount)}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'>
                      Overdue
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                    <button className='text-blue-600 hover:text-blue-900 mr-3'>
                      Contact Tenant
                    </button>
                    <button className='text-blue-600 hover:text-blue-900'>
                      Contact Landlord
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {overduePayments.length === 0 && (
          <div className='text-center py-8'>
            <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg
                className='w-8 h-8 text-green-600'
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
            <p className='text-gray-600'>No overdue payments found!</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderContracts = () => (
    <div>
      <div className='mb-6'>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>
          Contract Management
        </h2>
        <p className='text-gray-600'>
          View and manage all rental contracts across the platform
        </p>
      </div>

      {/* Summary Cards */}
      {contractSummary && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-6'>
          <div className='bg-white p-6 rounded-lg shadow'>
            <div className='flex items-center'>
              <div className='p-2 bg-blue-100 rounded-lg'>
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
                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>
                  Total Contracts
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {contracts.length}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white p-6 rounded-lg shadow'>
            <div className='flex items-center'>
              <div className='p-2 bg-green-100 rounded-lg'>
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
                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Signed</p>
                <p className='text-2xl font-bold text-green-600'>
                  {contractSummary.SIGNED || 0}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white p-6 rounded-lg shadow'>
            <div className='flex items-center'>
              <div className='p-2 bg-purple-100 rounded-lg'>
                <svg
                  className='w-6 h-6 text-purple-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
                  />
                </svg>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Signed</p>
                <p className='text-2xl font-bold text-purple-600'>
                  {contractSummary.SIGNED || 0}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white p-6 rounded-lg shadow'>
            <div className='flex items-center'>
              <div className='p-2 bg-gray-100 rounded-lg'>
                <svg
                  className='w-6 h-6 text-gray-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Completed</p>
                <p className='text-2xl font-bold text-gray-600'>
                  {contractSummary.COMPLETED || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className='bg-white p-6 rounded-lg shadow mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Search
            </label>
            <input
              type='text'
              placeholder='Search by contract number, tenant, or landlord...'
              value={contractFilter.search}
              onChange={e =>
                setContractFilter(prev => ({ ...prev, search: e.target.value }))
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Status
            </label>
            <select
              value={contractFilter.status}
              onChange={e =>
                setContractFilter(prev => ({ ...prev, status: e.target.value }))
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value=''>All Statuses</option>
              <option value='SIGNED'>Signed</option>
              <option value='COMPLETED'>Completed</option>
              <option value='EXPIRED'>Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contracts List */}
      <div className='bg-white shadow overflow-hidden sm:rounded-md'>
        {contracts.length === 0 ? (
          <div className='text-center py-12'>
            <svg
              className='mx-auto h-12 w-12 text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
            <h3 className='mt-2 text-sm font-medium text-gray-900'>
              No contracts found
            </h3>
            <p className='mt-1 text-sm text-gray-500'>
              No contracts match your current filters.
            </p>
          </div>
        ) : (
          <ul className='divide-y divide-gray-200'>
            {contracts.map(contract => (
              <li key={contract.id} className='px-6 py-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <h3 className='text-lg font-medium text-gray-900'>
                          Contract #{contract.contractNumber}
                        </h3>
                        <p className='text-sm text-gray-600 mt-1'>
                          {contract.rentalRequest?.tenant?.name ||
                            'Unknown Tenant'}{' '}
                          -{' '}
                          {contract.rentalRequest?.offers?.[0]?.landlord
                            ?.name || 'Unknown Landlord'}
                        </p>
                        <div className='flex items-center mt-2 space-x-4 text-sm text-gray-500'>
                          <span>Created: {formatDate(contract.createdAt)}</span>
                          {contract.signedAt && (
                            <span>Signed: {formatDate(contract.signedAt)}</span>
                          )}
                          <span>Status: {getStatusBadge(contract.status)}</span>
                        </div>
                      </div>
                      <div className='flex items-center space-x-3'>
                        <button
                          onClick={() => handleViewContract(contract.id)}
                          className='px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm'
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDownloadContract(contract.id)}
                          className='px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm'
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='mt-6 flex items-center justify-between'>
          <div className='flex-1 flex justify-between sm:hidden'>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className='relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50'
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage(prev => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className='ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50'
            >
              Next
            </button>
          </div>
          <div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
            <div>
              <p className='text-sm text-gray-700'>
                Showing page <span className='font-medium'>{currentPage}</span>{' '}
                of <span className='font-medium'>{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px'>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className='relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50'
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(prev => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className='relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50'
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const getEvidenceType = path => {
    const lower = (path || '').toLowerCase();
    if (/\.(jpg|jpeg|png|webp|gif)$/.test(lower)) return 'image';
    if (/\.(mp4|webm|ogg)$/.test(lower)) return 'video';
    if (/\.(pdf)$/.test(lower)) return 'pdf';
    return 'file';
  };

  const renderEvidenceItem = (fullUrl, type, idx) => {
    if (type === 'image') {
      return (
        <button
          key={idx}
          className='block focus:outline-none'
          onClick={() => setEvidencePreview({ url: fullUrl, type })}
        >
          <img
            src={fullUrl}
            alt='evidence'
            className='h-32 w-48 object-cover rounded border'
          />
        </button>
      );
    }
    if (type === 'video') {
      return (
        <div
          key={idx}
          className='h-32 w-48 rounded border overflow-hidden bg-black'
        >
          <video
            src={fullUrl}
            className='h-full w-full object-cover'
            controls
            onClick={() => setEvidencePreview({ url: fullUrl, type })}
          />
        </div>
      );
    }
    if (type === 'pdf') {
      return (
        <a
          key={idx}
          href={fullUrl}
          target='_blank'
          rel='noreferrer'
          className='h-32 w-48 flex items-center justify-center rounded border bg-gray-50 text-sm text-blue-700 underline'
        >
          Open PDF
        </a>
      );
    }
    return (
      <a
        key={idx}
        href={fullUrl}
        target='_blank'
        rel='noreferrer'
        className='h-32 w-48 flex items-center justify-center rounded border bg-gray-50 text-sm text-blue-700 underline'
      >
        Download
      </a>
    );
  };



  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'users':
        return renderUsers();
      case 'kyc':
        return renderKYC();
      case 'rentals':
        return renderRentals();
      case 'payments':
        return renderPayments();
      case 'overdue':
        return renderOverduePayments();
      case 'contracts':
        return renderContracts();

      default:
        return renderOverview();
    }
  };

  return (
    <div className='min-h-screen bg-white flex'>
      {/* Left Sidebar */}
      <div className='w-64 bg-white border-r border-gray-200 flex flex-col'>
        {/* Logo */}
        <div className='p-6 border-b border-gray-200'>
          <div className='flex items-center'>
            <div className='w-8 h-8 bg-black rounded-lg flex items-center justify-center mr-3'>
              <span className='text-white font-bold text-sm'>R</span>
            </div>
            <span className='text-lg font-semibold text-gray-900'>
              RentPlatform Poland
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className='flex-1 p-4'>
          <div className='space-y-2'>
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'overview'
                  ? 'text-white bg-black'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <svg
                className='w-5 h-5 mr-3'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z'
                />
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z'
                />
              </svg>
              Overview
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'users'
                  ? 'text-white bg-black'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <svg
                className='w-5 h-5 mr-3'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
                />
              </svg>
              Users
            </button>

            <button
              onClick={() => setActiveTab('kyc')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'kyc'
                  ? 'text-white bg-black'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <svg
                className='w-5 h-5 mr-3'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              KYC Verification
            </button>

            <button
              onClick={() => setActiveTab('rentals')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'rentals'
                  ? 'text-white bg-black'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <svg
                className='w-5 h-5 mr-3'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
              Rental Requests
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'payments'
                  ? 'text-white bg-black'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <svg
                className='w-5 h-5 mr-3'
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
              Payments
            </button>

            <button
              onClick={() => setActiveTab('overdue')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'overdue'
                  ? 'text-white bg-black'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <svg
                className='w-5 h-5 mr-3'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
              Overdue Payments
            </button>

            <button
              onClick={() => setActiveTab('contracts')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'contracts'
                  ? 'text-white bg-black'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <svg
                className='w-5 h-5 mr-3'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
              Contracts
            </button>

            {/* Move-in Reviews */}
            <Link
              to='/admin/move-in-reviews'
              className='w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            >
              <svg
                className='w-5 h-5 mr-3'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              Move-in Reviews
            </Link>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className='flex-1 flex flex-col'>
        {/* Top Header */}
        <header className='bg-white border-b border-gray-200 px-6 py-4'>
          <div className='flex items-center justify-between'>
            <h1 className='text-2xl font-bold text-gray-900'>
              Admin Dashboard
            </h1>

            <div className='flex items-center space-x-4'>
              {/* Notification Header */}
              <NotificationHeader />

              <div className='flex items-center space-x-3'>
                <span className='text-sm font-medium text-gray-900'>
                  {user?.name || 'Admin'}
                </span>
                <div className='w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center'>
                  <span className='text-sm font-medium text-gray-700'>
                    {user?.name?.charAt(0) || 'A'}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                className='text-sm text-gray-600 hover:text-gray-900'
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className='flex-1 p-6'>
          <div className='max-w-7xl mx-auto'>
            {error && (
              <div className='mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
                {error}
              </div>
            )}

            {success && (
              <div className='mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded'>
                {success}
              </div>
            )}

            {loading ? (
              <div className='flex items-center justify-center h-64'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
              </div>
            ) : (
              renderContent()
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
