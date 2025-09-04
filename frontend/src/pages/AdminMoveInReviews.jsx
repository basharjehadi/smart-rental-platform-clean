import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import NotificationHeader from '../components/common/NotificationHeader';

const AdminMoveInReviews = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Load issues
  const loadIssues = async (page = 1, status = statusFilter) => {
    try {
      setLoading(true);
      setError(null);
      
             const params = new URLSearchParams({
         page: page.toString(),
         limit: pagination.limit.toString(),
       });
       
       if (status && status !== 'ALL') {
         params.append('status', status);
       } else {
         // For "ALL", send explicit default list
         params.append('status', 'OPEN,IN_PROGRESS,ESCALATED');
       }

      const response = await api.get(`/admin/move-in/issues?${params}`);
      
      if (response.data.success) {
        setIssues(response.data.data.items);
        setPagination({
          page: response.data.data.page,
          limit: response.data.data.pageSize,
          total: response.data.data.total,
          totalPages: Math.ceil(response.data.data.total / response.data.data.pageSize),
        });
      }
    } catch (error) {
      console.error('Error loading issues:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load issues';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load issues on component mount and when filters change
  useEffect(() => {
    loadIssues(1, statusFilter);
  }, [statusFilter]);

  // Handle status filter change
  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    loadIssues(newPage, statusFilter);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'OPEN': 'bg-red-100 text-red-800',
      'ESCALATED': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'RESOLVED': 'bg-green-100 text-green-800',
      'CLOSED': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading && issues.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading move-in issues...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => loadIssues()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white flex'>
      {/* Sidebar */}
      <div className='w-64 bg-gray-50 border-r border-gray-200 flex flex-col'>
        {/* Logo */}
        <div className='p-6 border-b border-gray-200'>
          <div className='flex items-center'>
            <div className='w-8 h-8 bg-black rounded-lg flex items-center justify-center mr-3'>
              <span className='text-white font-bold text-lg'>R</span>
            </div>
            <span className='text-xl font-bold text-gray-900'>RentPlatform Poland</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className='flex-1 p-4 space-y-2'>
          <Link
            to='/admin'
            className='w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          >
            <svg className='w-5 h-5 mr-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' />
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z' />
            </svg>
            Overview
          </Link>

          <Link
            to='/admin?tab=users'
            className='w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          >
            <svg className='w-5 h-5 mr-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' />
            </svg>
            Users
          </Link>

          <Link
            to='/admin?tab=kyc'
            className='w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          >
            <svg className='w-5 h-5 mr-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
            KYC Verification
          </Link>

          <Link
            to='/admin?tab=requests'
            className='w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          >
            <svg className='w-5 h-5 mr-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
            </svg>
            Rental Requests
          </Link>

          <Link
            to='/admin?tab=payments'
            className='w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          >
            <svg className='w-5 h-5 mr-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' />
            </svg>
            Payments
          </Link>

          <Link
            to='/admin?tab=overdue'
            className='w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          >
            <svg className='w-5 h-5 mr-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
            Overdue Payments
          </Link>

          <Link
            to='/admin?tab=contracts'
            className='w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          >
            <svg className='w-5 h-5 mr-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
            </svg>
            Contracts
          </Link>

          {/* Move-in Reviews - Active */}
          <Link
            to='/admin/move-in-reviews'
            className='w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors text-white bg-black'
          >
            <svg className='w-5 h-5 mr-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' />
            </svg>
            Move-in Reviews
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className='flex-1 flex flex-col'>
        {/* Header */}
        <header className='bg-white border-b border-gray-200 px-6 py-4'>
          <div className='flex items-center justify-between'>
            <h1 className='text-2xl font-bold text-gray-900'>Move-In Issue Reviews</h1>
            <div className='flex items-center space-x-4'>
              <NotificationHeader />
              <div className='flex items-center space-x-3'>
                <div className='text-right'>
                  <p className='text-sm font-medium text-gray-900'>{user?.name}</p>
                  <p className='text-xs text-gray-500'>Administrator</p>
                </div>
                <div className='w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center'>
                  <span className='text-sm font-medium text-gray-700'>{user?.name?.charAt(0)}</span>
                </div>
                <button
                  onClick={logout}
                  className='text-sm text-gray-500 hover:text-gray-700 transition-colors'
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className='flex-1 bg-gray-50 p-6'>
          <div className='max-w-7xl mx-auto'>
            {/* Page Description */}
            <div className='mb-6'>
              <p className='text-gray-600'>Review and resolve move-in issues from tenants</p>
            </div>

        {/* Filters and Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Status Filter:</label>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Issues</option>
                <option value="OPEN">Open</option>
                <option value="ESCALATED">Escalated</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-600">
              Total: {pagination.total} issues • Page {pagination.page} of {pagination.totalPages}
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Issues Requiring Review</h2>
          </div>

          {issues.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500">No issues found matching your criteria</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {issues.map((issue) => (
                <div key={issue.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{issue.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                          {issue.status}
                        </span>
                      </div>
                      
                                             <p className="text-gray-600 mb-3">{issue.title}</p>
                      
                                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                         <div>
                           <span className="text-gray-500">Tenant:</span>
                           <span className="ml-2 text-gray-900">
                             {issue.tenantName || 'N/A'}
                           </span>
                         </div>
                         <div>
                           <span className="text-gray-500">Landlord:</span>
                           <span className="ml-2 text-gray-900">
                             {issue.landlordName || 'N/A'}
                           </span>
                         </div>
                         <div>
                           <span className="text-gray-500">Property:</span>
                           <span className="ml-2 text-gray-900">{issue.propertyTitle || 'N/A'}</span>
                         </div>
                       </div>
                      
                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                        <span>Created: {formatDate(issue.createdAt)}</span>
                        <span>Updated: {formatDate(issue.updatedAt)}</span>
                        {issue.lastCommentAt && (
                          <span>Last comment: {formatDate(issue.lastCommentAt)}</span>
                        )}
                      </div>
                    </div>
                    
                                         <div className="ml-4">
                       <button
                         onClick={() => navigate(`/admin/issue/${issue.id}`)}
                         className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                       >
                         Open Issue
                       </button>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {pagination.page} of {pagination.totalPages}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="px-3 py-2 text-sm text-gray-700">
                  {pagination.page}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminMoveInReviews;
