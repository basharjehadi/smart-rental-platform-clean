import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProfileViewPage = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/users/profile');
      console.log('Profile data received:', response.data.user);
      setProfileData(response.data.user);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = () => {
    navigate('/profile');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getProfileImage = () => {
    if (profileData?.profileImage) {
      return `http://localhost:3001/uploads/profile_images/${profileData.profileImage}`;
    }
    return null;
  };

  const getDisplayName = () => {
    if (profileData?.firstName && profileData?.lastName) {
      return `${profileData.firstName} ${profileData.lastName}`;
    }
    return user?.name || 'User';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            My Profile
          </h1>
          <p className="text-gray-600 text-lg">
            View your profile information and account details
          </p>
        </div>

        {/* Success/Error Messages */}
        {/* Removed landlord-specific success/error messages */}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mx-auto mb-4">
                  {getProfileImage() ? (
                    <img
                      src={getProfileImage()}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {getDisplayName()}
                </h2>
                <p className="text-gray-500 capitalize mb-4">
                  {profileData?.role?.toLowerCase()}
                </p>
                                 <button
                   onClick={handleUpdateProfile}
                   className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                 >
                   Update Profile
                 </button>
                 {profileData?.role === 'LANDLORD' && (
                   <button
                     onClick={() => navigate('/landlord-settings')}
                     className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors mt-3"
                   >
                     🏠 Landlord Settings
                   </button>
                 )}
                 {profileData?.role === 'LANDLORD' && (
                   <button
                     onClick={() => navigate('/property-media')}
                     className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors mt-3"
                   >
                     🖼️ Manage Property Media
                   </button>
                 )}
               </div>
             </div>

                           {/* KYC Status Section */}
              <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">KYC Status</h3>
                {profileData?.identityDocument ? (
                  <div className="space-y-3">
                    <div className="flex items-center text-green-600">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Document Uploaded</span>
                    </div>
                    {profileData?.isVerified ? (
                      <div className="flex items-center text-blue-600">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Verified by Admin</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-yellow-600">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Pending Verification</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 text-sm">No identity document uploaded</p>
                    <p className="text-gray-400 text-xs mt-1">Upload document for KYC verification</p>
                  </div>
                )}
              </div>

             {/* Digital Signature Section */}
             <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Digital Signature</h3>
                               {profileData?.signatureBase64 ? (
                  <div className="text-center">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                      <img
                        src={`data:image/png;base64,${profileData.signatureBase64}`}
                        alt="Digital Signature"
                        className="h-12 w-auto max-w-48 mx-auto"
                      />
                    </div>
                    <p className="text-green-600 text-sm font-medium">Signature Saved</p>
                    <p className="text-gray-500 text-xs">Ready for contract signing</p>
                  </div>
                ) : (
                 <div className="text-center py-4">
                   <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                   </svg>
                   <p className="text-gray-500 text-sm">No digital signature created</p>
                   <p className="text-gray-400 text-xs mt-1">Create signature for contract signing</p>
                 </div>
               )}
             </div>
           </div>

          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Profile Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                    Personal Information
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">First Name</label>
                      <p className="text-gray-900">{profileData?.firstName || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Last Name</label>
                      <p className="text-gray-900">{profileData?.lastName || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{profileData?.email || user?.email}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                      <p className="text-gray-900">{profileData?.phoneNumber || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Identity Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                    Identity Information
                  </h4>
                  
                  <div className="space-y-3">
                    {profileData?.role === 'TENANT' ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">PESEL</label>
                          <p className="text-gray-900">{profileData?.pesel || 'Not provided'}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Passport Number</label>
                          <p className="text-gray-900">{profileData?.passportNumber || 'Not provided'}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Karta Pobytu</label>
                          <p className="text-gray-900">{profileData?.kartaPobytuNumber || 'Not provided'}</p>
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Dowód Osobisty</label>
                        <p className="text-gray-900">{profileData?.dowodOsobistyNumber || 'Not provided'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Address</h4>
                <p className="text-gray-900">{profileData?.address || 'Not provided'}</p>
              </div>

              {/* Account Information */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Account Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Member Since</label>
                    <p className="text-gray-900">{formatDate(profileData?.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="text-gray-900">{formatDate(profileData?.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Removed Landlord Profile Management Section */}
      </div>
    </div>
  );
};

export default ProfileViewPage; 