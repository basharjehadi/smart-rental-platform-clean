import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LandlordSidebar from '../components/LandlordSidebar';
import NotificationHeader from '../components/common/NotificationHeader';
import { LogOut, MessageSquare, FileText, Phone, Mail, Clock, AlertCircle } from 'lucide-react';
import SupportTicketModal from '../components/support/SupportTicketModal';
import LiveChatModal from '../components/LiveChatModal';
import SupportTicketList from '../components/SupportTicketList';
import SupportTicketDetail from '../components/SupportTicketDetail';

const LandlordHelpCenter = () => {
  const { user, logout, api } = useAuth();
  const navigate = useNavigate();

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isTicketDetailOpen, setIsTicketDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('faq');
  const [activeSubTab, setActiveSubTab] = useState('properties');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await api.get('/users/profile');
        setProfileData(response.data.user);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };
    fetchProfileData();
  }, [api]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSubmitTicket = () => setIsTicketModalOpen(true);
  const handleLiveChat = () => setIsChatModalOpen(true);
  const handleCallSupport = () => window.open('tel:+48800123456', '_self');
  const handleEmailSupport = () => window.open('mailto:support@rentdash.pl', '_self');
  const handleTicketCreated = () => setIsTicketModalOpen(false);
  const handleViewTicket = (ticket) => { setSelectedTicket(ticket); setIsTicketDetailOpen(true); };
  const handleTicketDetailClose = () => { setIsTicketDetailOpen(false); setSelectedTicket(null); };
  const handleTicketDetailBack = () => { setIsTicketDetailOpen(false); setSelectedTicket(null); };
  const handleFaqToggle = (index) => setExpandedFaq(expandedFaq === index ? null : index);

  const faqData = {
    'properties': [
      { question: 'How do I add a new property?', answer: 'Go to My Properties and click “Add Property” to list a new rental property with full details and photos.' },
      { question: 'How can I update my property details?', answer: 'Navigate to My Properties, select the property, and click Edit to update pricing, address, or amenities.' },
      { question: 'Can I pause a property listing?', answer: 'Yes. You can temporarily hide your property from matching by contacting support to adjust the listing status.' }
    ],
    'requests': [
      { question: 'How do I receive rental requests?', answer: 'Our matching engine notifies you when tenants match your properties. Check Rental Requests to review and respond.' },
      { question: 'Can I make multiple offers?', answer: 'Yes. You can create one offer per property for the same tenant request. The first paid offer wins and invalidates others automatically.' },
      { question: 'Why did my offer get invalidated?', answer: 'If another tenant paid for the same property first, other pending/accepted offers for that property are automatically set to REJECTED.' }
    ],
    'payments': [
      { question: 'When do I receive payment?', answer: 'Once a tenant pays deposit and first month, the contract is generated and funds are processed based on your gateway settings.' },
      { question: 'How do monthly rents work?', answer: 'Monthly rent is due on the 10th. The first month can be prorated. Payment history is visible in the tenant profile.' },
      { question: 'Which gateways are supported?', answer: 'Stripe is integrated. Others like PayU, P24, and Tpay are scaffolded and can be enabled later.' }
    ]
  };

  const guidesData = [
    { title: 'Listing Guide', description: 'Best practices for creating high‑converting property listings', icon: '🏠', color: 'blue', points: ['Quality photos', 'Accurate pricing', 'Complete amenities', 'Clear rules'] },
    { title: 'Offer Guide', description: 'How to craft compelling, fair offers tenants accept', icon: '📄', color: 'green', points: ['Reference tenant needs', 'Transparent fees', 'Clear dates', 'Contact info'] },
    { title: 'Payment Guide', description: 'Configure payment preferences and timelines', icon: '💳', color: 'purple', points: ['Select gateway', 'Confirm payout details', 'Review settlement cycle'] },
    { title: 'Contract Guide', description: 'Understanding server‑generated lease contracts', icon: '📝', color: 'orange', points: ['Auto‑generation', 'Bilingual terms', 'Download and share'] }
  ];

  const filteredFaq = faqData[activeSubTab]?.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <LandlordSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
            <div className="flex items-center space-x-4">
              <NotificationHeader />
              <button onClick={handleLogout} className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header + Search */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h2>
              <p className="text-gray-600 mb-6">Get support, find answers, and manage tickets related to your properties.</p>
              <div className="max-w-md mx-auto mb-8">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search help topics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleLiveChat}>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-gray-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Live Chat</h3>
                <p className="text-sm text-gray-600">Get instant help</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleSubmitTicket}>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-gray-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Submit Ticket</h3>
                <p className="text-sm text-gray-600">Track your request</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleCallSupport}>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-gray-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Call Support</h3>
                <p className="text-sm text-gray-600">+48 800 123 456</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleEmailSupport}>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-gray-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Email Us</h3>
                <p className="text-sm text-gray-600">support@rentdash.pl</p>
              </div>
            </div>

            

            {/* Ticket list intentionally hidden to match tenant simplified design. Submit Ticket opens modal. */}

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[{ id: 'faq', label: 'FAQ' }, { id: 'guides', label: 'Guides' }, { id: 'legal-info', label: 'Legal Info' }, { id: 'emergency', label: 'Emergency' }].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="p-6">
                {activeTab === 'faq' && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Frequently Asked Questions</h3>
                    <p className="text-gray-600 mb-6">Common landlord questions</p>
                    <div className="flex space-x-6 mb-6">
                      {[{ id: 'properties', label: 'Properties' }, { id: 'requests', label: 'Requests & Offers' }, { id: 'payments', label: 'Payments' }].map(sub => (
                        <button key={sub.id} onClick={() => setActiveSubTab(sub.id)} className={`px-3 py-2 rounded-lg text-sm font-medium ${activeSubTab === sub.id ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>
                          {sub.label}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-4">
                      {filteredFaq.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg">
                          <button onClick={() => handleFaqToggle(index)} className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-gray-50">
                            <span className="font-medium text-gray-900">{item.question}</span>
                            <svg className={`w-5 h-5 text-gray-500 transform transition-transform ${expandedFaq === index ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {expandedFaq === index && (
                            <div className="px-4 pb-4">
                              <p className="text-gray-600">{item.answer}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'guides' && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Guides</h3>
                    <p className="text-gray-600 mb-6">Helpful guides for landlords</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {guidesData.map((guide, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-6">
                          <div className="flex items-center mb-4">
                            <span className="text-2xl mr-3">{guide.icon}</span>
                            <div>
                              <h4 className="font-semibold text-gray-900">{guide.title}</h4>
                              <p className="text-sm text-gray-600">{guide.description}</p>
                            </div>
                          </div>
                          <ul className="space-y-2 mb-4">
                            {guide.points.map((point, i) => (
                              <li key={i} className="flex items-start">
                                <span className={`inline-block w-2 h-2 rounded-full mt-2 mr-3 bg-${guide.color}-500`}></span>
                                <span className="text-sm text-gray-600">{point}</span>
                              </li>
                            ))}
                          </ul>
                          <button onClick={() => alert(`Downloading ${guide.title} guide...`)} className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center">
                            Download Full Guide
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'legal-info' && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Legal Info</h3>
                    <p className="text-gray-600 mb-6">Know your rights and obligations under Polish law</p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Landlord Responsibilities</h4>
                        <ul className="space-y-3">
                          {['Provide habitable conditions', 'Timely repairs of essential systems', 'Respect tenant privacy and notice periods', 'Fair contract terms'].map((item, i) => (
                            <li key={i} className="flex items-center">
                              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                              </div>
                              <span className="text-gray-700">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Useful Resources</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {['Polish Housing Law', 'Tax Rules for Landlords', 'Eviction Guidelines', 'Mediation Services'].map((label, i) => (
                            <a key={i} href="#" className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                              <span className="text-gray-700">{label}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'emergency' && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Emergency Contacts</h3>
                    <div className="flex items-center mb-6">
                      <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
                      <p className="text-gray-600">Important numbers for urgent situations</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {[
                        { service: 'Emergency Services', description: 'Police, Fire, Medical', number: '112' },
                        { service: 'Water Emergency', description: 'Water supply emergencies', number: '994' },
                        { service: 'Gas Emergency', description: 'Gas leaks and emergencies', number: '992' },
                        { service: 'Electricity Emergency', description: 'Power outages and electrical issues', number: '991' }
                      ].map((contact, i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{contact.service}</h4>
                              <p className="text-sm text-gray-600">{contact.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">{contact.number}</p>
                              <button onClick={() => window.open(`tel:${contact.number}`, '_self')} className="text-sm text-blue-600 hover:text-blue-800">Call Now</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gray-100 rounded-lg p-6 text-center">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <h5 className="font-semibold text-gray-900 mb-2">Emergency Hotline</h5>
                      <p className="text-2xl font-bold text-gray-900 mb-2">+48 800 911 911</p>
                      <p className="text-gray-600 mb-4">Available 24/7 for urgent landlord issues</p>
                      <button onClick={() => window.open('tel:+48800911911', '_self')} className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors">Call Emergency Support</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information removed to match tenant layout */}

            {/* Still Need Help Section (matches tenant layout) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Still Need Help?</h3>
              <p className="text-gray-600 mb-6">Our support team is here to assist you</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Live Chat</h4>
                  <p className="text-sm text-gray-600 mb-3">Average response: 2 minutes</p>
                  <button onClick={handleLiveChat} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Start Chat</button>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Email Support</h4>
                  <p className="text-sm text-gray-600 mb-3">Response within 4 hours</p>
                  <button onClick={handleEmailSupport} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">Send Email</button>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Phone Support</h4>
                  <p className="text-sm text-gray-600 mb-3">Mon–Fri, 9 AM - 6 PM CET</p>
                  <button onClick={handleCallSupport} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">Call Now</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <SupportTicketModal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} onTicketCreated={handleTicketCreated} />
      <LiveChatModal isOpen={isChatModalOpen} onClose={() => setIsChatModalOpen(false)} />
      <SupportTicketDetail ticket={selectedTicket} isOpen={isTicketDetailOpen} onClose={handleTicketDetailClose} onBack={handleTicketDetailBack} />
    </div>
  );
};

export default LandlordHelpCenter;