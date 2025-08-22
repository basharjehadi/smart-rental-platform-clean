import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, CreditCard, Home, ArrowLeft, Download, Mail, Copy, Calendar, User, Clock, Shield } from 'lucide-react';

const PaymentSuccessPage = () => {
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [landlordInfo, setLandlordInfo] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Handle different payment types
    if (location.state?.offer) {
      setOffer(location.state.offer);
      setLoading(false);
    } else if (location.state?.paymentType === 'monthly_rent') {
      // Handle monthly rent payment success
      setLoading(false);
      
      // Set flag to show success message when returning to payment history
      sessionStorage.setItem('paymentCompleted', 'true');
      
      // Fetch landlord info for monthly rent payments
      const fetchLandlordInfo = async () => {
        try {
          const response = await fetch('/api/tenant-dashboard/current-rental', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setLandlordInfo(data.landlord);
          }
        } catch (error) {
          console.error('Error fetching landlord info:', error);
        }
      };
      
      fetchLandlordInfo();
    } else {
      // If no payment data, redirect back to offers
      navigate('/my-offers');
    }
  }, [location.state, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment confirmation...</p>
        </div>
      </div>
    );
  }

  // Handle monthly rent payment success
  if (location.state?.paymentType === 'monthly_rent') {
    const { selectedPayments, totalAmount, paymentData } = location.state;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">


        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Payment Successful!</h1>
            <p className="text-xl text-gray-600">
              Your monthly rent payment has been processed and confirmed.
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Payment Confirmed Card */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Payment Confirmed
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Payment Processed: Funds transferred successfully</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Confirmation Sent: Email receipt delivered</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Receipt Available: Download your receipt</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Landlord Notified: Payment confirmation sent</span>
                  </div>
                </div>
              </div>

              {/* Payment Details Card */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                  Payment Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment Gateway:</span>
                    <span className="font-medium text-gray-900">{paymentData?.paymentGateway || 'Credit Card'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Completed
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment ID:</span>
                    <span className="font-mono text-sm text-gray-500">{paymentData?.paymentId || 'PAY_240322_005872'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Processing Time:</span>
                    <span className="font-medium text-gray-900">Instant</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Transaction Date:</span>
                    <span className="font-medium text-gray-900">{new Date().toLocaleDateString('pl-PL')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Next Due Date:</span>
                    <span className="font-medium text-gray-900">
                      {selectedPayments && selectedPayments.length > 0 
                        ? new Date(new Date(selectedPayments[0].dueDate).getTime() + 30*24*60*60*1000).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Download Receipt</span>
                  </button>
                  <div className="flex space-x-3">
                    <button className="flex-1 bg-white text-gray-700 py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>Email Receipt</span>
                    </button>
                    <button className="px-4 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Payment Summary Card */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  Payment Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Period:</span>
                    <span className="font-medium text-gray-900">
                      {selectedPayments && selectedPayments.length > 0 
                        ? selectedPayments[0].month 
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="font-medium text-gray-900">
                      {selectedPayments && selectedPayments.length > 0 
                        ? formatDate(selectedPayments[0].dueDate)
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="text-xl font-bold text-green-600">{totalAmount?.toFixed(2)} zł</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Processing Fee:</span>
                    <span className="font-medium text-gray-900">Free</span>
                  </div>
                </div>
              </div>

                             {/* Landlord Notified Card */}
               <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                   <User className="w-5 h-5 mr-2 text-green-600" />
                   Landlord Notified
                 </h3>
                 <div className="flex items-center space-x-4 mb-3">
                   {landlordInfo?.profileImage ? (
                     <img 
                       src={getProfilePhotoUrl(landlordInfo.profileImage)} 
                       alt="Landlord" 
                       className="w-12 h-12 rounded-full object-cover border-2 border-green-200" 
                     />
                   ) : (
                     <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-200">
                       {landlordInfo ? (
                         <span className="text-lg font-semibold text-green-600">
                           {landlordInfo.name?.split(' ').map(n => n[0]).join('') || 'L'}
                         </span>
                       ) : (
                         <div className="w-6 h-6 border-2 border-green-300 border-t-transparent rounded-full animate-spin"></div>
                       )}
                     </div>
                   )}
                   <div>
                     <div className="font-semibold text-gray-900">{landlordInfo?.name || 'Landlord'}</div>
                     <div className="flex items-center space-x-2 text-sm text-green-600">
                       <CheckCircle className="w-4 h-4" />
                       <span>Payment confirmation sent</span>
                     </div>
                   </div>
                 </div>
                 <div className="flex items-center space-x-2 text-sm text-gray-500">
                   <Clock className="w-4 h-4" />
                   <span>Delivered 2 minutes ago</span>
                 </div>
               </div>

              {/* What's Next Card */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">
                      Next Payment: Due {selectedPayments && selectedPayments.length > 0 
                        ? new Date(new Date(selectedPayments[0].dueDate).getTime() + 30*24*60*60*1000).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Receipt Sent: Check your email inbox</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="mt-12 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => navigate('/payment-history')}
              className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>View Payment History</span>
            </button>
            <button
              onClick={() => navigate('/tenant-dashboard')}
              className="bg-white text-gray-700 py-3 px-8 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Home className="w-5 h-5" />
              <span>Go to Dashboard</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Handle offer payment success (existing functionality)
  if (offer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/my-offers')}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors flex items-center space-x-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Offers</span>
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <img src="/logo.png" alt="SmartRental Logo" className="h-8" />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Payment Successful!</h2>
            <p className="text-gray-600 mb-8">
              Your payment has been processed successfully. The landlord will be notified.
            </p>

            <div className="space-y-4 mb-8 text-left">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-lg font-medium text-gray-700">Amount Paid:</span>
                <span className="text-2xl font-bold text-green-700">{offer.rentAmount} zł</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Property:</span>
                <span className="font-medium text-gray-700">{offer.propertyAddress}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Date:</span>
                <span className="font-medium text-gray-700">{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => navigate('/my-offers')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Offers
              </button>
              <button
                onClick={() => navigate('/tenant-dashboard')}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return null;
};

// Helper function to format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Helper function to get profile photo URL
const getProfilePhotoUrl = (photoPath) => {
  if (!photoPath) return null;
  if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
    return photoPath;
  }
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  if (!photoPath.startsWith('/')) {
    return `${baseUrl}/uploads/profile_images/${photoPath}`;
  }
  if (photoPath.startsWith('/uploads/')) {
    return `${baseUrl}${photoPath}`;
  }
  return `${baseUrl}${photoPath}`;
};

export default PaymentSuccessPage;

