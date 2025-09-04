import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MoveInIssueCommentThread from '../components/MoveInIssueCommentThread';

export default function TenantMoveInIssuePage() {
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
      console.log('🔍 Fetching move-in issue:', issueId);
      console.log('🔍 Current token:', localStorage.getItem('token') ? 'Present' : 'Missing');
      const response = await api.get(`/move-in-issues/${issueId}`);
      console.log('🔍 Full API response:', response);
      console.log('🔍 Response data:', response.data);
      console.log('🔍 Response success:', response.success);
      console.log('🔍 Response data.data:', response.data?.data);
      
      // Support both wrapper shapes due to spread in api client
      const issuePayload = response.success && response.data
        ? response.data
        : (response.data?.success && response.data?.data ? response.data.data : null);

      if (issuePayload) {
        setIssue(issuePayload);
        setErr(null);
        console.log('✅ Issue loaded successfully:', issuePayload.title);
      } else {
        console.error('❌ Invalid response format:', response);
        setErr('Invalid response format');
      }
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to fetch issue';
      console.error('❌ Tenant issue fetch failed:', {
        status: e?.response?.status,
        message: msg,
        error: e
      });
      setErr(msg);
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        navigate('/tenant-dashboard');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [issueId]);

  // posting comments (if present on this page)
  async function submitComment(formData) {
    try {
      await api.post(`/move-in-issues/${issueId}/comments`, formData);
      await load();
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to post comment');
    }
  }



  if (loading) return <div className="p-4">Loading...</div>;
  if (err) return <div className="p-4 text-red-600">Error: {err}</div>;
  if (!issue) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/tenant-dashboard')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Move-In Issue</h1>
              <p className="text-gray-600">
                {issue.lease?.property?.name || 'Property'} • Your Issue
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MoveInIssueCommentThread
          issue={issue}
          onCommentSubmit={submitComment}
          userRole="TENANT"
          showStatusUpdate={true}
          showCommentForm={true}
          showRequestAdminReview={false}
        />
      </div>
    </div>
  );
}
