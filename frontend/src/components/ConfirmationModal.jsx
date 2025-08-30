import React from 'react';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'bg-blue-600 hover:bg-blue-700',
  cancelColor = 'bg-gray-300 hover:bg-gray-400',
}) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
        <div className='mb-4'>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>{title}</h3>
          <p className='text-gray-600'>{message}</p>
        </div>

        <div className='flex space-x-3'>
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2 text-gray-700 font-medium rounded-lg transition-colors ${cancelColor}`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-white font-medium rounded-lg transition-colors ${confirmColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
