import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

const AdminMoveInReviews = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

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
      }

      const response = await api.get(`/api/move-in-issues/admin/move-in/issues?${params}`);
      
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

  // Handle admin decision
  const handleAdminDecision = async (issueId, decision, notes = '') => {
    try {
      setSubmitting(true);
      
      const response = await api.post(`/api/move-in-issues/${issueId}/admin-decision`, {
        decision,
        notes,
      });

      if (response.data.success) {
        // Update the issue in the list optimistically
        setIssues(prevIssues => 
          prevIssues.map(issue => 
            issue.id === issueId 
              ? { ...issue, status: response.data.data.status, adminDecision: decision }
              : issue
          )
        );

        // Close the detail modal
        setShowDetailModal(false);
        setSelectedIssue(null);

        // Show success message
        const actionText = decision === 'APPROVE' ? 'resolved' : 'closed';
        toast.success(`Issue ${actionText} successfully`);

        // Reload issues to get updated list
        loadIssues(pagination.page, statusFilter);
      }
    } catch (error) {
      console.error('Error making admin decision:', error);
      const errorMessage = error.response?.data?.message || 'Failed to make decision';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // View issue detail
  const handleViewIssue = (issue) => {
    setSelectedIssue(issue);
    setShowDetailModal(true);
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Move-In Issue Reviews</h1>
          <p className="text-gray-600">Review and resolve move-in issues from tenants</p>
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
                    
                                         <div className="ml-4 flex space-x-2">
                       <button
                         onClick={() => handleViewIssue(issue)}
                         className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                       >
                         View Details
                       </button>
                       <button
                         onClick={() => window.open(`/admin/issue/${issue.id}`, '_blank')}
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

      {/* Issue Detail Modal */}
      {showDetailModal && selectedIssue && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{selectedIssue.title}</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600">{selectedIssue.description}</p>
              </div>
              
                             <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                 <div>
                   <span className="text-gray-500">Status:</span>
                   <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedIssue.status)}`}>
                     {selectedIssue.status}
                   </span>
                 </div>
                 <div>
                   <span className="text-gray-500">Tenant:</span>
                   <span className="ml-2 text-gray-900">
                     {selectedIssue.tenantName || 'N/A'}
                   </span>
                 </div>
                 <div>
                   <span className="text-gray-500">Property:</span>
                   <span className="ml-2 text-gray-900">{selectedIssue.propertyTitle || 'N/A'}</span>
                 </div>
                 <div>
                   <span className="text-gray-500">Offer ID:</span>
                   <span className="ml-2 text-gray-900">{selectedIssue.offerId || 'N/A'}</span>
                 </div>
               </div>
              
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Admin Actions</h4>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleAdminDecision(selectedIssue.id, 'APPROVE')}
                    disabled={submitting}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {submitting ? 'Processing...' : 'Resolve Issue'}
                  </button>
                  <button
                    onClick={() => handleAdminDecision(selectedIssue.id, 'REJECT')}
                    disabled={submitting}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {submitting ? 'Processing...' : 'Close Issue'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Resolve: Approves the issue • Close: Rejects the issue
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMoveInReviews;
