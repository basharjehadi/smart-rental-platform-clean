import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SignatureCanvasComponent from '../components/SignatureCanvas';
import KYCDocumentUpload from '../components/KYCDocumentUpload';
import DigitalSignature from '../components/DigitalSignature';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    pesel: '',
    passportNumber: '',
    kartaPobytuNumber: '',
    phoneNumber: '',
    dowodOsobistyNumber: '',
    address: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [identityDocument, setIdentityDocument] = useState(null);
  const [identityDocumentUrl, setIdentityDocumentUrl] = useState('');
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [signature, setSignature] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  const { api } = useAuth();

  useEffect(() => {
    fetchUserProfile();
  }, []);

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
        address: userData.address || '',
      });

      setProfileImageUrl(
        userData.profileImage
          ? `http://localhost:3001/uploads/profile_images/${userData.profileImage}`
          : ''
      );
      setIdentityDocumentUrl(
        userData.identityDocument
          ? `http://localhost:3001/uploads/identity_documents/${userData.identityDocument}`
          : ''
      );
      setUserRole(userData.role);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        return;
      }

      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = e => {
        setProfileImageUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdentityDocumentChange = e => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf',
      ];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid file (JPEG, PNG, or PDF)');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setIdentityDocument(file);
      if (file.type === 'application/pdf') {
        setIdentityDocumentUrl(URL.createObjectURL(file));
      } else {
        const reader = new FileReader();
        reader.onload = e => {
          setIdentityDocumentUrl(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleImageUpload = async () => {
    if (!profileImage) return;

    try {
      const formData = new FormData();
      formData.append('profileImage', profileImage);

      const response = await api.post('/upload/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.profileImage) {
        setProfileImageUrl(
          `http://localhost:3001/uploads/profile_images/${response.data.profileImage}`
        );
        setProfileImage(null);
        console.log(
          '✅ Profile image uploaded successfully:',
          response.data.profileImage
        );
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'Failed to upload profile image';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleIdentityDocumentUpload = async () => {
    if (!identityDocument) return;

    try {
      const formData = new FormData();
      formData.append('identityDocument', identityDocument);

      const response = await api.post(
        '/users/upload-identity-document',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setIdentityDocumentUrl(
        `http://localhost:3001/uploads/identity_documents/${response.data.data.filename}`
      );
      setIdentityDocument(null);
    } catch (error) {
      console.error('Error uploading identity document:', error);
      throw error;
    }
  };

  const handleSignatureSave = async signatureData => {
    try {
      const base64Data = signatureData.split(',')[1];

      await api.post('/contracts/signature', {
        signatureBase64: base64Data,
      });

      setSignature(signatureData);
      setShowSignaturePad(false);
      setSuccess('Signature saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving signature:', error);
      setError('Failed to save signature. Please try again.');
    }
  };

  const handleSignatureClear = () => {
    setSignature('');
  };

  // Validation functions
  const validatePESEL = pesel => {
    if (!pesel) return true;
    return /^\d{11}$/.test(pesel);
  };

  const validatePhone = phone => {
    if (!phone) return true;
    const cleanNumber = phone.replace(/\s+/g, '');
    return /^(\+?48)?\d{9}$/.test(cleanNumber);
  };

  const validatePassport = passport => {
    if (!passport) return true;
    return /^[A-Z]{2}\d{7}$/.test(passport.toUpperCase());
  };

  const validateKartaPobytu = karta => {
    if (!karta) return true;
    return /^[A-Z0-9]{10}$/.test(karta.toUpperCase());
  };

  const validateDowodOsobisty = dowod => {
    if (!dowod) return true;
    return /^[A-Z]{3}\d{6}$/.test(dowod.toUpperCase());
  };

  const isFormValid = () => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      validatePESEL(formData.pesel) &&
      validatePhone(formData.phoneNumber)
    );
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Upload files first if there are new ones
      if (profileImage) {
        console.log('📤 Uploading profile image...');
        await handleImageUpload();
        console.log('✅ Profile image uploaded successfully');
      }
      if (identityDocument) {
        console.log('📤 Uploading identity document...');
        await handleIdentityDocumentUpload();
        console.log('✅ Identity document uploaded successfully');
      }

      // Update profile data
      console.log('📝 Updating profile data...');
      await api.put('/users/profile', formData);

      setSuccess('Profile updated successfully!');

      // Navigate back to profile view after successful save
      setTimeout(() => {
        setSuccess('');
        navigate('/profile-view');
      }, 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to update profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profileImageUrl) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold text-gray-900 mb-2'>
            Profile Settings
          </h1>
          <p className='text-gray-600 text-lg'>
            Complete your profile to unlock all platform features
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className='mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl'>
            <div className='flex items-center'>
              <svg
                className='w-5 h-5 mr-3'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                />
              </svg>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className='mb-6 bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl'>
            <div className='flex items-center'>
              <svg
                className='w-5 h-5 mr-3'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                  clipRule='evenodd'
                />
              </svg>
              {success}
            </div>
          </div>
        )}

        <div className='grid grid-cols-1 gap-8'>
          {/* Main Form */}
          <div className='w-full'>
            <div className='bg-white rounded-xl shadow-lg p-8'>
              <form onSubmit={handleSubmit} className='space-y-8'>
                {/* Profile Image Section */}
                <div className='border-b border-gray-200 pb-8'>
                  <h2 className='text-2xl font-semibold text-gray-900 mb-6'>
                    Profile Photo
                  </h2>

                  <div className='flex items-center space-x-8'>
                    <div className='flex-shrink-0'>
                      <div className='w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg'>
                        {profileImageUrl ? (
                          <img
                            src={profileImageUrl}
                            alt='Profile'
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          <div className='w-full h-full flex items-center justify-center'>
                            <svg
                              className='w-16 h-16 text-gray-400'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className='flex-1'>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Upload Profile Photo
                      </label>
                      <input
                        type='file'
                        accept='image/*'
                        onChange={handleImageChange}
                        className='block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors'
                      />
                      <p className='mt-2 text-sm text-gray-500'>
                        JPG, PNG up to 5MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div className='border-b border-gray-200 pb-8'>
                  <h2 className='text-2xl font-semibold text-gray-900 mb-6'>
                    Basic Information
                  </h2>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <label
                        htmlFor='firstName'
                        className='block text-sm font-medium text-gray-700 mb-2'
                      >
                        First Name *
                      </label>
                      <input
                        type='text'
                        id='firstName'
                        name='firstName'
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
                        placeholder='Enter your first name'
                      />
                    </div>

                    <div>
                      <label
                        htmlFor='lastName'
                        className='block text-sm font-medium text-gray-700 mb-2'
                      >
                        Last Name *
                      </label>
                      <input
                        type='text'
                        id='lastName'
                        name='lastName'
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
                        placeholder='Enter your last name'
                      />
                    </div>

                    <div>
                      <label
                        htmlFor='phoneNumber'
                        className='block text-sm font-medium text-gray-700 mb-2'
                      >
                        Phone Number
                      </label>
                      <input
                        type='tel'
                        id='phoneNumber'
                        name='phoneNumber'
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          formData.phoneNumber &&
                          !validatePhone(formData.phoneNumber)
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                        placeholder='+48 123 456 789'
                      />
                      {formData.phoneNumber &&
                        !validatePhone(formData.phoneNumber) && (
                          <p className='mt-1 text-sm text-red-600'>
                            Please enter a valid Polish phone number
                          </p>
                        )}
                    </div>
                  </div>
                </div>

                {/* Tenant-specific fields */}
                {userRole === 'TENANT' && (
                  <div className='border-b border-gray-200 pb-8'>
                    <h2 className='text-2xl font-semibold text-gray-900 mb-6'>
                      Tenant Information
                    </h2>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div>
                        <label
                          htmlFor='pesel'
                          className='block text-sm font-medium text-gray-700 mb-2'
                        >
                          PESEL Number
                        </label>
                        <input
                          type='text'
                          id='pesel'
                          name='pesel'
                          value={formData.pesel}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                            formData.pesel && !validatePESEL(formData.pesel)
                              ? 'border-red-300'
                              : 'border-gray-300'
                          }`}
                          placeholder='12345678901'
                          maxLength={11}
                        />
                        {formData.pesel && !validatePESEL(formData.pesel) && (
                          <p className='mt-1 text-sm text-red-600'>
                            PESEL must be exactly 11 digits
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor='passportNumber'
                          className='block text-sm font-medium text-gray-700 mb-2'
                        >
                          Passport Number
                        </label>
                        <input
                          type='text'
                          id='passportNumber'
                          name='passportNumber'
                          value={formData.passportNumber}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                            formData.passportNumber &&
                            !validatePassport(formData.passportNumber)
                              ? 'border-red-300'
                              : 'border-gray-300'
                          }`}
                          placeholder='AB1234567'
                        />
                        {formData.passportNumber &&
                          !validatePassport(formData.passportNumber) && (
                            <p className='mt-1 text-sm text-red-600'>
                              Format: 2 letters + 7 digits (e.g., AB1234567)
                            </p>
                          )}
                      </div>

                      <div>
                        <label
                          htmlFor='kartaPobytuNumber'
                          className='block text-sm font-medium text-gray-700 mb-2'
                        >
                          Karta Pobytu Number
                        </label>
                        <input
                          type='text'
                          id='kartaPobytuNumber'
                          name='kartaPobytuNumber'
                          value={formData.kartaPobytuNumber}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                            formData.kartaPobytuNumber &&
                            !validateKartaPobytu(formData.kartaPobytuNumber)
                              ? 'border-red-300'
                              : 'border-gray-300'
                          }`}
                          placeholder='ABC1234567'
                        />
                        {formData.kartaPobytuNumber &&
                          !validateKartaPobytu(formData.kartaPobytuNumber) && (
                            <p className='mt-1 text-sm text-red-600'>
                              Format: 10 alphanumeric characters
                            </p>
                          )}
                      </div>

                      <div className='md:col-span-2'>
                        <label
                          htmlFor='address'
                          className='block text-sm font-medium text-gray-700 mb-2'
                        >
                          Permanent Address
                        </label>
                        <textarea
                          id='address'
                          name='address'
                          value={formData.address}
                          onChange={handleInputChange}
                          rows={3}
                          className='w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
                          placeholder='Enter your permanent address'
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Landlord-specific fields */}
                {userRole === 'LANDLORD' && (
                  <div className='border-b border-gray-200 pb-8'>
                    <h2 className='text-2xl font-semibold text-gray-900 mb-6'>
                      Landlord Information
                    </h2>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div>
                        <label
                          htmlFor='dowodOsobistyNumber'
                          className='block text-sm font-medium text-gray-700 mb-2'
                        >
                          Dowód Osobisty Number
                        </label>
                        <input
                          type='text'
                          id='dowodOsobistyNumber'
                          name='dowodOsobistyNumber'
                          value={formData.dowodOsobistyNumber}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                            formData.dowodOsobistyNumber &&
                            !validateDowodOsobisty(formData.dowodOsobistyNumber)
                              ? 'border-red-300'
                              : 'border-gray-300'
                          }`}
                          placeholder='ABC123456'
                        />
                        {formData.dowodOsobistyNumber &&
                          !validateDowodOsobisty(
                            formData.dowodOsobistyNumber
                          ) && (
                            <p className='mt-1 text-sm text-red-600'>
                              Format: 3 letters + 6 digits (e.g., ABC123456)
                            </p>
                          )}
                      </div>

                      <div className='md:col-span-2'>
                        <label
                          htmlFor='address'
                          className='block text-sm font-medium text-gray-700 mb-2'
                        >
                          Address
                        </label>
                        <textarea
                          id='address'
                          name='address'
                          value={formData.address}
                          onChange={handleInputChange}
                          rows={3}
                          className='w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
                          placeholder='Enter your full address'
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* KYC Document Upload Component */}
                <KYCDocumentUpload
                  identityDocument={identityDocument}
                  onDocumentChange={setIdentityDocument}
                  onDocumentUpload={filename => {
                    setIdentityDocumentUrl(
                      `http://localhost:3001/uploads/identity_documents/${filename}`
                    );
                    setIdentityDocument(null);
                  }}
                  identityDocumentUrl={identityDocumentUrl}
                  isVerified={false} // TODO: Get from user data when verification is implemented
                />

                {/* Digital Signature Component */}
                <DigitalSignature
                  signature={signature}
                  onSignatureSave={handleSignatureSave}
                  onSignatureClear={handleSignatureClear}
                  signatureUrl={signature}
                />

                {/* Submit Buttons */}
                <div className='flex justify-end space-x-4 pt-6'>
                  <button
                    type='button'
                    onClick={() => navigate('/profile-view')}
                    className='px-8 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors'
                  >
                    Back
                  </button>
                  <button
                    type='submit'
                    disabled={loading || !isFormValid()}
                    className='px-8 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                  >
                    {loading ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
