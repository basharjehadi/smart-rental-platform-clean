import { useState, useEffect } from 'react';
import api from '../utils/api';

export interface MoveInWindow {
  phase: 'PRE_MOVE_IN' | 'WINDOW_OPEN' | 'WINDOW_CLOSED';
  windowClose: string | null;
}

export interface MoveInUiState {
  now: string;
  leaseStart: string | null;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'DENIED';
  window: MoveInWindow;
  canReportIssue: boolean;
  canConfirmOrDeny: boolean;
}

export interface UseMoveInUiStateReturn {
  uiState: MoveInUiState | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage move-in UI state for a specific offer
 * @param offerId - The offer ID to fetch move-in state for
 * @returns Object containing uiState, loading, error, and refetch function
 */
export function useMoveInUiState(offerId: string | null): UseMoveInUiStateReturn {
  const [uiState, setUiState] = useState<MoveInUiState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUiState = async () => {
    if (!offerId) {
      setUiState(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/api/offers/${offerId}/move-in/ui-state`);
      
      if (response.data.success) {
        setUiState(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch move-in state');
      }
    } catch (err: any) {
      console.error('Error fetching move-in UI state:', err);
      setError(err.response?.data?.message || 'Failed to fetch move-in state');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when offerId changes
  useEffect(() => {
    fetchUiState();
  }, [offerId]);

  return {
    uiState,
    loading,
    error,
    refetch: fetchUiState,
  };
}

/**
 * Utility function to format countdown text based on window phase
 * @param uiState - The move-in UI state
 * @returns Formatted countdown text or null
 */
export function getMoveInCountdownText(uiState: MoveInUiState | null): string | null {
  if (!uiState) return null;

  const { verificationStatus, window } = uiState;
  
  if (verificationStatus === 'VERIFIED') {
    if (window.phase === 'WINDOW_OPEN') {
      return 'Issue window closes in ...'; // Will be replaced with actual countdown
    }
    return null;
  }

  if (verificationStatus === 'PENDING') {
    if (window.phase === 'PRE_MOVE_IN') {
      return 'Move-in starts in ...'; // Will be replaced with actual countdown
    }
    if (window.phase === 'WINDOW_OPEN') {
      return 'Issue window closes in ...'; // Will be replaced with actual countdown
    }
    if (window.phase === 'WINDOW_CLOSED') {
      return 'Verification window closed';
    }
  }

  return null;
}

/**
 * Utility function to check if report issue button should be shown
 * @param uiState - The move-in UI state
 * @returns Boolean indicating if report issue should be shown
 */
export function shouldShowReportIssue(uiState: MoveInUiState | null): boolean {
  return uiState?.canReportIssue === true;
}

/**
 * Utility function to check if confirm/deny buttons should be shown
 * @param uiState - The move-in UI state
 * @returns Boolean indicating if confirm/deny buttons should be shown
 */
export function shouldShowConfirmDeny(uiState: MoveInUiState | null): boolean {
  return uiState?.canConfirmOrDeny === true;
}
