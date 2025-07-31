import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const DashboardPage = () => {
  const { user, api } = useAuth();
  const { t } = useTranslation();
  const [rentalStatus, setRentalStatus] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfileData();
    if (user?.role === 'TENANT') {
      fetchRentalStatus();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/users/profile');
      setProfileData(response.data.user);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setError('Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRentalStatus = async () => {
    try {
      const response = await api.get('/current-rental-status');
      setRentalStatus(response.data);
    } catch (error) {
      console.error('Error fetching rental status:', error);
      // Don't set error here as it's not critical for the dashboard
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  // Get display name (firstName + lastName or fallback to name)
  const getDisplayName = () => {
    if (profileData?.firstName && profileData?.lastName) {
      return `${profileData.firstName} ${profileData.lastName}`;
    }
    return user?.name || 'User';
  };

  // Get profile image or fallback to initials
  const getProfileImage = () => {
    if (profileData?.profileImage) {
      return `http://localhost:3001/uploads/profile_images/${profileData.profileImage}`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {getProfileImage() ? (
                      <img
                        src={getProfileImage()}
                        alt="Profile"
                        className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {getDisplayName().charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {t('dashboard.welcome')}, {getDisplayName()}!
                    </h1>
                    <p className="text-gray-600">
                      {t('dashboard.role')}: {user?.role}
                    </p>
                  </div>
                </div>
                
                {/* Action Button for Tenants */}
                {user?.role === 'TENANT' && (
                  <Link
                    to="/post-request"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {t('dashboard.createRentalRequest')}
                  </Link>
                )}
              </div>

              {/* Smart Lock Simulation for Tenants */}
              {user?.role === 'TENANT' && (
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    {t('dashboard.smartLockStatus')}
                  </h2>
                  
                  {error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800">{error}</p>
                    </div>
                  ) : rentalStatus?.hasRental ? (
                    <div className={`rounded-lg p-6 ${
                      rentalStatus.rental.isLocked 
                        ? 'bg-red-50 border border-red-200' 
                        : 'bg-green-50 border border-green-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                              rentalStatus.rental.isLocked 
                                ? 'bg-red-100' 
                                : 'bg-green-100'
                            }`}>
                              <span className="text-2xl">
                                {rentalStatus.rental.isLocked ? '🔒' : '🔓'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">
                              {rentalStatus.rental.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {rentalStatus.rental.location}
                            </p>
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                rentalStatus.rental.isLocked
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {rentalStatus.rental.isLocked ? '🔒 LOCKED' : '🔓 UNLOCKED'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {rentalStatus.rental.offer && (
                            <div className="text-sm text-gray-600">
                              <p>Rent: {formatCurrency(rentalStatus.rental.offer.rentAmount)}</p>
                              <p>Landlord: {rentalStatus.rental.offer.landlord.name}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {rentalStatus.rental.isLocked && (
                        <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                          <div className="flex items-center">
                            <span className="text-red-600 mr-2">⚠️</span>
                            <div>
                              <p className="text-sm font-medium text-red-800">
                                {t('dashboard.rentalLocked')}
                              </p>
                              <p className="text-xs text-red-600 mt-1">
                                Please pay your overdue rent to unlock access to your rental property.
                              </p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <Link
                              to="/my-rents"
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              {t('dashboard.payRentNow')}
                            </Link>
                          </div>
                        </div>
                      )}
                      
                      {!rentalStatus.rental.isLocked && rentalStatus.rental.offer && (
                        <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-md">
                          <div className="flex items-center">
                            <span className="text-green-600 mr-2">✅</span>
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                Your rental is unlocked and accessible.
                              </p>
                              <p className="text-xs text-green-600 mt-1">
                                All rent payments are up to date. You have full access to your rental property.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <div className="text-gray-400 text-4xl mb-2">🏠</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Active Rental
                      </h3>
                      <p className="text-gray-600 mb-4">
                        You don't have an active rental property at the moment. Create a rental request to get started.
                      </p>
                      <Link
                        to="/post-request"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {t('dashboard.createRentalRequest')}
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* User Info Card */}
                <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getProfileImage() ? (
                          <img
                            src={getProfileImage()}
                            alt="Profile"
                            className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Account Information
                          </dt>
                          <dd className="text-sm text-gray-900">
                            <div className="mt-2">
                              <p><strong>Name:</strong> {getDisplayName()}</p>
                              <p><strong>Email:</strong> {user?.email}</p>
                              <p><strong>Role:</strong> {user?.role}</p>
                              {profileData?.phoneNumber && (
                                <p><strong>Phone:</strong> {profileData.phoneNumber}</p>
                              )}
                              <p><strong>Member since:</strong> {new Date(user?.createdAt).toLocaleDateString()}</p>
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role-specific content */}
                {user?.role === 'TENANT' && (
                  <div className="bg-blue-50 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-blue-500 truncate">
                              {t('dashboard.tenantFeatures')}
                            </dt>
                            <dd className="text-sm text-blue-900 mt-2">
                              <ul className="list-disc list-inside space-y-1">
                                <li>Create rental requests</li>
                                <li>View your requests</li>
                                <li>Check offers from landlords</li>
                                <li>Manage payments</li>
                                <li>Smart lock access</li>
                              </ul>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {user?.role === 'LANDLORD' && (
                  <div className="bg-green-50 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-green-500 truncate">
                              {t('dashboard.landlordFeatures')}
                            </dt>
                            <dd className="text-sm text-green-900 mt-2">
                              <ul className="list-disc list-inside space-y-1">
                                <li>Browse rental requests</li>
                                <li>Make offers to tenants</li>
                                <li>Manage your properties</li>
                                <li>Track payments</li>
                              </ul>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-yellow-50 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-yellow-500 truncate">
                            Quick Actions
                          </dt>
                          <dd className="text-sm text-yellow-900 mt-2">
                            <ul className="space-y-2">
                              <li>
                                                                <Link
                                  to="/profile-view"
                                  className="inline-flex items-center text-yellow-700 hover:text-yellow-900 hover:underline"
                                >
                                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  View profile
                                </Link>
                              </li>
                              
                              {user?.role === 'TENANT' && (
                                <>
                                  <li>
                                    <Link 
                                      to="/my-rents" 
                                      className="inline-flex items-center text-yellow-700 hover:text-yellow-900 hover:underline"
                                    >
                                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      View payment history
                                    </Link>
                                  </li>
                                  <li>
                                    <Link 
                                      to="/my-offers" 
                                      className="inline-flex items-center text-yellow-700 hover:text-yellow-900 hover:underline"
                                    >
                                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                      </svg>
                                      View offers
                                    </Link>
                                  </li>
                                </>
                              )}
                              
                              {user?.role === 'LANDLORD' && (
                                <>
                                  <li>
                                    <Link 
                                      to="/requests" 
                                      className="inline-flex items-center text-yellow-700 hover:text-yellow-900 hover:underline"
                                    >
                                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                      </svg>
                                      Requests
                                    </Link>
                                  </li>
                                  <li>
                                    <Link 
                                      to="/landlord-rents" 
                                      className="inline-flex items-center text-yellow-700 hover:text-yellow-900 hover:underline"
                                    >
                                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      Rent overview
                                    </Link>
                                  </li>
                                </>
                              )}
                            </ul>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Recent Activity
                </h2>
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    <li className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">
                              Account created successfully
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(user?.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 