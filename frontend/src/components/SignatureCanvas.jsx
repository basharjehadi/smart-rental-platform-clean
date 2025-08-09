import React, { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignatureCanvasComponent = ({ onSave, onClear, initialSignature = null }) => {
  const sigPadRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (initialSignature && sigPadRef.current) {
      sigPadRef.current.fromDataURL(initialSignature);
    }
  }, [initialSignature]);

  const handleSave = () => {
    if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
      const signatureData = sigPadRef.current.toDataURL('image/png');
      onSave(signatureData);
    }
  };

  const handleClear = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
      setIsDrawing(false);
    }
  };

  const handleBegin = () => {
    setIsDrawing(true);
  };

  const handleEnd = () => {
    setIsDrawing(false);
  };

  return (
    <div className="signature-container">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Draw your signature below:
        </label>
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
          <SignatureCanvas
            ref={sigPadRef}
            canvasProps={{
              className: 'w-full h-48 bg-white',
              style: { border: 'none' }
            }}
            onBegin={handleBegin}
            onEnd={handleEnd}
          />
        </div>
        {isDrawing && (
          <p className="text-xs text-gray-500 mt-1">Drawing...</p>
        )}
      </div>
      
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!sigPadRef.current || sigPadRef.current.isEmpty()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Signature
        </button>
      </div>
    </div>
  );
};

export default SignatureCanvasComponent; 

