import { useEffect, useState } from 'react';
import api from '../utils/api';

export default function useMoveInUiState(offerId) {
  const [data, setData] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState(null);

  useEffect(() => {
    if (!offerId) return;
    let off = false; setLoading(true);
    api.get(`move-in/offers/${offerId}/move-in/ui-state`)
      .then(res => { if (!off) setData(res.data); })
      .catch(err => { if (!off) setError(err?.response?.data?.error || err.message); })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, [offerId]);

  return { data, loading, error };
}
