import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import ReportIssueForm from '../components/ReportIssueForm';

export default function MoveInCenter() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const offerId = sp.get('offerId');

  const [ui, setUi] = useState(null);
  const [st, setSt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [moveInIssues, setMoveInIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);

  // Fetch move-in issues for this specific offer
  const fetchMoveInIssues = async () => {
    try {
      setIssuesLoading(true);
      const response = await api.get(`move-in/offers/${offerId}/issues`);
      setMoveInIssues(response.data.issues || []);
    } catch (error) {
      console.error('Error fetching move-in issues:', error);
      setMoveInIssues([]);
    } finally {
      setIssuesLoading(false);
    }
  };

  useEffect(() => {
    let off = false;
    if (!offerId) { setErr('Missing offerId'); setLoading(false); return; }
        setLoading(true);
    Promise.all([
      api.get(`move-in/offers/${offerId}/move-in/ui-state`),
      api.get(`move-in/offers/${offerId}/status`),
    ])
      .then(([a, b]) => { 
        if (!off) { 
          console.log('🔍 MoveInCenter: UI State Response:', a.data.data);
          console.log('🔍 MoveInCenter: Status Response:', b.data.data);
          setUi(a.data.data); 
          setSt(b.data.data); 
        } 
      })
      .catch(e => { 
        console.error('API Error:', e);
        if (!off) setErr(e?.response?.data?.error || e.message); 
      })
      .finally(() => { if (!off) setLoading(false); });
    
    // Fetch move-in issues for this offer
    fetchMoveInIssues();
    
    return () => { off = true; };
  }, [offerId]);

  if (loading) return <div className="p-4">Loading…</div>;
  if (err) return <div className="p-4 text-red-600">Error: {err}</div>;
  if (!ui) return <div className="p-4 text-red-600">No UI data available</div>;

  const phase = ui?.window?.phase;
  const paymentDate = ui?.paymentDate ? new Date(ui.paymentDate).toLocaleString() : '';
  const leaseStart = ui?.leaseStart ? new Date(ui.leaseStart).toLocaleString() : '';
  const windowClose = ui?.window?.windowClose ? new Date(ui.window.windowClose).toLocaleString() : '';
  // tolerate different shapes from the API
  const status =
    st?.status ||
    ui?.verificationStatus ||
    'PENDING';



  const canConfirm = ui?.canConfirmOrDeny && status === 'PENDING';

  // Debug logging
  console.log('🔍 MoveInCenter: Phase and permissions:', {
    phase,
    status,
    canConfirm,
    canConfirmOrDeny: ui?.canConfirmOrDeny,
    canReportIssue: ui?.canReportIssue,
    paymentDate,
    leaseStart,
    windowClose
  });

    return (
    <div className="min-h-screen bg-gray-50 p-6">
            {/* Back Button */}
      <div className="mb-6">
            <button
          onClick={() => {
            if (user?.role === 'LANDLORD') {
              navigate('/landlord-my-property');
            } else {
              navigate('/my-offers?tab=PAID');
            }
          }} 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
            </button>
          </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <section className="card p-6">
          <h3 className="text-xl font-semibold mb-4">Move-In Status</h3>
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Status: {status}
                  </span>
              </div>

          {phase === 'PRE_MOVE_IN' && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                Issue window opens from payment date <strong>{paymentDate}</strong> and closes 2 days after move-in date <strong>{leaseStart}</strong>.
              </p>
                </div>
              )}

          {phase === 'WINDOW_OPEN' && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">
                Issue window is open! You can report issues from payment date until <strong>{windowClose}</strong> (2 days after move-in).
                  </p>
                </div>
              )}
          
          {phase === 'WINDOW_CLOSED' && (
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-800">Issue window closed (2 days after move-in date).</p>
              </div>
            )}

          {canConfirm && (
            <div className="mt-6 flex gap-4">
              <button 
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                onClick={() => api.post(`move-in/offers/${offerId}/verify`).then(()=>location.reload())}
              >
                ✅ Confirm Move-In
              </button>
              <div className="text-sm text-gray-600 flex items-center">
                <span>or</span>
              </div>
              <div className="text-sm text-gray-600">
                <span>Report a serious issue below that may result in contract cancellation</span>
              </div>
            </div>
          )}
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Move-In Issues</h3>
            {ui?.canReportIssue && moveInIssues.length === 0 && (
              <button 
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                onClick={() => setShowReportModal(true)}
              >
                Report Move-In Issue
              </button>
            )}
          </div>

          {issuesLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ) : moveInIssues.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">✅</div>
              <p className="text-gray-600 text-lg mb-2">No issues reported</p>
              <p className="text-gray-500">Your move-in is going smoothly!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {moveInIssues.map(issue => (
                <div key={issue.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {issue.title}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          issue.status === 'OPEN' ? 'bg-red-100 text-red-800' :
                          issue.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                          issue.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                          issue.status === 'ESCALATED' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {issue.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">
                        {issue.description}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Created:</span>
                          <p className="font-medium">
                            {new Date(issue.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Comments:</span>
                          <p className="font-medium">
                            {issue.comments?.length || 0}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Last Updated:</span>
                          <p className="font-medium">
                            {new Date(issue.updatedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => {
                          if (user?.role === 'LANDLORD') {
                            navigate(`/landlord/issue/${issue.id}`);
                          } else {
                            navigate(`/tenant/issue/${issue.id}`);
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Report Issue Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Report Move-In Issue</h2>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <ReportIssueForm
                offerId={offerId}
                onSuccess={(issueId) => {
                  setShowReportModal(false);
                  // Navigate to the tenant issue page
                  navigate(`/tenant/issue/${issueId}`);
                }}
                onCancel={() => setShowReportModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}