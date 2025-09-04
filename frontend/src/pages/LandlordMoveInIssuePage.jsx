import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MoveInIssueCommentThread from '../components/MoveInIssueCommentThread';

export default function LandlordMoveInIssuePage() {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  async function load() {
    if (!issueId) { setErr('Missing issue id'); setLoading(false); return; }
    try {
      setLoading(true);
      const { data } = await api.get(`move-in-issues/${issueId}`);
      setIssue(data);
      setErr(null);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to fetch issue';
      console.error('Landlord issue fetch failed:', e?.response?.status, msg);
      setErr(msg);
      if (e?.response?.status === 401) navigate('/landlord-dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [issueId]);

  // posting comments (if present on this page)
  async function submitComment(formData) {
    try {
      await api.post(`move-in-issues/${issueId}/comments`, formData);
      await load();
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to post comment');
    }
  }



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
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'RESOLVED': 'bg-green-100 text-green-800',
      'CLOSED': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      'LOW': 'bg-blue-100 text-blue-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (err) return <div className="p-4 text-red-600">Error: {err}</div>;
  if (!issue) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/landlord-my-property')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Move-In Issue</h1>
                <p className="text-gray-600">
                  {issue.lease?.property?.name || 'Property'} • Issue from {issue.lease?.tenantGroup?.members?.[0]?.user?.name || 'Tenant'}
                </p>
              </div>
            </div>
            
            {/* Status and Priority Badges */}
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(issue.priority)}`}>
                {issue.priority}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(issue.status)}`}>
                {issue.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Issue Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Issue Details</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Title</h3>
                  <p className="text-gray-900">{issue.title}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="text-gray-900">{issue.description}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Reported</h3>
                  <p className="text-gray-900">{formatDate(issue.createdAt)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                  <p className="text-gray-900">{formatDate(issue.updatedAt)}</p>
                </div>
              </div>

              {/* Status Display */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                    Current Status: {issue.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Status updates automatically when you respond to the issue.
                </p>
              </div>
            </div>
          </div>

          {/* Move-In Issue Comment Thread */}
          <div className="lg:col-span-2">
            <MoveInIssueCommentThread
              issue={issue}
              onCommentSubmit={submitComment}
              userRole="LANDLORD"
              showStatusUpdate={true}
              showCommentForm={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
