import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LandlordSidebar from '../components/LandlordSidebar';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Eye,
  MessageSquare,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Mail,
  Phone,
  Lock,
  Home,
  Send,
  X,
  LogOut,
  FileText
} from 'lucide-react';

const LandlordRentalRequests = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('active');
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [offerData, setOfferData] = useState({
    monthlyRent: '',
    securityDeposit: '',
    availableFrom: '',
    leaseDuration: '12 months',
    additionalTerms: ''
  });
  const [sendingOffer, setSendingOffer] = useState(false);
  const [offerSent, setOfferSent] = useState(false);
  const [declineSuccess, setDeclineSuccess] = useState('');
  const [decliningRequest, setDecliningRequest] = useState(null);
  
  const { api } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    fetchRentalRequests();
    fetchProfileData();
  }, []);

  // Calculate total initial cost when rent or deposit changes
  useEffect(() => {
    const rent = parseFloat(offerData.monthlyRent) || 0;
    const deposit = parseFloat(offerData.securityDeposit) || 0;
    const total = rent + deposit;
    setOfferData(prev => ({ ...prev, totalInitialCost: total }));
  }, [offerData.monthlyRent, offerData.securityDeposit]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (declineSuccess) {
      const timer = setTimeout(() => {
        setDeclineSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [declineSuccess]);

  const fetchRentalRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/rental-requests');
      console.log('Rental requests response:', response.data);
      
      // Check if landlord has no properties
      if (response.data.message && response.data.message.includes('No properties found')) {
        setRequests([]);
        setError('No properties found. Add properties to see matching rental requests.');
        return;
      }
      
      // If we have real data, transform it to match our frontend structure
      if (response.data.rentalRequests && response.data.rentalRequests.length > 0) {
        const transformedRequests = response.data.rentalRequests.map(request => ({
          id: request.id,
          name: request.tenant?.name || 'Unknown Tenant',
          initials: request.tenant?.name?.split(' ').map(n => n[0]).join('') || 'UT',
          rating: 4.5, // Mock rating
          reviews: 12, // Mock reviews
          quote: request.description || 'No description provided.',
          email: request.tenant?.email || '......@email.com',
          phone: request.tenant?.phoneNumber || '+48 ...... 789',
          age: '25-34 years', // Mock data
          occupation: 'Technology', // Mock data
          budgetRange: `${request.budgetFrom || 0} zł - ${request.budgetTo || request.budget || 0} zł`,
          moveInDate: new Date(request.moveInDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          location: request.location,
          requirements: request.description || 'No specific requirements.',
          propertyMatch: {
            address: `ul. ${request.location} 123, ${request.location}`,
            rent: `${request.budget || request.budgetTo || 3000} zł`,
            available: new Date(request.moveInDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          },
          interestCount: request.viewCount || 0,
          status: request.poolStatus === 'ACTIVE' ? 'active' : 'inactive'
        }));
        setRequests(transformedRequests);
        setError(''); // Clear any existing errors
      } else {
        // No matching rental requests found
        setRequests([]);
        setError('No matching rental requests found for your properties.');
      }
    } catch (error) {
      console.error('Error fetching rental requests:', error);
      setError('Failed to load rental requests');
      // Fallback to mock data only if it's not a "no properties" error
      if (!error.response?.data?.message?.includes('No properties found')) {
        setRequests(mockTenants);
      } else {
        setRequests([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileData = async () => {
    try {
      setProfileLoading(true);
      const response = await api.get('/users/profile');
      console.log('Profile response:', response.data); // Debug log
      setProfileData(response.data.user); // Fix: access the user object from response
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
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

  const handleSendOffer = (tenant) => {
    setSelectedTenant(tenant);
    // Extract rent amount from property match (remove "zł" and convert to number)
    const rentAmount = parseInt(tenant.propertyMatch.rent.replace(' zł', '').replace(/\s/g, ''));
    setOfferData({
      monthlyRent: rentAmount.toString(),
      securityDeposit: rentAmount.toString(),
      availableFrom: tenant.propertyMatch.available,
      leaseDuration: '12 months',
      additionalTerms: ''
    });
    setShowOfferModal(true);
    setOfferSent(false);
  };

  const handleCloseModal = () => {
    setShowOfferModal(false);
    setSelectedTenant(null);
    setOfferData({
      monthlyRent: '',
      securityDeposit: '',
      availableFrom: '',
      leaseDuration: '12 months',
      additionalTerms: ''
    });
    setOfferSent(false);
  };

  const handleSubmitOffer = async () => {
    try {
      setSendingOffer(true);
      
      // Make the actual API call
      const response = await api.post(`/rental-request/${selectedTenant.id}/offer`, {
        rentAmount: parseFloat(offerData.monthlyRent),
        depositAmount: parseFloat(offerData.securityDeposit),
        leaseDuration: parseInt(offerData.leaseDuration.split(' ')[0]), // Extract number from "12 months"
        availableFrom: offerData.availableFrom,
        description: offerData.additionalTerms,
        propertyAddress: selectedTenant.propertyMatch.address,
        propertyType: 'Apartment', // Default type
        utilitiesIncluded: false // Default value
      });
      
      setOfferSent(true);
      
      // Close modal after 3 seconds
      setTimeout(() => {
        handleCloseModal();
        // Refresh the rental requests list
        fetchRentalRequests();
      }, 3000);
      
    } catch (error) {
      console.error('Error sending offer:', error);
      setError('Failed to send offer. Please try again.');
    } finally {
      setSendingOffer(false);
    }
  };

  const handleDeclineRequest = async (tenant) => {
    try {
      setDecliningRequest(tenant.id);
      const response = await api.post(`/rental-request/${tenant.id}/decline`, {
        reason: 'Not a good match for our property'
      });
      
      // Show success message
      setDeclineSuccess('Request declined successfully!');
      
      // Refresh the rental requests list
      fetchRentalRequests();
      
    } catch (error) {
      console.error('Error declining request:', error);
      setError('Failed to decline request. Please try again.');
    } finally {
      setDecliningRequest(null);
    }
  };

  const formatCurrencyDisplay = (amount) => {
    return new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Mock data for demonstration - replace with real data
  const mockTenants = [
    {
      id: 18, // Real rental request ID from database
      name: 'Jan Kowalski',
      initials: 'JK',
      rating: 4.5,
      reviews: 12,
      quote: 'Clean, responsible tenant. Always paid rent on time.',
      email: '......@email.com',
      phone: '+48 ...... 789',
      age: '25-34 years',
      occupation: 'Technology',
      budgetRange: '2000 zł - 3500 zł',
      moveInDate: 'Sep 15, 2024',
      location: 'Poznań',
      requirements: 'Clean, responsible tenant looking for long-term rental. Non-smoker, no pets.',
      propertyMatch: {
        address: 'ul. Poznańska 125, Poznań',
        rent: '3200 zł',
        available: 'Sep 01, 2024'
      },
      interestCount: 3,
      status: 'active'
    },
    {
      id: 19, // Real rental request ID from database
      name: 'Anna Nowak',
      initials: 'AN',
      rating: 4.2,
      reviews: 8,
      quote: 'Quiet tenant, perfect for family neighborhoods.',
      email: '......@email.com',
      phone: '+48 ...... 456',
      age: '35-44 years',
      occupation: 'Finance',
      budgetRange: '4000 zł - 6000 zł',
      moveInDate: 'Oct 01, 2024',
      location: 'Warszawa',
      requirements: 'Professional looking for quiet apartment near business district.',
      propertyMatch: {
        address: 'ul. Marszałkowska 45, Warszawa',
        rent: '5200 zł',
        available: 'Oct 01, 2024'
      },
      interestCount: 1,
      status: 'active'
    }
  ];

  const getFilteredTenants = () => {
    switch (activeFilter) {
      case 'active':
        return requests.filter(tenant => tenant.status === 'active');
      case 'offered':
        return requests.filter(tenant => tenant.status === 'offered');
      case 'declined':
        return requests.filter(tenant => tenant.status === 'declined');
      default:
        return requests;
    }
  };

  const getStatusCounts = () => {
    return {
      active: requests.filter(t => t.status === 'active').length,
      offered: requests.filter(t => t.status === 'offered').length,
      declined: requests.filter(t => t.status === 'declined').length
    };
  };

  const statusCounts = getStatusCounts();
  const filteredTenants = getFilteredTenants();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex">
        <LandlordSidebar />
        <div className="flex-1 flex flex-col">
          <div className="animate-pulse">
            <div className="h-16 bg-white border-b"></div>
            <div className="flex-1 p-6">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-6">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white rounded-lg shadow p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Sidebar */}
      <LandlordSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Rental Requests</h1>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-900">{user?.name || 'Landlord'}</span>
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-md overflow-hidden">
                  {profileLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : profileData && profileData.profileImage ? (
                    <img
                      src={getProfilePhotoUrl(profileData.profileImage)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Profile image failed to load:', e.target.src);
                        console.log('Profile data:', profileData);
                        console.log('Profile image path:', profileData.profileImage);
                      }}
                      onLoad={() => {
                        console.log('Profile image loaded successfully:', getProfilePhotoUrl(profileData.profileImage));
                      }}
                    />
                  ) : (
                    <span className="text-base font-bold text-white">
                      {user?.name?.charAt(0) || 'L'}
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
          <div className="max-w-7xl mx-auto">
            {/* Page Description */}
            <p className="text-gray-600 mb-8">
              Tenant requests matched to your property listings. Review profiles and send personalized offers.
            </p>

            {/* Error Message */}
            {error && !error.includes('No properties found') && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* No Properties Found - Beautiful Empty State */}
            {error && error.includes('No properties found') && (
              <div className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-8">
                <div className="text-center">
                  {/* Icon */}
                  <div className="mx-auto h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="h-10 w-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Start Your Property Portfolio
                  </h3>
                  
                  {/* Description */}
                  <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                    Add your first property to start receiving rental requests from qualified tenants. 
                    The more properties you list, the more opportunities you'll have to find great tenants.
                  </p>
                  
                  {/* Benefits */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center justify-center h-8 w-8 bg-green-100 rounded-full mb-3 mx-auto">
                        <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">Earn More</h4>
                      <p className="text-sm text-gray-600">Maximize your rental income with competitive pricing</p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center justify-center h-8 w-8 bg-blue-100 rounded-full mb-3 mx-auto">
                        <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">Quality Tenants</h4>
                      <p className="text-sm text-gray-600">Connect with verified, responsible tenants</p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center justify-center h-8 w-8 bg-purple-100 rounded-full mb-3 mx-auto">
                        <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">Easy Management</h4>
                      <p className="text-sm text-gray-600">Streamlined process from listing to lease</p>
                    </div>
                  </div>
                  
                  {/* Call to Action */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => navigate('/landlord-add-property')}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Your First Property
                    </button>
                    
                    <button
                      onClick={() => navigate('/landlord-my-property')}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      View My Properties
                    </button>
                  </div>
                  
                  {/* Help Text */}
                  <p className="text-sm text-gray-500 mt-4">
                    Need help? <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Contact our support team</a>
                  </p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {declineSuccess && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">{declineSuccess}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Status Cards */}
            {!error || !error.includes('No properties found') ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <button
                  onClick={() => setActiveFilter('active')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    activeFilter === 'active'
                      ? 'border-black bg-white'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Requests</p>
                      <p className="text-2xl font-bold text-yellow-600">{statusCounts.active}</p>
                    </div>
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                </button>

                <button
                  onClick={() => setActiveFilter('offered')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    activeFilter === 'offered'
                      ? 'border-black bg-white'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Offered</p>
                      <p className="text-2xl font-bold text-blue-600">{statusCounts.offered}</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-gray-400" />
                  </div>
                </button>

                <button
                  onClick={() => setActiveFilter('declined')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    activeFilter === 'declined'
                      ? 'border-black bg-white'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Declined</p>
                      <p className="text-2xl font-bold text-red-600">{statusCounts.declined}</p>
                    </div>
                    <XCircle className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
              </div>
            ) : null}

            {/* Section Header */}
            {!error || !error.includes('No properties found') ? (
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {filteredTenants.length} pending requests
                </h2>
                <span className="text-sm text-gray-500">
                  Showing: {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Requests
                </span>
              </div>
            ) : null}

            {/* Tenant Profile Cards */}
            <div className="space-y-6">
              {filteredTenants.map((tenant) => (
                <div key={tenant.id} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                  {/* Interest Indicator */}
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <div className="flex items-center text-sm text-gray-600">
                      <Eye className="h-4 w-4 mr-2" />
                      {tenant.interestCount} other landlords have shown interest.
                    </div>
                  </div>

                  {/* Privacy Banner */}
                  <div className="bg-blue-50 px-6 py-3 border-b border-blue-200">
                    <div className="flex items-center text-sm text-blue-800">
                      <Lock className="h-4 w-4 mr-2" />
                      Privacy Protected. Full contact details will be revealed after tenant accepts your offer and completes payment.
                    </div>
                  </div>

                  {/* Tenant Information */}
                  <div className="p-6">
                    <div className="flex items-start space-x-4 mb-6">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">{tenant.initials}</span>
                        </div>
                      </div>

                      {/* Tenant Details */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{tenant.name}</h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </span>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= Math.floor(tenant.rating)
                                    ? 'text-yellow-400 fill-current'
                                    : star === Math.ceil(tenant.rating) && tenant.rating % 1 !== 0
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {tenant.rating} ({tenant.reviews} reviews)
                          </span>
                        </div>

                        {/* Quote */}
                        <p className="text-sm text-gray-700 italic mb-4">"{tenant.quote}"</p>

                        {/* Contact Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-4 w-4 mr-2" />
                            Email: {tenant.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            Phone: {tenant.phone}
                          </div>
                        </div>

                        {/* Demographics and Preferences */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Age & Occupation</p>
                            <p className="text-sm font-medium text-gray-900">{tenant.age}, {tenant.occupation}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Budget Range</p>
                            <p className="text-sm font-medium text-gray-900">{tenant.budgetRange}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Preferred Move-in</p>
                            <p className="text-sm font-medium text-gray-900">{tenant.moveInDate}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                            <p className="text-sm font-medium text-gray-900">{tenant.location}</p>
                          </div>
                        </div>

                        {/* Property Match */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-green-800">Matched with your property</span>
                          </div>
                          <p className="text-sm text-green-700 font-medium">{tenant.propertyMatch.address}</p>
                          <p className="text-sm text-green-700">
                            Rent: {tenant.propertyMatch.rent} Available: {tenant.propertyMatch.available}
                          </p>
                        </div>

                        {/* Tenant Requirements */}
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Tenant Requirements</h4>
                          <p className="text-sm text-gray-600">{tenant.requirements}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-4">
                          <button 
                            onClick={() => handleSendOffer(tenant)}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send Offer
                          </button>
                          <button 
                            onClick={() => handleDeclineRequest(tenant)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            disabled={decliningRequest === tenant.id}
                          >
                            {decliningRequest === tenant.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <X className="h-4 w-4 mr-2" />
                            )}
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredTenants.length === 0 && !error.includes('No properties found') && (
              <div className="bg-white rounded-lg shadow p-12 text-center border border-gray-200">
                <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeFilter} requests found</h3>
                <p className="text-gray-500 mb-6">
                  There are currently no {activeFilter} rental requests matching your properties. Check back later for new requests.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Send Offer Modal */}
      {showOfferModal && selectedTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Home className="h-6 w-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Send Offer to {selectedTenant.name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Configure your rental offer terms and conditions for this tenant.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Success Message */}
            {offerSent && (
              <div className="p-6 bg-green-50 border-b border-green-200">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-green-800">Offer sent successfully!</h3>
                    <p className="text-sm text-green-700">
                      Your offer has been sent to {selectedTenant.name}. They will be notified and can review your terms.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Financial Terms */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Financial Terms</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Tenant's budget: {selectedTenant.budgetRange} • You can adjust your offer within reasonable range.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Rent (PLN)
                    </label>
                    <input
                      type="number"
                      value={offerData.monthlyRent}
                      onChange={(e) => setOfferData(prev => ({ ...prev, monthlyRent: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="3200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Security Deposit (PLN)
                    </label>
                    <input
                      type="number"
                      value={offerData.securityDeposit}
                      onChange={(e) => setOfferData(prev => ({ ...prev, securityDeposit: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="3200"
                    />
                  </div>
                </div>

                {/* Total Initial Cost */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-sm text-green-700 mb-1">Total Initial Cost (Rent + Deposit)</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrencyDisplay(offerData.totalInitialCost || 0)} zł
                    </p>
                    <p className="text-sm text-green-600">
                      This is what the tenant will need to pay upfront to secure the property
                    </p>
                  </div>
                </div>
              </div>

              {/* Lease Terms */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Lease Terms</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available From
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={offerData.availableFrom}
                        onChange={(e) => setOfferData(prev => ({ ...prev, availableFrom: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lease Duration
                    </label>
                    <div className="relative">
                      <select
                        value={offerData.leaseDuration}
                        onChange={(e) => setOfferData(prev => ({ ...prev, leaseDuration: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      >
                        <option value="6 months">6 months</option>
                        <option value="12 months">12 months</option>
                        <option value="18 months">18 months</option>
                        <option value="24 months">24 months</option>
                      </select>
                      <div className="absolute right-3 top-2.5 pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Terms & Conditions */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Additional Terms & Conditions</h3>
                <textarea
                  value={offerData.additionalTerms}
                  onChange={(e) => setOfferData(prev => ({ ...prev, additionalTerms: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Pets allowed (small dogs/cats), No smoking, Utilities included (water, heating), Internet included"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Include any specific conditions, allowed pets, utility inclusions, or property rules
                </p>
              </div>

              {/* Contract Integration Box */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-orange-800">
                      These additional terms & conditions will be automatically included in the rental contract that will be generated after the tenant pays for the property.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitOffer}
                disabled={sendingOffer || offerSent}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingOffer ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : offerSent ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Offer Sent
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Send Offer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandlordRentalRequests; 