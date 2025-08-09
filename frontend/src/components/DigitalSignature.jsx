import React, { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useAuth } from '../contexts/AuthContext';

const DigitalSignature = ({ signature, onSignatureSave, onSignatureClear, signatureUrl }) => {
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const signaturePadRef = useRef(null);
  const { api } = useAuth();

  const handleSaveSignature = async () => {
    if (signaturePadRef.current.isEmpty()) {
      setError('Please draw your signature before saving');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const signatureData = signaturePadRef.current.toDataURL();
      const base64Data = signatureData.split(',')[1];
      
      await api.post('/users/signature', {
        signatureBase64: base64Data
      });
      
      onSignatureSave(signatureData);
      setShowSignaturePad(false);
      setError('');
    } catch (error) {
      console.error('Error saving signature:', error);
      setError(error.response?.data?.error || 'Failed to save signature');
    } finally {
      setSaving(false);
    }
  };

  const handleClearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
    setError('');
  };

  const handleDeleteSignature = async () => {
    try {
      await api.delete('/users/signature');
      onSignatureClear();
      setError('');
    } catch (error) {
      console.error('Error deleting signature:', error);
      setError(error.response?.data?.error || 'Failed to delete signature');
    }
  };

  const handleEditSignature = () => {
    setShowSignaturePad(true);
    setError('');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Digital Signature</h3>
        {signature && (
          <div className="flex items-center text-green-600">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Saved</span>
          </div>
        )}
      </div>

      {/* Current Signature Display */}
      {signature && !showSignaturePad && (
        <div className="border border-gray-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-3">Current Signature:</h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <img 
                  src={signature} 
                  alt="Digital Signature" 
                  className="h-12 w-auto max-w-48"
                />
              </div>
              <div>
                <p className="text-sm text-gray-600">Digital signature saved</p>
                <p className="text-xs text-gray-500">Ready for contract signing</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleEditSignature}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={handleDeleteSignature}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Pad */}
      {showSignaturePad && (
        <div className="border border-gray-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-3">Draw Your Signature:</h4>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <SignatureCanvas
              ref={signaturePadRef}
              canvasProps={{
                className: 'w-full h-48'
              }}
              backgroundColor="white"
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex space-x-2">
              <button
                onClick={handleClearSignature}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                onClick={() => setShowSignaturePad(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
            <button
              onClick={handleSaveSignature}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Signature'}
            </button>
          </div>
        </div>
      )}

      {/* Create New Signature Button */}
      {!signature && !showSignaturePad && (
        <div className="text-center">
          <button
            onClick={() => setShowSignaturePad(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Draw Signature
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Create your digital signature for contract signing
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Information */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start">
          <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium">Digital Signature Information:</p>
            <ul className="mt-1 space-y-1">
              <li>• Your signature will be used for digital contract signing</li>
              <li>• You can edit or delete your signature at any time</li>
              <li>• Signatures are securely stored and encrypted</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalSignature; 

