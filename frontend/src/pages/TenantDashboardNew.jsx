import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import TenantSidebar from '../components/TenantSidebar';
import { LogOut } from 'lucide-react';

const TenantDashboardNew = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [dashboardData, setDashboardData] = useState({
    tenant: null,
    hasActiveLease: false,
    property: null,
    landlord: null,
    lease: null,
    payments: [],
    accountStatus: {
      paymentHistory: 'No Data',
      leaseCompliance: 'No Data',
      communication: 'No Data'
    },
    upcomingActions: [
      'Create your first rental request',
      'Complete your profile information',
      'Upload identity verification documents'
    ]
  });
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Separate useEffect for profile data fetching (like other working pages)
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        console.log('Fetching profile data from /users/profile...');
        const response = await api.get('/users/profile');
        console.log('Profile response on dashboard:', response.data);
        console.log('Profile user data:', response.data.user);
        console.log('Profile image field:', response.data.user?.profileImage);
        console.log('Profile image type:', typeof response.data.user?.profileImage);
        console.log('Profile image length:', response.data.user?.profileImage?.length);
        console.log('Full profile user object:', JSON.stringify(response.data.user, null, 2));
        setProfileData(response.data.user);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        console.error('Profile error response:', error.response?.data);
        setProfileData(null);
      } finally {
        setProfileLoading(false);
      }
    };
    
    fetchProfileData();
  }, []);

  useEffect(() => {
    console.log('Profile data changed on dashboard:', profileData);
    if (profileData) {
      console.log('Profile data details:');
      console.log('- profileImage field:', profileData.profileImage);
      console.log('- profileImage type:', typeof profileData.profileImage);
      console.log('- profileImage length:', profileData.profileImage?.length);
      console.log('- Constructed URL:', getProfilePhotoUrl(profileData.profileImage));
    }
  }, [profileData]);

  useEffect(() => {
    console.log('Profile loading state changed on dashboard:', profileLoading);
  }, [profileLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch tenant dashboard data
      const dashboardResponse = await api.get('/tenant-dashboard/dashboard');
      
      // Set the dashboard data
      setDashboardData(dashboardResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };



  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const calculateDaysToRenewal = () => {
    if (!dashboardData.hasActiveLease || !dashboardData.lease?.endDate) return 0;
    const endDate = new Date(dashboardData.lease.endDate);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const calculateLeaseProgress = () => {
    if (!dashboardData.hasActiveLease || !dashboardData.lease?.startDate || !dashboardData.lease?.endDate) return 0;
    const startDate = new Date(dashboardData.lease.startDate);
    const endDate = new Date(dashboardData.lease.endDate);
    const today = new Date();
    
    const totalDuration = endDate - startDate;
    const elapsed = today - startDate;
    
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 zł';
    return `${amount} zł`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getProfilePhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    
    // If it's already a full URL, return as is
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      return photoPath;
    }
    
    // If it's a relative path, construct full URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    return `${baseUrl}${photoPath}`;
  };

  const getStatusBadge = (status) => {
    const configs = {
      'Excellent': { bg: 'bg-green-100', text: 'text-green-800' },
      'Good': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'Responsive': { bg: 'bg-purple-100', text: 'text-purple-800' }
    };
    
    const config = configs[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <TenantSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
              <h1 className="text-2xl font-bold text-gray-900">Tenant Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-900">{user?.name || 'Tenant'}</span>
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-md overflow-hidden">
                  {profileLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : profileData && profileData.profileImage ? (
                    <img
                      src={getProfilePhotoUrl(profileData.profileImage)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Profile image failed to load on dashboard:', e.target.src);
                        console.log('Profile data:', profileData);
                        console.log('Profile image path:', profileData.profileImage);
                        console.log('Constructed URL:', e.target.src);
                      }}
                      onLoad={() => {
                        console.log('Profile image loaded successfully on dashboard');
                        console.log('Loaded image URL:', getProfilePhotoUrl(profileData.profileImage));
                      }}
                    />
                  ) : (
                    <span className="text-base font-bold text-white">
                      {user?.name?.charAt(0) || 'T'}
                    </span>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Dashboard Summary Cards */}
            {dashboardData.hasActiveLease ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Monthly Rent */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Monthly Rent</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(dashboardData.lease?.monthlyRent)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Days to Renewal */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Days to Renewal</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {calculateDaysToRenewal()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Property Type */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Property Type</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {dashboardData.property?.rooms} rooms
                      </p>
                    </div>
                  </div>
                </div>

                {/* Security Deposit */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Security Deposit</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(dashboardData.lease?.securityDeposit)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty State for No Active Lease */
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Rental</h3>
                <p className="text-gray-600 mb-6">You don't have any active rental properties yet. Start by creating a rental request to find your perfect home.</p>
                <button 
                  onClick={() => navigate('/tenant/requests')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Rental Request
                </button>
              </div>
            )}

            {/* Detailed Information Cards */}
            {dashboardData.hasActiveLease ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Landlord Information */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Landlord Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{dashboardData.landlord?.name}</p>
                      <p className="text-sm text-gray-600">{dashboardData.landlord?.company}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">{dashboardData.landlord?.email}</p>
                      <p className="text-sm text-gray-600">{dashboardData.landlord?.phone}</p>
                      <p className="text-sm text-gray-600">{dashboardData.landlord?.address}</p>
                    </div>
                    <button className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Contact Landlord
                    </button>
                  </div>
                </div>

                {/* Property Details */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">{dashboardData.property?.address}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Rooms:</span> {dashboardData.property?.rooms}
                      </div>
                      <div>
                        <span className="font-medium">Bathrooms:</span> {dashboardData.property?.bathrooms}
                      </div>
                      <div>
                        <span className="font-medium">Area:</span> {dashboardData.property?.area} m²
                      </div>
                      <div>
                        <span className="font-medium">Lease Term:</span> {dashboardData.property?.leaseTerm} months
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">Amenities:</p>
                      <div className="flex flex-wrap gap-2">
                        {dashboardData.property?.amenities?.map((amenity, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lease Progress */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Lease Progress</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        {formatDate(dashboardData.lease?.startDate)} - {formatDate(dashboardData.lease?.endDate)}
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Lease Completion</span>
                        <span className="font-medium">{Math.round(calculateLeaseProgress())}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${calculateLeaseProgress()}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="text-sm text-orange-600 font-medium">
                        {calculateDaysToRenewal()} days until lease renewal
                      </p>
                    </div>
                    <button className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                      View Lease Agreement
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty State for Detailed Cards */
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Property Information</h3>
                <p className="text-gray-600 mb-6">Property details, landlord information, and lease progress will appear here once you have an active rental.</p>
              </div>
            )}

            {/* Payment History */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment History</h3>
              <p className="text-sm text-gray-600 mb-4">Your last 5 rent payments</p>
              {dashboardData.payments && dashboardData.payments.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.payments.slice(0, 5).map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{payment.month}</p>
                          <p className="text-xs text-gray-600">Paid on {formatDate(payment.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                        <p className="text-xs text-gray-600">{payment.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No payment history available yet.</p>
                </div>
              )}
              {dashboardData.payments && dashboardData.payments.length > 0 && (
                <div className="mt-4 text-center">
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    View Full Payment History
                  </button>
                </div>
              )}
            </div>

            {/* Account Review */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Review</h3>
              <p className="text-sm text-gray-600 mb-6">Your rental account status and recommendations</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Account Status */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Account Status</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Payment History</span>
                      {getStatusBadge(dashboardData.accountStatus.paymentHistory)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Lease Compliance</span>
                      {getStatusBadge(dashboardData.accountStatus.leaseCompliance)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Communication</span>
                      {getStatusBadge(dashboardData.accountStatus.communication)}
                    </div>
                  </div>
                </div>

                {/* Upcoming Actions */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Upcoming Actions</h4>
                  <ul className="space-y-2">
                    {dashboardData.upcomingActions?.map((action, index) => (
                      <li key={index} className="flex items-start">
                        <span className={`inline-block w-2 h-2 rounded-full mt-2 mr-3 ${
                          index === 0 ? 'bg-orange-500' : 
                          index === 1 ? 'bg-blue-500' : 'bg-green-500'
                        }`}></span>
                        <span className="text-sm text-gray-600">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TenantDashboardNew; 