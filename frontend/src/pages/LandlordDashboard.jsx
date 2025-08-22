import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import LandlordSidebar from '../components/LandlordSidebar';
import NotificationHeader from '../components/common/NotificationHeader';
import ReviewCard from '../components/ReviewCard';
import { 
  LogOut, 
  DollarSign, 
  Building, 
  Home, 
  FileText, 
  Users, 
  Star, 
  AlertTriangle, 
  Wrench, 
  Clock, 
  Calendar, 
  TrendingUp,
  Eye,
  CheckCircle,
  XCircle,
  ChevronRight
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

  // Key Metrics Cards (Top Row)
  const MetricCard = ({ title, value, icon: Icon, color = "blue" }) => {
    const colorClasses = {
      green: "bg-green-100 text-green-600",
      blue: "bg-blue-100 text-blue-600", 
      purple: "bg-purple-100 text-purple-600",
      orange: "bg-orange-100 text-orange-600"
    };

    return (
      <div className="card-modern p-6">
        <div className="flex items-center">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          </div>
        </div>
      </div>
    );
  };

  // Portfolio Overview Card
  const PortfolioCard = () => (
    <div className="card-modern p-6">
      <div className="flex items-center mb-4">
        <Building className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Portfolio Overview</h3>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Active Properties</span>
          <span className="font-semibold text-gray-900">{dashboardData?.totalProperties || 0}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Units</span>
          <span className="font-semibold text-gray-900">{dashboardData?.totalUnits || 0}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Occupied Units</span>
          <span className="font-semibold text-gray-900">{dashboardData?.occupiedUnits || 0}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Vacant Units</span>
          <span className="font-semibold text-orange-600">{dashboardData?.vacantUnits || 0}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Portfolio Performance</span>
          <span className="text-sm text-gray-500">{dashboardData?.occupancyRate || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gray-900 h-2 rounded-full transition-all duration-300"
            style={{ width: `${dashboardData?.occupancyRate || 0}%` }}
          ></div>
        </div>
      </div>

      <button className="btn-secondary flex items-center space-x-2 w-full justify-center">
        <Eye className="w-4 h-4" />
        <span>View All Properties</span>
      </button>
    </div>
  );

  // Recent Tenants Card
  const TenantsCard = () => (
    <div className="card-modern p-6">
      <div className="flex items-center mb-4">
        <Users className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Recent Tenants</h3>
      </div>
      
      <div className="space-y-3 mb-4">
        {dashboardData?.recentTenants && dashboardData.recentTenants.length > 0 ? (
          dashboardData.recentTenants.slice(0, 3).map((tenant, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {tenant.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'T'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{tenant.name || 'Tenant'}</p>
                <p className="text-xs text-gray-500">{tenant.property || 'Property'}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                tenant.status === "Paid" 
                  ? "bg-green-100 text-green-700" 
                  : "bg-yellow-100 text-yellow-700"
              }`}>
                {tenant.status || 'Unknown'}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No tenants yet. Start by creating offers!</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => navigate('/landlord-my-tenants')}
        className="btn-secondary flex items-center space-x-2 w-full justify-center"
      >
        <Users className="w-4 h-4" />
        <span>View All Tenants</span>
      </button>
    </div>
  );

  // Upcoming Tasks Card
  const TasksCard = () => (
    <div className="card-modern p-6">
      <div className="flex items-center mb-4">
        <Clock className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
      </div>
      
      <div className="space-y-3 mb-4">
        {dashboardData?.upcomingTasks && dashboardData.upcomingTasks.length > 0 ? (
          dashboardData.upcomingTasks.slice(0, 3).map((task, index) => (
            <div key={index} className={`p-3 rounded-lg ${
              task.type === "renewal" ? "bg-red-50" :
              task.type === "inspection" ? "bg-yellow-50" : "bg-blue-50"
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  task.type === "renewal" ? "bg-red-100" :
                  task.type === "inspection" ? "bg-yellow-100" : "bg-blue-100"
                }`}>
                  <AlertTriangle className={`w-3 h-3 ${
                    task.type === "renewal" ? "text-red-600" :
                    task.type === "inspection" ? "text-yellow-600" : "text-blue-600"
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{task.title || 'Task'}</p>
                  <p className="text-xs text-gray-600">{task.description || 'No description'}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No upcoming tasks</p>
          </div>
        )}
      </div>

      <button className="btn-secondary flex items-center space-x-2 w-full justify-center">
        <Clock className="w-4 h-4" />
        <span>View All Tasks</span>
      </button>
    </div>
  );

  // Payment History Card
  const PaymentHistoryCard = () => (
    <div className="card-modern p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Payment Collection Status</h3>
        <p className="text-sm text-gray-600">Your recent payments (rent + deposits)</p>
      </div>
      
      <div className="space-y-3 mb-4">
        {dashboardData?.paymentHistory && dashboardData.paymentHistory.length > 0 ? (
          dashboardData.paymentHistory.slice(0, 3).map((payment, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${
                payment.status === "Complete" ? "bg-green-500" : "bg-yellow-500"
              }`}></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{payment.tenant || 'Tenant'}</p>
                <p className="text-xs text-gray-500">{payment.collectedDate || 'Date'}</p>
                <p className="text-xs text-blue-600">{payment.type === 'rent' ? 'Monthly Rent' : payment.type}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-green-600">{payment.amount || '0 zł'}</p>
                <span className={`text-xs ${
                  payment.status === "Complete" ? "text-green-600" : "text-orange-600"
                }`}>
                  {payment.status || 'Unknown'}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No payment history available</p>
          </div>
        )}
      </div>

      <button className="btn-secondary flex items-center space-x-2 w-full justify-center">
        <DollarSign className="w-4 h-4" />
        <span>View Full Payment History</span>
      </button>
    </div>
  );

  // Review System Card
  const ReviewsCard = () => (
    <div className="card-modern p-6">
      <div className="flex items-center mb-4">
        <Star className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Review System</h3>
      </div>
      
                      <ReviewCard userId={user?.id} isLandlord={true} />
      
      <div className="mt-4 text-center">
        <button 
          onClick={() => navigate('/reviews')}
          className="btn-secondary flex items-center space-x-2 w-full justify-center"
        >
          <Eye className="w-4 h-4" />
          <span>View Full Review System</span>
        </button>
      </div>
    </div>
  );

  // Maintenance Requests Card
  const MaintenanceCard = () => (
    <div className="card-modern p-6">
      <div className="flex items-center mb-4">
        <Wrench className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Recent Maintenance Requests</h3>
      </div>
      
      <div className="space-y-3 mb-4">
        {dashboardData?.maintenanceRequests && dashboardData.maintenanceRequests.length > 0 ? (
          dashboardData.maintenanceRequests.slice(0, 3).map((request, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                request.status === "In Progress" ? "bg-orange-100" : "bg-green-100"
              }`}>
                <AlertTriangle className={`w-3 h-3 ${
                  request.status === "In Progress" ? "text-orange-600" : "text-green-600"
                }`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{request.title || 'Maintenance Request'}</p>
                <p className="text-xs text-gray-500">{request.tenant || 'Tenant'} - {request.property || 'Property'}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                request.status === "In Progress" 
                  ? "bg-orange-100 text-orange-700" 
                  : "bg-green-100 text-green-700"
              }`}>
                {request.status || 'Unknown'}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No maintenance requests</p>
          </div>
        )}
      </div>

      <button className="btn-secondary flex items-center space-x-2 w-full justify-center">
        <Wrench className="w-4 h-4" />
        <span>View All Requests</span>
      </button>
    </div>
  );



  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex">
        <LandlordSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600 text-sm">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary flex">
      {/* Left Sidebar */}
      <LandlordSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 text-sm">Welcome back, {user?.name || 'Landlord'}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notification Header */}
              <NotificationHeader />
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
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
            {/* Key Metrics - Top Row */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Monthly Revenue"
                  value={`${dashboardData?.monthlyRevenue || 0} zł`}
                  icon={DollarSign}
                  color="green"
                />
                <MetricCard
                  title="Lease Renewals"
                  value={`${dashboardData?.expiringContracts || 0} upcoming`}
                  icon={Calendar}
                  color="blue"
                />
                <MetricCard
                  title="Total Properties"
                  value={`${dashboardData?.totalProperties || 0} properties`}
                  icon={Building}
                  color="purple"
                />
                <MetricCard
                  title="Occupancy Rate"
                  value={`${dashboardData?.occupancyRate || 0}%`}
                  icon={TrendingUp}
                  color="orange"
                />
              </div>
            </div>

            {/* Middle Section - Three Cards */}
            <div className="mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <PortfolioCard />
                <TenantsCard />
                <TasksCard />
              </div>
            </div>

            {/* Bottom Section - Payment History & Reviews */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PaymentHistoryCard />
              <ReviewsCard />
            </div>

            {/* Maintenance Requests - Full Width */}
            <div className="mt-8">
              <MaintenanceCard />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LandlordDashboard; 