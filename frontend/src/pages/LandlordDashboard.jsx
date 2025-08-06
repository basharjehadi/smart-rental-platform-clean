import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import LandlordSidebar from '../components/LandlordSidebar';
import { 
  LogOut, 
  DollarSign, 
  Calendar, 
  Building, 
  TrendingUp, 
  Eye, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Star,
  Wrench,
  ArrowRight
} from 'lucide-react';

const LandlordDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Dashboard data states
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchProfileData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/landlord/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileData = async () => {
    try {
      setProfileLoading(true);
      const response = await api.get('/users/profile');
      setProfileData(response.data.user);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const getProfilePhotoUrl = (profileImage) => {
    if (!profileImage) return null;
    if (profileImage.startsWith('/')) {
      return `http://localhost:3001${profileImage}`;
    }
    return `http://localhost:3001/uploads/profile_images/${profileImage}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Complete':
      case 'Paid':
        return 'text-green-600';
      case 'Due Soon':
        return 'text-orange-600';
      case 'Late Payment':
        return 'text-red-600';
      case 'In Progress':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'Complete':
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Due Soon':
        return 'bg-orange-100 text-orange-800';
      case 'Late Payment':
        return 'bg-red-100 text-red-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <LandlordSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              <h1 className="text-2xl font-bold text-gray-900">Landlord Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'Landlord'}</p>
            </div>
            
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
                    />
                  ) : (
                    <span className="text-base font-bold text-white">
                      {user?.name?.charAt(0) || 'L'}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Good Standing
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

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData?.monthlyRevenue ? formatCurrency(dashboardData.monthlyRevenue) : '0 zł'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Lease Renewals</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData?.upcomingRenewals || 0} upcoming
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Properties</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData?.totalProperties || 0} properties
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Building className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData?.occupancyRate || 0}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Portfolio, Tenants, and Tasks Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Portfolio Overview */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Portfolio Overview</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Properties</span>
                    <span className="font-semibold">{dashboardData?.activeProperties || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Units</span>
                    <span className="font-semibold">{dashboardData?.totalUnits || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Occupied Units</span>
                    <span className="font-semibold">{dashboardData?.occupiedUnits || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vacant Units</span>
                    <span className="font-semibold text-orange-600">{dashboardData?.vacantUnits || 0}</span>
                  </div>
                  
                  <div className="pt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Portfolio Performance</span>
                      <span className="text-sm font-semibold">{dashboardData?.occupancyRate || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${dashboardData?.occupancyRate || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => navigate('/landlord-my-property')}
                    className="w-full mt-4 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View All Properties</span>
                  </button>
                </div>
              </div>

              {/* Recent Tenants */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Tenants</h3>
                </div>
                
                <div className="space-y-4">
                  {dashboardData?.recentTenants?.slice(0, 3).map((tenant, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {tenant.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{tenant.name}</p>
                        <p className="text-sm text-gray-600">{tenant.property}</p>
                      </div>
                      <span className={`text-sm font-medium ${getStatusColor(tenant.status)}`}>
                        {tenant.status}
                      </span>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => navigate('/landlord-tenants')}
                    className="w-full mt-4 flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span>View All Tenants</span>
                  </button>
                </div>
              </div>

              {/* Upcoming Tasks */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
                </div>
                
                <div className="space-y-4">
                  {dashboardData?.upcomingTasks?.slice(0, 3).map((task, index) => (
                    <div key={index} className={`p-3 rounded-lg ${task.bgColor || 'bg-gray-50'}`}>
                      <div className="flex items-center space-x-3">
                        {task.type === 'renewal' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                        {task.type === 'inspection' && <Calendar className="w-4 h-4 text-yellow-600" />}
                        {task.type === 'collection' && <CheckCircle className="w-4 h-4 text-blue-600" />}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{task.title}</p>
                          <p className="text-sm text-gray-600">{task.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => navigate('/landlord-tasks')}
                    className="w-full mt-4 flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>View All Tasks</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Collection Status */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Payment Collection Status</h3>
                  <p className="text-sm text-gray-600">Your last 6 rent payments</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {dashboardData?.recentPayments?.slice(0, 3).map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        payment.status === 'Complete' ? 'bg-green-500' : 
                        payment.status === 'Late Payment' ? 'bg-orange-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{payment.month}</p>
                        <p className="text-sm text-gray-600">{payment.collectedDate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                      <p className={`text-sm font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </p>
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={() => navigate('/landlord-payments')}
                  className="w-full mt-4 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>View Full Payment History</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tenant Reviews and Maintenance Requests */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tenant Reviews */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Tenant Reviews</h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-lg font-bold text-gray-900">{dashboardData?.averageRating || 0}</span>
                    <span className="text-sm text-gray-600">({dashboardData?.totalReviews || 0} reviews)</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {dashboardData?.recentReviews?.slice(0, 3).map((review, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {review.tenantName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{review.tenantName}</p>
                          <p className="text-sm text-gray-600">{review.property}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{review.comment}</p>
                      <p className="text-xs text-gray-500 mt-2">{formatDate(review.date)}</p>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => navigate('/landlord-reviews')}
                    className="w-full mt-4 flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <span>View All Reviews</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Recent Maintenance Requests */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Wrench className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Recent Maintenance Requests</h3>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {dashboardData?.maintenanceRequests?.slice(0, 2).map((request, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      {request.status === 'In Progress' && <Clock className="w-4 h-4 text-yellow-600" />}
                      {request.status === 'Completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{request.title}</p>
                        <p className="text-sm text-gray-600">{request.tenant} - {request.property}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBgColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => navigate('/landlord-maintenance')}
                    className="w-full mt-4 flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <span>View All Requests</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LandlordDashboard; 