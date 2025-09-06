import React, { useState, useMemo } from 'react';

const EndLeaseModal = ({
  open,
  onClose,
  onSubmit,
  effectiveDate,
  terminationPolicyPreview,
  submitting = false,
}) => {
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState(false);

  const eff = useMemo(() => {
    try {
      return new Date(effectiveDate);
    } catch {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d;
    }
  }, [effectiveDate]);

  // Calculate earliest possible end date from policy
  const earliestEnd = useMemo(() => {
    if (terminationPolicyPreview?.earliestEnd) {
      return new Date(terminationPolicyPreview.earliestEnd);
    }
    return eff;
  }, [terminationPolicyPreview, eff]);

  if (!open) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg w-full max-w-md shadow-lg'>
        <div className='px-5 py-4 border-b'>
          <h3 className='text-lg font-semibold text-gray-900'>
            End Lease
          </h3>
        </div>
        <div className='px-5 py-4 space-y-4'>
          {/* Termination Policy Information */}
          {terminationPolicyPreview && (
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4'>
              <div className='flex items-start space-x-2'>
                <div className='flex-shrink-0'>
                  <svg className='w-5 h-5 text-blue-600 mt-0.5' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z' clipRule='evenodd' />
                  </svg>
                </div>
                <div className='flex-1'>
                  <h4 className='text-sm font-medium text-blue-900 mb-1'>
                    Termination Policy
                  </h4>
                  <p className='text-sm text-blue-800 mb-2'>
                    <strong>Earliest possible end date:</strong>{' '}
                    {earliestEnd.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className='text-xs text-blue-700'>
                    {terminationPolicyPreview.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          <p className='text-sm text-gray-700'>
            This will submit a termination request to end your lease. Your effective
            end date will be
            <span className='font-medium'>
              {' '}
              {earliestEnd.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            .
          </p>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Reason (optional)
            </label>
            <textarea
              className='w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none'
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder='e.g., moving for a new job'
            />
          </div>
          <label className='flex items-center space-x-2 text-sm text-gray-700'>
            <input
              type='checkbox'
              className='rounded'
              checked={confirm}
              onChange={e => setConfirm(e.target.checked)}
            />
            <span>I understand this action is irreversible.</span>
          </label>
        </div>
        <div className='px-5 py-4 border-t flex items-center justify-end space-x-2'>
          <button
            onClick={onClose}
            className='px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200'
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={() =>
              confirm && onSubmit({ reason, effectiveDate: earliestEnd.toISOString() })
            }
            className='px-4 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60'
            disabled={submitting || !confirm}
          >
            {submitting ? 'Sending…' : 'Send Termination Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndLeaseModal;
