import React, { useState } from 'react';

const RenewalRequestModal = ({ open, onClose, onSubmit, defaultTerm = 12, submitting = false }) => {
  const [term, setTerm] = useState(String(defaultTerm));
  const [note, setNote] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
        <div className="px-5 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Request Renewal</h3>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Term (months)</label>
            <input
              type="number"
              min={1}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
            <textarea
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything you'd like to tell the landlord"
            />
          </div>
        </div>
        <div className="px-5 py-4 border-t flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit({ termMonths: Number(term) || 12, note })}
            className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
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


