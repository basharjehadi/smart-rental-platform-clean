import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import OfferCard from '../components/OfferCard';

const MyOffers = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ACTIVE');

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tenant/offers');
      setOffers(response.data.offers || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
      setError('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAcceptOffer = async (offerId) => {
    try {
      await api.patch(`/tenant/offer/${offerId}`, { status: 'ACCEPTED' });
      fetchOffers(); // Refresh the offers list
    } catch (error) {
      console.error('Error accepting offer:', error);
      setError('Failed to accept offer');
    }
  };

  const handleDeclineOffer = async (offerId) => {
    try {
      await api.patch(`/tenant/offer/${offerId}`, { status: 'DECLINED' });
      fetchOffers(); // Refresh the offers list
    } catch (error) {
      console.error('Error declining offer:', error);
      setError('Failed to decline offer');
    }
  };

  // Filter offers by status
  const filteredOffers = offers.filter(offer => offer.status === activeTab);

  // Get counts for each status
  const getStatusCount = (status) => {
    return offers.filter(offer => offer.status === status).length;
  };

  const tabs = [
    { key: 'ACTIVE', label: 'Active', count: getStatusCount('ACTIVE') },
    { key: 'ACCEPTED', label: 'Accepted', count: getStatusCount('ACCEPTED') },
    { key: 'DECLINED', label: 'Declined', count: getStatusCount('DECLINED') },
    { key: 'EXPIRED', label: 'Expired', count: getStatusCount('EXPIRED') }
  ];

  useEffect(() => {
    fetchOffers();
  }, []);

  return (
    <div className="min-h-screen bg-white flex">
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
              to="/tenant-dashboard"
              className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              My requests
            </Link>
            
            <Link
              to="/my-offers"
              className="flex items-center px-4 py-3 text-sm font-medium text-white bg-black rounded-lg"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h6v-2H4v2zM4 11h6V9H4v2zM4 7h6V5H4v2z" />
              </svg>
              View offers
            </Link>
            
            <Link
              to="/tenant-profile"
              className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
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
              <h1 className="text-2xl font-bold text-gray-900">My Offers from Landlord</h1>
              <p className="text-gray-600 mt-1">Review and manage offers from landlords who responded to my rental request.</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/tenant-dashboard"
                className="inline-flex items-center px-4 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                My Requests
              </Link>
              
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-900">{user?.name || 'Test Tenant'}</span>
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.name?.charAt(0) || 'T'}
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
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Status Tabs */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`p-4 rounded-lg border transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      activeTab === tab.key ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {tab.count}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {tab.label}
                    </div>
                    <div className={`w-2 h-2 rounded-full mx-auto mt-2 ${
                      tab.key === 'ACTIVE' ? 'bg-green-500' :
                      tab.key === 'ACCEPTED' ? 'bg-blue-500' :
                      tab.key === 'DECLINED' ? 'bg-red-500' :
                      'bg-orange-500'
                    }`}></div>
                  </div>
                </button>
              ))}
            </div>

            {/* Offers List */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {activeTab === 'ACTIVE' && `${getStatusCount('ACTIVE')} Active Offers`}
                {activeTab === 'ACCEPTED' && `${getStatusCount('ACCEPTED')} Accepted Offers`}
                {activeTab === 'DECLINED' && `${getStatusCount('DECLINED')} Declined Offers`}
                {activeTab === 'EXPIRED' && `${getStatusCount('EXPIRED')} Expired Offers`}
              </h2>

              {loading ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your offers...</p>
                </div>
              ) : filteredOffers.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                  <div className="text-gray-400 text-4xl mb-4">📋</div>
                  <p className="text-gray-600 text-lg mb-4">
                    {activeTab === 'ACTIVE' && 'No active offers at the moment.'}
                    {activeTab === 'ACCEPTED' && 'No accepted offers yet.'}
                    {activeTab === 'DECLINED' && 'No declined offers yet.'}
                    {activeTab === 'EXPIRED' && 'No expired offers yet.'}
                  </p>
                  <p className="text-gray-500">
                    {activeTab === 'ACTIVE' && 'Landlords will send you offers when they respond to your rental requests.'}
                    {activeTab === 'ACCEPTED' && 'Accepted offers will appear here once you accept them.'}
                    {activeTab === 'DECLINED' && 'Declined offers will appear here once you decline them.'}
                    {activeTab === 'EXPIRED' && 'Expired offers will appear here when offers expire.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOffers.map((offer) => (
                    <OfferCard
                      key={offer.id}
                      offerId={offer.id}
                      propertyTitle={offer.propertyTitle || offer.rentalRequest?.title}
                      location={offer.propertyAddress || offer.rentalRequest?.location}
                      rent={offer.rentAmount}
                      deposit={offer.depositAmount}
                      availableFrom={offer.availableFrom}
                      duration={offer.leaseDuration}
                      amenities={offer.propertyAmenities ? JSON.parse(offer.propertyAmenities) : []}
                      terms={offer.description}
                      status={offer.status}
                      propertyImage={offer.propertyImages ? JSON.parse(offer.propertyImages)[0] : null}
                      landlordName={offer.landlord?.name}
                      landlordRating={offer.landlord?.rating}
                      landlordEmail={offer.landlord?.email}
                      landlordPhone={offer.landlord?.phone}
                      propertyType={offer.propertyType}
                      rooms={offer.propertySize}
                      area={offer.propertySize}
                      bathrooms={offer.propertyAmenities ? JSON.parse(offer.propertyAmenities).filter(a => a.toLowerCase().includes('bath')).length : 1}
                      furnishing={offer.propertyAmenities ? JSON.parse(offer.propertyAmenities).filter(a => a.toLowerCase().includes('furnish')).length > 0 ? 'Furnished' : 'Unfurnished' : 'Unfurnished'}
                      parking={offer.propertyAmenities ? JSON.parse(offer.propertyAmenities).filter(a => a.toLowerCase().includes('park')).length > 0 ? 'Yes' : 'No' : 'No'}
                      isPaid={offer.isPaid || false}
                      onAccept={handleAcceptOffer}
                      onDecline={handleDeclineOffer}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyOffers; 