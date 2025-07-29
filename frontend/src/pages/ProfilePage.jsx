import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

const ProfilePage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    pesel: '',
    passportNumber: '',
    kartaPobytuNumber: '',
    phoneNumber: '',
    dowodOsobistyNumber: '',
    address: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userRole, setUserRole] = useState('');
  const [profileStatus, setProfileStatus] = useState(null);
  const [missingFields, setMissingFields] = useState([]);

  const { api } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    fetchUserProfile();
    fetchProfileStatus();
    
    // Check if redirected with missing fields message
    if (location.state?.message) {
      setError(location.state.message);
      if (location.state.missingFields) {
        setMissingFields(location.state.missingFields);
      }
    }
  }, [location.state]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/profile');
      const userData = response.data.user;
      
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        pesel: userData.pesel || '',
        passportNumber: userData.passportNumber || '',
        kartaPobytuNumber: userData.kartaPobytuNumber || '',
        phoneNumber: userData.phoneNumber || '',
        dowodOsobistyNumber: userData.dowodOsobistyNumber || '',
        address: userData.address || ''
      });
      
      setProfileImageUrl(userData.profileImage || '');
      setUserRole(userData.role);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError(t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileStatus = async () => {
    try {
      const response = await api.get('/users/profile/status');
      setProfileStatus(response.data);
    } catch (error) {
      console.error('Error fetching profile status:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(t('profile.invalidImageType'));
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(t('profile.imageTooLarge'));
        return;
      }

      setProfileImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImageUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!profileImage) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('profileImage', profileImage);

      const response = await api.post('/upload/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setProfileImageUrl(response.data.profileImage);
      setSuccess(t('profile.imageUploaded'));
      setProfileImage(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error.response?.data?.error || t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Upload image first if there's a new one
      if (profileImage) {
        await handleImageUpload();
      }

      // Update profile data
      const response = await api.put('/users/profile', formData);
      
      setSuccess(t('profile.profileUpdated'));
      
      // Refresh profile status after successful update
      await fetchProfileStatus();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.error || t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const validatePESEL = (pesel) => {
    if (!pesel) return true;
    return /^\d{11}$/.test(pesel);
  };

  const validatePhone = (phone) => {
    if (!phone) return true;
    return /^[\+]?[0-9\s\-\(\)]{9,15}$/.test(phone);
  };

  const isFormValid = () => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      validatePESEL(formData.pesel) &&
      validatePhone(formData.phoneNumber)
    );
  };

  if (loading && !profileImageUrl) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('profile.title')}
            </h1>
            <p className="text-gray-600">
              {t('profile.description')}
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {/* Profile Completion Status */}
          {profileStatus && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-blue-900">
                  Profile Completion Status
                </h3>
                <div className="flex items-center">
                  <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                    <div 
                      className={`h-2 rounded-full ${
                        profileStatus.isComplete ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${profileStatus.completionPercentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-blue-700">
                    {profileStatus.completionPercentage}%
                  </span>
                </div>
              </div>
              
              {profileStatus.isComplete ? (
                <div className="flex items-center text-green-700">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Profile Complete!</span>
                </div>
              ) : (
                <div>
                  <p className="text-blue-700 mb-2">
                    Please complete the following required fields to use all platform features:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {missingFields.map((field, index) => (
                      <div key={index} className="flex items-center text-red-600">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm capitalize">
                          {field.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Image Section */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('profile.profileImage')}
              </h2>
              
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    {t('profile.imageHelp')}
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('profile.basicInformation')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.firstName')} *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.lastName')} *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.phoneNumber')}
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formData.phoneNumber && !validatePhone(formData.phoneNumber) 
                        ? 'border-red-300' 
                        : 'border-gray-300'
                    }`}
                    placeholder="+48 123 456 789"
                  />
                  {formData.phoneNumber && !validatePhone(formData.phoneNumber) && (
                    <p className="mt-1 text-sm text-red-600">
                      {t('profile.invalidPhone')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tenant-specific fields */}
            {userRole === 'TENANT' && (
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('profile.tenantInformation')}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="pesel" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('profile.pesel')}
                    </label>
                    <input
                      type="text"
                      id="pesel"
                      name="pesel"
                      value={formData.pesel}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        formData.pesel && !validatePESEL(formData.pesel) 
                          ? 'border-red-300' 
                          : 'border-gray-300'
                      }`}
                      placeholder="12345678901"
                      maxLength={11}
                    />
                    {formData.pesel && !validatePESEL(formData.pesel) && (
                      <p className="mt-1 text-sm text-red-600">
                        {t('profile.invalidPesel')}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="passportNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('profile.passportNumber')}
                    </label>
                    <input
                      type="text"
                      id="passportNumber"
                      name="passportNumber"
                      value={formData.passportNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="kartaPobytuNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('profile.kartaPobytuNumber')}
                    </label>
                    <input
                      type="text"
                      id="kartaPobytuNumber"
                      name="kartaPobytuNumber"
                      value={formData.kartaPobytuNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Landlord-specific fields */}
            {userRole === 'LANDLORD' && (
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('profile.landlordInformation')}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="dowodOsobistyNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('profile.dowodOsobistyNumber')}
                    </label>
                    <input
                      type="text"
                      id="dowodOsobistyNumber"
                      name="dowodOsobistyNumber"
                      value={formData.dowodOsobistyNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('profile.address')}
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('profile.addressPlaceholder')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Missing Fields Display */}
            {missingFields.length > 0 && (
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('profile.missingFields')}
                </h2>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {missingFields.map((field, index) => (
                    <li key={index}>{t(`profile.missingField.${field}`)}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={fetchUserProfile}
                className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || !isFormValid()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 