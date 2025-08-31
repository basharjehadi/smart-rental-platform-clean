import React, { useState, useEffect } from 'react';
import { useInterval } from '../hooks/useInterval';
import { useMoveInUiState, shouldShowReportIssue, shouldShowConfirmDeny } from '../hooks/useMoveInUiState';
import api from '../utils/api';
import toast from 'react-hot-toast';

// Custom hook for countdown calculations using server times
const useCountdown = (serverNow, targetTime) => {
  const [countdown, setCountdown] = useState(null);
  const [localOffset, setLocalOffset] = useState(0);

  // Calculate offset between server and local time on first render
  useEffect(() => {
    if (serverNow) {
      const serverTime = new Date(serverNow).getTime();
      const localTime = Date.now();
      const offset = serverTime - localTime;
      setLocalOffset(offset);
      
      // Debug logging
      console.log('Countdown offset calculated:', {
        serverTime: new Date(serverNow).toISOString(),
        localTime: new Date(localTime).toISOString(),
        offsetMs: offset,
        offsetSeconds: Math.round(offset / 1000)
      });
    }
  }, [serverNow]);

  // Update countdown every second
  useInterval(() => {
    if (targetTime && localOffset !== 0) {
      const now = Date.now() + localOffset;
      const target = new Date(targetTime).getTime();
      const diff = Math.max(0, target - now);
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        setCountdown({ days, hours, minutes, totalMs: diff });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, totalMs: 0 });
      }
    }
  }, 1000);

  return countdown;
};

