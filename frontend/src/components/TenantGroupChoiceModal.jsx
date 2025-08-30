import React from 'react';
import { Users, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const TenantGroupChoiceModal = ({ isOpen, onClose, onChoice }) => {
  if (!isOpen) return null;

  const navigate = useNavigate();
  const { api } = useAuth();

  const handleChoice = choice => {
    if (onChoice) {
      onChoice(choice);
      onClose();
      return;
    }
    onClose();
  };

  const handleSoloRequest = async () => {
    // If parent supplied onChoice, let parent drive the flow (e.g., open inline modal)
    if (onChoice) {
      onClose();
      onChoice('individual');
      return;
    }
    // Fallback: create solo group then navigate to post-request
    try {
      await api.post('/tenant-groups', { name: 'Solo Group' });
    } catch (err) {
      // If group already exists or any non-critical error, proceed anyway
    } finally {
      onClose();
      // Open inline create modal for a clear solo flow
      navigate('/tenant-request-for-landlord');
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg shadow-xl max-w-md w-full p-6'>
        <div className='text-center mb-6'>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            How are you renting?
          </h2>
          <p className='text-gray-600'>
            Choose your rental arrangement to get started
          </p>
        </div>

        <div className='space-y-4'>
          {/* Just Me Option */}
          <button
            onClick={handleSoloRequest}
            className='w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group'
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors'>
                  <User className='w-6 h-6 text-blue-600' />
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900'>Just Me</h3>
                  <p className='text-sm text-gray-600'>Renting individually</p>
                </div>
              </div>
              <ArrowRight className='w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors' />
            </div>
          </button>

          {/* With a Group Option */}
          <button
            onClick={() => handleChoice('group')}
            className='w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group'
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors'>
                  <Users className='w-6 h-6 text-green-600' />
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900'>With a Group</h3>
                  <p className='text-sm text-gray-600'>
                    Renting with friends or family
                  </p>
                </div>
              </div>
              <ArrowRight className='w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors' />
            </div>
          </button>
        </div>

        <div className='mt-6 text-center'>
          <button
            onClick={onClose}
            className='text-gray-500 hover:text-gray-700 text-sm font-medium'
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantGroupChoiceModal;
