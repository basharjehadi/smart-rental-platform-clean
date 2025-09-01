import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import useMoveInUiState from '../hooks/useMoveInUiState';

const MoveInCenter = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [offerId, setOfferId] = useState('');
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Use the shared hook for move-in UI state
  const { data: uiState, loading: uiLoading, error: uiError } = useMoveInUiState(offerId);

  // Get offerId from query params
  useEffect(() => {
    const offerIdParam = searchParams.get('offerId');
    if (!offerIdParam) {
      setError('No offer ID provided');
      setLoading(false);
      return;
    }
    setOfferId(offerIdParam);
  }, [searchParams]);

  // Fetch move-in issues
  useEffect(() => {
    if (!offerId) return;

    const fetchIssues = async () => {
      try {
        setLoading(true);
        
        // Fetch move-in issues for this offer
        try {
          const issuesResponse = await api.get(`move-in/offers/${offerId}/issues`);
          setIssues(issuesResponse.data.issues || []);
        } catch (issuesError) {
          console.log('No issues found or endpoint not available');
          setIssues([]);
        }

      } catch (error) {
        console.error('Error fetching move-in issues:', error);
        setError('Failed to load move-in issues');
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, [offerId]);

  // Handle move-in verification (confirm)
  const handleConfirmMoveIn = async () => {
    try {
      const response = await api.post(`move-in/offers/${offerId}/verify`);
      if (response.data.success) {
        toast.success('Move-in confirmed successfully!');
        // Refresh the data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error confirming move-in:', error);
      toast.error(error.response?.data?.message || 'Failed to confirm move-in');
    }
  };

  // Handle move-in denial
  const handleDenyMoveIn = async () => {
    try {
      const response = await api.post(`move-in/offers/${offerId}/deny`);
      if (response.data.success) {
        toast.success('Move-in denied successfully!');
        // Refresh the data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error denying move-in:', error);
      toast.error(error.response?.data?.message || 'Failed to deny move-in');
    }
  };

  // Handle adding a comment to an issue
  const handleAddComment = async (issueId) => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      setSubmittingComment(true);
      const response = await api.post(`move-in-issues/${issueId}/comments`, {
        content: newComment.trim()
      });

      if (response.data.success) {
        toast.success('Comment added successfully!');
        setNewComment('');
        // Refresh issues to show new comment
        const issuesResponse = await api.get(`move-in/offers/${offerId}/issues`);
        setIssues(issuesResponse.data.issues || []);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Check if user is a tenant for this offer
  const isTenant = uiState && user && uiState.tenantGroup?.members?.some(
    member => member.userId === user.id
  );

  // Use server UI state for verification logic
  const canVerify = uiState?.canConfirmOrDeny === true && isTenant;

  if (loading || uiLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading move-in information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || uiError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600 mb-4">{error || uiError}</p>
            <button
              onClick={() => navigate('/tenant-dashboard')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Move-In Center</h1>
          <p className="text-gray-600">Manage your move-in verification and report any issues</p>
        </div>

        {/* Move-In Status */}
        {uiState && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Move-In Status</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    uiState.verificationStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    uiState.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                    uiState.verificationStatus === 'DENIED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {uiState.verificationStatus}
                  </span>
                </div>
              </div>

              {uiState.window?.windowClose && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Verification Window</label>
                  <p className="text-sm text-gray-900">
                    {uiState.window.phase === 'PRE_MOVE_IN' ? 'Pre Move-in' :
                     uiState.window.phase === 'WINDOW_OPEN' ? 'Window Open' :
                     uiState.window.phase === 'WINDOW_CLOSED' ? 'Window Closed' : 'Unknown'}
                  </p>
                  {uiState.window.phase === 'WINDOW_OPEN' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Closes: {new Date(uiState.window.windowClose).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {uiState.leaseStart && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lease Start</label>
                  <p className="text-sm text-gray-900">
                    {new Date(uiState.leaseStart).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {canVerify && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleConfirmMoveIn}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  ✅ Confirm Move-In
                </button>
                <button
                  onClick={handleDenyMoveIn}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  ❌ Deny Move-In
                </button>
              </div>
            )}

            {/* Report Issue Button */}
            {uiState?.canReportIssue && (
              <div className="mt-3">
                <button
                  onClick={() => navigate(`/report-issue?offerId=${offerId}`)}
                  className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  🚨 Report Issue
                </button>
              </div>
            )}

            {uiState?.verificationStatus === 'PENDING' && !canVerify && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  {!isTenant 
                    ? 'Only tenants can verify move-in status'
                    : uiState.window?.phase === 'WINDOW_CLOSED'
                    ? 'Verification window has closed'
                    : 'Waiting for move-in window to open'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Move-In Issues */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Move-In Issues</h2>
          
          {issues.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No issues reported yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {issues.map((issue) => (
                <div key={issue.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{issue.title}</h3>
                      <p className="text-sm text-gray-600">{issue.description}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      issue.status === 'OPEN' ? 'bg-red-100 text-red-800' :
                      issue.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                      issue.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                      issue.status === 'CLOSED' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {issue.status}
                    </span>
                  </div>

                  {/* Comments */}
                  {issue.comments && issue.comments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {issue.comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-gray-900">
                              {comment.author?.firstName} {comment.author?.lastName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment Form */}
                  <div className="mt-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleAddComment(issue.id)}
                        disabled={submittingComment || !newComment.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {submittingComment ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoveInCenter;
