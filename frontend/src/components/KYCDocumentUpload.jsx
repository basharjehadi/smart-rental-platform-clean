import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const KYCDocumentUpload = ({ identityDocument, onDocumentChange, onDocumentUpload, identityDocumentUrl, isVerified = false }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const { api } = useAuth();

  const handleIdentityDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid file (JPEG, PNG, or PDF)');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      onDocumentChange(file);
      setError('');
    }
  };

  const handleIdentityDocumentUpload = async () => {
    if (!identityDocument) return;
    
    setUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('identityDocument', identityDocument);

      const response = await api.post('/users/upload-identity-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onDocumentUpload(response.data.data.filename);
    } catch (error) {
      console.error('Error uploading identity document:', error);
      setError(error.response?.data?.error || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Identity Document</h3>
        {isVerified && (
          <div className="flex items-center text-green-600">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Verified</span>
          </div>
        )}
      </div>

      {/* Explanation Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-blue-900 font-medium mb-2">Why do we need your identity document?</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• KYC Verification: To verify your identity and ensure platform security</li>
              <li>• Contract Signing: Required for digital signature verification on rental contracts</li>
              <li>• Legal Compliance: Ensures all rental agreements are legally binding</li>
              <li>• Fraud Prevention: Protects both tenants and landlords from identity fraud</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Identity Document
          </label>
          <div className="flex items-center space-x-4">
            <label className="bg-green-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-green-700 transition-colors">
              Choose File
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleIdentityDocumentChange}
              />
            </label>
            <span className="text-gray-600">
              {identityDocument ? identityDocument.name : 'No file chosen'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            PDF, JPG, PNG up to 10MB
          </p>
        </div>

        {/* Upload Button */}
        {identityDocument && (
          <button
            onClick={handleIdentityDocumentUpload}
            disabled={uploading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Current Document Display */}
        {identityDocumentUrl && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Current Document:</h4>
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">Identity Document</p>
                <p className="text-xs text-gray-500">Uploaded successfully</p>
              </div>
              <a
                href={identityDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                View
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KYCDocumentUpload; 

