import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const AdminDecisionModal = ({ 
  isOpen, 
  onClose, 
  issue, 
  onDecisionSubmit 
}) => {
  const [decision, setDecision] = useState('');
  const [notes, setNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !issue) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!decision) {
      toast.error('Please select a decision');
      return;
    }

    if (decision === 'ACCEPTED' && (!refundAmount || parseFloat(refundAmount) <= 0)) {
      toast.error('Please enter a valid refund amount');
      return;
    }

    try {
      setSubmitting(true);
      
      const decisionData = {
        decision,
        notes: notes.trim() || null,
        refundAmount: decision === 'ACCEPTED' ? parseFloat(refundAmount) : null,
      };

      await onDecisionSubmit(decisionData);
      
      // Reset form
      setDecision('');
      setNotes('');
      setRefundAmount('');
      
      toast.success(`Move-in issue ${decision.toLowerCase()} successfully`);
      onClose();
    } catch (error) {
      console.error('Error submitting decision:', error);
      toast.error('Failed to submit decision');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setDecision('');
      setNotes('');
      setRefundAmount('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Admin Decision</h3>
            <button
              onClick={handleClose}
              disabled={submitting}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Issue:</strong> {issue.title}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Description:</strong> {issue.description}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Decision Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Decision *
              </label>
              <select
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a decision</option>
                <option value="ACCEPTED">Accept Issue</option>
                <option value="REJECTED">Reject Issue</option>
                <option value="ESCALATED">Escalate for Review</option>
              </select>
            </div>

            {/* Refund Amount (only for ACCEPTED) */}
            {decision === 'ACCEPTED' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter refund amount"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Full refund amount to be processed for the tenant
                </p>
              </div>
            )}

            {/* Admin Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your reasoning or notes..."
              />
            </div>

            {/* Decision Consequences */}
            {decision && (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Consequences:</h4>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {decision === 'ACCEPTED' && (
                    <>
                      <li>• Rental request will be cancelled</li>
                      <li>• Tenant will receive full refund</li>
                      <li>• Property will be placed on hold for 30 days</li>
                      <li>• Landlord must update property listing</li>
                    </>
                  )}
                  {decision === 'REJECTED' && (
                    <>
                      <li>• Issue will be marked as rejected</li>
                      <li>• Tenant must proceed with move-in</li>
                      <li>• No refund will be provided</li>
                    </>
                  )}
                  {decision === 'ESCALATED' && (
                    <>
                      <li>• Issue will be marked for further review</li>
                      <li>• No immediate action taken</li>
                      <li>• Additional investigation required</li>
                    </>
                  )}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !decision}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Processing...' : 'Submit Decision'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDecisionModal;
