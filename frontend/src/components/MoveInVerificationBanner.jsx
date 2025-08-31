import React, { useState, useEffect } from 'react';
import useMoveInUiState from '../hooks/useMoveInUiState';
import api from '../utils/api';
import toast from 'react-hot-toast';



const MoveInVerificationBanner = ({ offerId, onStatusChange }) => {
  // Use the simple hook for UI state
  const { data, loading, error } = useMoveInUiState(offerId);
  const [countdown, setCountdown] = useState(null);

  // Server-based countdown logic
  useEffect(() => {
    if (!data?.window?.windowClose) return;

    const updateCountdown = () => {
      const now = new Date(data.now);
      const close = new Date(data.window.windowClose);
      const diff = close - now;

      if (diff <= 0) {
        setCountdown('Window closed');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setCountdown(`${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [data?.window?.windowClose, data?.now]);

  // Handle confirm move-in
  const handleConfirm = async () => {
    try {
      await api.post(`/api/offers/${offerId}/move-in/verify`);
      toast.success('Move-in confirmed successfully!');
      if (onStatusChange) onStatusChange();
    } catch {
      toast.error('Failed to confirm move-in');
    }
  };

  // Handle deny move-in
  const handleDeny = async () => {
    try {
      await api.post(`/api/offers/${offerId}/move-in/deny`);
      toast.success('Move-in denied');
      if (onStatusChange) onStatusChange();
    } catch {
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

  if (error || !data) {
    return (
      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
        <div className="text-sm text-red-900">
          ⚠️ {error || 'Failed to load move-in status'}
        </div>
      </div>
    );
  }

  const { verificationStatus, window } = data;

  // VERIFIED status - show success message
  if (verificationStatus === 'VERIFIED') {
    return (
      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
        <div className="flex items-center justify-between">
          <div className="text-sm text-green-900 font-medium">
            ✅ Move-in successful
          </div>
          {window.phase === 'WINDOW_OPEN' && countdown && (
            <div className="text-xs text-green-800">
              Issue window closes in: {countdown}
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
        countdownText = 'Move-in starts in: ... (server time)';
        break;

      case 'WINDOW_OPEN':
        countdownText = countdown ? `Issue window closes in: ${countdown}` : 'Issue window open';
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
           {data?.canConfirmOrDeny === true && (
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
           {data?.canReportIssue === true && (
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
