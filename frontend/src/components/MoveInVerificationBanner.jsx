import useMoveInUiState from '../hooks/useMoveInUiState';

export default function MoveInVerificationBanner({ offerId, onReportIssue, onConfirm, onDeny }) {
  const { data, loading } = useMoveInUiState(offerId);
  if (loading || !data) return null;

  const { verificationStatus, window: w, canReportIssue, canConfirmOrDeny } = data;

  return (
    <div className="movein-banner">
      <div className="header">🏠 Move-in verification</div>

      {verificationStatus === 'VERIFIED' && (
        <div className="chip success">Move-in successful</div>
      )}

      {w?.phase === 'PRE_MOVE_IN' && (
        <div className="text-sm text-gray-500">
          Move-in starts on {new Date(data.leaseStart).toLocaleString()}. The 24h issue window opens at that time.
        </div>
      )}

      {w?.phase === 'WINDOW_OPEN' && (
        <div className="note">Issue window closes soon.</div>
      )}

      {w?.phase === 'WINDOW_CLOSED' && (
        <div className="note">Verification window closed.</div>
      )}

      <div className="actions">
        {canConfirmOrDeny && verificationStatus === 'PENDING' && (
          <>
            <button className="btn btn-success" onClick={onConfirm}>Confirm</button>
            <button className="btn btn-outline" onClick={onDeny}>Deny</button>
          </>
        )}

        {canReportIssue && (
          <button className="btn btn-danger" onClick={onReportIssue}>Report issue</button>
        )}
      </div>
    </div>
  );
}
