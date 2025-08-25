import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LandlordSidebar from '../components/LandlordSidebar';
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
  User
} from 'lucide-react';

const LandlordMyTenants = () => {
  const { user, logout, api } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/landlord/tenants');
      
      if (response.data.success) {
        setTenants(response.data.tenants || []);
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
      filtered = filtered.filter(tenant =>
        tenant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.property?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.property?.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tenant => tenant.paymentStatus === statusFilter);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.moveInDate) - new Date(a.moveInDate));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.moveInDate) - new Date(b.moveInDate));
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Paid</span>;
      case 'overdue':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Overdue</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Pending</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Unknown</span>;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewTenant = (tenantId) => {
    navigate(`/landlord-tenant-profile/${tenantId}`);
  };

  const handleViewContract = async (tenantId) => {
    try {
      const t = tenants.find(x => x.id === tenantId);
      if (!t?.rentalRequestId) {
        alert('No rental request found to view contract.');
        return;
      }

      // 1) Try open existing contract
      const contractsResp = await api.get('/contracts/landlord-contracts');
      const existing = contractsResp.data.contracts?.find(c => c.rentalRequest?.id === t.rentalRequestId);
      if (existing?.pdfUrl && existing.pdfUrl !== 'null') {
        window.open(`http://localhost:3001${existing.pdfUrl}`, '_blank');
        return;
      }

      // 2) Generate on-the-fly
      const genResp = await api.post(`/contracts/generate/${t.rentalRequestId}`);
      if (genResp.data?.success && genResp.data.contract?.pdfUrl) {
        window.open(`http://localhost:3001${genResp.data.contract.pdfUrl}`, '_blank');
        return;
      }

      // 3) Fallback: go to tenant profile
      navigate(`/landlord-tenant-profile/${tenantId}`);
    } catch (e) {
      console.error('Error opening contract from My Tenants:', e);
      navigate(`/landlord-tenant-profile/${tenantId}`);
    }
  };

  const handleSendMessage = (tenantId) => {
    // Navigate to messaging page with tenant info
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      navigate('/messaging', { 
        state: { 
          newConversation: true, 
          participantIds: [tenant.id],
          propertyId: tenant.propertyId,
          title: `Chat with ${tenant.name || 'Tenant'}`
        } 
      });
    } else {
      alert('Tenant information not available');
    }
  };

  const filteredTenants = filterAndSortTenants();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <LandlordSidebar />
        <div className="flex-1 flex flex-col">
          <div className="animate-pulse">
            <div className="h-16 bg-white border-b"></div>
            <div className="flex-1 p-6">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <LandlordSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Tenants</h1>
              <p className="text-gray-600 mt-1">
                Manage your {tenants.length} tenant{tenants.length !== 1 ? 's' : ''} and track payments
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
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

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                    <p className="text-2xl font-semibold text-gray-900">{tenants.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Paid This Month</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {tenants.filter(t => t.paymentStatus === 'paid').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Overdue</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {tenants.filter(t => t.paymentStatus === 'overdue').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(tenants.reduce((sum, t) => sum + (t.monthlyRent || 0), 0))}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search tenants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Payment Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="rent-high">Rent High-Low</option>
                  <option value="rent-low">Rent Low-High</option>
                </select>

                {/* Quick Actions (removed Back to Dashboard per request) */}
                <div className="flex space-x-2"></div>
              </div>
            </div>

            {/* Tenants List */}
            <div className="space-y-6">
              {filteredTenants.length > 0 ? (
                filteredTenants.map((tenant) => (
                  <div key={tenant.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        {/* Tenant Info */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                              {tenant.profileImage ? (
                                <img
                                  src={tenant.profileImage.startsWith('/') ? `http://localhost:3001${tenant.profileImage}` : `http://localhost:3001/uploads/profile_images/${tenant.profileImage}`}
                                  alt={tenant.name || 'Tenant'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-6 h-6 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{tenant.name || 'Tenant'}</h3>
                              <p className="text-sm text-gray-600">{tenant.email}</p>
                            </div>
                            {getStatusBadge(tenant.paymentStatus)}
                          </div>

                          {/* Property and Payment Info */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-center space-x-2">
                              <Building className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{tenant.property?.title || 'Property'}</p>
                                <p className="text-xs text-gray-600">
                                  {tenant.property?.address}
                                  {tenant.property?.district ? `, ${tenant.property.district}` : ''}
                                  {tenant.property?.zipCode ? `, ${tenant.property.zipCode}` : ''}
                                  {tenant.property?.city ? `, ${tenant.property.city}` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <DollarSign className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{formatCurrency(tenant.monthlyRent || 0)}</p>
                                <p className="text-xs text-gray-600">Monthly Rent</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{formatDate(tenant.moveInDate)}</p>
                                <p className="text-xs text-gray-600">Move-in Date</p>
                              </div>
                            </div>
                          </div>

                          {/* Contact Info */}
                          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
                            {tenant.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="w-4 h-4" />
                                <span>{tenant.phone}</span>
                              </div>
                            )}
                            {tenant.email && (
                              <div className="flex items-center space-x-1">
                                <Mail className="w-4 h-4" />
                                <span>{tenant.email}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col space-y-2 ml-6">
                          <button
                            onClick={() => handleViewTenant(tenant.id)}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Profile</span>
                          </button>
                          
                          <button
                            onClick={() => handleViewContract(tenant.id)}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                          >
                            <FileText className="w-4 h-4" />
                            <span>View Contract</span>
                          </button>
                          
                          <button
                            onClick={() => handleSendMessage(tenant.id)}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>Send Message</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'You don\'t have any tenants yet. Start by creating property listings and accepting offers!'
                    }
                  </p>
                  <button
                    onClick={() => navigate('/landlord-my-property')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
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
  );
};

export default LandlordMyTenants;

