import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import UserIdentityForm from './UserIdentityForm';

const ContractViewer = ({ rentalRequestId, offerId, className = '' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showIdentityForm, setShowIdentityForm] = useState(false);
  const [userIdentity, setUserIdentity] = useState(null);
  const [checkingIdentity, setCheckingIdentity] = useState(true);

  const { t } = useTranslation();
  const { token, api } = useAuth();

  useEffect(() => {
    checkUserIdentity();
  }, []);

  const checkUserIdentity = async () => {
    try {
      setCheckingIdentity(true);
      const response = await api.get('/users/identity');
      const userData = response.data.user;

      setUserIdentity(userData);

      // Check if user has required identity data
      const hasRequiredData = checkRequiredIdentityData(userData);
      if (!hasRequiredData) {
        setShowIdentityForm(true);
      }
    } catch (error) {
      console.error('Error checking user identity:', error);
      setError(t('errors.somethingWentWrong'));
    } finally {
      setCheckingIdentity(false);
    }
  };

  const checkRequiredIdentityData = userData => {
    if (!userData.firstName || !userData.lastName) {
      return false;
    }

    // For tenants, check for at least one form of identification
    if (userData.role === 'TENANT') {
      return userData.pesel || userData.passportNumber || userData.kartaPobytu;
    }

    // For landlords, check for ID card number
    if (userData.role === 'LANDLORD') {
      return userData.dowodOsobistyNumber;
    }

    return true;
  };

  const handleIdentityComplete = () => {
    setShowIdentityForm(false);
    checkUserIdentity(); // Re-check identity data
  };

  const handleDownloadContract = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/contracts/${rentalRequestId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download contract');
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rental-contract-${rentalRequestId}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading contract:', err);
      setError(err.message || 'Failed to download contract');
    } finally {
      setLoading(false);
    }
  };

  if (checkingIdentity) {
    return (
      <div className={className}>
        <div className='flex items-center justify-center p-4'>
          <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600'></div>
          <span className='ml-2 text-sm text-gray-600'>
            {t('common.loading')}
          </span>
        </div>
      </div>
    );
  }

  if (showIdentityForm) {
    return (
      <div className={className}>
        <div className='bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4'>
          <div className='flex'>
            <div className='flex-shrink-0'>
              <svg
                className='h-5 w-5 text-yellow-400'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-yellow-800'>
                {t('contract.missingIdentity')}
              </h3>
              <div className='mt-2 text-sm text-yellow-700'>
                <p>{t('contract.identityRequired')}</p>
              </div>
            </div>
          </div>
        </div>

        <UserIdentityForm
          onComplete={handleIdentityComplete}
          onCancel={() => setShowIdentityForm(false)}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        onClick={handleDownloadContract}
        disabled={loading}
        className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
      >
        {loading ? (
          <>
            <svg
              className='animate-spin -ml-1 mr-3 h-4 w-4 text-white'
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              ></circle>
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              ></path>
            </svg>
            {t('common.loading')}
          </>
        ) : (
          <>
            <svg
              className='w-4 h-4 mr-2'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
            {t('rental.viewContract')}
          </>
        )}
      </button>

      {error && <div className='mt-2 text-sm text-red-600'>{error}</div>}
    </div>
  );
};

export default ContractViewer;
