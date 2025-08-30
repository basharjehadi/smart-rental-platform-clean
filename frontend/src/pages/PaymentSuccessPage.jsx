import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle,
  ArrowLeft,
  MapPin,
  Calendar,
  FileText,
  MessageCircle,
  Phone,
  Shield,
  AlertTriangle,
  Download,
  Mail,
  Home,
  Copy,
} from 'lucide-react';

const PaymentSuccessPage = () => {
  const [loading, setLoading] = useState(true);
  const [landlordInfo, setLandlordInfo] = useState(null);
  const [propertyInfo, setPropertyInfo] = useState(null);
  const [rentalRequest, setRentalRequest] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Handle different payment types
    if (location.state?.paymentType === 'monthly_rent') {
      // Handle monthly rent payment success
      setLoading(false);
      sessionStorage.setItem('paymentCompleted', 'true');
      fetchLandlordInfo();
    } else if (location.state?.paymentType === 'deposit_and_first_month') {
      // Handle first-time payment success (deposit + first month)
      setLoading(false);
      sessionStorage.setItem('paymentCompleted', 'true');
      fetchLandlordInfo();
      fetchPropertyInfo();
      fetchRentalRequest();
    } else {
      // If no valid payment type, redirect back to offers
      navigate('/my-offers');
    }
  }, [location.state, navigate]);

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('🔍 PaymentSuccessPage: State updated');
    console.log('🔍 propertyInfo:', propertyInfo);
    console.log('🔍 landlordInfo:', landlordInfo);
    console.log('🔍 rentalRequest:', rentalRequest);

    // Test if the function exists
    console.log(
      '🔍 handleMessageLandlord function exists:',
      typeof handleMessageLandlord
    );
    console.log('🔍 handleMessageLandlord function:', handleMessageLandlord);
  }, [propertyInfo, landlordInfo, rentalRequest]);

  const fetchLandlordInfo = async () => {
    try {
      const response = await fetch('/api/tenant-dashboard/current-rental', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 PaymentSuccessPage: Landlord info response:', data);
        setLandlordInfo(data.landlord);
      }
    } catch (error) {
      console.error('Error fetching landlord info:', error);
    }
  };

  const fetchPropertyInfo = async () => {
    try {
      const response = await fetch('/api/tenant-dashboard/current-rental', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 PaymentSuccessPage: Property info response:', data);
        setPropertyInfo(data.property);
      }
    } catch (error) {
      console.error('Error fetching property info:', error);
    }
  };

  const fetchRentalRequest = async () => {
    try {
      const response = await fetch('/api/tenant-dashboard/current-rental', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 PaymentSuccessPage: Rental request response:', data);
        setRentalRequest(data.rentalRequest);
      }
    } catch (error) {
      console.error('Error fetching rental request:', error);
    }
  };

  const handleMessageLandlord = () => {
    console.log('🔍 Message button clicked!');
    console.log('🔍 propertyInfo:', propertyInfo);
    console.log('🔍 landlordInfo:', landlordInfo);

    // Check if we have the required data
    if (!propertyInfo?.id) {
      console.log('❌ Property info not loaded yet, refreshing...');
      fetchPropertyInfo();
      return;
    }

    if (!landlordInfo?.id) {
      console.log('❌ Landlord info not loaded yet, refreshing...');
      fetchLandlordInfo();
      return;
    }

    // Navigate to messaging with landlord and auto-start chat for this property
    const targetUrl = `/messaging?conversationId=new&propertyId=${propertyInfo.id}`;
    console.log('🔍 Navigating to:', targetUrl);

    console.log('🔍 About to navigate to:', targetUrl);
    console.log('🔍 Navigation state:', {
      recipientId: landlordInfo.id,
      recipientName: landlordInfo.name,
      propertyId: propertyInfo.id,
    });

    navigate(targetUrl, {
      state: {
        recipientId: landlordInfo.id,
        recipientName: landlordInfo.name,
        propertyId: propertyInfo.id,
      },
    });

    console.log('🔍 Navigation called');
  };

  const handleCallLandlord = () => {
    // Handle phone call (could open phone app or show phone number)
    if (landlordInfo?.phone) {
      window.open(`tel:${landlordInfo.phone}`);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading payment confirmation...</p>
        </div>
      </div>
    );
  }

  // Handle monthly rent payment success
  if (location.state?.paymentType === 'monthly_rent') {
    const { selectedPayments, totalAmount, paymentData } = location.state;

    return (
      <div className='min-h-screen bg-gradient-to-br from-green-50 to-emerald-100'>
        <main className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          {/* Success Header */}
          <div className='text-center mb-12'>
            <div className='w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'>
              <CheckCircle className='w-12 h-12 text-green-600' />
            </div>
            <h1 className='text-4xl font-bold text-gray-900 mb-3'>
              Payment Successful!
            </h1>
            <p className='text-xl text-gray-600'>
              Your monthly rent payment has been processed and confirmed.
            </p>
          </div>

          {/* Main Content Grid */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* Left Column */}
            <div className='space-y-6'>
              {/* Payment Confirmed Card */}
              <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                  <CheckCircle className='w-5 h-5 mr-2 text-green-600' />
                  Payment Confirmed
                </h3>
                <div className='space-y-3'>
                  <div className='flex items-center space-x-3'>
                    <CheckCircle className='w-4 h-4 text-green-600' />
                    <span className='text-sm text-gray-700'>
                      Payment Processed: Funds transferred successfully
                    </span>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <CheckCircle className='w-4 h-4 text-green-600' />
                    <span className='text-sm text-gray-700'>
                      Confirmation Sent: Email receipt delivered
                    </span>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <CheckCircle className='w-4 h-4 text-green-600' />
                    <span className='text-sm text-gray-700'>
                      Receipt Available: Download your receipt
                    </span>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <CheckCircle className='w-4 h-4 text-green-600' />
                    <span className='text-sm text-gray-700'>
                      Landlord Notified: Payment confirmation sent
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Details Card */}
              <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                  <CheckCircle className='w-5 h-5 mr-2 text-blue-600' />
                  Payment Details
                </h3>
                <div className='space-y-3'>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600'>Payment Gateway:</span>
                    <span className='font-medium text-gray-900'>
                      {paymentData?.paymentGateway || 'Credit Card'}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600'>Status:</span>
                    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                      Completed
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600'>Payment ID:</span>
                    <span className='font-mono text-sm text-gray-500'>
                      {paymentData?.paymentId || 'PAY_240322_005872'}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600'>Processing Time:</span>
                    <span className='font-medium text-gray-900'>Instant</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600'>Transaction Date:</span>
                    <span className='font-medium text-gray-900'>
                      {new Date().toLocaleDateString('pl-PL')}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600'>Next Due Date:</span>
                    <span className='font-medium text-gray-900'>
                      {selectedPayments && selectedPayments.length > 0
                        ? new Date(
                            new Date(selectedPayments[0].dueDate).getTime() +
                              30 * 24 * 60 * 60 * 1000
                          ).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='mt-6 space-y-3'>
                  <button className='w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2'>
                    <Download className='w-4 h-4' />
                    <span>Download Receipt</span>
                  </button>
                  <div className='flex space-x-3'>
                    <button className='flex-1 bg-white text-gray-700 py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2'>
                      <Mail className='w-4 h-4' />
                      <span>Email Receipt</span>
                    </button>
                    <button className='px-4 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors'>
                      <Copy className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className='space-y-6'>
              {/* Payment Summary Card */}
              <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                  <Calendar className='w-5 h-5 mr-2 text-blue-600' />
                  Payment Summary
                </h3>
                <div className='space-y-3'>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600'>Period:</span>
                    <span className='font-medium text-gray-900'>
                      {selectedPayments && selectedPayments.length > 0
                        ? selectedPayments[0].month
                        : 'N/A'}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600'>Due Date:</span>
                    <span className='font-medium text-gray-900'>
                      {selectedPayments && selectedPayments.length > 0
                        ? formatDate(selectedPayments[0].dueDate)
                        : 'N/A'}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600'>Amount Paid:</span>
                    <span className='text-xl font-bold text-green-600'>
                      {totalAmount?.toFixed(2)} zł
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600'>Processing Fee:</span>
                    <span className='font-medium text-gray-900'>Free</span>
                  </div>
                </div>
              </div>

              {/* Landlord Notified Card */}
              <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                  <CheckCircle className='w-5 h-5 mr-2 text-green-600' />
                  Landlord Notified
                </h3>
                <div className='flex items-center space-x-4 mb-3'>
                  {landlordInfo?.profileImage ? (
                    <img
                      src={getProfilePhotoUrl(landlordInfo.profileImage)}
                      alt='Landlord'
                      className='w-12 h-12 rounded-full object-cover border-2 border-green-200'
                    />
                  ) : (
                    <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-200'>
                      {landlordInfo ? (
                        <span className='text-lg font-semibold text-green-600'>
                          {landlordInfo.name
                            ?.split(' ')
                            .map(n => n[0])
                            .join('') || 'L'}
                        </span>
                      ) : (
                        <div className='w-6 h-6 border-2 border-green-300 border-t-transparent rounded-full animate-spin'></div>
                      )}
                    </div>
                  )}
                  <div>
                    <div className='font-semibold text-gray-900'>
                      {landlordInfo?.name || 'Landlord'}
                    </div>
                    <div className='flex items-center space-x-2 text-sm text-green-600'>
                      <CheckCircle className='w-4 h-4' />
                      <span>Payment confirmation sent</span>
                    </div>
                  </div>
                </div>
                <div className='flex items-center space-x-2 text-sm text-gray-500'>
                  <Calendar className='w-4 h-4' />
                  <span>Delivered 2 minutes ago</span>
                </div>
              </div>

              {/* What's Next Card */}
              <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  What's Next?
                </h3>
                <div className='space-y-3'>
                  <div className='flex items-center space-x-3'>
                    <Calendar className='w-4 h-4 text-blue-600' />
                    <span className='text-sm text-gray-700'>
                      Next Payment: Due{' '}
                      {selectedPayments && selectedPayments.length > 0
                        ? new Date(
                            new Date(selectedPayments[0].dueDate).getTime() +
                              30 * 24 * 60 * 60 * 1000
                          ).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </span>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <Mail className='w-4 h-4 text-green-600' />
                    <span className='text-sm text-gray-700'>
                      Receipt Sent: Check your email inbox
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className='mt-12 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4'>
            <button
              onClick={() => navigate('/payment-history')}
              className='bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2'
            >
              <CheckCircle className='w-5 h-5' />
              <span>View Payment History</span>
            </button>
            <button
              onClick={() => navigate('/tenant-dashboard')}
              className='bg-white text-gray-700 py-3 px-8 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2'
            >
              <Home className='w-5 h-5' />
              <span>Go to Dashboard</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Handle first-time payment success (deposit + first month) - NEW DESIGN
  if (location.state?.paymentType === 'deposit_and_first_month') {
    const { totalAmount, paymentData } = location.state;

    // Use real data instead of fallbacks
    const moveInDate = rentalRequest?.moveInDate
      ? formatDate(rentalRequest.moveInDate)
      : 'N/A';
    const landlordName = landlordInfo?.name || 'Landlord';
    const landlordEmail = landlordInfo?.email || 'landlord@email.com';
    const propertyTitle = propertyInfo?.title || 'Property';
    const propertyType = propertyInfo?.type
      ? `${propertyInfo.type}, ${propertyInfo.rooms || 'N/A'} rooms`
      : 'Property';
    const propertyAddress = propertyInfo?.address || 'Address not available';

    // Debug logging
    console.log('🔍 PaymentSuccessPage: Debug data:', {
      rentalRequest,
      landlordInfo,
      propertyInfo,
      moveInDate,
      landlordName,
      landlordEmail,
      propertyTitle,
      propertyType,
      propertyAddress,
    });

    return (
      <div className='min-h-screen bg-white'>
        {/* Header Navigation */}
        <header className='bg-white border-b border-gray-200'>
          <div className='max-w-7xl mx-auto px-6 py-4'>
            <div className='flex items-center justify-between'>
              <button
                onClick={() => navigate('/tenant-dashboard')}
                className='flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors'
              >
                <ArrowLeft className='w-5 h-5' />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        </header>

        <main className='max-w-7xl mx-auto px-6 py-8'>
          {/* Success Header */}
          <div className='text-center mb-12'>
            <div className='w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'>
              <CheckCircle className='w-12 h-12 text-green-600' />
            </div>
            <h1 className='text-4xl font-bold text-gray-900 mb-3'>
              Payment Successful!
            </h1>
            <p className='text-xl text-gray-600'>
              Your rental is confirmed and fully protected by our safety
              guarantee
            </p>
          </div>

          {/* Main Content Grid */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Left Column - Main Content */}
            <div className='lg:col-span-2 space-y-6'>
              {/* Escrow Protection Box */}
              <div className='bg-green-50 border border-green-200 rounded-xl p-6'>
                <h2 className='text-xl font-bold text-green-800 mb-4'>
                  Your Payment is Protected in Escrow
                </h2>
                <p className='text-green-700 mb-4'>
                  Your money is safely held in our secure escrow system. It will
                  only be released to the landlord 24 hours after you check in,
                  giving you time to inspect the property and ensure everything
                  matches your expectations.
                </p>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='flex items-center space-x-2'>
                    <CheckCircle className='w-5 h-5 text-green-600' />
                    <span className='text-green-700'>
                      Funds secured in escrow
                    </span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <CheckCircle className='w-5 h-5 text-green-600' />
                    <span className='text-green-700'>
                      Full refund if property differs
                    </span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <CheckCircle className='w-5 h-5 text-green-600' />
                    <span className='text-green-700'>
                      24-hour protection window
                    </span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <CheckCircle className='w-5 h-5 text-green-600' />
                    <span className='text-green-700'>
                      24/7 support available
                    </span>
                  </div>
                </div>
              </div>

              {/* What Happens Next */}
              <div className='bg-white border border-gray-200 rounded-xl p-6'>
                <h2 className='text-xl font-bold text-gray-900 mb-4'>
                  What Happens Next
                </h2>
                <div className='space-y-4'>
                  <div className='flex items-start space-x-4'>
                    <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold'>
                      1
                    </div>
                    <div>
                      <p className='font-medium text-gray-900'>
                        Landlord Notified
                      </p>
                      <p className='text-gray-600'>
                        {landlordName} has been notified of your payment and
                        will prepare for your move-in on {moveInDate}.
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start space-x-4'>
                    <div className='w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold'>
                      2
                    </div>
                    <div>
                      <p className='font-medium text-gray-900'>Move-in Day</p>
                      <p className='text-gray-600'>
                        Check in on {moveInDate}. Inspect the property carefully
                        and compare it to the photos and description.
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start space-x-4'>
                    <div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold'>
                      3
                    </div>
                    <div>
                      <p className='font-medium text-gray-900'>
                        24-Hour Protection Window
                      </p>
                      <p className='text-gray-600'>
                        After check-in, you have 24 hours to report any issues.
                        If everything is perfect, payment is automatically
                        released.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 24-Hour Protection */}
              <div className='bg-yellow-50 border border-yellow-200 rounded-xl p-6'>
                <div className='flex items-start space-x-3 mb-4'>
                  <AlertTriangle className='w-6 h-6 text-yellow-600 mt-1' />
                  <div>
                    <h3 className='text-lg font-bold text-yellow-800'>
                      Important: Your 24-Hour Protection
                    </h3>
                    <p className='text-yellow-700'>
                      What to Check on Move-in Day:
                    </p>
                  </div>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-2 mb-4'>
                  <div className='flex items-center space-x-2'>
                    <CheckCircle className='w-4 h-4 text-yellow-600' />
                    <span className='text-yellow-700 text-sm'>
                      Property matches photos and description
                    </span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <CheckCircle className='w-4 h-4 text-yellow-600' />
                    <span className='text-yellow-700 text-sm'>
                      All advertised amenities are present and working
                    </span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <CheckCircle className='w-4 h-4 text-yellow-600' />
                    <span className='text-yellow-700 text-sm'>
                      Property is clean and in good condition
                    </span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <CheckCircle className='w-4 h-4 text-yellow-600' />
                    <span className='text-yellow-700 text-sm'>
                      Location and accessibility as described
                    </span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <CheckCircle className='w-4 h-4 text-yellow-600' />
                    <span className='text-yellow-700 text-sm'>
                      Keys and access codes work properly
                    </span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <CheckCircle className='w-4 h-4 text-yellow-600' />
                    <span className='text-yellow-700 text-sm'>
                      Any furnishing matches what was promised
                    </span>
                  </div>
                </div>
                <button className='bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-medium'>
                  Contact Support 24/7
                </button>
              </div>
            </div>

            {/* Right Column - Property & Landlord Info */}
            <div className='space-y-6'>
              {/* Confirmed Rental */}
              <div className='bg-green-50 border border-green-200 rounded-xl p-6'>
                <h3 className='text-lg font-bold text-green-800 mb-2'>
                  Confirmed Rental
                </h3>
                <p className='text-green-600 text-sm mb-4'>Payment Complete</p>

                <div className='bg-white rounded-lg p-4 mb-4'>
                  {propertyInfo?.images && propertyInfo.images.length > 0 ? (
                    <img
                      src={getPropertyImageUrl(propertyInfo.images[0])}
                      alt={propertyTitle}
                      className='w-full h-32 object-cover rounded-lg mb-3'
                    />
                  ) : (
                    <div className='w-full h-32 bg-gray-200 rounded-lg mb-3 flex items-center justify-center'>
                      <span className='text-gray-500'>No Image Available</span>
                    </div>
                  )}
                  <h4 className='font-semibold text-gray-900 mb-1'>
                    {propertyTitle}
                  </h4>
                  <p className='text-gray-600 text-sm mb-2'>{propertyType}</p>
                  <div className='flex items-center space-x-2 text-sm text-gray-600 mb-2'>
                    <MapPin className='w-4 h-4' />
                    <span>{propertyAddress}</span>
                  </div>
                  <div className='flex items-center space-x-2 text-sm text-gray-600 mb-2'>
                    <Calendar className='w-4 h-4' />
                    <span>Move-in: {moveInDate}</span>
                  </div>
                  <div className='flex items-center space-x-2 text-sm text-gray-600'>
                    <FileText className='w-4 h-4' />
                    <span>12 months lease</span>
                  </div>
                </div>
              </div>

              {/* Landlord Contact */}
              <div className='bg-white border border-gray-200 rounded-xl p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Landlord Contact
                </h3>
                <div className='flex items-center space-x-3 mb-4'>
                  {landlordInfo?.profileImage ? (
                    <img
                      src={getProfilePhotoUrl(landlordInfo.profileImage)}
                      alt='Landlord'
                      className='w-12 h-12 rounded-full object-cover border-2 border-blue-200'
                    />
                  ) : (
                    <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200'>
                      <span className='text-lg font-semibold text-blue-600'>
                        {landlordName
                          ?.split(' ')
                          .map(n => n[0])
                          .join('') || 'L'}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className='font-semibold text-gray-900'>
                      {landlordName}
                    </div>
                    <div className='text-sm text-gray-600'>{landlordEmail}</div>
                  </div>
                </div>
                <div className='space-y-3'>
                  <button
                    onClick={() => {
                      console.log(
                        '🔍 Button clicked! Testing click handler...'
                      );
                      handleMessageLandlord();
                    }}
                    disabled={!propertyInfo?.id || !landlordInfo?.id}
                    className={`w-full py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                      propertyInfo?.id && landlordInfo?.id
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    }`}
                  >
                    <MessageCircle className='w-4 h-4' />
                    <span>
                      {!propertyInfo?.id || !landlordInfo?.id
                        ? 'Loading...'
                        : 'Message'}
                    </span>
                  </button>
                  <button
                    onClick={handleCallLandlord}
                    className='w-full bg-white text-gray-700 py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2'
                  >
                    <Phone className='w-4 h-4' />
                    <span>Call</span>
                  </button>

                  {/* Test button removed */}
                </div>
              </div>

              {/* Documents */}
              <div className='bg-white border border-gray-200 rounded-xl p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Documents
                </h3>
                <div className='space-y-3'>
                  <button
                    onClick={async () => {
                      try {
                        // Prefer offerId when available from state or rentalRequest context
                        const offerId =
                          location.state?.offerId ||
                          rentalRequest?.offerId ||
                          null;
                        if (offerId) {
                          const resp = await fetch(
                            `/api/contracts/generate-by-offer/${offerId}`,
                            {
                              method: 'POST',
                              headers: {
                                Authorization: `Bearer ${localStorage.getItem('token')}`,
                              },
                            }
                          );
                          const data = await resp.json();
                          if (data?.success && data.contract?.pdfUrl) {
                            window.open(
                              `http://localhost:3001${data.contract.pdfUrl}`,
                              '_blank'
                            );
                            return;
                          }
                        }
                        if (rentalRequest?.id) {
                          const resp = await fetch(
                            `/api/contracts/generate/${rentalRequest.id}`,
                            {
                              method: 'POST',
                              headers: {
                                Authorization: `Bearer ${localStorage.getItem('token')}`,
                              },
                            }
                          );
                          const data = await resp.json();
                          if (data?.success && data.contract?.pdfUrl) {
                            window.open(
                              `http://localhost:3001${data.contract.pdfUrl}`,
                              '_blank'
                            );
                            return;
                          }
                        }
                        alert(
                          'Unable to generate contract right now. Please try from your dashboard.'
                        );
                      } catch (e) {
                        console.error(
                          'Error opening contract from success page:',
                          e
                        );
                        alert(
                          'Unable to open contract. Please try from your dashboard.'
                        );
                      }
                    }}
                    className='w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2'
                  >
                    <FileText className='w-4 h-4' />
                    <span>View Rental Contract</span>
                  </button>
                  <button className='w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2'>
                    <Download className='w-4 h-4' />
                    <span>Download Payment Receipt</span>
                  </button>
                  <button className='w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2'>
                    <Shield className='w-4 h-4' />
                    <span>Safety Protection Policy</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // If no valid payment type, redirect back to offers
  if (!location.state?.paymentType) {
    navigate('/my-offers');
    return null;
  }

  return null;
};

// Helper function to format date
const formatDate = dateString => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    return 'N/A';
  }
};

// Helper function to get profile photo URL
const getProfilePhotoUrl = photoPath => {
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

// Helper function to get property image URL
const getPropertyImageUrl = imagePath => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  if (!imagePath.startsWith('/')) {
    return `${baseUrl}/uploads/property_images/${imagePath}`;
  }
  if (imagePath.startsWith('/uploads/')) {
    return `${baseUrl}${imagePath}`;
  }
  return `${baseUrl}${imagePath}`;
};

export default PaymentSuccessPage;
