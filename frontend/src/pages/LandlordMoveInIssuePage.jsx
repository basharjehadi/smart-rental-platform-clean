import { useEffect, useMemo, useState } from 'react';
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
  const [now, setNow] = useState(Date.now());

  async function load() {
    if (!issueId) { setErr('Missing issue id'); setLoading(false); return; }
    try {
      setLoading(true);
      const response = await api.get(`/move-in-issues/${issueId}`);
      console.log('🔍 Landlord full API response:', response);

      // Support both wrapper shapes due to spread in api client
      const issuePayload = response.success && response.data
        ? response.data
        : (response.data?.success && response.data?.data ? response.data.data : null);

      if (issuePayload) {
        setIssue(issuePayload);
        setErr(null);
      } else {
        setErr('Invalid response format');
      }
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to fetch issue';
      console.error('Landlord issue fetch failed:', e?.response?.status, msg);
      setErr(msg);
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        navigate('/landlord-dashboard');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [issueId]);

  // Tick every second for countdown
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Compute countdown until auto-escalation (24h since createdAt) when OPEN
  const countdown = useMemo(() => {
    if (!issue || issue.status !== 'OPEN') return null;
    const created = new Date(issue.createdAt).getTime();
    const deadline = created + 24 * 60 * 60 * 1000;
    const remaining = Math.max(0, deadline - now);
    const hrs = Math.floor(remaining / (1000 * 60 * 60));
    const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((remaining % (1000 * 60)) / 1000);
    return { remaining, hrs, mins, secs };
  }, [issue, now]);

  // posting comments (if present on this page)
  async function submitComment(formData) {
    try {
      await api.post(`/move-in-issues/${issueId}/comments`, formData);
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
          {/* Left column: Countdown panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Response Window</h2>
              {countdown ? (
                <div className="text-center">
                  <div className="text-3xl font-bold tracking-wider text-gray-900">
                    {String(countdown.hrs).padStart(2, '0')}:{String(countdown.mins).padStart(2, '0')}:{String(countdown.secs).padStart(2, '0')}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">Time left to respond before auto-escalation to admin</p>
                  <p className="mt-3 text-xs text-gray-500">Reported: {formatDate(issue.createdAt)}</p>
                </div>
              ) : (
                <div className="text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                    Current Status: {issue.status}
                  </span>
                  <p className="mt-2 text-xs text-gray-500">Status updates automatically when you respond to the issue.</p>
                </div>
              )}
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