const MoveInVerificationBanner = ({ offerId, onStatusChange }) => {
  // Use the shared hook for UI state
  const { uiState, loading, error, refetch } = useMoveInUiState(offerId);

  // Refresh every 30 seconds to keep in sync
  useInterval(() => {
    refetch();
  }, 30000);

  // Countdown hooks for different time displays
  const moveInCountdown = useCountdown(uiState?.now, uiState?.leaseStart);
  const windowCountdown = useCountdown(uiState?.now, uiState?.window?.windowClose);

  // Handle confirm move-in
  const handleConfirm = async () => {
    try {
      await api.post(`/api/offers/${offerId}/move-in/verify`);
      toast.success('Move-in confirmed successfully!');
      refetch(); // Refresh state
      if (onStatusChange) onStatusChange();
    } catch (error) {
      toast.error('Failed to confirm move-in');
    }
  };

  // Handle deny move-in
  const handleDeny = async () => {
    try {
      await api.post(`/api/offers/${offerId}/move-in/deny`);
      toast.success('Move-in denied');
      refetch(); // Refresh state
      if (onStatusChange) onStatusChange();
    } catch (error) {
      toast.error('Failed to deny move-in');
    }
  };

  // Handle report issue
  const handleReportIssue = () => {
    // Navigate to issue reporting or open modal
    // This would depend on your app's navigation structure
    toast.info('Redirecting to issue reporting...');
  };

  if (loading) {
    return (
      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !uiState) {
    return (
      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
        <div className="text-sm text-red-900">
          ⚠️ {error || 'Failed to load move-in status'}
        </div>
        <button 
          onClick={refetch}
          className="mt-2 text-xs text-red-700 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const { verificationStatus, window } = uiState;

  // VERIFIED or SUCCESS status - show success message
  if (verificationStatus === 'VERIFIED' || verificationStatus === 'SUCCESS') {
    return (
      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
        <div className="flex items-center justify-between">
          <div className="text-sm text-green-900 font-medium">
            ✅ Move-in successful
          </div>
          {window.phase === 'WINDOW_OPEN' && windowCountdown && (
            <div className="text-xs text-green-800">
              Issue window closes in: {windowCountdown.hours}h {windowCountdown.minutes}m
            </div>
          )}
        </div>
        <div className="mt-1 text-xs text-green-800">
          Your move-in has been confirmed. Enjoy your stay!
        </div>
      </div>
    );
  }

  // PENDING status - show different states based on window phase
  if (verificationStatus === 'PENDING') {
    let bannerColor = 'bg-blue-50 border-blue-200';
    let textColor = 'text-blue-900';
    let accentColor = 'text-blue-800';
    let title = '🏠 Move-in verification';

    let countdownText = '';

    switch (window.phase) {
      case 'PRE_MOVE_IN':
        if (moveInCountdown && moveInCountdown.totalMs > 0) {
          countdownText = `Move-in starts in: ${moveInCountdown.days}d ${moveInCountdown.hours}h`;
        } else {
          countdownText = 'Move-in starting soon';
        }
        break;

      case 'WINDOW_OPEN':
        if (windowCountdown && windowCountdown.totalMs > 0) {
          countdownText = `Issue window closes in: ${windowCountdown.hours}h ${windowCountdown.minutes}m`;
        } else {
          countdownText = 'Issue window closing soon';
        }
        break;

      case 'WINDOW_CLOSED':
        countdownText = 'Verification window closed';
        bannerColor = 'bg-gray-50 border-gray-200';
        textColor = 'text-gray-900';
        accentColor = 'text-gray-800';
        break;

      default:
        countdownText = '—';
    }

    return (
      <div className={`mt-3 p-3 ${bannerColor} border rounded-md`}>
        <div className="flex items-center justify-between">
          <div className={`text-sm ${textColor} font-medium`}>
            {title}
          </div>
          <div className={`text-xs ${accentColor}`}>
            ⏰ {countdownText || '—'}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-3 flex space-x-2">
          {/* Confirm/Deny buttons - only show if canConfirmOrDeny */}
          {shouldShowConfirmDeny(uiState) && (
            <>
              <button
                onClick={handleConfirm}
                className="px-3 py-1.5 rounded-md text-sm bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Confirm Move-in
              </button>
              <button
                onClick={handleDeny}
                className="px-3 py-1.5 rounded-md text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Deny Move-in
              </button>
            </>
          )}

          {/* Report Issue button - only show if canReportIssue */}
          {shouldShowReportIssue(uiState) && (
            <button
              onClick={handleReportIssue}
              className="px-3 py-1.5 rounded-md text-sm bg-orange-600 text-white hover:bg-orange-700 transition-colors"
            >
              Report Issue
            </button>
          )}
        </div>

        {/* Status info */}
        <div className="mt-2 text-xs text-gray-600">
          {window.phase === 'PRE_MOVE_IN' && 'Waiting for move-in date to arrive'}
          {window.phase === 'WINDOW_OPEN' && 'You can now confirm move-in or report issues'}
          {window.phase === 'WINDOW_CLOSED' && 'The verification window has closed'}
        </div>
      </div>
    );
  }

  // DENIED status - show denied message
  if (verificationStatus === 'DENIED') {
    return (
      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
        <div className="text-sm text-red-900 font-medium">
          ❌ Move-in denied
        </div>
        <div className="mt-1 text-xs text-red-800">
          Your move-in request has been denied.
        </div>
      </div>
    );
  }

  // ISSUE_REPORTED status - show issue reported message
  if (verificationStatus === 'ISSUE_REPORTED') {
    return (
      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="text-sm text-yellow-900 font-medium">
          ⚠️ Issue reported
        </div>
        <div className="mt-1 text-xs text-yellow-800">
          An issue has been reported and is under review.
        </div>
      </div>
    );
  }

  // CANCELLED status - show cancelled message
  if (verificationStatus === 'CANCELLED') {
    return (
      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
        <div className="text-sm text-gray-900 font-medium">
          🚫 Move-in cancelled
        </div>
        <div className="mt-1 text-xs text-gray-800">
          This move-in request has been cancelled.
        </div>
      </div>
    );
  }

  // Other statuses
  return (
    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
      <div className="text-sm text-gray-900">
        Status: {verificationStatus}
      </div>
    </div>
  );
};

export default MoveInVerificationBanner;
