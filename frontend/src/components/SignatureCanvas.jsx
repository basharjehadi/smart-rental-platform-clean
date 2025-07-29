import { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useTranslation } from 'react-i18next';

const SignatureCanvasComponent = ({ 
  onSave, 
  onClear, 
  initialSignature = null,
  className = '',
  width = 400,
  height = 200 
}) => {
  const sigPadRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    // Load initial signature if provided
    if (initialSignature && sigPadRef.current) {
      sigPadRef.current.fromDataURL(initialSignature);
    }
  }, [initialSignature]);

  const handleClear = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
    }
    if (onClear) {
      onClear();
    }
  };

  const handleSave = () => {
    if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
      const signatureData = sigPadRef.current.toDataURL();
      if (onSave) {
        onSave(signatureData);
      }
    }
  };

  const handleSaveSignature = async () => {
    if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
      const signatureData = sigPadRef.current.toDataURL();
      
      try {
        // Extract base64 data (remove data:image/png;base64, prefix)
        const base64Data = signatureData.split(',')[1];
        
        if (onSave) {
          onSave(base64Data);
        }
      } catch (error) {
        console.error('Error saving signature:', error);
      }
    }
  };

  return (
    <div className={`signature-canvas-container ${className}`}>
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('contract.signature')}
          </h3>
          <p className="text-sm text-gray-600">
            {t('contract.signatureInstructions')}
          </p>
        </div>
        
        <div className="border border-gray-300 rounded bg-gray-50 mb-4">
          <SignatureCanvas
            ref={sigPadRef}
            canvasProps={{
              width: width,
              height: height,
              className: 'signature-canvas w-full h-full'
            }}
            backgroundColor="rgb(248, 250, 252)"
            penColor="rgb(0, 0, 0)"
          />
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleClear}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            {t('contract.clearSignature')}
          </button>
          <button
            onClick={handleSaveSignature}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            {t('contract.saveSignature')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureCanvasComponent; 