import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const LandlordDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [rentalRequests, setRentalRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [activeTab, setActiveTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRentalRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/rental-requests');
      setRentalRequests(response.data.rentalRequests || []);
    } catch (error) {
      console.error('Error fetching rental requests:', error);
      setError('Failed to load rental requests');
    } finally {
      setLoading(false);
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
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate counts for each status
  const getStatusCounts = () => {
    const counts = {
      active: 0,
      offered: 0,
      declined: 0
    };
    
    rentalRequests.forEach(request => {
      if (request.status === 'ACTIVE' || request.status === 'MATCHED') {
        counts.active++;
      } else if (request.status === 'OFFERED') {
        counts.offered++;
      } else if (request.status === 'DECLINED') {
        counts.declined++;
      }
    });
    
    return counts;
  };

  // Filter requests based on active tab
  const getFilteredRequests = () => {
    const counts = getStatusCounts();
    
    switch (activeTab) {
      case 'active':
        return rentalRequests.filter(req => req.status === 'ACTIVE' || req.status === 'MATCHED');
      case 'offered':
        return rentalRequests.filter(req => req.status === 'OFFERED');
      case 'declined':
        return rentalRequests.filter(req => req.status === 'DECLINED');
      default:
        return rentalRequests;
    }
  };

  const handleSendOffer = (requestId) => {
    // TODO: Implement send offer functionality
    console.log('Send offer for request:', requestId);
  };

  const handleDecline = (requestId) => {
    // TODO: Implement decline functionality
    console.log('Decline request:', requestId);
  };

  useEffect(() => {
    fetchRentalRequests();
  }, []);

  const statusCounts = getStatusCounts();
  const filteredRequests = getFilteredRequests();

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
              to="/tenant-rental-requests"
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                location.pathname === '/tenant-rental-requests' 
                  ? 'text-black bg-gray-100' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Rental Requests
            </Link>
            
            <Link
              to="/landlord-my-property"
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                location.pathname === '/landlord-my-property' 
                  ? 'text-black bg-gray-100' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              My Properties
            </Link>
            
            <Link
              to="/landlord-profile"
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                location.pathname === '/landlord-profile' 
                  ? 'text-black bg-gray-100' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </Link>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rental Requests</h1>
              <p className="text-gray-600 mt-1">Tenant requests matched to your property listings. Review profiles and send personalized offers.</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-900">{user?.name || 'Test Landlord'}</span>
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.name?.charAt(0) || 'L'}
                  </span>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Status Overview Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className={`bg-white rounded-lg p-4 border-2 ${activeTab === 'active' ? 'border-black' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Requests</p>
                    <p className="text-2xl font-bold text-orange-500">{statusCounts.active}</p>
                  </div>
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              
              <div className={`bg-white rounded-lg p-4 border-2 ${activeTab === 'offered' ? 'border-black' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Offered</p>
                    <p className="text-2xl font-bold text-blue-500">{statusCounts.offered}</p>
                  </div>
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              <div className={`bg-white rounded-lg p-4 border-2 ${activeTab === 'declined' ? 'border-black' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Declined</p>
                    <p className="text-2xl font-bold text-red-500">{statusCounts.declined}</p>
                  </div>
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'active' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Active Requests
                </button>
                <button
                  onClick={() => setActiveTab('offered')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'offered' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Offered
                </button>
                <button
                  onClick={() => setActiveTab('declined')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'declined' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Declined
                </button>
              </div>
              
              <div className="text-sm text-gray-600">
                Showing: {activeTab === 'active' ? 'Active Requests' : activeTab === 'offered' ? 'Offered Requests' : 'Declined Requests'}
              </div>
            </div>

            {/* Requests List */}
            {loading ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading rental requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <div className="text-gray-400 text-4xl mb-4">📝</div>
                <p className="text-gray-600 text-lg mb-4">
                  {activeTab === 'active' ? 'No active requests available.' : 
                   activeTab === 'offered' ? 'No offers sent yet.' : 
                   'No declined requests.'}
                </p>
                <p className="text-gray-500 mb-4">
                  {activeTab === 'active' ? 'When tenants create rental requests that match your properties, they will appear here.' :
                   activeTab === 'offered' ? 'Your sent offers will appear here once you start making offers to tenants.' :
                   'Declined requests will appear here.'}
                </p>
                <Link
                  to="/landlord-add-property"
                  className="inline-flex items-center px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Property
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Interest indicator */}
                {activeTab === 'active' && filteredRequests.length > 0 && (
                  <div className="bg-gray-100 rounded-lg p-3 flex items-center">
                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      {Math.floor(Math.random() * 5) + 1} other landlords have shown interest
                    </span>
                  </div>
                )}

                {filteredRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {/* Privacy Protected Banner */}
                    <div className="bg-blue-50 border-b border-blue-200 p-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-blue-900">Privacy Protected</p>
                          <p className="text-xs text-blue-700">Full contact details will be revealed after tenant accepts your offer and completes payment.</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Tenant Profile Section */}
                      <div className="flex items-start space-x-4 mb-6">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-lg font-semibold text-blue-600">
                              {request.tenant?.firstName?.charAt(0) || 'T'}{request.tenant?.lastName?.charAt(0) || 'N'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {request.tenant?.firstName || 'Tenant'} {request.tenant?.lastName || 'Name'}
                            </h3>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1 mb-2">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} className="w-4 h-4" fill={i < 4 ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">4.5 (12 reviews)</span>
                          </div>
                          
                          <p className="text-sm text-gray-600 italic mb-3">
                            "Clean, responsible tenant. Always paid rent on time."
                          </p>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Email:</span>
                              <p className="font-medium">......@email.com</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Phone:</span>
                              <p className="font-medium">+48 ...... 789</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Age & Occupation:</span>
                              <p className="font-medium">25-34 years, Technology</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Budget Range:</span>
                              <p className="font-medium">{formatCurrency(request.budgetFrom || 2000)} - {formatCurrency(request.budgetTo || 3500)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Preferred Move-in:</span>
                              <p className="font-medium">{formatDate(request.preferredMoveIn || new Date())}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Location:</span>
                              <p className="font-medium">{request.location || 'Poznań'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Matched Property Section */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center mb-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-sm font-medium text-green-800">Matched with your property</span>
                        </div>
                        <div className="text-sm text-green-700">
                          <p className="font-medium">ul. Poznańska 125, Poznań</p>
                          <p>Rent: {formatCurrency(3200)} • Available: {formatDate(new Date())}</p>
                        </div>
                      </div>

                      {/* Tenant Requirements */}
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Tenant Requirements</h4>
                        <p className="text-sm text-gray-600">
                          {request.description || 'Clean, responsible tenant looking for long-term rental. Non-smoker, no pets.'}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      {activeTab === 'active' && (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleSendOffer(request.id)}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Send Offer
                          </button>
                          <button
                            onClick={() => handleDecline(request.id)}
                            className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Decline
                          </button>
                        </div>
                      )}

                      {/* Offer Status (for offered requests) */}
                      {activeTab === 'offered' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                              <span className="text-sm font-medium text-blue-800">Offer Sent</span>
                            </div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              Expired
                            </span>
                          </div>
                          <p className="text-sm text-blue-700 mb-2">
                            Property: ul. Poznańska 125, Poznań • Rent: {formatCurrency(3200)} • Sent: {formatDate(request.createdAt)}, 11:30
                          </p>
                          <p className="text-xs text-blue-600">
                            Full tenant contact details will be shared once they accept your offer.
                          </p>
                        </div>
                      )}

                      {/* Declined Status (for declined requests) */}
                      {activeTab === 'declined' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-sm font-medium text-red-800">Request Declined</span>
                          </div>
                          <p className="text-sm text-red-700 mt-1">
                            This request has been declined and removed from active listings.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LandlordDashboard; 