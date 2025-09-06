import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LandlordSidebar from '../components/LandlordSidebar';
import NotificationHeader from '../components/common/NotificationHeader';
import {
  LogOut,
  Search,
  Filter,
  Eye,
  MessageSquare,
  FileText,
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Users,
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  AlertTriangle,
} from 'lucide-react';
import ProposeRenewalModal from '../components/ProposeRenewalModal.jsx';
import EndLeaseModal from '../components/EndLeaseModal.jsx';

const LandlordMyTenants = () => {
  const { user, logout, api } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalTenant, setRenewalTenant] = useState(null);
  const [sendingRenewal, setSendingRenewal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [endTenant, setEndTenant] = useState(null);
  const [sendingEnd, setSendingEnd] = useState(false);
  const [leaseMetaByOffer, setLeaseMetaByOffer] = useState({});
  const [renewalBadgeByLease, setRenewalBadgeByLease] = useState({});

  useEffect(() => {
    fetchTenants();
    // Also pull monthly revenue from the same source as dashboard for accuracy
    (async () => {
      try {
        const resp = await api.get('/landlord/dashboard');
        if (resp.data && typeof resp.data.monthlyRevenue === 'number') {
          setMonthlyRevenue(resp.data.monthlyRevenue);
        }
      } catch (e) {
        // fallback computed once tenants load
      }
    })();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/landlord/tenants');

      if (response.data.success) {
        const list = response.data.tenants || [];
        setTenants(list);
        // Fetch lease meta and latest renewal for each tenant's booking (offer)
        try {
          const results = await Promise.all(
            list.map(async t => {
              const offerId = t?.offerId || t?.paidOfferId || t?.offer?.id;
              if (!offerId) return null;
              try {
                // Use new endpoint that resolves the active lease considering renewals
                const leaseRes = await api.get(`/leases/active-by-offer/${offerId}`);
                const originalLease = leaseRes.data?.originalLease || leaseRes.data?.lease || null;
                let activeLease = leaseRes.data?.activeLease || originalLease;
                let latest = null;
                let renewalLease = null;
                
                if (originalLease?.id) {
                  const renRes = await api.get(`/leases/${originalLease.id}/renewals`);
                  const arr = renRes.data?.renewals || [];
                  latest = arr.length > 0 ? arr[arr.length - 1] : null;
                  
                  // If there's an accepted renewal, find the renewal lease
                  if (latest && latest.status === 'ACCEPTED') {
                    try {
                      // Try to get renewal lease data from the renewal request itself
                      renewalLease = {
                        startDate: latest.proposedStartDate,
                        endDate: latest.proposedEndDate,
                        leaseType: 'RENEWAL'
                      };
                      
                      // Check if renewal lease has started
                      const today = new Date();
                      const renewalStartDate = latest.proposedStartDate ? new Date(latest.proposedStartDate) : null;
                      
                      if (renewalStartDate && renewalStartDate <= today) {
                        // Use renewal lease as active lease
                        activeLease = renewalLease;
                      }
                    } catch (e) {
                      console.log('Could not get renewal lease data:', e);
                    }
                  }
                }
                return { offerId, lease: activeLease, originalLease, latest, renewalLease };
              } catch {
                return { offerId, lease: null, latest: null, renewalLease: null };
              }
            })
          );
          const leaseMap = {};
          const renewalMap = {};
          for (const r of results || []) {
            if (!r) continue;
            if (r.lease) leaseMap[r.offerId] = r.lease;
            if (r.lease?.id && r.latest) {
              renewalMap[r.lease.id] = {
                ...r.latest,
                renewalLease: r.renewalLease
              };
            }
          }
          setLeaseMetaByOffer(leaseMap);
          setRenewalBadgeByLease(renewalMap);
        } catch (e) {
          // non-fatal; badges just won't show
        }
      } else {
        setError('Failed to fetch tenants');
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
      setError('Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTenants = () => {
    let filtered = [...tenants];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        tenant =>
          tenant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.property?.address
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          tenant.property?.city
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        tenant => tenant.paymentStatus === statusFilter
      );
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort(
          (a, b) => new Date(b.moveInDate) - new Date(a.moveInDate)
        );
        break;
      case 'oldest':
        filtered.sort(
          (a, b) => new Date(a.moveInDate) - new Date(b.moveInDate)
        );
        break;
      case 'name':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'rent-high':
        filtered.sort((a, b) => (b.monthlyRent || 0) - (a.monthlyRent || 0));
        break;
      case 'rent-low':
        filtered.sort((a, b) => (a.monthlyRent || 0) - (b.monthlyRent || 0));
        break;
      default:
        break;
    }

    return filtered;
  };

  const getStatusBadge = status => {
    switch (status) {
      case 'paid':
        return (
          <span className='px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium'>
            Paid
          </span>
        );
      case 'overdue':
        return (
          <span className='px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium'>
            Overdue
          </span>
        );
      case 'pending':
        return (
          <span className='px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium'>
            Pending
          </span>
        );
      default:
        return (
          <span className='px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium'>
            Unknown
          </span>
        );
    }
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helpers for renewal badges
  const daysUntil = date => {
    if (!date) return null;
    const end = new Date(date);
    const today = new Date();
    return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  };

  const renderRenewalBadge = leaseEndDate => {
    const d = daysUntil(leaseEndDate);
    if (d == null || d > 60) return null; // Only show badge if within 60 days
    let cls = 'bg-gray-100 text-gray-700';
    if (d <= 7) cls = 'bg-red-100 text-red-700';
    else if (d <= 30) cls = 'bg-amber-100 text-amber-700';
    else if (d <= 60) cls = 'bg-green-100 text-green-700';
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${cls}`}
        title={`Lease ends in ${d} days`}
      >
        Ends in {d}d
      </span>
    );
  };

  const renderProgress = (start, end) => {
    console.log('renderProgress called with:', { start, end });
    if (!start || !end) {
      console.log('renderProgress returning null - missing dates');
      return null;
    }
    const s = new Date(start);
    const e = new Date(end);
    const now = new Date();
    const total = Math.max(1, e - s);
    const elapsed = Math.min(Math.max(0, now - s), total);
    const pct = Math.round((elapsed / total) * 100);
    console.log('renderProgress rendering with pct:', pct);
    return (
      <div className='mt-1'>
        <div className='w-40 h-2 bg-gray-200 rounded overflow-hidden'>
          <div className='h-full bg-blue-600' style={{ width: `${pct}%` }} />
        </div>
        <div className='text-[10px] text-gray-500 mt-1'>
          {new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}
          {' – '}
          {new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}
        </div>
      </div>
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewTenant = tenantId => {
    navigate(`/landlord-tenant-profile/${tenantId}`);
  };

  const handleViewContract = async tenantId => {
    try {
      const t = tenants.find(x => x.id === tenantId);
      const offerId = t?.offerId || t?.paidOfferId || t?.offer?.id;
      if (!offerId) {
        alert('No booking identifiers found to view contract.');
        return;
      }

      // Prefer the active lease we computed for this offer (may be renewal)
      const lease = leaseMetaByOffer?.[offerId];
      const leaseId = lease?.id;
      if (!leaseId) {
        // Fallback to original path if no lease meta yet
        const genResp = await api.post(`/contracts/generate-by-offer/${offerId}`);
        if (genResp.data?.success && genResp.data.contract?.pdfUrl) {
          window.open(`http://localhost:3001${genResp.data.contract.pdfUrl}`, '_blank');
          return;
        }
        navigate(`/landlord-tenant-profile/${tenantId}`);
        return;
      }

      // Ask backend for contract for this lease (auto-generates if missing)
      const contractResp = await api.get(`/contracts/lease/${leaseId}`);
      const contract = contractResp.data?.contract;
      if (contract?.pdfUrl) {
        window.open(`http://localhost:3001${contract.pdfUrl}`, '_blank');
        return;
      }

      alert('Contract not available yet. Please try again shortly.');
    } catch (e) {
      console.error('View contract error:', e);
      alert('Failed to open contract');
    }
  };

  const handleSendMessage = tenantId => {
    // Navigate to messaging page with tenant info
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      navigate('/messaging', {
        state: {
          newConversation: true,
          participantIds: [tenant.id],
          propertyId: tenant.propertyId,
          title: `Chat with ${tenant.name || 'Tenant'}`,
        },
      });
    } else {
      alert('Tenant information not available');
    }
  };

  const handleProposeRenewal = tenant => {
    setRenewalTenant(tenant);
    setShowRenewalModal(true);
  };

  const filteredTenants = filterAndSortTenants();

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex'>
        <LandlordSidebar />
        <div className='flex-1 flex flex-col'>
          <div className='animate-pulse'>
            <div className='h-16 bg-white border-b'></div>
            <div className='flex-1 p-6'>
              <div className='h-8 bg-gray-200 rounded w-1/4 mb-4'></div>
              <div className='h-4 bg-gray-200 rounded w-1/2 mb-8'></div>
              <div className='space-y-6'>
                {[1, 2, 3].map(i => (
                  <div key={i} className='bg-white rounded-lg shadow p-6'>
                    <div className='h-4 bg-gray-200 rounded w-3/4 mb-4'></div>
                    <div className='h-3 bg-gray-200 rounded w-1/2 mb-2'></div>
                    <div className='h-3 bg-gray-200 rounded w-2/3'></div>
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
    <>
      <div className='min-h-screen bg-gray-50 flex'>
        {/* Left Sidebar */}
        <LandlordSidebar />

        {/* Main Content */}
        <div className='flex-1 flex flex-col'>
          {/* Top Header */}
          <header className='bg-white border-b border-gray-200 px-6 py-4'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>My Tenants</h1>
                <p className='text-gray-600 mt-1'>
                  Manage your {tenants.length} tenant
                  {tenants.length !== 1 ? 's' : ''} and track payments
                </p>
              </div>

              <div className='flex items-center space-x-4'>
                {/* Header notification bell (hidden on messaging page; this page is not messaging) */}
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

          {/* Main Content */}
          <main className='flex-1 p-6'>
            <div className='max-w-7xl mx-auto'>
              {/* Summary Cards */}
              <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
                <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center'>
                    <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                      <Users className='w-6 h-6 text-blue-600' />
                    </div>
                    <div className='ml-4'>
                      <p className='text-sm font-medium text-gray-600'>
                        Total Tenants
                      </p>
                      <p className='text-2xl font-semibold text-gray-900'>
                        {tenants.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center'>
                    <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                      <CheckCircle className='w-6 h-6 text-green-600' />
                    </div>
                    <div className='ml-4'>
                      <p className='text-sm font-medium text-gray-600'>
                        Paid This Month
                      </p>
                      <p className='text-2xl font-semibold text-gray-900'>
                        {tenants.filter(t => t.paymentStatus === 'paid').length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center'>
                    <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
                      <AlertCircle className='w-6 h-6 text-red-600' />
                    </div>
                    <div className='ml-4'>
                      <p className='text-sm font-medium text-gray-600'>
                        Overdue
                      </p>
                      <p className='text-2xl font-semibold text-gray-900'>
                        {
                          tenants.filter(t => t.paymentStatus === 'overdue')
                            .length
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center'>
                    <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center'>
                      <DollarSign className='w-6 h-6 text-purple-600' />
                    </div>
                    <div className='ml-4'>
                      <p className='text-sm font-medium text-gray-600'>
                        Monthly Revenue
                      </p>
                      <p className='text-2xl font-semibold text-gray-900'>
                        {formatCurrency(monthlyRevenue)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters and Search */}
              <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6'>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                  {/* Search */}
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                    <input
                      type='text'
                      placeholder='Search tenants...'
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  >
                    <option value='all'>Payment Status</option>
                    <option value='paid'>Paid</option>
                    <option value='pending'>Pending</option>
                    <option value='overdue'>Overdue</option>
                  </select>

                  {/* Sort By */}
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  >
                    <option value='newest'>Newest First</option>
                    <option value='oldest'>Oldest First</option>
                    <option value='name'>Name A-Z</option>
                    <option value='rent-high'>Rent High-Low</option>
                    <option value='rent-low'>Rent Low-High</option>
                  </select>

                  {/* Quick Actions (removed Back to Dashboard per request) */}
                  <div className='flex space-x-2'></div>
                </div>
              </div>

              {/* Tenants List */}
              <div className='space-y-6'>
                {filteredTenants.length > 0 ? (
                  filteredTenants.map(tenant => (
                    <div
                      key={tenant.id}
                      className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'
                    >
                      <div className='p-6'>
                        <div className='flex items-start justify-between'>
                          {/* Tenant Info */}
                          <div className='flex-1'>
                            <div className='flex items-center space-x-4 mb-4'>
                              <div className='w-12 h-12 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center'>
                                {tenant.profileImage ? (
                                  <img
                                    src={
                                      tenant.profileImage.startsWith('/')
                                        ? `http://localhost:3001${tenant.profileImage}`
                                        : `http://localhost:3001/uploads/profile_images/${tenant.profileImage}`
                                    }
                                    alt={tenant.name || 'Tenant'}
                                    className='w-full h-full object-cover'
                                  />
                                ) : (
                                  <User className='w-6 h-6 text-blue-600' />
                                )}
                              </div>
                              <div>
                                <h3 className='text-lg font-semibold text-gray-900'>
                                  {tenant.name || 'Tenant'}
                                </h3>
                                <p className='text-sm text-gray-600'>
                                  {tenant.email}
                                </p>
                              </div>
                              {getStatusBadge(tenant.paymentStatus)}
                            </div>

                            {/* Status chips under tenant profile info */}
                            <div className='mt-3 mb-3 flex flex-wrap gap-3 items-center'>
                              {(() => {
                                const offerId =
                                  tenant?.offerId ||
                                  tenant?.paidOfferId ||
                                  tenant?.offer?.id;
                                const lease = leaseMetaByOffer?.[offerId];
                                const start = tenant.leaseStartDate || lease?.startDate;
                                const end = tenant.leaseEndDate || lease?.endDate;
                                
                                return (
                                  <>
                                    {renderRenewalBadge(end)}
                                  </>
                                );
                                if (lease?.terminationEffectiveDate) {
                                  const d = new Date(
                                    lease.terminationEffectiveDate
                                  );
                                  return (
                                    <div className='text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-1.5 shadow-sm'>
                                      Termination notice – effective{' '}
                                      {d.toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}
                                      {tenant?.terminationReason || lease.terminationReason ? (
                                        <span className='ml-2 text-amber-700'>
                                          • Reason: {tenant?.terminationReason || lease.terminationReason}
                                        </span>
                                      ) : null}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                              {(() => {
                                const offerId =
                                  tenant?.offerId ||
                                  tenant?.paidOfferId ||
                                  tenant?.offer?.id;
                                const lease = leaseMetaByOffer?.[offerId];
                                const latest = lease
                                  ? renewalBadgeByLease?.[lease.id]
                                  : null;
                                if (
                                  latest &&
                                  (latest.status === 'PENDING' ||
                                    latest.status === 'COUNTERED')
                                ) {
                                  const isTenantInitiated = latest.initiatorUserId === tenant.id;
                                  return (
                                    <div className='flex items-center gap-2'>
                                      <div className='text-xs text-indigo-800 bg-indigo-50 border border-indigo-200 rounded px-3 py-1.5 shadow-sm'>
                                        Renewal {isTenantInitiated ? 'requested by tenant' : 'proposal sent'} ({latest.status.toLowerCase()})
                                      </div>
                                      {isTenantInitiated && (
                                        <>
                                          <button
                                            className='text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                            onClick={() => {
                                              setRenewalTenant(tenant);
                                              setShowRenewalModal(true);
                                            }}
                                            title='Counter with terms'
                                          >
                                            Counter
                                          </button>
                                          <button
                                            className='text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200'
                                            onClick={async () => {
                                              try {
                                                const oId = offerId;
                                                const metaResp = await api.get(`/leases/by-offer/${oId}`);
                                                const lId = metaResp.data?.lease?.id;
                                                if (!lId) return alert('No lease found for this booking.');
                                                // find latest again to ensure fresh id
                                                const threadResp = await api.get(`/leases/${lId}/renewals`);
                                                const arr = threadResp.data?.renewals || [];
                                                const active = arr.find(r => ['PENDING','COUNTERED'].includes(r.status));
                                                if (!active) return alert('No open renewal to decline.');
                                                await api.post(`/renewals/${active.id}/decline`, {});
                                                await fetchTenants();
                                              } catch (e) {
                                                alert('Failed to decline renewal');
                                              }
                                            }}
                                            title='Decline request'
                                          >
                                            Decline
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>

                            {/* Property and Payment Info */}
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                              <div className='flex items-center space-x-2'>
                                <Building className='w-4 h-4 text-gray-400' />
                                <div>
                                  <p className='text-sm font-medium text-gray-900'>
                                    {tenant.property?.title || 'Property'}
                                  </p>
                                  <p className='text-xs text-gray-600'>
                                    {tenant.property?.address}
                                    {tenant.property?.district
                                      ? `, ${tenant.property.district}`
                                      : ''}
                                    {tenant.property?.zipCode
                                      ? `, ${tenant.property.zipCode}`
                                      : ''}
                                    {tenant.property?.city
                                      ? `, ${tenant.property.city}`
                                      : ''}
                                  </p>
                                </div>
                              </div>

                              <div className='flex items-center space-x-2'>
                                <DollarSign className='w-4 h-4 text-gray-400' />
                                <div>
                                  <p className='text-sm font-medium text-gray-900'>
                                    {formatCurrency(tenant.monthlyRent || 0)}
                                  </p>
                                  <p className='text-xs text-gray-600'>
                                    Monthly Rent
                                  </p>
                                </div>
                              </div>

                              <div className='flex items-center space-x-2'>
                                <Calendar className='w-4 h-4 text-gray-400' />
                                <div>
                                  <p className='text-sm font-medium text-gray-900'>
                                    {formatDate(tenant.moveInDate)}
                                  </p>
                                  <p className='text-xs text-gray-600'>
                                    Move-in Date
                                  </p>
                                  {/* Progress bar for lease duration */}
                                  {(() => {
                                    const offerId = tenant?.offerId || tenant?.paidOfferId || tenant?.offer?.id;
                                    const lease = leaseMetaByOffer?.[offerId];
                                    let start = tenant.leaseStartDate || lease?.startDate || tenant.moveInDate || null;
                                    let end = tenant.leaseEndDate || lease?.endDate || null;

                                    // Fallback: derive end date from start + leaseDuration (default 12 months)
                                    if (!end && start) {
                                      const months = (() => {
                                        const text = tenant.leaseDuration; // e.g. "12 months"
                                        const match = text ? String(text).match(/\d+/) : null;
                                        const parsed = match ? parseInt(match[0], 10) : null;
                                        return parsed || 12;
                                      })();
                                      const derived = new Date(start);
                                      derived.setMonth(derived.getMonth() + months);
                                      end = derived;
                                    }

                                    return renderProgress(start, end);
                                  })()}
                                </div>
                              </div>
                            </div>

                            {/* Contact Info */}
                            <div className='mt-4 flex items-center space-x-4 text-sm text-gray-600'>
                              {tenant.phone && (
                                <div className='flex items-center space-x-1'>
                                  <Phone className='w-4 h-4' />
                                  <span>{tenant.phone}</span>
                                </div>
                              )}
                              {tenant.email && (
                                <div className='flex items-center space-x-1'>
                                  <Mail className='w-4 h-4' />
                                  <span>{tenant.email}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className='flex flex-col space-y-2 ml-6'>
                            <button
                              onClick={() => handleViewTenant(tenant.id)}
                              className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200'
                            >
                              <Eye className='w-4 h-4' />
                              <span>View Profile</span>
                            </button>

                            <button
                              onClick={() => handleViewContract(tenant.id)}
                              className='flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200'
                            >
                              <FileText className='w-4 h-4' />
                              <span>View Contract</span>
                            </button>

                            <button
                              onClick={() => handleSendMessage(tenant.id)}
                              className='flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200'
                            >
                              <MessageSquare className='w-4 h-4' />
                              <span>Send Message</span>
                            </button>

                            {/* Propose Renewal (landlord) */}
                            {!(() => {
                              // Hide if tenant has terminationNoticeDate OR if we fetched a lease with termination fields
                              const offerId = tenant?.offerId || tenant?.paidOfferId || tenant?.offer?.id;
                              const lease = leaseMetaByOffer?.[offerId];
                              const latest = lease ? renewalBadgeByLease?.[lease.id] : null;
                              const hasOpenRenewal = !!(latest && (latest.status === 'PENDING' || latest.status === 'COUNTERED'));
                              const hasAcceptedRenewal = !!(latest && latest.status === 'ACCEPTED');
                              
                              // Check if lease is within 60 days of ending
                              const isLeaseFinishing = (() => {
                                const endDate = tenant.leaseEndDate || lease?.endDate;
                                if (!endDate) return false;
                                
                                const end = new Date(endDate);
                                const today = new Date();
                                const daysUntilEnd = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
                                
                                return daysUntilEnd <= 60 && daysUntilEnd > 0;
                              })();
                              
                              // Check if lease is actually finishing (within 60 days of end date)
                              // const isLeaseFinishing = (() => {
                              //   if (!lease?.endDate) return false;
                              //   const endDate = new Date(lease.endDate);
                              //   const today = new Date();
                              //   const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                              //   return daysUntilEnd <= 60 && daysUntilEnd > 0; // Within 60 days but not expired
                              // })();
                              
                              return tenant?.terminationNoticeDate || !!lease?.terminationEffectiveDate || hasOpenRenewal || hasAcceptedRenewal || !isLeaseFinishing;
                            })() && (
                              <button
                                onClick={() => handleProposeRenewal(tenant)}
                                className='flex items-center space-x-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors duration-200'
                              >
                                <Calendar className='w-4 h-4' />
                                <span>Propose Renewal</span>
                              </button>
                            )}

                            {/* Show message when renewal is pending but allow new request after expiration */}
                            {(() => {
                              const offerId = tenant?.offerId || tenant?.paidOfferId || tenant?.offer?.id;
                              const lease = leaseMetaByOffer?.[offerId];
                              const latest = lease ? renewalBadgeByLease?.[lease.id] : null;
                              const hasOpenRenewal = !!(latest && (latest.status === 'PENDING' || latest.status === 'COUNTERED'));
                              const hasExpiredRenewal = !!(latest && latest.status === 'EXPIRED');
                              const hasAcceptedRenewal = !!(latest && latest.status === 'ACCEPTED');
                              
                              // TEMPORARY: For testing purposes, skip 60-day message
                              // TODO: Restore 60-day logic after testing
                              const isLeaseFinishing = true; // Always true for testing
                              
                              // Check if lease is actually finishing (within 60 days of end date)
                              // const isLeaseFinishing = (() => {
                              //   if (!lease?.endDate) return false;
                              //   const endDate = new Date(lease.endDate);
                              //   const today = new Date();
                              //   const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                              //   return daysUntilEnd <= 60 && daysUntilEnd > 0; // Within 60 days but not expired
                              // })();
                              
                              // if (!isLeaseFinishing && !tenant?.terminationNoticeDate && !lease?.terminationEffectiveDate) {
                              //   return (
                              //     <div className='text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-2'>
                              //       Renewal available when lease is within 60 days of ending
                              //     </div>
                              //   );
                              // }
                              
                              // If the active lease is already a started renewal, hide any acceptance message
                              if (lease?.leaseType === 'RENEWAL') {
                                const today = new Date();
                                if (lease?.startDate && new Date(lease.startDate) <= today) {
                                  return null;
                                }
                              }

                              if (hasAcceptedRenewal) {
                                // Compute renewal dates robustly (works even if renewalLease missing)
                                const today = new Date();
                                const renewalLease = latest?.renewalLease || null;
                                // Prefer actual renewal lease dates when present
                                let start = renewalLease?.startDate ? new Date(renewalLease.startDate) : null;
                                let end = renewalLease?.endDate ? new Date(renewalLease.endDate) : null;

                                // Fallbacks derived from accepted renewal request and original lease
                                if (!start) {
                                  if (latest?.proposedStartDate) {
                                    start = new Date(latest.proposedStartDate);
                                  } else if (lease?.endDate) {
                                    const originalEnd = new Date(lease.endDate);
                                    start = new Date(originalEnd.getTime() + 24 * 60 * 60 * 1000);
                                  }
                                }
                                if (!end && start) {
                                  const months = latest?.proposedTermMonths || 12;
                                  const derived = new Date(start);
                                  derived.setMonth(derived.getMonth() + months);
                                  end = derived;
                                }

                                // If renewal lease has started, don't show renewal messages at all
                                if (start && start <= today) {
                                  return null; // Hide all renewal messages when new lease is active
                                }

                                // If renewal is accepted but hasn't started yet, show detailed message with dates
                                return (
                                  <div className='text-xs text-green-700 bg-green-50 border border-green-200 rounded p-3'>
                                    <div className='font-semibold mb-1'>
                                      ✅ Renewal accepted by tenant
                                    </div>
                                    {start && end ? (
                                      <div className='space-y-1'>
                                        <div>
                                          New lease will start: {start.toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric'
                                          })}
                                        </div>
                                        <div>
                                          New lease will end: {end.toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric'
                                          })}
                                        </div>
                                        
                                      </div>
                                    ) : (
                                      <div className='text-green-600'>
                                        Renewal details will be available soon
                                      </div>
                                    )}
                                  </div>
                                );
                              } else if (hasOpenRenewal) {
                                return (
                                  <div className='text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-2'>
                                    Renewal request pending
                                  </div>
                                );
                              } else if (hasExpiredRenewal) {
                                return (
                                  <div className='text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-2'>
                                    Previous renewal expired. You can create a new proposal.
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            {/* Landlord End Lease button (opens modal) */}
                            {!(() => {
                              const offerId = tenant?.offerId || tenant?.paidOfferId || tenant?.offer?.id;
                              const lease = leaseMetaByOffer?.[offerId];
                              return tenant?.terminationNoticeDate || !!lease?.terminationEffectiveDate;
                            })() && (
                            <button
                              onClick={async () => {
                                try {
                                  const offerId =
                                    tenant?.offerId ||
                                    tenant?.paidOfferId ||
                                    tenant?.offer?.id;
                                  let enriched = { ...tenant };
                                  if (offerId) {
                                    try {
                                      const metaResp = await api.get(`/leases/by-offer/${offerId}`);
                                      const preview = metaResp.data?.terminationPolicyPreview;
                                      if (preview) {
                                        enriched = { ...enriched, terminationPolicyPreview: preview };
                                      }
                                    } catch {}
                                  }
                                  setEndTenant(enriched);
                                  setShowEndModal(true);
                                } catch {
                                  setEndTenant(tenant);
                                  setShowEndModal(true);
                                }
                              }}
                              className='flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200'
                            >
                              <AlertTriangle className='w-4 h-4' />
                              <span>End Lease</span>
                            </button>
                            )}
                            {/* Chips displayed under tenant info (moved from actions column) */}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center'>
                    <Users className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>
                      No tenants found
                    </h3>
                    <p className='text-gray-600 mb-6'>
                      {searchTerm || statusFilter !== 'all'
                        ? 'Try adjusting your search or filters'
                        : "You don't have any tenants yet. Start by creating property listings and accepting offers!"}
                    </p>
                    <button
                      onClick={() => navigate('/landlord-my-property')}
                      className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200'
                    >
                      View My Properties
                    </button>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
      {/* Modals */}
      <ProposeRenewalModal
        open={showRenewalModal}
        currentRent={renewalTenant?.monthlyRent || 0}
        currentLeaseEndDate={renewalTenant?.leaseEndDate ? new Date(renewalTenant.leaseEndDate) : null}
        submitting={sendingRenewal}
        onClose={() => setShowRenewalModal(false)}
        onSubmit={async ({ proposedTermMonths, proposedMonthlyRent, proposedStartDate, note }) => {
          try {
            if (!renewalTenant) return;
            setSendingRenewal(true);
            const offerId =
              renewalTenant?.offerId ||
              renewalTenant?.paidOfferId ||
              renewalTenant?.offer?.id;
            const metaResp = await api.get(`/leases/by-offer/${offerId}`);
            const leaseId = metaResp.data?.lease?.id;
            if (!leaseId) {
              alert('No lease found for this booking.');
              setSendingRenewal(false);
              return;
            }
            // If an open renewal exists, landlord should counter instead of creating a new one
            let hasCountered = false;
            try {
              const thread = await api.get(`/leases/${leaseId}/renewals`);
              const arr = thread.data?.renewals || [];
              const active = arr.find(r => r.status === 'PENDING' || r.status === 'COUNTERED');
              if (active) {
                await api.post(`/renewals/${active.id}/counter`, {
                  proposedMonthlyRent: proposedMonthlyRent,
                  proposedTermMonths: proposedTermMonths,
                  proposedStartDate: proposedStartDate,
                  note: note || '',
                });
                hasCountered = true;
              }
            } catch {}

            if (!hasCountered) {
              await api.post(`/leases/${leaseId}/renewals`, {
                proposedMonthlyRent: proposedMonthlyRent,
                proposedTermMonths: proposedTermMonths,
                proposedStartDate: proposedStartDate,
                note: note || '',
              });
            }
            setShowRenewalModal(false);
            await fetchTenants();
          } catch (e) {
            console.error('Propose renewal error:', e);
            alert('Failed to propose renewal');
          } finally {
            setSendingRenewal(false);
          }
        }}
      />
      <EndLeaseModal
        open={showEndModal}
        submitting={sendingEnd}
        effectiveDate={(() => {
          const d = new Date();
          d.setDate(d.getDate() + 30);
          return d.toISOString();
        })()}
        terminationPolicyPreview={endTenant?.terminationPolicyPreview}
        onClose={() => setShowEndModal(false)}
        onSubmit={async ({ reason, effectiveDate }) => {
          try {
            if (!endTenant) return;
            setSendingEnd(true);
            const offerId =
              endTenant?.offerId ||
              endTenant?.paidOfferId ||
              endTenant?.offer?.id;
            const metaResp = await api.get(`/leases/by-offer/${offerId}`);
            const leaseId = metaResp.data?.lease?.id;
            if (!leaseId) {
              alert('No lease found for this booking.');
              setSendingEnd(false);
              return;
            }
            await api.post(`/leases/${leaseId}/terminations`, {
              reason: reason || 'Landlord initiated termination',
              effectiveDate,
            });
            setShowEndModal(false);
            await fetchTenants();
          } catch (e) {
            console.error('End lease error:', e);
            alert('Failed to submit termination notice');
          } finally {
            setSendingEnd(false);
          }
        }}
      />
    </>
  );
};

export default LandlordMyTenants;
