import { useEffect, useState } from 'react';

export default function useMoveInUiState(offerId) {
  const [data, setData] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState(null);
  useEffect(() => {
    if (!offerId) return;
    let off = false; setLoading(true);
    fetch(`/api/move-in/offers/${offerId}/ui-state`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
      .then(j => { if (!off) setData(j); })
      .catch(e => { if (!off) setError(e?.error || 'Failed to load'); })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, [offerId]);
  return { data, loading, error };
}
