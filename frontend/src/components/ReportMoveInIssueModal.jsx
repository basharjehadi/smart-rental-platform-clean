import React, { useState } from 'react';

const ReportMoveInIssueModal = ({ open, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files || []));
  };

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    try {
      setSubmitting(true);
      const form = new FormData();
      form.append('reason', reason.trim());
      files.forEach(f => form.append('moveInEvidence', f));
      await onSubmit(form);
      setReason('');
      setFiles([]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Report move-in issue</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1">Describe the issue</label>
        <textarea
          className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain what was wrong (mismatch, safety concerns, etc.)"
        />

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Evidence (photos/videos)</label>
          <input type="file" multiple accept="image/*,video/*,application/pdf" onChange={handleFileChange} />
          {files.length > 0 && (
            <div className="mt-2 text-xs text-gray-600">{files.length} file(s) selected</div>
          )}
        </div>

        <div className="mt-5 flex justify-end space-x-2">
          <button className="px-4 py-2 rounded-md border border-gray-300" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50" onClick={handleSubmit} disabled={submitting || !reason.trim()}>
            {submitting ? 'Submitting…' : 'Submit issue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportMoveInIssueModal;


