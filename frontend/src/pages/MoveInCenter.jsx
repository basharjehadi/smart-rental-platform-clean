import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api'; // axios with baseURL '/api' + auth

export default function MoveInCenter() {
  const [sp] = useSearchParams();
  const offerId = sp.get('offerId');

  const [ui, setUi] = useState(null);
  const [st, setSt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const load = () => {
    if (!offerId) { setErr('Missing offerId'); setLoading(false); return; }
    let off = false;
    setLoading(true);
    Promise.all([
      api.get(`move-in/offers/${offerId}/move-in/ui-state`),
      api.get(`move-in/offers/${offerId}/status`),
    ])
      .then(([a, b]) => { if (!off) { setUi(a.data); setSt(b.data); } })
      .catch(e => { if (!off) setErr(e?.response?.data?.error || e.message); })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  };

  useEffect(load, [offerId]);

  const refetch = load;

  const onConfirm = async () => { await api.post(`move-in/offers/${offerId}/verify`); refetch(); };
  const onDeny    = async () => { await api.post(`move-in/offers/${offerId}/deny`); refetch(); };

  if (loading) return <div className="card"><div className="p-4">Loading…</div></div>;
  if (err)      return <div className="card"><div className="p-4 text-red-600">Error: {err}</div></div>;
  if (!ui || !st) return null;

  const phase = ui?.window?.phase;
  const leaseStart = ui?.leaseStart ? new Date(ui.leaseStart).toLocaleString() : '';
  const windowClose = ui?.window?.windowClose ? new Date(ui.window.windowClose).toLocaleString() : '';
  const status = st?.moveInVerificationStatus || ui?.verificationStatus;

  return (
    <div>
      <section className="card p-4 mb-6">
        <h3 className="font-semibold mb-2">Move-In Status</h3>
        <div className="mb-2">Status: <b>{status}</b></div>

        {phase === 'PRE_MOVE_IN'   && <div>Move-in starts on <b>{leaseStart}</b>. The 24h issue window opens then.</div>}
        {phase === 'WINDOW_OPEN'   && <div>Issue window closes at <b>{windowClose}</b>.</div>}
        {phase === 'WINDOW_CLOSED' && <div>Verification window closed.</div>}

        {ui.canConfirmOrDeny && status === 'PENDING' && (
          <div className="mt-3 flex gap-2">
            <button className="btn btn-primary" onClick={onConfirm}>Confirm</button>
            <button className="btn btn-outline" onClick={onDeny}>Deny</button>
          </div>
        )}
      </section>

      <section className="card p-4">
        <h3 className="font-semibold mb-2">Move-In Issues</h3>
        {!ui.canReportIssue && phase !== 'WINDOW_OPEN' && <div>No issues reported yet.</div>}
        {ui.canReportIssue && (
          <button className="btn btn-danger" onClick={() => {/* open your report issue flow */}}>
            Report issue
          </button>
        )}
      </section>
    </div>
  );
}