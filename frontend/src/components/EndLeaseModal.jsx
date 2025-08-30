import React, { useState, useMemo } from 'react';

const EndLeaseModal = ({
  open,
  onClose,
  onSubmit,
  effectiveDate,
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

  if (!open) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg w-full max-w-md shadow-lg'>
        <div className='px-5 py-4 border-b'>
          <h3 className='text-lg font-semibold text-gray-900'>
            End Lease (30-day notice)
          </h3>
        </div>
        <div className='px-5 py-4 space-y-4'>
          <p className='text-sm text-gray-700'>
            This will submit a 30-day notice to end your lease. Your effective
            end date will be
            <span className='font-medium'>
              {' '}
              {eff.toLocaleDateString('en-US', {
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
              confirm && onSubmit({ reason, effectiveDate: eff.toISOString() })
            }
            className='px-4 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60'
            disabled={submitting || !confirm}
          >
            {submitting ? 'Sending…' : 'Send Notice'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndLeaseModal;
