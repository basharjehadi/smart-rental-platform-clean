import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LandlordSidebar from '../components/LandlordSidebar';
import { viewContract, downloadContract } from '../utils/contractGenerator.js';
import { 
  LogOut, 
  ArrowLeft,
  Eye, 
  MessageSquare, 
  FileText, 
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Edit,
  CreditCard,
  TrendingUp,
  FileCheck
} from 'lucide-react';

const LandlordTenantProfile = () => {
  const { user, logout, api } = useAuth();
  const navigate = useNavigate();
  const { tenantId } = useParams();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchTenantDetails();
  }, [tenantId]);

  const fetchTenantDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/landlord/tenants/${tenantId}`);
      
      if (response.data.success) {
        setTenant(response.data.tenant);
      } else {
        setError('Failed to fetch tenant details');
      }
    } catch (error) {
      console.error('Error fetching tenant details:', error);
      setError('Failed to fetch tenant details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Paid</span>;
      case 'overdue':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">Overdue</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">Pending</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">Unknown</span>;
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
      month: 'long',
      day: 'numeric'
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewContract = async () => {
    try {
      console.log('🔍 Landlord: Viewing contract for tenant:', tenant.name);
      
      if (!tenant.rentalRequestId) {
        console.log('❌ Landlord: No rental request ID found');
        alert('No rental request found to view contract.');
        return;
      }

      // First, check if there's an existing contract in the database
      let existingContract = null;
      try {
        console.log('🔍 Landlord: Checking for existing contract...');
        const contractResponse = await api.get(`/contracts/landlord-contracts`);
        console.log('🔍 Landlord: Contract response:', contractResponse.data);
        
        if (contractResponse.data.contracts) {
          console.log('🔍 Landlord: Found contracts, searching for rental request ID:', tenant.rentalRequestId);
          existingContract = contractResponse.data.contracts.find(
            contract => contract.rentalRequest.id === tenant.rentalRequestId
          );
          
          if (existingContract) {
            console.log('✅ Landlord: Found existing contract, checking PDF URL:', existingContract.pdfUrl);
            
            // Check if PDF URL exists and is valid
            if (existingContract.pdfUrl && existingContract.pdfUrl !== 'null' && existingContract.pdfUrl !== null) {
              console.log('✅ Landlord: Opening saved contract with URL:', `http://localhost:3001${existingContract.pdfUrl}`);
              window.open(`http://localhost:3001${existingContract.pdfUrl}`, '_blank');
              return;
            } else {
              console.log('⚠️ Landlord: Contract found but PDF URL is invalid, will generate on-the-fly');
            }
          } else {
            console.log('ℹ️ Landlord: No matching contract found for rental request ID:', tenant.rentalRequestId);
          }
        } else {
          console.log('ℹ️ Landlord: No contracts in response');
        }
      } catch (contractError) {
        console.error('❌ Landlord: Error checking for existing contract:', contractError);
        console.log('ℹ️ Landlord: Will generate on-the-fly due to error');
      }

      // If no existing contract, generate on-the-fly using backend
      console.log('🔍 Landlord: No existing contract found, generating via backend...');
      
      try {
        // Call backend to generate contract
        const generateResponse = await api.post(`/contracts/generate/${tenant.rentalRequestId}`);
        
        if (generateResponse.data.success) {
          // Open the newly generated contract in a new tab
          const contractUrl = `http://localhost:3001${generateResponse.data.contract.pdfUrl}`;
          window.open(contractUrl, '_blank');
          return;
        }
      } catch (generateError) {
        console.error('❌ Landlord: Error generating contract via backend:', generateError);
        console.log('⚠️ Landlord: Falling back to frontend generation');
        
        // Fallback to frontend generation
        const response = await api.get(`/landlord/tenant-offer/${tenant.rentalRequestId}`);
        const offerData = response.data;
        
        // If we found an existing contract but with invalid PDF, use its data for consistency
        if (existingContract) {
          console.log('🔍 Landlord: Using existing contract data for consistency:', {
            contractNumber: existingContract.contractNumber,
            createdAt: existingContract.createdAt,
            paymentDate: existingContract.paymentDate
          });
          
          // Add the original contract data to the offer
          offerData.offer.originalContractNumber = existingContract.contractNumber;
          offerData.offer.originalContractDate = existingContract.createdAt;
          offerData.offer.originalPaymentDate = existingContract.paymentDate;
        }
        
        console.log('🔍 Landlord: Offer data for contract:', offerData);
        await viewContract(offerData.offer, user);
      }
    } catch (error) {
      console.error('❌ Landlord: Error viewing contract:', error);
      console.error('❌ Landlord: Error response:', error.response?.data);
      alert('Error viewing contract. Please try again.');
    }
  };

  const handleSendMessage = () => {
    navigate(`/landlord-tenant-messages/${tenantId}`);
  };

  const handleDownloadContract = async () => {
    try {
      console.log('🔍 Landlord: Downloading contract for tenant:', tenant.name);
      
      if (!tenant.rentalRequestId) {
        console.log('❌ Landlord: No rental request ID found');
        alert('No rental request found to download contract.');
        return;
      }

      let existingContract = null; // Declare at function level
      
      // First, check if there's an existing contract in the database
      try {
        console.log('🔍 Landlord: Checking for existing contract...');
        const contractResponse = await api.get(`/contracts/landlord-contracts`);
        console.log('🔍 Landlord: Contract response:', contractResponse.data);
        
        if (contractResponse.data.contracts) {
          console.log('🔍 Landlord: Found contracts, searching for rental request ID:', tenant.rentalRequestId);
          existingContract = contractResponse.data.contracts.find(
            contract => contract.rentalRequest.id === tenant.rentalRequestId
          );
          
          if (existingContract) {
            console.log('✅ Landlord: Found existing contract, downloading saved contract');
            try {
              // Try to download the saved contract
              const downloadResponse = await api.get(`/contracts/download-generated/${existingContract.id}`, {
                responseType: 'blob'
              });
              
              const url = window.URL.createObjectURL(new Blob([downloadResponse.data]));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `contract-${existingContract.contractNumber}.pdf`);
              document.body.appendChild(link);
              link.click();
              link.remove();
              window.URL.revokeObjectURL(url);
              return;
            } catch (downloadError) {
              console.error('❌ Landlord: Error downloading saved contract:', downloadError);
              console.log('⚠️ Landlord: Will generate on-the-fly due to download error');
              // Continue to on-the-fly generation
            }
          } else {
            console.log('ℹ️ Landlord: No matching contract found for rental request ID:', tenant.rentalRequestId);
          }
        } else {
          console.log('ℹ️ Landlord: No contracts in response');
        }
      } catch (contractError) {
        console.error('❌ Landlord: Error checking for existing contract:', contractError);
        console.log('ℹ️ Landlord: Will generate on-the-fly due to error');
      }

      // If no existing contract, generate on-the-fly using backend
      console.log('🔍 Landlord: No existing contract found, generating via backend...');
      
      try {
        // Call backend to generate contract
        const generateResponse = await api.post(`/contracts/generate/${tenant.rentalRequestId}`);
        
        if (generateResponse.data.success) {
          // Download the newly generated contract
          const downloadResponse = await api.get(`/contracts/download-generated/${generateResponse.data.contract.id}`, {
            responseType: 'blob'
          });
          
          const url = window.URL.createObjectURL(new Blob([downloadResponse.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `contract-${generateResponse.data.contract.contractNumber}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          return;
        }
      } catch (generateError) {
        console.error('❌ Landlord: Error generating contract via backend:', generateError);
        console.log('⚠️ Landlord: Falling back to frontend generation');
        
        // Fallback to frontend generation
        const response = await api.get(`/landlord/tenant-offer/${tenant.rentalRequestId}`);
        const offerData = response.data;
        
        // If we found an existing contract but with invalid PDF, use its data for consistency
        if (existingContract) {
          console.log('🔍 Landlord: Using existing contract data for download consistency:', {
            contractNumber: existingContract.contractNumber,
            createdAt: existingContract.createdAt,
            paymentDate: existingContract.paymentDate
          });
          
          // Add the original contract data to the offer
          offerData.offer.originalContractNumber = existingContract.contractNumber;
          offerData.offer.originalContractDate = existingContract.createdAt;
          offerData.offer.originalPaymentDate = existingContract.paymentDate;
        }
        
        console.log('🔍 Landlord: Offer data for download:', offerData);
        await downloadContract(offerData.offer, user);
      }
    } catch (error) {
      console.error('❌ Landlord: Error downloading contract:', error);
      console.error('❌ Landlord: Error response:', error.response?.data);
      alert('Error downloading contract. Please try again.');
    }
  };

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

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <LandlordSidebar />
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Tenant</h3>
                <p className="text-gray-600 mb-6">{error || 'Tenant not found'}</p>
                <button
                  onClick={() => navigate('/landlord-my-tenants')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Back to Tenants
                </button>
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/landlord-my-tenants')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Tenants</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{tenant.name || 'Tenant Profile'}</h1>
                <p className="text-gray-600 mt-1">Tenant details and management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-900">{user?.name || 'Landlord'}</span>
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-base font-bold text-white">
                    {user?.name?.charAt(0) || 'L'}
                  </span>
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

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{tenant.name || 'Tenant'}</h2>
                    <p className="text-gray-600">{tenant.email}</p>
                  </div>
                  {getStatusBadge(tenant.paymentStatus)}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleViewContract}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Contract</span>
                  </button>
                  
                  <button
                    onClick={handleDownloadContract}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Contract</span>
                  </button>
                  
                  <button
                    onClick={handleSendMessage}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'overview', label: 'Overview', icon: Eye },
                    { id: 'payments', label: 'Payments', icon: DollarSign },
                    { id: 'lease', label: 'Lease Details', icon: FileCheck },
                    { id: 'property', label: 'Property', icon: Building }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Tenant Information */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tenant Information</h3>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <User className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Name</p>
                              <p className="text-sm text-gray-600">{tenant.name || 'Not provided'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Email</p>
                              <p className="text-sm text-gray-600">{tenant.email || 'Not provided'}</p>
                            </div>
                          </div>
                          
                          {tenant.phone && (
                            <div className="flex items-center space-x-3">
                              <Phone className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Phone</p>
                                <p className="text-sm text-gray-600">{tenant.phone}</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Move-in Date</p>
                              <p className="text-sm text-gray-600">{formatDate(tenant.moveInDate)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Summary */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Monthly Rent</span>
                            <span className="text-lg font-semibold text-gray-900">{formatCurrency(tenant.monthlyRent || 0)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Security Deposit</span>
                            <span className="text-lg font-semibold text-gray-900">{formatCurrency(tenant.securityDeposit || 0)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Current Status</span>
                            {getStatusBadge(tenant.paymentStatus)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="w-5 h-5 text-blue-600" />
                              <span className="text-sm font-medium text-blue-900">Total Paid</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-900 mt-2">
                              {formatCurrency(tenant.totalPaid || 0)}
                            </p>
                          </div>
                          
                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="text-sm font-medium text-green-900">On-time Payments</span>
                            </div>
                            <p className="text-2xl font-bold text-green-900 mt-2">
                              {tenant.onTimePayments || 0}
                            </p>
                          </div>
                          
                          <div className="bg-yellow-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-5 h-5 text-yellow-600" />
                              <span className="text-sm font-medium text-yellow-900">Days Rented</span>
                            </div>
                            <p className="text-2xl font-bold text-yellow-900 mt-2">
                              {tenant.daysRented || 0}
                            </p>
                          </div>
                          
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <CreditCard className="w-5 h-5 text-purple-600" />
                              <span className="text-sm font-medium text-purple-900">Next Payment</span>
                            </div>
                            <p className="text-lg font-bold text-purple-900 mt-2">
                              {tenant.nextPaymentDate ? formatDate(tenant.nextPaymentDate) : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                        <div className="space-y-3">
                          {tenant.recentActivity && tenant.recentActivity.length > 0 ? (
                            tenant.recentActivity.map((activity, index) => (
                              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <div className="flex-1">
                                  <p className="text-sm text-gray-900">{activity.description}</p>
                                  <p className="text-xs text-gray-500">{formatDate(activity.date)}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No recent activity</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'payments' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
                    {tenant.paymentHistory && tenant.paymentHistory.length > 0 ? (
                      <div className="space-y-4">
                        {tenant.paymentHistory.map((payment, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{payment.description}</p>
                                <p className="text-xs text-gray-500">{formatDate(payment.date)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                              {getStatusBadge(payment.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No payment history available</p>
                    )}
                  </div>
                )}

                {activeTab === 'lease' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Lease Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Lease Start Date</p>
                          <p className="text-lg text-gray-900">{formatDate(tenant.leaseStartDate)}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700">Lease End Date</p>
                          <p className="text-lg text-gray-900">{formatDate(tenant.leaseEndDate)}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700">Lease Duration</p>
                          <p className="text-lg text-gray-900">{tenant.leaseDuration || 12} months</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Monthly Rent</p>
                          <p className="text-lg text-gray-900">{formatCurrency(tenant.monthlyRent || 0)}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700">Security Deposit</p>
                          <p className="text-lg text-gray-900">{formatCurrency(tenant.securityDeposit || 0)}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700">Contract Status</p>
                          <p className="text-lg text-gray-900">{tenant.contractStatus || 'Active'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'property' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h3>
                    {tenant.property ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Property Name</p>
                            <p className="text-lg text-gray-900">{tenant.property.title}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-700">Address</p>
                            <p className="text-lg text-gray-900">{tenant.property.address}</p>
                            <p className="text-sm text-gray-600">{tenant.property.city}, {tenant.property.zipCode}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-700">Property Type</p>
                            <p className="text-lg text-gray-900">{tenant.property.propertyType}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Bedrooms</p>
                            <p className="text-lg text-gray-900">{tenant.property.bedrooms}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-700">Bathrooms</p>
                            <p className="text-lg text-gray-900">{tenant.property.bathrooms}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-700">Size</p>
                            <p className="text-lg text-gray-900">{tenant.property.size} m²</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Property information not available</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LandlordTenantProfile;
