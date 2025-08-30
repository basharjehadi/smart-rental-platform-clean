import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import api from '../utils/api';
import OfferCard from '../components/OfferCard';
import TenantSidebar from '../components/TenantSidebar';
import NotificationHeader from '../components/common/NotificationHeader';
import { LogOut, CheckCircle, X } from 'lucide-react';

const MyOffers = () => {
  const { user, logout } = useAuth();
  const { markByTypeAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [offers, setOffers] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('PENDING');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tenant/offers');
      setOffers(response.data.offers || []);

      // Fetch user profile data for profile image
      const profileResponse = await api.get('/users/profile');
      setProfileData(profileResponse.data.user);
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

  const handleAcceptOffer = async offerId => {
    try {
      await api.patch(`/tenant/offer/${offerId}`, { status: 'ACCEPTED' });
      fetchOffers(); // Refresh the offers list
    } catch (error) {
      console.error('Error accepting offer:', error);
      setError('Failed to accept offer');
    }
  };

  const handleDeclineOffer = async offerId => {
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
  const getStatusCount = status => {
    return offers.filter(offer => offer.status === status).length;
  };

  const tabs = [
    { key: 'PENDING', label: 'Pending', count: getStatusCount('PENDING') },
    { key: 'ACCEPTED', label: 'Accepted', count: getStatusCount('ACCEPTED') },
    { key: 'PAID', label: 'Paid', count: getStatusCount('PAID') },
    { key: 'DECLINED', label: 'Declined', count: getStatusCount('DECLINED') },
  ];

  useEffect(() => {
    fetchOffers();
    // Mark offer notifications as read when visiting the page
    (async () => {
      try {
        await markByTypeAsRead('NEW_OFFER');
        try {
          window.dispatchEvent(new Event('notif-unread-refresh'));
        } catch {}
      } catch {}
    })();
  }, []);

  useEffect(() => {
    // Check for success message in location state
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(''), 5000); // Clear message after 5 seconds
      // Clear the state to prevent showing the message again on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate]);

  return (
    <div className='min-h-screen bg-primary flex'>
      {/* Left Sidebar */}
      <TenantSidebar />

      {/* Main Content */}
      <div className='flex-1 flex flex-col'>
        {/* Top Header */}
        <header className='header-modern px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-xl font-semibold text-gray-900'>
                My Offers from Landlord
              </h1>
              <p className='text-gray-600 mt-1'>
                Review and manage offers from landlords who responded to my
                rental request.
              </p>
            </div>

            <div className='flex items-center space-x-4'>
              {/* Notification Header */}
              <NotificationHeader />

              <button
                onClick={handleLogout}
                className='flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200'
              >
                <LogOut className='h-4 w-4' />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className='flex-1 p-6'>
          <div className='max-w-6xl mx-auto'>
            {error && (
              <div className='mb-6 text-sm text-red-600 p-4 bg-red-50 border border-red-200 rounded-lg'>
                {error}
              </div>
            )}
            {successMessage && (
              <div className='mb-6 text-sm text-green-600 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center'>
                <CheckCircle className='w-5 h-5 mr-2' />
                {successMessage}
              </div>
            )}

            {/* Status Tabs */}
            <div className='grid grid-cols-5 gap-4 mb-6'>
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`card-modern p-4 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className='text-center'>
                    <div
                      className={`text-2xl font-bold ${
                        activeTab === tab.key
                          ? 'text-blue-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {tab.count}
                    </div>
                    <div className='text-sm text-gray-600 mt-1'>
                      {tab.label}
                    </div>
                    <div
                      className={`w-2 h-2 rounded-full mx-auto mt-2 ${
                        tab.key === 'PENDING'
                          ? 'bg-orange-500'
                          : tab.key === 'ACCEPTED'
                            ? 'bg-blue-500'
                            : tab.key === 'PAID'
                              ? 'bg-green-500'
                              : tab.key === 'DECLINED'
                                ? 'bg-red-500'
                                : 'bg-gray-500'
                      }`}
                    ></div>
                  </div>
                </button>
              ))}
            </div>

            {/* Offers List */}
            <div>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                {activeTab === 'PENDING' &&
                  `${getStatusCount('PENDING')} Pending Offers`}
                {activeTab === 'ACCEPTED' &&
                  `${getStatusCount('ACCEPTED')} Accepted Offers`}
                {activeTab === 'PAID' &&
                  `${getStatusCount('PAID')} Paid Offers`}
                {activeTab === 'DECLINED' &&
                  `${getStatusCount('DECLINED')} Declined Offers`}
                {/* EXPIRED tab removed */}
              </h2>

              {loading ? (
                <div className='card-modern p-8 text-center'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
                  <p className='text-gray-600'>Loading your offers...</p>
                </div>
              ) : filteredOffers.length === 0 ? (
                <div className='card-modern p-8 text-center'>
                  <div className='text-gray-400 text-4xl mb-4'>📋</div>
                  <p className='text-gray-600 text-lg mb-4'>
                    {activeTab === 'PENDING' &&
                      'No pending offers at the moment.'}
                    {activeTab === 'ACCEPTED' && 'No accepted offers yet.'}
                    {activeTab === 'PAID' && 'No paid offers yet.'}
                    {activeTab === 'DECLINED' && 'No declined offers yet.'}
                    {/* EXPIRED state removed */}
                  </p>
                  <p className='text-gray-500'>
                    {activeTab === 'PENDING' &&
                      'Landlords will send you offers when they respond to your rental requests.'}
                    {activeTab === 'ACCEPTED' &&
                      'Accepted offers will appear here once you accept them.'}
                    {activeTab === 'PAID' &&
                      'Paid offers will appear here once you complete payment.'}
                    {activeTab === 'DECLINED' &&
                      'Declined offers will appear here once you decline them.'}
                    {/* EXPIRED helper text removed */}
                  </p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {filteredOffers.map(offer => (
                    <OfferCard
                      key={offer.id}
                      offerId={offer.id}
                      propertyTitle={
                        offer.propertyTitle ||
                        offer.rentalRequest?.title ||
                        'Property Offer'
                      }
                      location={
                        offer.propertyAddress ||
                        offer.rentalRequest?.location ||
                        'Location not specified'
                      }
                      rent={offer.rentAmount}
                      deposit={offer.depositAmount}
                      availableFrom={offer.availableFrom}
                      duration={offer.leaseDuration}
                      amenities={
                        offer.propertyAmenities
                          ? (() => {
                              try {
                                return typeof offer.propertyAmenities ===
                                  'string'
                                  ? JSON.parse(offer.propertyAmenities)
                                  : offer.propertyAmenities;
                              } catch (error) {
                                console.warn(
                                  'Failed to parse propertyAmenities:',
                                  offer.propertyAmenities,
                                  error
                                );
                                return [];
                              }
                            })()
                          : []
                      }
                      terms={offer.description}
                      status={offer.status}
                      propertyImage={
                        offer.propertyImages
                          ? (() => {
                              try {
                                const images =
                                  typeof offer.propertyImages === 'string'
                                    ? JSON.parse(offer.propertyImages)
                                    : offer.propertyImages;
                                return Array.isArray(images) ? images[0] : null;
                              } catch (error) {
                                console.warn(
                                  'Failed to parse propertyImages:',
                                  offer.propertyImages,
                                  error
                                );
                                return null;
                              }
                            })()
                          : null
                      }
                      landlordName={offer.landlord?.name}
                      landlordRating={offer.landlord?.rating}
                      landlordEmail={offer.landlord?.email}
                      landlordPhone={offer.landlord?.phoneNumber}
                      propertyType={offer.propertyType || 'Apartment'}
                      rooms={
                        offer.property?.bedrooms ||
                        offer.propertySize ||
                        offer.rentalRequest?.bedrooms ||
                        1
                      }
                      area={
                        offer.property?.size ||
                        offer.propertySize ||
                        offer.rentalRequest?.bedrooms ||
                        1
                      }
                      bathrooms={
                        offer.property?.bathrooms ||
                        (offer.propertyAmenities
                          ? (() => {
                              try {
                                const amenities =
                                  typeof offer.propertyAmenities === 'string'
                                    ? JSON.parse(offer.propertyAmenities)
                                    : offer.propertyAmenities;
                                return Array.isArray(amenities)
                                  ? amenities.filter(a =>
                                      a.toLowerCase().includes('bath')
                                    ).length
                                  : 1;
                              } catch (error) {
                                console.warn(
                                  'Failed to parse propertyAmenities for bathrooms:',
                                  offer.propertyAmenities,
                                  error
                                );
                                return 1;
                              }
                            })()
                          : 1)
                      }
                      furnishing={
                        offer.property?.furnished
                          ? 'Furnished'
                          : offer.propertyAmenities
                            ? (() => {
                                try {
                                  const amenities =
                                    typeof offer.propertyAmenities === 'string'
                                      ? JSON.parse(offer.propertyAmenities)
                                      : offer.propertyAmenities;
                                  return Array.isArray(amenities) &&
                                    amenities.filter(a =>
                                      a.toLowerCase().includes('furnish')
                                    ).length > 0
                                    ? 'Furnished'
                                    : 'Unfurnished';
                                } catch (error) {
                                  console.warn(
                                    'Failed to parse propertyAmenities for furnishing:',
                                    offer.propertyAmenities,
                                    error
                                  );
                                  return 'Unfurnished';
                                }
                              })()
                            : 'Unfurnished'
                      }
                      parking={
                        offer.property?.parking
                          ? 'Yes'
                          : offer.propertyAmenities
                            ? (() => {
                                try {
                                  const amenities =
                                    typeof offer.propertyAmenities === 'string'
                                      ? JSON.parse(offer.propertyAmenities)
                                      : offer.propertyAmenities;
                                  return Array.isArray(amenities) &&
                                    amenities.filter(a =>
                                      a.toLowerCase().includes('park')
                                    ).length > 0
                                    ? 'Yes'
                                    : 'No';
                                } catch (error) {
                                  console.warn(
                                    'Failed to parse propertyAmenities for parking:',
                                    offer.propertyAmenities,
                                    error
                                  );
                                  return 'No';
                                }
                              })()
                            : 'No'
                      }
                      isPaid={offer.status === 'PAID'}
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
