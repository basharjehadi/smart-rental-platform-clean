import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import TenantSidebar from '../components/TenantSidebar';
import { LogOut, AlertTriangle } from 'lucide-react';
import RenewalRequestModal from '../components/RenewalRequestModal.jsx';
import EndLeaseModal from '../components/EndLeaseModal.jsx';
import { viewContract, downloadContract } from '../utils/contractGenerator.js';
import NotificationHeader from '../components/common/NotificationHeader';
import ReviewCard from '../components/ReviewCard';

const TenantDashboardNew = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [dashboardData, setDashboardData] = useState({
    tenant: null,
    hasActiveLease: false,
    offerId: null,
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
  const [focusedOfferId, setFocusedOfferId] = useState(null);
  const [leaseMeta, setLeaseMeta] = useState(null);
  const [renewals, setRenewals] = useState([]);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [sendingRenewal, setSendingRenewal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [sendingEnd, setSendingEnd] = useState(false);

  useEffect(() => {
    console.log('🔍 Frontend: User state changed:', user);
    if (user) {
      console.log('✅ Frontend: User is authenticated, fetching dashboard data...');
      fetchDashboardData();
    } else {
      console.log('❌ Frontend: No user found, not fetching dashboard data');
      setLoading(false);
    }
  }, [user]);

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

  useEffect(() => {
    console.log('🔍 Frontend: Dashboard data changed:', dashboardData);
    console.log('🔍 Frontend: Has active lease:', dashboardData.hasActiveLease);
    console.log('🔍 Frontend: Property data:', dashboardData.property);
    console.log('🔍 Frontend: Landlord data:', dashboardData.landlord);
  }, [dashboardData]);

  const fetchDashboardData = async () => {
    try {
      console.log('🔍 Frontend: Starting dashboard data fetch...');
      setLoading(true);
      
      // Fetch tenant dashboard data
      const dashboardResponse = await api.get('/tenant-dashboard/dashboard');
      console.log('✅ Frontend: Dashboard response received:', dashboardResponse.data);
      console.log('🔍 Frontend: Offer ID from backend:', dashboardResponse.data.offerId);
      console.log('🔍 Frontend: Offer ID type:', typeof dashboardResponse.data.offerId);
      console.log('🔍 Frontend: Offer ID length:', dashboardResponse.data.offerId?.length);
      
      // Set the dashboard data
      setDashboardData(dashboardResponse.data);
      // Initialize focus to the first lease if multiple leases are present
      if (dashboardResponse.data?.leases && dashboardResponse.data.leases.length > 0) {
        setFocusedOfferId(dashboardResponse.data.leases[0].offerId);
      } else if (dashboardResponse.data?.offerId) {
        setFocusedOfferId(dashboardResponse.data.offerId);
      }
      // Fetch lease meta for the focused or single offer
      try {
        const offerForMeta = (dashboardResponse.data?.leases?.[0]?.offerId) || dashboardResponse.data?.offerId;
        if (offerForMeta) {
          const metaResp = await api.get(`/leases/by-offer/${offerForMeta}`);
          setLeaseMeta(metaResp.data?.lease || null);
          const leaseId = metaResp.data?.lease?.id;
          if (leaseId) {
            const threadResp = await api.get(`/leases/${leaseId}/renewals`);
            setRenewals(threadResp.data?.renewals || []);
          } else {
            setRenewals([]);
          }
        } else {
          setLeaseMeta(null);
          setRenewals([]);
        }
      } catch { setLeaseMeta(null); setRenewals([]); }
      console.log('✅ Frontend: Dashboard data set successfully');
      console.log('🔍 Frontend: Dashboard data after set:', dashboardResponse.data);
      console.log('🔍 Frontend: Offer ID in dashboard data:', dashboardResponse.data.offerId);
    } catch (error) {
      console.error('❌ Frontend: Error fetching dashboard data:', error);
      console.error('❌ Frontend: Error response:', error.response?.data);
      console.error('❌ Frontend: Error status:', error.response?.status);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Derived view data based on current focus
  const leases = dashboardData?.leases || [];
  const currentLease = focusedOfferId ? leases.find(l => l.offerId === focusedOfferId) : null;
  const currentOfferId = currentLease?.offerId || dashboardData?.offerId;
  const currentProperty = currentLease?.property || dashboardData?.property;
  const currentLandlord = currentLease?.landlord || dashboardData?.landlord;
  const currentLeaseInfo = currentLease?.lease || dashboardData?.lease;
  const currentOfferForMeta = currentLease?.offerId || dashboardData?.offerId;
  const latestRenewal = renewals.length > 0 ? renewals[renewals.length - 1] : null;
  const latestOpen = latestRenewal && (latestRenewal.status === 'PENDING' || latestRenewal.status === 'COUNTERED') ? latestRenewal : null;

  const formatArea = (areaVal) => {
    if (!areaVal && areaVal !== 0) return 'N/A';
    const raw = String(areaVal).trim();
    const stripped = raw.replace(/\s*m²\s*$/i, '');
    return `${stripped} m²`;
  };



  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewContract = async () => {
    try {
      console.log('🔍 Dashboard: Viewing contract...');
      console.log('🔍 Dashboard: hasActiveLease:', dashboardData.hasActiveLease);
      console.log('🔍 Dashboard: offerId (current):', currentOfferId);
      console.log('🔍 Dashboard: Full dashboard data:', dashboardData);
      
      // Get the active lease data from dashboard
      if (!dashboardData.hasActiveLease || !currentOfferId) {
        console.log('❌ Dashboard: Missing data - hasActiveLease:', dashboardData.hasActiveLease, 'offerId:', currentOfferId);
        alert('No active lease found to view contract.');
        return;
      }

      // Validate offer ID format
      if (typeof currentOfferId !== 'string' || currentOfferId.length < 20) {
        console.log('❌ Dashboard: Invalid offer ID format:', currentOfferId);
        alert('Invalid offer ID format. Please refresh the page and try again.');
        return;
      }

      // Add a small delay to ensure dashboard data is properly loaded
      await new Promise(resolve => setTimeout(resolve, 100));

      // First, check if there's an existing contract in the database
      let existingContract = null;
      try {
        console.log('🔍 Dashboard: Checking for existing contract...');
        const contractResponse = await api.get(`/contracts/my-contracts`);
        console.log('🔍 Dashboard: Contract response:', contractResponse.data);
        
        if (contractResponse.data.contracts) {
          console.log('🔍 Dashboard: Found contracts, searching for offer ID:', currentOfferId);
          existingContract = contractResponse.data.contracts.find(
            contract => contract.rentalRequest.offers.some(offer => offer.id === currentOfferId)
          );
          
          if (existingContract) {
            console.log('✅ Dashboard: Found existing contract, checking PDF URL:', existingContract.pdfUrl);
            
            // Check if PDF URL exists and is valid
            if (existingContract.pdfUrl && existingContract.pdfUrl !== 'null' && existingContract.pdfUrl !== null) {
              console.log('✅ Dashboard: Opening saved contract with URL:', `http://localhost:3001${existingContract.pdfUrl}`);
              window.open(`http://localhost:3001${existingContract.pdfUrl}`, '_blank');
              return;
            } else {
              console.log('⚠️ Dashboard: Contract found but PDF URL is invalid, will generate on-the-fly');
            }
          } else {
            console.log('ℹ️ Dashboard: No matching contract found for offer ID:', dashboardData.offerId);
          }
        } else {
          console.log('ℹ️ Dashboard: No contracts in response');
        }
      } catch (contractError) {
        console.error('❌ Dashboard: Error checking for existing contract:', contractError);
        console.log('ℹ️ Dashboard: Will generate on-the-fly due to error');
      }

      // If no existing contract, generate on-the-fly using backend
      console.log('🔍 Dashboard: No existing contract found, generating via backend...');
      
      try {
        // Call backend to generate contract by offer ID
        const generateResponse = await api.post(`/contracts/generate-by-offer/${currentOfferId}`);
        
        if (generateResponse.data.success) {
          // Open the newly generated contract in a new tab
          const contractUrl = `http://localhost:3001${generateResponse.data.contract.pdfUrl}`;
          window.open(contractUrl, '_blank');
          return;
        }
      } catch (generateError) {
        console.error('❌ Dashboard: Error generating contract via backend:', generateError);
        console.log('⚠️ Dashboard: Falling back to frontend generation');
        
        // Fallback to frontend generation
        const response = await api.get(`/tenant/offer/${currentOfferId}`);
        const offerData = response.data;
        
        // If we found an existing contract but with invalid PDF, use its data for consistency
        if (existingContract) {
          console.log('🔍 Dashboard: Using existing contract data for consistency:', {
            contractNumber: existingContract.contractNumber,
            createdAt: existingContract.createdAt,
            paymentDate: existingContract.paymentDate
          });
          
          // Add the original contract data to the offer
          offerData.offer.originalContractNumber = existingContract.contractNumber;
          offerData.offer.originalContractDate = existingContract.createdAt;
          offerData.offer.originalPaymentDate = existingContract.paymentDate;
        }
        
        console.log('🔍 Dashboard: Offer data for contract:', offerData);
        await viewContract(offerData.offer, user);
      }
    } catch (error) {
      console.error('❌ Dashboard: Error viewing contract:', error);
      console.error('❌ Dashboard: Error response:', error.response?.data);
      alert('Error viewing contract. Please try again.');
    }
  };

  const handleDownloadContract = async () => {
    try {
      console.log('🔍 Dashboard: Downloading contract...');
      console.log('🔍 Dashboard: hasActiveLease:', dashboardData.hasActiveLease);
      console.log('🔍 Dashboard: offerId (current):', currentOfferId);
      
      if (!dashboardData.hasActiveLease || !currentOfferId) {
        console.log('❌ Dashboard: Missing data - hasActiveLease:', dashboardData.hasActiveLease, 'offerId:', currentOfferId);
        alert('No active lease found to download contract.');
        return;
      }

      // Validate offer ID format
      if (typeof currentOfferId !== 'string' || currentOfferId.length < 20) {
        console.log('❌ Dashboard: Invalid offer ID format:', currentOfferId);
        alert('Invalid offer ID format. Please refresh the page and try again.');
        return;
      }

      // First, check if there's an existing contract in the database
      let existingContract = null;
      try {
        console.log('🔍 Dashboard: Checking for existing contract...');
        const contractResponse = await api.get(`/contracts/my-contracts`);
        console.log('🔍 Dashboard: Contract response:', contractResponse.data);
        
        if (contractResponse.data.contracts) {
          console.log('🔍 Dashboard: Found contracts, searching for offer ID:', currentOfferId);
          existingContract = contractResponse.data.contracts.find(
            contract => contract.rentalRequest.offers.some(offer => offer.id === currentOfferId)
          );
          
          if (existingContract) {
            console.log('✅ Dashboard: Found existing contract, checking PDF URL:', existingContract.pdfUrl);
            
            // Check if PDF URL exists and is valid
            if (existingContract.pdfUrl && existingContract.pdfUrl !== 'null' && existingContract.pdfUrl !== null) {
              console.log('✅ Dashboard: Downloading saved contract with URL:', `http://localhost:3001${existingContract.pdfUrl}`);
              
              // Download the existing contract
              const response = await fetch(`http://localhost:3001${existingContract.pdfUrl}`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              });
              
              if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `rental-contract-${existingContract.contractNumber}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                return;
              }
            } else {
              console.log('⚠️ Dashboard: Contract found but PDF URL is invalid, will generate on-the-fly');
            }
          } else {
            console.log('ℹ️ Dashboard: No matching contract found for offer ID:', dashboardData.offerId);
          }
        } else {
          console.log('ℹ️ Dashboard: No contracts in response');
        }
      } catch (contractError) {
        console.error('❌ Dashboard: Error checking for existing contract:', contractError);
        console.log('ℹ️ Dashboard: Will generate on-the-fly due to error');
      }

      // If no existing contract, generate on-the-fly using backend
      console.log('🔍 Dashboard: No existing contract found, generating via backend...');
      
      try {
        // Call backend to generate contract by offer ID
        const generateResponse = await api.post(`/contracts/generate-by-offer/${currentOfferId}`);
        
        if (generateResponse.data.success) {
          // Download the newly generated contract
          const contractUrl = `http://localhost:3001${generateResponse.data.contract.pdfUrl}`;
          const response = await fetch(contractUrl, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `rental-contract-${generateResponse.data.contract.contractNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            return;
          }
        }
      } catch (generateError) {
        console.error('❌ Dashboard: Error generating contract via backend:', generateError);
        console.log('⚠️ Dashboard: Falling back to frontend generation');
        
        // Fallback to frontend generation
        const response = await api.get(`/tenant/offer/${currentOfferId}`);
        const offerData = response.data;
        
        // If we found an existing contract but with invalid PDF, use its data for consistency
        if (existingContract) {
          console.log('🔍 Dashboard: Using existing contract data for consistency:', {
            contractNumber: existingContract.contractNumber,
            createdAt: existingContract.createdAt,
            paymentDate: existingContract.paymentDate
          });
          
          // Add the original contract data to the offer
          offerData.offer.originalContractNumber = existingContract.contractNumber;
          offerData.offer.originalContractDate = existingContract.createdAt;
          offerData.offer.originalPaymentDate = existingContract.paymentDate;
        }
        
        console.log('🔍 Dashboard: Offer data for download:', offerData);
        await downloadContract(offerData.offer, user);
      }
    } catch (error) {
      console.error('❌ Dashboard: Error downloading contract:', error);
      console.error('❌ Dashboard: Error response:', error.response?.data);
      alert('Error downloading contract. Please try again.');
    }
  };

  const calculateDaysToRenewal = () => {
    const leaseObj = currentLeaseInfo || dashboardData.lease;
    if (!dashboardData.hasActiveLease || !leaseObj?.startDate || !leaseObj?.endDate) return 'N/A';
    const startDate = new Date(leaseObj.startDate);
    const endDate = new Date(leaseObj.endDate);
    const today = new Date();
    
    // If lease hasn't started yet
    if (today < startDate) {
      const daysToStart = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
      return `Lease starts in ${daysToStart} days`;
    }
    
    // If lease is active, calculate days to renewal
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return 'Lease expired';
    }
    
    return `${diffDays} days`;
  };

  const calculateLeaseProgress = () => {
    const leaseObj = currentLeaseInfo || dashboardData.lease;
    if (!dashboardData.hasActiveLease || !leaseObj?.startDate || !leaseObj?.endDate) return 0;
    const startDate = new Date(leaseObj.startDate);
    const endDate = new Date(leaseObj.endDate);
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
    
    // If it's just a filename, construct full URL to profile_images directory
    if (!photoPath.startsWith('/')) {
      const baseUrl = 'http://localhost:3001';
      return `${baseUrl}/uploads/profile_images/${photoPath}`;
    }
    
    // If it's a relative path starting with /uploads/, construct full URL
    if (photoPath.startsWith('/uploads/')) {
      const baseUrl = 'http://localhost:3001';
      return `${baseUrl}${photoPath}`;
    }
    
    // If it's a relative path, construct full URL
    const baseUrl = 'http://localhost:3001';
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

  const formatPropertyType = (propertyType, rooms) => {
    if (!propertyType) return 'N/A';
    
    // Capitalize first letter and format property type
    const formattedType = propertyType.charAt(0).toUpperCase() + propertyType.slice(1).toLowerCase();
    
    // Add room count if available
    if (rooms) {
      return `${formattedType} - ${rooms} room${rooms > 1 ? 's' : ''}`;
    }
    
    return formattedType;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary flex">
      {/* Left Sidebar */}
      <TenantSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="header-modern px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Welcome back, {user?.name || 'Tenant'}</h1>
            
            <div className="flex items-center space-x-4">
              {/* Notification Header */}
              <NotificationHeader />
              
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
          <div className="max-w-6xl mx-auto space-y-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Dashboard Summary Cards */}
            {dashboardData.hasActiveLease ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Monthly Rent */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-600">Monthly Rent</p>
                      <p className="text-xl font-bold text-gray-900 break-words">
                        {formatCurrency(currentLeaseInfo?.monthlyRent)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Days to Renewal */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-600">Days to Renewal</p>
                      <p className="text-lg font-bold text-gray-900 break-words leading-tight">
                        {calculateDaysToRenewal()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Property Type */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-600">Property Type</p>
                      <p className="text-lg font-bold text-gray-900 break-words leading-tight">
                        {formatPropertyType((currentProperty?.propertyType || dashboardData.property?.propertyType), (currentProperty?.rooms || dashboardData.property?.rooms))}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Security Deposit */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-600">Security Deposit</p>
                      <p className="text-xl font-bold text-gray-900 break-words">
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
                <p className="text-gray-600 mb-6">You don't have any active rental properties yet. To create a rental request, please go to the My Requests page from the sidebar.</p>
                
                {/* Quick Actions section removed - no create request button */}
              </div>
            )}

            {/* Active Rentals & Detailed Information */}
            {dashboardData.hasActiveLease ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Rentals List */}
                {leases.length > 1 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Rentals</h3>
                    <div className="flex flex-wrap gap-2">
                      {leases.map((l) => (
                        <button
                          key={l.offerId}
                          onClick={() => setFocusedOfferId(l.offerId)}
                          className={`px-3 py-1 rounded-full text-sm border ${focusedOfferId === l.offerId ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                          title={l.property?.address}
                        >
                          {l.property?.address?.split(',')[0] || 'Rental'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Landlord Information */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Landlord Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{dashboardData.landlord?.name}</p>
                      <p className="text-sm text-gray-600">{dashboardData.landlord?.company}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">{(currentLandlord?.email || dashboardData.landlord?.email)}</p>
                      <p className="text-sm text-gray-600">{(currentLandlord?.phone || dashboardData.landlord?.phone)}</p>
                      <p className="text-sm text-gray-600">{(currentLandlord?.address || dashboardData.landlord?.address)}</p>
                    </div>
                    <button 
                      onClick={() => navigate(`/messaging?conversationId=new&propertyId=${currentProperty?.id || dashboardData.property?.id}`)}
                      className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Contact Landlord
                    </button>
                  </div>
                </div>

                {/* Property Details */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">{(currentProperty?.address || dashboardData.property?.address)}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Rooms:</span> {(currentProperty?.rooms || dashboardData.property?.rooms)}
                      </div>
                      <div>
                        <span className="font-medium">Bathrooms:</span> {(currentProperty?.bathrooms || dashboardData.property?.bathrooms)}
                      </div>
                      <div>
                        <span className="font-medium">Area:</span> {formatArea(currentProperty?.area || dashboardData.property?.area)}
                      </div>
                      <div>
                        <span className="font-medium">Lease Term:</span> {(currentProperty?.leaseTerm || dashboardData.property?.leaseTerm)} months
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">Amenities:</p>
                      <div className="flex flex-wrap gap-2">
                        {(currentProperty?.amenities || dashboardData.property?.amenities)?.map((amenity, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payments (compact) */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payments</h3>
                  {dashboardData.payments && dashboardData.payments.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.payments.slice(0, 2).map((payment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {payment.purpose === 'DEPOSIT_AND_FIRST_MONTH' ? 'Deposit & First Month' : payment.purpose}
                            </p>
                            <p className="text-xs text-gray-600">Paid on {formatDate(payment.date)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                            <p className="text-xs text-gray-600">{payment.status}</p>
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => navigate('/payment-history')}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Full Payment History
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No payments yet.</p>
                  )}
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

            {/* Lease Progress (moved into middle area) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lease Progress</h3>
              {/* Empty when no active lease */}
              {!leaseMeta?.id ? (
                <p className="text-sm text-gray-600">No active lease yet.</p>
              ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">
                    {formatDate(currentLeaseInfo?.startDate)} - {formatDate(currentLeaseInfo?.endDate)}
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
                {leaseMeta && (
                  <div className="space-y-2">
                    {leaseMeta.terminationNoticeDate && (
                      <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                        Termination notice submitted • effective {new Date(leaseMeta.terminationEffectiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    )}
                    {leaseMeta.renewalStatus === 'DECLINED' && (
                      <div className="text-xs text-yellow-800 bg-yellow-50 border border-yellow-200 rounded p-2">
                        Renewal declined
                      </div>
                    )}
                  </div>
                )}
                {/* Two-column layout: left stable actions, right renewal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left column */}
                  <div className="space-y-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="text-sm font-semibold text-gray-800 mb-1">Current lease</div>
                    <button 
                      onClick={handleViewContract}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Lease Agreement
                    </button>
                    <button 
                      onClick={handleDownloadContract}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Download Contract
                    </button>
                    {!leaseMeta?.terminationNoticeDate && (
                      <button
                        onClick={() => setShowEndModal(true)}
                        className="w-full bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center space-x-2"
                        title="End lease (30-day notice)"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>End Lease</span>
                      </button>
                    )}
                  </div>

                  {/* Right column */}
                  <div className="space-y-2 bg-indigo-50/40 border border-indigo-200 rounded-lg p-3">
                    <div className="text-sm font-semibold text-indigo-800 mb-1">Renewal</div>
                    <button
                      onClick={() => setShowRenewalModal(true)}
                      className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                      title="Request lease renewal"
                    >
                      Request Renewal
                    </button>

                    {renewals.length > 0 && (
                      <div className="bg-white border border-indigo-200 rounded p-3">
                        <div className="text-sm font-semibold text-indigo-800 mb-2">Renewal thread</div>
                        <div className="space-y-2 max-h-48 overflow-auto pr-1">
                          {renewals.slice().reverse().map(r => (
                            <div key={r.id} className="text-xs text-gray-700 bg-white border border-gray-100 rounded p-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{r.status}</span>
                                <span className="text-[10px] text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                              </div>
                              {r.proposedMonthlyRent != null && (
                                <div className="mt-1">Proposed rent: {r.proposedMonthlyRent} zł</div>
                              )}
                              {r.proposedTermMonths && (
                                <div>Term: {r.proposedTermMonths} months</div>
                              )}
                              {r.proposedStartDate && (
                                <div>Start: {new Date(r.proposedStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                              )}
                              {r.note && (<div className="mt-1 text-gray-600">Note: {r.note}</div>)}
                            </div>
                          ))}
                        </div>
                        {latestOpen && latestOpen.initiatorUserId !== user?.id && (
                          <div className="mt-2 flex space-x-2">
                            <button
                              onClick={async () => {
                                try {
                                  await api.post(`/renewals/${latestOpen.id}/accept`, {});
                                  if (leaseMeta?.id) {
                                    const threadResp = await api.get(`/leases/${leaseMeta.id}/renewals`);
                                    setRenewals(threadResp.data?.renewals || []);
                                  }
                                  alert('Renewal accepted. New lease created.');
                                } catch (e) { alert('Failed to accept renewal'); }
                              }}
                              className="px-3 py-1 rounded text-xs bg-green-600 text-white hover:bg-green-700"
                            >
                              Accept
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await api.post(`/renewals/${latestOpen.id}/decline`, {});
                                  if (leaseMeta?.id) {
                                    const threadResp = await api.get(`/leases/${leaseMeta.id}/renewals`);
                                    setRenewals(threadResp.data?.renewals || []);
                                  }
                                } catch (e) { alert('Failed to decline renewal'); }
                              }}
                              className="px-3 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-700"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )}
              {/* Renewal Request Modal */}
              <RenewalRequestModal
                open={showRenewalModal}
                defaultTerm={12}
                submitting={sendingRenewal}
                onClose={() => setShowRenewalModal(false)}
                onSubmit={async ({ termMonths, note }) => {
                  try {
                    if (!currentOfferForMeta) { alert('No active booking found.'); return; }
                    setSendingRenewal(true);
                    const metaResp = await api.get(`/leases/by-offer/${currentOfferForMeta}`);
                    const leaseId = metaResp.data?.lease?.id;
                    if (!leaseId) { alert('No lease found for this booking.'); setSendingRenewal(false); return; }
                    await api.post(`/leases/${leaseId}/renewals`, { proposedTermMonths: termMonths || 12, note: note || '' });
                    const threadResp = await api.get(`/leases/${leaseId}/renewals`);
                    setRenewals(threadResp.data?.renewals || []);
                    setShowRenewalModal(false);
                  } catch (e) {
                    console.error('Request renewal error:', e);
                    alert('Failed to create renewal request');
                  } finally {
                    setSendingRenewal(false);
                  }
                }}
              />

              {/* End Lease Modal */}
              <EndLeaseModal
                open={showEndModal}
                submitting={sendingEnd}
                effectiveDate={(() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString(); })()}
                onClose={() => setShowEndModal(false)}
                onSubmit={async ({ reason, effectiveDate }) => {
                  try {
                    if (!currentOfferForMeta) { alert('No active booking found.'); return; }
                    setSendingEnd(true);
                    const metaResp = await api.get(`/leases/by-offer/${currentOfferForMeta}`);
                    const leaseId = metaResp.data?.lease?.id;
                    if (!leaseId) { alert('No lease found for this booking.'); setSendingEnd(false); return; }
                    await api.post(`/leases/${leaseId}/termination/notice`, { reason: reason || 'Tenant initiated termination', effectiveDate });
                    const newMeta = await api.get(`/leases/by-offer/${currentOfferForMeta}`);
                    setLeaseMeta(newMeta.data?.lease || null);
                    await fetchDashboardData();
                    setShowEndModal(false);
                  } catch (e) {
                    console.error('End lease (dashboard) error:', e);
                    alert('Failed to submit termination notice');
                  } finally {
                    setSendingEnd(false);
                  }
                }}
              />

              {/* Tenant Group Choice Modal removed - no create request functionality */}
            </div>

            {/* Review System */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Review System</h3>
              <p className="text-sm text-gray-600 mb-6">Your 3-stage review progress and rating</p>
                              <ReviewCard userId={user?.id} isLandlord={false} />
              
              <div className="mt-4 text-center">
                <button 
                  onClick={() => navigate('/reviews')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Full Review System
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TenantDashboardNew; 