import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import MoveInIssueCommentThread from '../components/MoveInIssueCommentThread';

const AdminMoveInIssueDetail = () => {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load issue details
  const loadIssue = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/move-in-issues/${issueId}`);
      
      if (response.data.success) {
        setIssue(response.data.data);
      }
    } catch (error) {
      console.error('Error loading issue:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load issue';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (issueId) {
      loadIssue();
    }
  }, [issueId]);

  // Handle comment submission
  const handleCommentSubmit = async (formData) => {
    try {
      const response = await api.post(`/move-in-issues/${issueId}/comments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Reload issue to get updated comments
        loadIssue();
        return response.data.comment;
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      throw error;
    }
  };

  // Handle admin decision
  const handleAdminDecision = async (action) => {
    try {
      setSubmitting(true);
      
      // Map frontend actions to backend decisions
      const decision = action === 'RESOLVED' ? 'APPROVE' : 'REJECT';
      
      const response = await api.post(`/move-in-issues/${issueId}/admin-decision`, {
        decision,
        notes: `Admin decision: ${action === 'RESOLVED' ? 'Approved tenant claim' : 'Rejected tenant claim'}`,
      });

      if (response.data.success) {
        const actionText = action === 'RESOLVED' ? 'resolved (tenant approved)' : 'closed (tenant rejected)';
        toast.success(`Issue ${actionText} successfully`);
        
        // Reload issue to get updated status
        loadIssue();
      }
    } catch (error) {
      console.error('Error making admin decision:', error);
      const errorMessage = error.response?.data?.message || 'Failed to make decision';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading issue details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/admin/move-in-reviews')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Reviews
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">Issue Not Found</h2>
            <p className="text-yellow-600 mb-4">The requested issue could not be found.</p>
            <button
              onClick={() => navigate('/admin/move-in-reviews')}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Back to Reviews
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helpers
  const getLandlordName = () => {
    // Prefer organization OWNER member name
    const owner = issue?.lease?.property?.organization?.members?.find?.(
      (m) => m?.user?.role === 'OWNER' || m?.role === 'OWNER'
    );
    if (owner?.user?.name) return owner.user.name;
    // Fallbacks if schema changes
    return (
      issue?.lease?.property?.landlord?.name ||
      issue?.lease?.property?.organization?.members?.[0]?.user?.name ||
      'Unknown'
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Move-In Issue Details</h1>
              <p className="text-gray-600">Admin Review - {issue.lease?.property?.name || 'Property'}</p>
            </div>
            <button
              onClick={() => navigate('/admin/move-in-reviews')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Reviews</span>
            </button>
          </div>
        </div>

        {/* Issue Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-xl font-semibold text-gray-900">{issue.title}</h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                  {issue.status}
                </span>
              </div>
              <p className="text-gray-600 mb-4">{issue.description}</p>
            </div>
          </div>

          {/* Issue Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Tenant:</span>
                <span className="ml-2 text-gray-900">
                  {issue.lease?.tenantGroup?.members?.[0]?.user?.name || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Landlord:</span>
                <span className="ml-2 text-gray-900">{getLandlordName()}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Property:</span>
                <span className="ml-2 text-gray-900">{issue.lease?.property?.name || 'Unknown'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Created:</span>
                <span className="ml-2 text-gray-900">{formatDate(issue.createdAt)}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Updated:</span>
                <span className="ml-2 text-gray-900">{formatDate(issue.updatedAt)}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Offer ID:</span>
                <span className="ml-2 text-gray-900 font-mono text-sm">{issue.lease?.offerId || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Decision</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => handleAdminDecision('RESOLVED')}
                disabled={submitting || issue.status === 'RESOLVED' || issue.status === 'CLOSED'}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : '✅ Resolve (Approve Tenant)'}
              </button>
              <button
                onClick={() => handleAdminDecision('CLOSED')}
                disabled={submitting || issue.status === 'RESOLVED' || issue.status === 'CLOSED'}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : '❌ Close (Reject Tenant)'}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              <strong>Resolve:</strong> Approves the tenant's claim and triggers refund process • 
              <strong> Close:</strong> Rejects the tenant's claim and maintains the rental agreement
            </p>
          </div>
        </div>

        {/* Comments and Evidence */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Conversation & Evidence</h3>
          <MoveInIssueCommentThread 
            issue={issue}
            onCommentSubmit={handleCommentSubmit}
            userRole="ADMIN"
            onStatusUpdate={() => loadIssue()}
            showStatusUpdate={false}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminMoveInIssueDetail;
