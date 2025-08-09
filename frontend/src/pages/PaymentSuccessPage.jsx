import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, Shield, Clock, MapPin, Calendar, Home, MessageCircle, Phone, AlertTriangle, FileText, Download, Info, Zap } from 'lucide-react';
import { viewContract, downloadContract } from '../utils/contractGenerator.js';

const PaymentSuccessPage = () => {
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (location.state?.offer) {
      setOffer(location.state.offer);
      setLoading(false);
    } else {
      // If no offer data, redirect back to offers
      navigate('/my-offers');
    }
  }, [location.state, navigate]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleMessageLandlord = () => {
    // TODO: Implement messaging functionality
    alert('Messaging feature coming soon!');
  };

  const handleCallLandlord = () => {
    // TODO: Implement calling functionality
    alert('Calling feature coming soon!');
  };

  const handleContactSupport = () => {
    // TODO: Implement support contact
    alert('Support contact feature coming soon!');
  };

  const handleEmergencyCall = () => {
    // TODO: Implement emergency call
    alert('Emergency call feature coming soon!');
  };

  const handleViewContract = async () => {
    try {
      console.log('🔍 Viewing contract for offer:', offer);
      await viewContract(offer, user);
    } catch (error) {
      console.error('❌ Error viewing contract:', error);
      alert('Error viewing contract. Please try again.');
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      console.log('🔍 Downloading receipt for offer:', offer);
      
      // Create a simple receipt HTML
      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .receipt-details { margin-bottom: 20px; }
            .receipt-details div { margin-bottom: 10px; }
            .total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Payment Receipt</h1>
            <p><strong>Smart Rental System</strong></p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="receipt-details">
            <div><strong>Property:</strong> ${offer?.propertyAddress || 'N/A'}</div>
            <div><strong>Landlord:</strong> ${offer?.landlord?.name || 'N/A'}</div>
            <div><strong>Tenant:</strong> ${offer?.rentalRequest?.tenant?.name || 'N/A'}</div>
            <div><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</div>
            <div><strong>First Month Rent:</strong> ${offer?.rentAmount || 0} PLN</div>
            <div><strong>Security Deposit:</strong> ${offer?.depositAmount || 0} PLN</div>
          </div>
          
          <div class="total">
            <strong>Total Amount:</strong> ${(offer?.rentAmount || 0) + (offer?.depositAmount || 0)} PLN
          </div>
          
          <div style="margin-top: 30px; text-align: center; color: #666;">
            <p>Thank you for using Smart Rental System!</p>
            <p>This receipt serves as proof of payment.</p>
          </div>
        </body>
        </html>
      `;
      
      // Download as HTML file
      const blob = new Blob([receiptHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payment_Receipt_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ Receipt downloaded successfully');
    } catch (error) {
      console.error('❌ Error downloading receipt:', error);
      alert('Error downloading receipt. Please try again.');
    }
  };

  const handleViewProtectionPolicy = () => {
    // Open protection policy in new window
    const policyHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Safety Protection Policy</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .section { margin-bottom: 25px; }
          .section h3 { color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Safety Protection Policy</h1>
          <p><strong>Smart Rental System</strong></p>
        </div>

        <div class="section">
          <h3>1. ESCROW PROTECTION</h3>
          <p>Your payment is held securely in our escrow system until you successfully check in to the property. This ensures that your money is protected and only released to the landlord after you confirm everything is as expected.</p>
        </div>

        <div class="section">
          <h3>2. 24-HOUR PROTECTION WINDOW</h3>
          <div class="highlight">
            <p><strong>After check-in, you have 24 hours to report any issues.</strong></p>
            <p>If the property doesn't match the description or there are significant problems, you can request a full refund.</p>
          </div>
        </div>

        <div class="section">
          <h3>3. WHAT WE COVER</h3>
          <ul>
            <li>Property doesn't match the listing description</li>
            <li>Missing or broken amenities</li>
            <li>Cleanliness or safety issues</li>
            <li>Misleading location or access information</li>
            <li>Landlord unresponsive or unavailable</li>
          </ul>
        </div>

        <div class="section">
          <h3>4. HOW TO REPORT ISSUES</h3>
          <ol>
            <li>Take photos of any problems immediately</li>
            <li>Contact our support team within 24 hours of check-in</li>
            <li>We'll investigate and resolve the issue quickly</li>
            <li>Get a full refund if the property doesn't match</li>
          </ol>
        </div>

        <div class="section">
          <h3>5. RESOLUTION PROCESS</h3>
          <p>Our support team will work with both parties to resolve any issues. In most cases, we can resolve problems within 2 hours. If a resolution cannot be reached, we will provide a full refund.</p>
        </div>

        <div class="section">
          <h3>6. CONTACT SUPPORT</h3>
          <p>Our support team is available 24/7 to help with any issues. You can contact us through the app or by calling our emergency line.</p>
        </div>
      </body>
      </html>
    `;
    
    const newWindow = window.open('', '_blank');
    newWindow.document.write(policyHTML);
    newWindow.document.title = 'Safety Protection Policy';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment confirmation...</p>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No payment data found.</p>
          <button 
            onClick={() => navigate('/my-offers')}
            className="btn-primary mt-4"
          >
            Back to Offers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
             {/* Header */}
       <header className="header-modern px-6 py-4">
         <div className="flex items-center justify-between max-w-7xl mx-auto">
           <div className="flex items-center space-x-4">
             <button
               onClick={() => navigate('/my-offers')}
               className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
             >
               <span className="font-medium">← Back to Offers</span>
             </button>
           </div>
           <div className="flex items-center space-x-4">
             <button
               onClick={() => navigate('/tenant-dashboard')}
               className="btn-primary flex items-center space-x-2"
             >
               <span>Back to Dashboard</span>
             </button>
           </div>
         </div>
       </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-lg text-gray-600">Your rental is confirmed and fully protected by our safety guarantee.</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Payment Protection Card */}
            <div className="card-modern border-green-200 bg-green-50">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                  <h2 className="text-lg font-semibold text-green-900">Your Payment is Protected in Escrow</h2>
                </div>
                <p className="text-green-800 mb-4">
                  Your money is safely held in our secure escrow system. It will only be released to the landlord 24 hours after you check in, giving you time to inspect the property and ensure everything matches your expectations.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800">Funds secured in escrow</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800">Full refund if property differs</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800">24-hour protection window</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800">24/7 support available</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* What Happens Next */}
            <div className="card-modern">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900">What Happens Next</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">1</div>
                    <div>
                      <p className="text-gray-700">
                        <strong>{offer.landlord?.name || 'Jan Kowalczyk'}</strong> has been notified of your payment and will prepare for your move-in on {formatDate(offer.availableFrom)}.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold text-sm">2</div>
                    <div>
                      <p className="text-gray-700">
                        Check in on {formatDate(offer.availableFrom)}. Inspect the property carefully and compare it to the photos and description.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-gray-700">
                        After check-in, you have 24 hours to report any issues. If everything is perfect, payment is automatically released.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 24-Hour Protection */}
            <div className="card-modern border-yellow-200 bg-yellow-50">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  <h2 className="text-lg font-semibold text-yellow-900">Important: Your 24-Hour Protection</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-2">What to Check on Move-in Day:</h3>
                    <ul className="space-y-1 text-yellow-800">
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">Property matches photos and description</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">All advertised amenities are present and working</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">Property is clean and in good condition</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">Location and accessibility as described</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">Keys and access codes work properly</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">Any furnishing matches what was promised</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-2">If Something's Wrong:</h3>
                    <ol className="space-y-1 text-yellow-800">
                      <li className="flex items-start space-x-2">
                        <span className="text-sm font-semibold">1.</span>
                        <span className="text-sm">Take photos of any issues immediately</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-sm font-semibold">2.</span>
                        <span className="text-sm">Contact our support within 24 hours of check-in</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-sm font-semibold">3.</span>
                        <span className="text-sm">We'll investigate and resolve the issue quickly</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-sm font-semibold">4.</span>
                        <span className="text-sm">Get a full refund if the property doesn't match</span>
                      </li>
                    </ol>
                  </div>
                  <button
                    onClick={handleContactSupport}
                    className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:bg-orange-600 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Contact Support 24/7</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dispute Resolution */}
            <div className="card-modern">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">How Our Dispute Resolution Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">What We Cover</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Property doesn't match listing</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Missing or broken amenities</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Cleanliness or safety issues</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Misleading location/access info</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Landlord unresponsive</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Zap className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">Quick Resolution</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Average resolution: under 2 hours</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Full refund for major issues</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Partial refund for minor problems</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Alternative accommodation help</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>No-questions-asked guarantee</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Move-in Date */}
            <div className="card-modern border-green-200 bg-green-50">
              <div className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="text-sm text-green-800">Move-in: {formatDate(offer.availableFrom)}</div>
                    <div className="text-sm text-green-800">{offer.leaseDuration || 12} months lease</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirmed Rental */}
            <div className="card-modern border-green-200 bg-green-50">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Confirmed Rental</h3>
                <div className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium mb-4">
                  Payment Complete
                </div>
                <div className="w-full h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <Home className="w-8 h-8 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <div className="font-semibold text-green-900">
                    {offer.propertyTitle || 'Modern apartment in central Warsaw'}
                  </div>
                  <div className="text-sm text-green-800">
                    {offer.propertyType || 'Apartment'}, {offer.property?.bedrooms || 2} rooms
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-green-800">
                    <MapPin className="w-4 h-4" />
                    <span>{offer.propertyAddress || 'ul. Krakowska 123, Warszawa'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-green-800">
                    <Calendar className="w-4 h-4" />
                    <span>Move-in: {formatDate(offer.availableFrom)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-green-800">
                    <Home className="w-4 h-4" />
                    <span>{offer.leaseDuration || 12} months lease</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Landlord Contact */}
            <div className="card-modern">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Landlord Contact</h3>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-gray-600">
                      {offer.landlord?.name?.charAt(0) || 'J'}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {offer.landlord?.name || 'Jan Kowalczyk'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {offer.landlord?.email || 'jan.kowalczyk@email.com'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleMessageLandlord}
                    className="flex items-center justify-center space-x-2 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">Message</span>
                  </button>
                  <button
                    onClick={handleCallLandlord}
                    className="flex items-center justify-center space-x-2 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">Call</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="card-modern">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleViewContract}
                    className="w-full flex items-center space-x-3 text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">View Rental Contract</span>
                  </button>
                  <button
                    onClick={handleDownloadReceipt}
                    className="w-full flex items-center space-x-3 text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Download Payment Receipt</span>
                  </button>
                  <button
                    onClick={handleViewProtectionPolicy}
                    className="w-full flex items-center space-x-3 text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Info className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">Safety Protection Policy</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Protection Summary */}
            <div className="card-modern border-blue-200 bg-blue-50">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900">Your Protection Summary</h3>
                </div>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>Payment Status:</span>
                    <span className="font-semibold">Secured in Escrow</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Protection Period:</span>
                    <span className="font-semibold">24 hours after check-in</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coverage:</span>
                    <span className="font-semibold">100% Refund Guarantee</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Support:</span>
                    <span className="font-semibold">24/7 Available</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Support */}
            <div className="card-modern border-red-200 bg-red-50">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <h3 className="text-lg font-semibold text-red-900">Emergency Support</h3>
                </div>
                <p className="text-red-800 text-sm mb-4">
                  If you encounter any issues during move-in or need immediate assistance
                </p>
                <button
                  onClick={handleEmergencyCall}
                  className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-600 transition-colors"
                >
                  Call Emergency Line
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccessPage;

