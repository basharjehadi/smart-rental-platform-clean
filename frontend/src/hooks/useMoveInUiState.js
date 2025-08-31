import { useEffect, useState } from 'react';
import api from '../utils/api';

export default function useMoveInUiState(offerId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!offerId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchUiState = async () => {
      try {
        const response = await api.get(`/api/move-in/offers/${offerId}/move-in/ui-state`);
        
        if (isMounted && response.data.success) {
          setData(response.data.data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching move-in UI state:', err);
          setError(err.response?.data?.message || 'Failed to load move-in status');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUiState();

    return () => {
      isMounted = false;
    };
  }, [offerId]);

  return { data, loading, error };
}
