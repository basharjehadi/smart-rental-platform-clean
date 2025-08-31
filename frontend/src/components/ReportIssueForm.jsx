import React, { useState } from 'react';
import api from '../utils/api';

const ReportIssueForm = ({ offerId, rentalRequestId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setFileError('');

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/avi', 'video/mov', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setFileError(`Invalid file type(s): ${invalidFiles.map(f => f.name).join(', ')}. Allowed: images, videos, PDFs, Word docs.`);
      return;
    }

    // Validate file sizes (max 10MB each)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setFileError(`File(s) too large: ${oversizedFiles.map(f => f.name).join(', ')}. Max size: 10MB each.`);
      return;
    }

    // Validate total number of files (max 5)
    if (selectedFiles.length + files.length > 5) {
      setFileError('Maximum 5 files allowed.');
      return;
    }

    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Please provide a title for the issue.');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please provide a description of the issue.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Create the move-in issue directly with offerId
      const submitData = new FormData();
      submitData.append('title', formData.title.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('offerId', offerId);
      
      // Add files if any
      selectedFiles.forEach(file => {
        submitData.append('evidence', file);
      });

      const response = await api.post(`/move-in-issues`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        onSuccess();
      } else {
        setError(response.data.error || 'Failed to report issue. Please try again.');
      }
    } catch (err) {
      console.error('Error reporting issue:', err);
      setError(err.response?.data?.error || 'Failed to report issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      {error && (
        <div className='p-3 bg-red-50 border border-red-200 rounded-md'>
          <p className='text-sm text-red-600'>{error}</p>
        </div>
      )}

      <div>
        <label htmlFor='title' className='block text-sm font-medium text-gray-700 mb-2'>
          Issue Title *
        </label>
        <input
          type='text'
          id='title'
          name='title'
          value={formData.title}
          onChange={handleInputChange}
          placeholder='Brief description of the issue'
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          required
        />
      </div>

      <div>
        <label htmlFor='description' className='block text-sm font-medium text-gray-700 mb-2'>
          Issue Description *
        </label>
        <textarea
          id='description'
          name='description'
          value={formData.description}
          onChange={handleInputChange}
          placeholder='Please describe the issue in detail...'
          rows={4}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          required
        />
      </div>

      <div>
        <label htmlFor='evidence' className='block text-sm font-medium text-gray-700 mb-2'>
          Evidence (Optional)
        </label>
        <input
          type='file'
          id='evidence'
          multiple
          accept='image/*,video/*,.pdf,.doc,.docx'
          onChange={handleFileSelect}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        />
        <p className='text-xs text-gray-500 mt-1'>
          Supported: Images (JPEG, PNG, WebP, GIF), Videos (MP4, AVI, MOV), Documents (PDF, Word). Max 5 files, 10MB each.
        </p>
      </div>

      {fileError && (
        <div className='p-3 bg-red-50 border border-red-200 rounded-md'>
          <p className='text-sm text-red-600'>{fileError}</p>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Selected Files ({selectedFiles.length}/5)
          </label>
          <div className='space-y-2'>
            {selectedFiles.map((file, index) => (
              <div key={index} className='flex items-center justify-between p-2 bg-gray-50 rounded-md'>
                <div className='flex items-center space-x-2'>
                  <span className='text-sm text-gray-600'>{file.name}</span>
                  <span className='text-xs text-gray-500'>
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type='button'
                  onClick={() => removeFile(index)}
                  className='text-red-500 hover:text-red-700 text-sm'
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className='flex justify-end space-x-3 pt-4'>
        <button
          type='button'
          onClick={onCancel}
          className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        >
          Cancel
        </button>
        <button
          type='submit'
          disabled={isSubmitting}
          className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isSubmitting ? 'Reporting...' : 'Report Issue'}
        </button>
      </div>
    </form>
  );
};

export default ReportIssueForm;
