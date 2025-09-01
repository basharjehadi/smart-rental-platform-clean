import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import CreateRentalRequestModal from '../components/CreateRentalRequestModal';
import TenantSidebar from '../components/TenantSidebar';
import Chat from '../components/chat/Chat';
import { LogOut } from 'lucide-react';
import NotificationHeader from '../components/common/NotificationHeader';
import { useNotifications } from '../contexts/NotificationContext';
import dayjs from 'dayjs';

import TenantGroupChoiceModal from '../components/TenantGroupChoiceModal.jsx';
import ReportIssueForm from '../components/ReportIssueForm.jsx';
import MoveInVerificationBanner from '../components/MoveInVerificationBanner';

const TenantDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { markByTypeAsRead } = useNotifications();
  const didMarkReadRef = useRef(false);
  const [requests, setRequests] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportIssueModal, setShowReportIssueModal] = useState(false);
  const [requestToEdit, setRequestToEdit] = useState(null);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [requestToReportIssue, setRequestToReportIssue] = useState(null);
  const [offerToReportIssue, setOfferToReportIssue] = useState(null);
  const [moveInIssues, setMoveInIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [verificationStatuses, setVerificationStatuses] = useState({}); // offerId -> status data
  const [leaseMetaByOffer, setLeaseMetaByOffer] = useState({}); // offerId -> leaseMeta

  // Chat states
  const [showChat, setShowChat] = useState(false);

  const [isGroupChoiceModalOpen, setGroupChoiceModalOpen] = useState(false);

  const fetchMoveInIssues = async () => {
    try {
      setIssuesLoading(true);
      // Get all move-in issues for the tenant's active leases
      const response = await api.get('/tenant-dashboard/move-in-issues');
      setMoveInIssues(response.data.issues || []);
    } catch (error) {
      console.error('Error fetching move-in issues:', error);
      setMoveInIssues([]);
    } finally {
      setIssuesLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      console.log('🔍 Dashboard: Starting requests fetch...');
      console.log(
        '🔍 Dashboard: Token in localStorage:',
        localStorage.getItem('token') ? 'Present' : 'Missing'
      );
      setLoading(true);
      // Endpoint removed; dashboard will fetch a summary endpoint if needed
      const response = await api.get('/tenant-dashboard/summary');
      console.log('✅ Dashboard: Requests response received:', response.data);
      console.log(
        '✅ Dashboard: Rental requests:',
        response.data.rentalRequests
      );
      setRequests(response.data.rentalRequests || []);
      // Fetch move-in verification status for locked requests with paid offers
      const lockedWithOffers = (response.data.rentalRequests || []).filter(
        r =>
          r.status === 'LOCKED' &&
          Array.isArray(r.offers) &&
          r.offers.some(o => o.status === 'PAID')
      );
      const statusPromises = lockedWithOffers.map(async r => {
        const paidOffer = r.offers.find(o => o.status === 'PAID');
        try {
          const s = await api.get(`/move-in/offers/${paidOffer.id}/status`);
          return [paidOffer.id, s.data.data];
        } catch {
          return [paidOffer.id, null];
        }
      });
      const entries = await Promise.all(statusPromises);
      const map = Object.fromEntries(entries);
      setVerificationStatuses(map);

      // Fetch lease meta (termination/renewal) for tenant active lease; best-effort
      try {
        const leaseRes = await api.get('/tenant-dashboard/active-lease');
        if (leaseRes?.data?.offerId && leaseRes?.data?.leaseMeta) {
          setLeaseMetaByOffer(prev => ({
            ...prev,
            [leaseRes.data.offerId]: leaseRes.data.leaseMeta,
          }));
        }
      } catch {}
    } catch (error) {
      console.error('❌ Dashboard: Error fetching requests:', error);
      console.error('❌ Dashboard: Error response:', error.response?.data);
      console.error('❌ Dashboard: Error status:', error.response?.status);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const renderMoveInVerificationCard = request => {
    if (request.status !== 'LOCKED' || !Array.isArray(request.offers))
      return null;
    const paidOffer = request.offers.find(o => o.status === 'PAID');
    if (!paidOffer) return null;

    const handleConfirm = async () => {
      try {
        await api.post(`/move-in/offers/${paidOffer.id}/verify`);
        fetchRequests();
      } catch {}
    };

    const handleDeny = async () => {
      try {
        await api.post(`/move-in/offers/${paidOffer.id}/deny`);
        fetchRequests();
      } catch {}
    };

    const handleReportIssueClick = () => {
      handleReportIssue(request, paidOffer);
    };

    return (
      <div className="mt-3">
        <MoveInVerificationBanner
          offerId={paidOffer.id}
          onConfirm={handleConfirm}
          onDeny={handleDeny}
          onReportIssue={handleReportIssueClick}
        />
      </div>
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRequestCreated = () => {
    fetchRequests();
  };

  const handleEditClick = request => {
    setRequestToEdit(request);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setRequestToEdit(null);
    fetchRequests();
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
    setRequestToEdit(null);
  };

  const handleDeleteClick = request => {
    setRequestToDelete(request);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/rental-request/${requestToDelete.id}`);
      setShowDeleteModal(false);
      setRequestToDelete(null);
      fetchRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      setError('Failed to delete request');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setRequestToDelete(null);
  };

  const handleReportIssue = (request, offer) => {
    setRequestToReportIssue(request);
    setOfferToReportIssue(offer);
    setShowReportIssueModal(true);
  };

  const handleReportIssueClose = () => {
    setShowReportIssueModal(false);
    setRequestToReportIssue(null);
    setOfferToReportIssue(null);
  };

  const handleReportIssueSuccess = () => {
    setShowReportIssueModal(false);
    setRequestToReportIssue(null);
    setOfferToReportIssue(null);
    // Refresh the requests to show the new issue
    fetchRequests();
    fetchMoveInIssues(); // Refresh the move-in issues to show the new issue
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = dateString => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  const getProfilePhotoUrl = photoPath => {
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

    // If it's a relative path, construct full URL
    const baseUrl = 'http://localhost:3001';
    return `${baseUrl}${photoPath}`;
  };

  const getStatusBadge = (status, forceCancelled = false) => {
    const statusConfig = {
      ACTIVE: { text: 'Active', color: 'bg-green-100 text-green-800' },
      LOCKED: { text: 'Locked', color: 'bg-yellow-100 text-yellow-800' },
      CANCELLED: { text: 'Cancelled', color: 'bg-red-100 text-red-800' },
    };
    const effective = forceCancelled ? 'CANCELLED' : status;
    const config = statusConfig[effective] || statusConfig.CANCELLED;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  // Helper function to check if request has accepted/paid offers
  const hasAcceptedOrPaidOffer = request => {
    return (
      request.offers &&
      request.offers.some(
        offer => offer.status === 'ACCEPTED' || offer.status === 'PAID'
      )
    );
  };

  // Helper function to get offer status text
  const getOfferStatusText = request => {
    if (!request.offers || request.offers.length === 0) return null;

    const acceptedOffer = request.offers.find(
      offer => offer.status === 'ACCEPTED' || offer.status === 'PAID'
    );

    if (acceptedOffer) {
      return acceptedOffer.status === 'PAID' ? 'Offer Paid' : 'Offer Accepted';
    }

    return null;
  };

  // Helper function to get issue status colors
  const getIssueStatusColor = (status) => {
    const statusConfig = {
      OPEN: 'bg-red-100 text-red-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      RESOLVED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800',
      ADMIN_APPROVED: 'bg-green-100 text-green-800',
      ADMIN_REJECTED: 'bg-red-100 text-red-800',
      ESCALATED: 'bg-orange-100 text-orange-800',
    };
    return statusConfig[status] || 'bg-gray-100 text-gray-800';
  };

  // Filter and sort requests
  const filteredAndSortedRequests = requests
    .filter(request => {
      // Status filter
      if (statusFilter !== 'all' && request.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          request.title?.toLowerCase().includes(searchLower) ||
          request.description?.toLowerCase().includes(searchLower) ||
          request.location?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
    });

  useEffect(() => {
    console.log('🔍 Dashboard: User state changed:', user);
    if (user) {
      console.log('✅ Dashboard: User is authenticated, fetching requests...');
      fetchRequests();
      fetchMoveInIssues();
      // Mark rental request notifications as read once per mount
      if (!didMarkReadRef.current) {
        didMarkReadRef.current = true;
        (async () => {
          try {
            await markByTypeAsRead('NEW_RENTAL_REQUEST');
            try {
              window.dispatchEvent(new Event('notif-unread-refresh'));
            } catch {}
          } catch {}
        })();
      }
    } else {
      console.log('❌ Dashboard: No user found, not fetching requests');
      setLoading(false);
    }
  }, [user]);

  // Separate useEffect for profile data fetching (like other working pages)
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        console.log('🔍 Dashboard: Starting profile data fetch...');
        console.log(
          '🔍 Dashboard: Token in localStorage:',
          localStorage.getItem('token') ? 'Present' : 'Missing'
        );
        console.log('🔍 Dashboard: User from context:', user);

        const response = await api.get('/users/profile');
        console.log('✅ Dashboard: Profile response received:', response.data);
        console.log('✅ Dashboard: Profile user data:', response.data.user);
        setProfileData(response.data.user);
      } catch (error) {
        console.error('❌ Dashboard: Error fetching profile data:', error);
        console.error('❌ Dashboard: Error response:', error.response?.data);
        console.error('❌ Dashboard: Error status:', error.response?.status);
        setProfileData(null);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfileData();
  }, [user]); // Add user as dependency to refetch when user changes

  useEffect(() => {
    console.log('Profile data changed on dashboard:', profileData);
  }, [profileData]);

  useEffect(() => {
    console.log('Profile loading state changed on dashboard:', profileLoading);
  }, [profileLoading]);

  // Check if user is authenticated
  if (!user) {
    return (
      <div className='min-h-screen bg-primary flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-primary flex'>
      {/* Left Sidebar */}
      <TenantSidebar />

      {/* Main Content */}
      <div className='flex-1 flex flex-col'>
        {/* Top Header */}
        <header className='header-modern px-6 py-4'>
          <div className='flex items-center justify-between'>
            <h1 className='text-xl font-semibold text-gray-900'>My Requests</h1>

            <div className='flex items-center space-x-4'>
              {/* Notification Header */}
              <NotificationHeader />

              <button
                onClick={handleLogout}
                className='flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200'
              >
                <LogOut className='w-4 h-4' />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className='flex-1 p-6'>
          <div className='max-w-6xl mx-auto'>
            {error && (
              <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
                <p className='text-sm text-red-600'>{error}</p>
              </div>
            )}

            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-semibold text-gray-900'>
                Your rental requests
              </h2>
              <button
                onClick={() => setGroupChoiceModalOpen(true)}
                className='btn-primary'
              >
                <svg
                  className='w-4 h-4 mr-2'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                  />
                </svg>
                Create New Request
              </button>
            </div>

            {/* Search and Filter Section */}
            <div className='card-modern p-4 mb-6'>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                {/* Search */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Search
                  </label>
                  <input
                    type='text'
                    placeholder='Search by title or description...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='input-modern'
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className='input-modern'
                  >
                    <option value='all'>All Statuses</option>
                    <option value='ACTIVE'>Active</option>
                    <option value='LOCKED'>Locked</option>
                    <option value='CANCELLED'>Cancelled</option>
                    <option value='EXPIRED'>Expired</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className='input-modern'
                  >
                    <option value='newest'>Newest First</option>
                    <option value='oldest'>Oldest First</option>
                  </select>
                </div>

                {/* Results Count */}
                <div className='flex items-end'>
                  <div className='text-sm text-gray-600'>
                    {filteredAndSortedRequests.length} of {requests.length}{' '}
                    requests
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className='card-modern p-8 text-center'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
                <p className='text-sm text-gray-600'>
                  Loading your requests...
                </p>
              </div>
            ) : filteredAndSortedRequests.length === 0 ? (
              <div className='card-modern p-8 text-center'>
                <div className='text-gray-400 text-4xl mb-4'>📝</div>
                <p className='text-gray-600 text-lg mb-4'>
                  {searchTerm || statusFilter !== 'all'
                    ? 'No matching requests found'
                    : "You don't have any requests yet."}
                </p>
                {searchTerm || statusFilter !== 'all' ? (
                  <p className='text-gray-500 mb-4'>
                    Try adjusting your search or filter criteria.
                  </p>
                ) : (
                  <button
                    onClick={() => setGroupChoiceModalOpen(true)}
                    className='btn-primary'
                  >
                    <svg
                      className='w-4 h-4 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                      />
                    </svg>
                    Create first request
                  </button>
                )}
              </div>
            ) : (
              <div className='space-y-4'>
                {filteredAndSortedRequests.map(request => (
                  <div key={request.id} className='card-elevated p-6'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-2'>
                          <h3 className='text-lg font-semibold text-gray-900'>
                            {request.title}
                          </h3>
                          {(() => {
                            const memberCount =
                              request.tenantGroup?._count?.members ?? 1;
                            const isGroup = memberCount > 1;
                            const color = isGroup
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800';
                            const label = isGroup
                              ? `Group (${memberCount})`
                              : 'Solo';
                            return (
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
                              >
                                {label}
                              </span>
                            );
                          })()}
                        </div>
                        <p className='text-gray-600 mb-3'>
                          {request.description}
                        </p>
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                          <div>
                            <span className='text-gray-500'>Location:</span>
                            <p className='font-medium'>{request.location}</p>
                          </div>
                          <div>
                            <span className='text-gray-500'>Budget:</span>
                            <p className='font-medium'>
                              {formatCurrency(request.budget)}
                            </p>
                          </div>
                          <div>
                            <span className='text-gray-500'>Move-in:</span>
                            <p className='font-medium'>
                              {formatDate(request.moveInDate)}
                            </p>
                          </div>
                          <div>
                            <span className='text-gray-500'>Status:</span>
                            <div className='mt-1'>
                              {(() => {
                                const paidOffer = (request.offers || []).find(
                                  o => o.status === 'PAID'
                                );
                                const v = paidOffer
                                  ? verificationStatuses[paidOffer.id]
                                  : null;
                                const forceCancelled =
                                  v?.status === 'CANCELLED';
                                return getStatusBadge(
                                  request.status,
                                  forceCancelled
                                );
                              })()}
                            </div>
                            {/* Show offer status if request is locked */}
                            {request.status === 'LOCKED' &&
                              getOfferStatusText(request) && (
                                <div className='mt-1 text-xs text-gray-600'>
                                  {getOfferStatusText(request)}
                                </div>
                              )}
                          </div>
                        </div>

                        {/* Move-in verification section for locked requests with paid offer */}
                        {renderMoveInVerificationCard(request)}

                        {/* Refund summary for cancelled bookings */}
                        {request.status === 'CANCELLED' &&
                          request._refundSummary &&
                          request._refundSummary.count > 0 && (
                            <div className='mt-3 p-3 bg-green-50 border border-green-200 rounded-md'>
                              <div className='flex items-center justify-between'>
                                <div className='text-sm text-green-900 font-medium'>
                                  Refunds
                                </div>
                                <div className='text-sm text-green-800'>
                                  {new Intl.NumberFormat('pl-PL', {
                                    style: 'currency',
                                    currency: 'PLN',
                                  }).format(
                                    request._refundSummary.totalRefunded || 0
                                  )}
                                </div>
                              </div>
                              <div className='mt-1 text-xs text-green-800'>
                                {request._refundSummary.count} payment
                                {request._refundSummary.count !== 1
                                  ? 's'
                                  : ''}{' '}
                                refunded via{' '}
                                {request._refundSummary.gateways.join(', ')}
                              </div>
                            </div>
                          )}

                        {/* Created Date and Time */}
                        <div className='mt-4 pt-3 border-t border-gray-100'>
                          <div className='text-xs text-gray-500'>
                            Created: {formatDate(request.createdAt)} at{' '}
                            {formatTime(request.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className='flex flex-col space-y-2 ml-4'>
                        {request.status !== 'CANCELLED' && (
                          <div className='flex space-x-2'>
                            <button
                              onClick={() => handleEditClick(request)}
                              disabled={(() => {
                                if (request.status === 'LOCKED') return true;
                                const paidOffer = (request.offers || []).find(
                                  o => o.status === 'PAID'
                                );
                                const lm = paidOffer
                                  ? leaseMetaByOffer[paidOffer.id]
                                  : null;
                                if (lm?.terminationNoticeDate) return true;
                                if (lm?.renewalStatus === 'DECLINED')
                                  return true;
                                return false;
                              })()}
                              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                (() => {
                                  const paidOffer = (request.offers || []).find(
                                    o => o.status === 'PAID'
                                  );
                                  const lm = paidOffer
                                    ? leaseMetaByOffer[paidOffer.id]
                                    : null;
                                  const dis =
                                    request.status === 'LOCKED' ||
                                    lm?.terminationNoticeDate ||
                                    lm?.renewalStatus === 'DECLINED';
                                  return dis;
                                })()
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 hover:bg-gray-50 hover:shadow-sm'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm'
                              }`}
                              title={'This request cannot be edited'}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(request)}
                              disabled={(() => {
                                if (request.status === 'LOCKED') return true;
                                const paidOffer = (request.offers || []).find(
                                  o => o.status === 'PAID'
                                );
                                const lm = paidOffer
                                  ? leaseMetaByOffer[paidOffer.id]
                                  : null;
                                if (lm?.terminationNoticeDate) return true;
                                if (lm?.renewalStatus === 'DECLINED')
                                  return true;
                                return false;
                              })()}
                              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                (() => {
                                  const paidOffer = (request.offers || []).find(
                                    o => o.status === 'PAID'
                                  );
                                  const lm = paidOffer
                                    ? leaseMetaByOffer[paidOffer.id]
                                    : null;
                                  const dis =
                                    request.status === 'LOCKED' ||
                                    lm?.terminationNoticeDate ||
                                    lm?.renewalStatus === 'DECLINED';
                                  return dis;
                                })()
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 hover:bg-gray-50 hover:shadow-sm'
                                  : 'bg-white text-red-700 border border-red-300 hover:bg-red-50 hover:border-red-400 hover:shadow-sm'
                              }`}
                              title={'This request cannot be deleted'}
                            >
                              Delete
                            </button>
                          </div>
                        )}

                        {/* Show reason why buttons are disabled */}
                        {(() => {
                          const paidOffer = (request.offers || []).find(
                            o => o.status === 'PAID'
                          );
                          const lm = paidOffer
                            ? leaseMetaByOffer[paidOffer.id]
                            : null;
                          const isDisabled =
                            request.status === 'LOCKED' ||
                            lm?.terminationNoticeDate ||
                            lm?.renewalStatus === 'DECLINED';
                          if (!isDisabled) return null;
                          return (
                            <div className='text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-md border border-gray-100 animate-pulse'>
                              {'🔒 Request locked - cannot be modified'}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Move-In Issues Section */}
            {moveInIssues.length > 0 && (
              <div className='mt-8'>
                <div className='flex items-center justify-between mb-6'>
                  <h2 className='text-lg font-semibold text-gray-900'>
                    Move-In Issues
                  </h2>
                </div>
                
                <div className='space-y-4'>
                  {moveInIssues.map(issue => (
                    <div key={issue.id} className='card-elevated p-6'>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-2'>
                            <h3 className='text-lg font-semibold text-gray-900'>
                              {issue.title}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getIssueStatusColor(issue.status)}`}>
                              {issue.status}
                            </span>
                          </div>
                          <p className='text-gray-600 mb-3'>
                            {issue.description}
                          </p>
                          <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
                            <div>
                              <span className='text-gray-500'>Property:</span>
                              <p className='font-medium'>
                                {issue.lease?.property?.name || 'Unknown Property'}
                              </p>
                            </div>
                            <div>
                              <span className='text-gray-500'>Created:</span>
                              <p className='font-medium'>
                                {formatDate(issue.createdAt)}
                              </p>
                            </div>
                            <div>
                              <span className='text-gray-500'>Comments:</span>
                              <p className='font-medium'>
                                {issue.comments?.length || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className='ml-4'>
                          <button
                            onClick={() => navigate(`/tenant/issue/${issue.id}`)}
                            className='btn-primary'
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}



          </div>
        </main>
      </div>



      {/* Create Rental Request Modal */}
      <CreateRentalRequestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleRequestCreated}
        rentalType='solo'
      />

      {/* Edit Request Modal */}
      {showEditModal && requestToEdit && (
        <CreateRentalRequestModal
          isOpen={showEditModal}
          onClose={handleEditCancel}
          onSuccess={handleEditSuccess}
          editMode={true}
          requestData={requestToEdit}
          rentalType={(() => {
            const mc = requestToEdit?.tenantGroup?._count?.members ?? 1;
            return mc > 1 ? 'group' : 'solo';
          })()}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && requestToDelete && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg max-w-md w-full p-6'>
            <div className='flex items-center mb-4'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-6 w-6 text-red-600'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
              </div>
              <div className='ml-3'>
                <h3 className='text-lg font-medium text-gray-900'>
                  Delete Rental Request
                </h3>
              </div>
            </div>

            <div className='mb-6'>
              <p className='text-sm text-gray-600'>
                Are you sure you want to delete the rental request "
                {requestToDelete.title}"? This action cannot be undone.
              </p>
            </div>

            <div className='flex space-x-3'>
              <button
                onClick={handleDeleteCancel}
                className='flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className='flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg w-full max-w-6xl h-[80vh] relative'>
            <div className='flex items-center justify-between p-4 border-b border-gray-200'>
              <h3 className='text-lg font-semibold text-gray-900'>Messages</h3>
              <button
                onClick={() => setShowChat(false)}
                className='text-gray-400 hover:text-gray-600 transition-colors'
              >
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>
            <div className='p-4 h-full'>
              <Chat
                conversationStatus='ACTIVE'
                paymentStatus='PAID'
                className='h-full'
              />
            </div>
          </div>
        </div>
      )}

      {/* Tenant Group Choice Modal for request creation entry */}
      <TenantGroupChoiceModal
        isOpen={isGroupChoiceModalOpen}
        onClose={() => setGroupChoiceModalOpen(false)}
        onChoice={choice => {
          if (choice === 'individual') {
            setGroupChoiceModalOpen(false);
            setShowCreateModal(true);
          } else if (choice === 'group') {
            setGroupChoiceModalOpen(false);
            navigate('/tenant-group-management');
          }
        }}
      />

      {/* Report Issue Modal */}
      {showReportIssueModal && requestToReportIssue && offerToReportIssue && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Report Move-In Issue
              </h3>
              <button
                onClick={handleReportIssueClose}
                className='text-gray-400 hover:text-gray-600 transition-colors'
              >
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>

            <div className='mb-4 p-4 bg-gray-50 rounded-lg'>
              <h4 className='font-medium text-gray-900 mb-2'>Rental Request Details</h4>
              <div className='text-sm text-gray-600'>
                <p><strong>Request:</strong> {requestToReportIssue.title}</p>
                <p><strong>Property:</strong> {offerToReportIssue.property?.name || 'Unknown Property'}</p>
                <p><strong>Move-in Date:</strong> {formatDate(requestToReportIssue.moveInDate)}</p>
              </div>
            </div>

            <ReportIssueForm
              offerId={offerToReportIssue.id}
              rentalRequestId={requestToReportIssue.id}
              onSuccess={handleReportIssueSuccess}
              onCancel={handleReportIssueClose}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantDashboard;
