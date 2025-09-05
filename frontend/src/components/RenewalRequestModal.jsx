import React, { useState } from 'react';

const RenewalRequestModal = ({
  open,
  onClose,
  onSubmit,
  submitting = false,
}) => {
  const [note, setNote] = useState('');

  if (!open) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg w-full max-w-md shadow-lg'>
        <div className='px-5 py-4 border-b'>
          <h3 className='text-lg font-semibold text-gray-900'>
            Request Renewal
          </h3>
          <p className='text-sm text-gray-600 mt-1'>
            Send a renewal request to your landlord. They will propose the terms and rent.
          </p>
        </div>
        <div className='px-5 py-4 space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Message (optional)
            </label>
            <textarea
              className='w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none'
              rows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Let your landlord know you'd like to renew your lease..."
            />
          </div>
          <div className='bg-blue-50 border border-blue-200 rounded-md p-3'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <svg className='h-5 w-5 text-blue-400' viewBox='0 0 20 20' fill='currentColor'>
                  <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z' clipRule='evenodd' />
                </svg>
              </div>
              <div className='ml-3'>
                <p className='text-sm text-blue-700'>
                  <strong>Note:</strong> Your landlord will propose the renewal terms including rent amount and lease duration.
                </p>
              </div>
            </div>
          </div>
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
            onClick={() => onSubmit({ note })}
            className='px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60'
            disabled={submitting}
          >
            {submitting ? 'Sending…' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenewalRequestModal;
