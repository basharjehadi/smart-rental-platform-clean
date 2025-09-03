import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';

export default function MoveInCenter() {
  const [sp] = useSearchParams();
  const offerId = sp.get('offerId');

  const [ui, setUi] = useState(null);
  const [st, setSt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let off = false;
    if (!offerId) { setErr('Missing offerId'); setLoading(false); return; }
    setLoading(true);
    Promise.all([
      api.get(`move-in/offers/${offerId}/move-in/ui-state`),
      api.get(`move-in/offers/${offerId}/status`),
    ])
      .then(([a, b]) => { 
        console.log('API Response UI:', a.data);
        console.log('API Response Status:', b.data);
        if (!off) { setUi(a.data); setSt(b.data); } 
      })
      .catch(e => { 
        console.error('API Error:', e);
        if (!off) setErr(e?.response?.data?.error || e.message); 
      })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, [offerId]);

  if (loading) return <div className="p-4">Loading…</div>;
  if (err) return <div className="p-4 text-red-600">Error: {err}</div>;
  if (!ui) return <div className="p-4 text-red-600">No UI data available</div>;

  const phase = ui?.window?.phase;
  const leaseStart = ui?.leaseStart ? new Date(ui.leaseStart).toLocaleString() : '';
  const windowClose = ui?.window?.windowClose ? new Date(ui.window.windowClose).toLocaleString() : '';
  // tolerate different shapes from the API
  const status =
    st?.moveInVerificationStatus ||
    st?.status ||
    ui?.verificationStatus ||
    'PENDING';

  // Debug logging
  console.log('MoveInCenter Debug:', {
    ui,
    st,
    phase,
    leaseStart,
    windowClose,
    status,
    token: localStorage.getItem('token'),
    offerId
  });

  const canConfirm = ui?.canConfirmOrDeny && status === 'PENDING';

  return (
    <div className="space-y-6">
      {/* Debug Section */}
      <section className="card p-4 bg-gray-100">
        <h3 className="font-semibold mb-2">Debug Info</h3>
        <div className="text-xs">
          <div>Phase: <b>{phase}</b></div>
          <div>Lease Start: <b>{leaseStart}</b></div>
          <div>Window Close: <b>{windowClose}</b></div>
          <div>Can Confirm: <b>{canConfirm ? 'Yes' : 'No'}</b></div>
        </div>
      </section>

      <section className="card p-4">
        <h3 className="font-semibold mb-2">Move-In Status</h3>
        <div className="mb-2">Status: <b>{status}</b></div>

        {phase === 'PRE_MOVE_IN'   && <div>Move-in starts on <b>{leaseStart}</b>. The 24h issue window opens then.</div>}
        {phase === 'WINDOW_OPEN'   && <div>Issue window closes at <b>{windowClose}</b>.</div>}
        {phase === 'WINDOW_CLOSED' && <div>Verification window closed.</div>}

        {canConfirm && (
          <div className="mt-3 flex gap-8">
            <button className="btn btn-primary" onClick={() => api.post(`move-in/offers/${offerId}/verify`).then(()=>location.reload())}>Confirm</button>
            <button className="btn btn-outline" onClick={() => api.post(`move-in/offers/${offerId}/deny`).then(()=>location.reload())}>Deny</button>
          </div>
        )}
      </section>

      <section className="card p-4">
        <h3 className="font-semibold mb-2">Move-In Issues</h3>
        {ui?.canReportIssue
          ? <button className="btn btn-danger" onClick={() => {/* open report flow */}}>Report issue</button>
          : <div>No issues reported yet.</div>}
      </section>
    </div>
  );
}