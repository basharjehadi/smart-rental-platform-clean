import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TenantRequestCard from '../components/TenantRequestCard';
import SendOfferModal from '../components/SendOfferModal';
import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
});

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const LandlordRequests = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [offerForm, setOfferForm] = useState({
    monthlyRent: '',
    securityDeposit: '',
    availableFrom: '',
    leaseDuration: '12',
    additionalTerms: ''
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, activeTab]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // For now, we'll use mock data. In real implementation, this would be an API call
      const mockRequests = [
        {
          id: 1,
          tenant: {
            id: 'tenant1',
            name: 'Anna K.',
            photo: null,
            verified: true,
            rating: 4.5,
            reviewCount: 12,
            review: 'Clean, responsible tenant. Always paid rent on time.',
            age: '25-34',
            occupation: 'Technology',
            email: 'anna.k@email.com',
            phone: '+48 123 456 789'
          },
          budgetRange: { min: 2000, max: 3500 },
          preferredMoveIn: '2024-09-15',
          location: 'Poznań',
          matchedProperty: {
            address: 'ul. Poznańska 125, Poznań',
            rent: 3200,
            availableFrom: '2024-09-01'
          },
          requirements: 'Clean, responsible tenant looking for long-term rental. Non-smoker, no pets.',
          status: 'active',
          otherLandlordsInterest: 3,
          createdAt: '2024-01-29T10:30:00Z'
        },
        {
          id: 2,
          tenant: {
            id: 'tenant2',
            name: 'Maria W.',
            photo: null,
            verified: true,
            rating: 4.9,
            reviewCount: 15,
            review: 'Professional and reliable. Left property in perfect condition.',
            age: '25-34',
            occupation: 'Management',
            email: 'maria.w@email.com',
            phone: '+48 987 654 456'
          },
          budgetRange: { min: 3000, max: 4000 },
          preferredMoveIn: '2024-11-01',
          location: 'Warszawa',
          matchedProperty: {
            address: 'ul. Marszałkowska 89, Warszawa',
            rent: 4000,
            availableFrom: '2024-11-15'
          },
          requirements: 'Professional tenant with stable income, looking for modern accommodation.',
          status: 'active',
          otherLandlordsInterest: 5,
          createdAt: '2024-01-28T14:20:00Z'
        },
        {
          id: 3,
          tenant: {
            id: 'tenant3',
            name: 'Jakub N.',
            photo: null,
            verified: true,
            rating: 4.5,
            reviewCount: 8,
            review: 'Excellent tenant, very quiet and respectful of property.',
            age: '18-24',
            occupation: 'Student',
            email: 'jakub.n@email.com',
            phone: '+48 555 123 321'
          },
          budgetRange: { min: 1500, max: 2000 },
          preferredMoveIn: '2024-10-01',
          location: 'Warszawa',
          matchedProperty: {
            address: 'ul. Krakowska 45, Kraków',
            rent: 2800,
            availableFrom: '2025-02-15'
          },
          requirements: 'Quiet student, excellent references from previous landlords.',
          status: 'offered',
          offerSentAt: '2024-01-29T11:30:00Z',
          offerExpired: true,
          offerDetails: {
            monthlyRent: 2800,
            securityDeposit: 2800,
            availableFrom: '2025-02-15',
            leaseDuration: '12'
          }
        },
        {
          id: 4,
          tenant: {
            id: 'tenant4',
            name: 'Tomasz L.',
            photo: null,
            verified: true,
            rating: 4.2,
            reviewCount: 6,
            review: 'Good tenant, minor communication issues but reliable payments.',
            age: '35-44',
            occupation: 'Management',
            email: 'tomasz.l@email.com',
            phone: '+48 777 888 654'
          },
          budgetRange: { min: 2500, max: 3500 },
          preferredMoveIn: '2025-03-15',
          location: 'Wrocław',
          matchedProperty: {
            address: 'ul. Rynek 12, Wrocław',
            rent: 3200,
            availableFrom: '2025-03-01'
          },
          requirements: 'Working professional seeks quiet apartment in city center with good internet connection.',
          status: 'declined',
          declinedAt: '2024-01-27T16:45:00Z'
        }
      ];

      setRequests(mockRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests.filter(request => {
      switch (activeTab) {
        case 'active':
          return request.status === 'active';
        case 'offered':
          return request.status === 'offered';
        case 'declined':
          return request.status === 'declined';
        default:
          return true;
      }
    });
    setFilteredRequests(filtered);
  };

  const getStatusCounts = () => {
    return {
      active: requests.filter(r => r.status === 'active').length,
      offered: requests.filter(r => r.status === 'offered').length,
      declined: requests.filter(r => r.status === 'declined').length
    };
  };

  const handleSendOffer = (request) => {
    setSelectedRequest(request);
    setOfferForm({
      monthlyRent: request.matchedProperty.rent.toString(),
      securityDeposit: request.matchedProperty.rent.toString(),
      availableFrom: request.matchedProperty.availableFrom,
      leaseDuration: '12',
      additionalTerms: ''
    });
    setShowOfferModal(true);
  };

  const handleDecline = async (request) => {
    try {
      // In real implementation, this would be an API call
      const updatedRequests = requests.map(r => 
        r.id === request.id ? { ...r, status: 'declined', declinedAt: new Date().toISOString() } : r
      );
      setRequests(updatedRequests);
    } catch (error) {
      console.error('Error declining request:', error);
      setError('Failed to decline request');
    }
  };

  const handleSubmitOffer = async () => {
    try {
      // In real implementation, this would be an API call
      const updatedRequests = requests.map(r => 
        r.id === selectedRequest.id ? { 
          ...r, 
          status: 'offered', 
          offerSentAt: new Date().toISOString(),
          offerDetails: {
            monthlyRent: parseInt(offerForm.monthlyRent),
            securityDeposit: parseInt(offerForm.securityDeposit),
            availableFrom: offerForm.availableFrom,
            leaseDuration: offerForm.leaseDuration,
            additionalTerms: offerForm.additionalTerms
          }
        } : r
      );
      setRequests(updatedRequests);
      setShowOfferModal(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error sending offer:', error);
      setError('Failed to send offer');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const statusCounts = getStatusCounts();

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
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">RentPlatform Poland</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <Link
              to="/landlord-dashboard"
              className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Dashboard
            </Link>
            
            <Link
              to="/landlord-profile"
              className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Profile
            </Link>
            
            <Link
              to="/landlord-my-property"
              className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              My Properties
            </Link>
            
            <Link
              to="/requests"
              className="flex items-center px-4 py-3 text-sm font-medium text-white bg-black rounded-lg"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Requests
            </Link>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h1 className="text-2xl font-bold text-gray-900">Landlord Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.name || 'Landlord'}</span>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <span>Log out</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-gray-700 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h1 className="text-3xl font-bold text-gray-900">Rental Requests</h1>
                </div>
                <Link
                  to="/landlord-my-property"
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  My Properties
                </Link>
              </div>
              <p className="text-gray-600 text-lg">Tenant requests matched to your property listings. Review profiles and send personalized offers.</p>
            </div>

            {/* Status Tabs */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    activeTab === 'active' 
                      ? 'border-black bg-gray-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium text-gray-900">Active Requests</span>
                    </div>
                    <span className="text-2xl font-bold text-orange-500">{statusCounts.active}</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('offered')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    activeTab === 'offered' 
                      ? 'border-black bg-gray-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium text-gray-900">Offered</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-500">{statusCounts.offered}</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('declined')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    activeTab === 'declined' 
                      ? 'border-black bg-gray-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="font-medium text-gray-900">Declined</span>
                    </div>
                    <span className="text-2xl font-bold text-red-500">{statusCounts.declined}</span>
                  </div>
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Requests List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {filteredRequests.length} {activeTab === 'active' ? 'pending' : activeTab} request{filteredRequests.length !== 1 ? 's' : ''}
                </h2>
                <span className="text-sm text-gray-600">Showing: {activeTab === 'active' ? 'Active' : activeTab === 'offered' ? 'Offered' : 'Declined'} Requests</span>
              </div>

              {filteredRequests.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                  <svg className="w-20 h-20 text-gray-400 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No {activeTab} requests</h3>
                  <p className="text-gray-600">
                    {activeTab === 'active' 
                      ? "You don't have any pending tenant requests at the moment."
                      : activeTab === 'offered'
                      ? "You haven't sent any offers yet."
                      : "You haven't declined any requests yet."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredRequests.map((request) => (
                    <TenantRequestCard
                      key={request.id}
                      request={request}
                      onSendOffer={handleSendOffer}
                      onDecline={handleDecline}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Send Offer Modal */}
      {showOfferModal && selectedRequest && (
        <SendOfferModal
          request={selectedRequest}
          offerForm={offerForm}
          setOfferForm={setOfferForm}
          onClose={() => setShowOfferModal(false)}
          onSubmit={handleSubmitOffer}
        />
      )}
    </div>
  );
};

export default LandlordRequests; 