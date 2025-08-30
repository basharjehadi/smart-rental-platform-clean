import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import SignatureCanvasComponent from './SignatureCanvas';

const UserIdentityForm = ({ onComplete, onCancel, className = '' }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    pesel: '',
    passportNumber: '',
    kartaPobytu: '',
    phone: '',
    dowodOsobistyNumber: '',
    address: '',
  });
  const [signatureBase64, setSignatureBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const { api } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    fetchUserIdentity();
  }, []);

  const fetchUserIdentity = async () => {
    try {
      const response = await api.get('/users/identity');
      const userData = response.data.user;

      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        pesel: userData.pesel || '',
        passportNumber: userData.passportNumber || '',
        kartaPobytu: userData.kartaPobytu || '',
        phone: userData.phone || '',
        dowodOsobistyNumber: userData.dowodOsobistyNumber || '',
        address: userData.address || '',
      });

      setSignatureBase64(userData.signatureBase64 || '');
    } catch (error) {
      console.error('Error fetching user identity:', error);
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignatureSave = signatureData => {
    setSignatureBase64(signatureData);
    setSuccess(t('contract.signatureSaved'));
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Save identity data
      await api.put('/users/identity', formData);

      // Save signature if provided
      if (signatureBase64) {
        await api.post('/users/signature', { signatureBase64 });
      }

      setSuccess(t('contract.identitySaved'));
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 2000);
    } catch (error) {
      console.error('Error saving identity:', error);
      setError(error.response?.data?.error || t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const isTenant = () => {
    // This should be determined from user context
    return true; // Default to tenant for now
  };

  const renderTenantFields = () => (
    <>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label
            htmlFor='firstName'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            {t('contract.firstName')} *
          </label>
          <input
            type='text'
            id='firstName'
            name='firstName'
            value={formData.firstName}
            onChange={handleInputChange}
            required
            className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
          />
        </div>
        <div>
          <label
            htmlFor='lastName'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            {t('contract.lastName')} *
          </label>
          <input
            type='text'
            id='lastName'
            name='lastName'
            value={formData.lastName}
            onChange={handleInputChange}
            required
            className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
          />
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label
            htmlFor='pesel'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            {t('contract.pesel')}
          </label>
          <input
            type='text'
            id='pesel'
            name='pesel'
            value={formData.pesel}
            onChange={handleInputChange}
            className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            placeholder='12345678901'
          />
        </div>
        <div>
          <label
            htmlFor='passportNumber'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            {t('contract.passportNumber')}
          </label>
          <input
            type='text'
            id='passportNumber'
            name='passportNumber'
            value={formData.passportNumber}
            onChange={handleInputChange}
            className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
          />
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label
            htmlFor='kartaPobytu'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            {t('contract.kartaPobytu')}
          </label>
          <input
            type='text'
            id='kartaPobytu'
            name='kartaPobytu'
            value={formData.kartaPobytu}
            onChange={handleInputChange}
            className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
          />
        </div>
        <div>
          <label
            htmlFor='phone'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            {t('contract.phone')}
          </label>
          <input
            type='tel'
            id='phone'
            name='phone'
            value={formData.phone}
            onChange={handleInputChange}
            className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            placeholder='+48 123 456 789'
          />
        </div>
      </div>
    </>
  );

  const renderLandlordFields = () => (
    <>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label
            htmlFor='firstName'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            {t('contract.firstName')} *
          </label>
          <input
            type='text'
            id='firstName'
            name='firstName'
            value={formData.firstName}
            onChange={handleInputChange}
            required
            className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
          />
        </div>
        <div>
          <label
            htmlFor='lastName'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            {t('contract.lastName')} *
          </label>
          <input
            type='text'
            id='lastName'
            name='lastName'
            value={formData.lastName}
            onChange={handleInputChange}
            required
            className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
          />
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label
            htmlFor='dowodOsobistyNumber'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            {t('contract.dowodOsobistyNumber')}
          </label>
          <input
            type='text'
            id='dowodOsobistyNumber'
            name='dowodOsobistyNumber'
            value={formData.dowodOsobistyNumber}
            onChange={handleInputChange}
            className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
          />
        </div>
        <div>
          <label
            htmlFor='phone'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            {t('contract.phone')}
          </label>
          <input
            type='tel'
            id='phone'
            name='phone'
            value={formData.phone}
            onChange={handleInputChange}
            className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            placeholder='+48 123 456 789'
          />
        </div>
      </div>

      <div>
        <label
          htmlFor='address'
          className='block text-sm font-medium text-gray-700 mb-1'
        >
          {t('contract.address')}
        </label>
        <textarea
          id='address'
          name='address'
          value={formData.address}
          onChange={handleInputChange}
          rows={3}
          className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
          placeholder={t('contract.addressPlaceholder')}
        />
      </div>
    </>
  );

  return (
    <div className={`user-identity-form ${className}`}>
      <div className='bg-white rounded-lg shadow-md p-6'>
        <div className='mb-6'>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            {t('contract.identityForm')}
          </h2>
          <p className='text-gray-600'>
            {t('contract.identityFormDescription')}
          </p>
        </div>

        {error && (
          <div className='mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
            {error}
          </div>
        )}

        {success && (
          <div className='mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded'>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-6'>
          {currentStep === 1 && (
            <>
              <div className='space-y-4'>
                {isTenant() ? renderTenantFields() : renderLandlordFields()}
              </div>

              <div className='flex justify-between pt-4'>
                <button
                  type='button'
                  onClick={onCancel}
                  className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  {t('common.cancel')}
                </button>
                <button
                  type='button'
                  onClick={() => setCurrentStep(2)}
                  className='px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  {t('common.next')}
                </button>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <SignatureCanvasComponent
                onSave={handleSignatureSave}
                initialSignature={
                  signatureBase64
                    ? `data:image/png;base64,${signatureBase64}`
                    : null
                }
              />

              <div className='flex justify-between pt-4'>
                <button
                  type='button'
                  onClick={() => setCurrentStep(1)}
                  className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  {t('common.previous')}
                </button>
                <button
                  type='submit'
                  disabled={loading}
                  className='px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50'
                >
                  {loading ? t('common.saving') : t('contract.saveIdentity')}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default UserIdentityForm;
