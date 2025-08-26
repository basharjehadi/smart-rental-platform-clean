import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TenantSidebar from '../components/TenantSidebar';
import NotificationHeader from '../components/common/NotificationHeader';
import { LogOut, MessageSquare, FileText, Phone, Mail, Clock, AlertCircle } from 'lucide-react';
import SupportTicketModal from '../components/support/SupportTicketModal';
import LiveChatModal from '../components/LiveChatModal';
import SupportTicketList from '../components/SupportTicketList';
import SupportTicketDetail from '../components/SupportTicketDetail';

const TenantHelpCenter = () => {
  const { user, logout, api } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('faq');
  const [activeSubTab, setActiveSubTab] = useState('rental-payments');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isTicketDetailOpen, setIsTicketDetailOpen] = useState(false);

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

  const handleFaqToggle = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleCallSupport = () => {
    window.open('tel:+48800123456', '_self');
  };

  const handleEmailSupport = () => {
    window.open('mailto:support@rentdash.pl', '_self');
  };

  const handleLiveChat = () => setIsChatModalOpen(true);

  const handleSubmitTicket = () => setIsTicketModalOpen(true);

  const handleDownloadGuide = (guideType) => {
    // Placeholder for guide downloads
    alert(`Downloading ${guideType} guide...`);
  };

  const handleFindLegalHelp = () => alert('Legal help finder feature coming soon!');
  const handleTicketCreated = () => setIsTicketModalOpen(false);
  const handleViewTicket = (ticket) => { setSelectedTicket(ticket); setIsTicketDetailOpen(true); };
  const handleTicketDetailClose = () => { setIsTicketDetailOpen(false); setSelectedTicket(null); };
  const handleTicketDetailBack = () => { setIsTicketDetailOpen(false); setSelectedTicket(null); };

  const handleEmergencyCall = () => {
    window.open('tel:+48800911911', '_self');
  };

  const faqData = {
    'rental-payments': [
      {
        question: 'How do I pay my monthly rent?',
        answer: 'You can pay your monthly rent through bank transfer, online payment, or by setting up automatic payments. Contact your landlord for the specific payment details and account information.'
      },
      {
        question: 'What should I do if I can\'t pay rent on time?',
        answer: 'Contact your landlord immediately to discuss payment arrangements. Most landlords are understanding if you communicate early and propose a reasonable payment plan.'
      },
      {
        question: 'Can my landlord increase the rent during my lease?',
        answer: 'In Poland, rent increases during an active lease are generally not allowed unless specifically stated in your lease agreement. Rent can only be increased when renewing the lease.'
      },
      {
        question: 'What happens to my security deposit?',
        answer: 'Your security deposit is held by your landlord and should be returned within 30 days after you move out, minus any deductions for damages beyond normal wear and tear.'
      }
    ],
    'maintenance': [
      {
        question: 'Who is responsible for repairs in my rental?',
        answer: 'Landlords are responsible for structural repairs, heating, plumbing, and electrical systems. Tenants are responsible for minor repairs and damages caused by their actions.'
      },
      {
        question: 'How do I report a maintenance issue?',
        answer: 'Report maintenance issues to your landlord in writing (email or text) with photos if possible. Keep records of all communications and follow up if the issue isn\'t addressed promptly.'
      },
      {
        question: 'What if my landlord doesn\'t fix important issues?',
        answer: 'If your landlord doesn\'t address critical issues (heating, plumbing, electrical), you may be able to withhold rent or have repairs done and deduct the cost from your rent. Consult legal advice first.'
      },
      {
        question: 'Can I make improvements to the property?',
        answer: 'You can make minor improvements with landlord permission. Major changes require written consent. Always get approval in writing before making any modifications.'
      }
    ],
    'legal-rights': [
      {
        question: 'What are my rights as a tenant in Poland?',
        answer: 'You have the right to peaceful enjoyment of the property, privacy, reasonable notice for visits, habitable living conditions, and protection from discrimination.'
      },
      {
        question: 'How much notice is required for lease termination?',
        answer: 'Standard notice period is 3 months for both tenant and landlord. Check your lease agreement for specific terms, as they may vary.'
      },
      {
        question: 'Can my landlord evict me without cause?',
        answer: 'No, landlords cannot evict tenants without a valid reason. Valid reasons include non-payment of rent, lease violations, or the landlord needing the property for personal use.'
      },
      {
        question: 'What should I do if I have a dispute with my landlord?',
        answer: 'First, try to resolve the issue through direct communication. If that fails, consider mediation services or consult with a tenant rights organization for legal advice.'
      }
    ]
  };

  const guidesData = [
    {
      title: 'Moving In Guide',
      description: 'Everything you need to know for a smooth move-in',
      icon: '🏠',
      color: 'blue',
      points: [
        'Complete property inspection and document condition',
        'Set up utilities and internet services',
        'Register your address with local authorities',
        'Get copies of all keys and important documents'
      ]
    },
    {
      title: 'Payment Setup Guide',
      description: 'Set up automated rent payments',
      icon: '💰',
      color: 'green',
      points: [
        'Get landlord\'s bank account details',
        'Set up automatic bank transfer (standing order)',
        'Include proper payment reference',
        'Keep payment confirmations as records'
      ]
    },
    {
      title: 'Communication Guide',
      description: 'Best practices for landlord communication',
      icon: '💬',
      color: 'purple',
      points: [
        'Use email for important communications',
        'Keep records of all conversations',
        'Report issues promptly and clearly',
        'Be respectful and professional'
      ]
    },
    {
      title: 'Moving Out Guide',
      description: 'Ensure a smooth move-out process',
      icon: '📦',
      color: 'orange',
      points: [
        'Give proper notice as per lease agreement',
        'Schedule final property inspection',
        'Clean property and return keys',
        'Update address with all services'
      ]
    }
  ];

  const legalRights = [
    'Right to peaceful enjoyment of the property',
    'Protection from discrimination',
    'Right to privacy and reasonable notice',
    'Right to habitable living conditions'
  ];

  const legalProtections = [
    'Protection from illegal eviction',
    'Right to security deposit return',
    'Right to reasonable rent increases',
    'Right to legal representation'
  ];

  const legalResources = [
    'Polish Tenant Rights Guide',
    'Housing Law Information',
    'Legal Aid Directory',
    'Mediation Services'
  ];

  const emergencyContacts = [
    { service: 'Emergency Services', description: 'Police, Fire, Medical', number: '112' },
    { service: 'Water Emergency', description: 'Water supply emergencies', number: '994' },
    { service: 'Gas Emergency', description: 'Gas leaks and emergencies', number: '992' },
    { service: 'Electricity Emergency', description: 'Power outages and electrical issues', number: '991' }
  ];

  const propertyEmergencies = [
    'Gas leaks - Call 992 immediately',
    'Fire - Call 112',
    'Flooding - Turn off water main',
    'Electrical hazards - Turn off power'
  ];

  const filteredFaq = faqData[activeSubTab]?.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <TenantSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
            
            <div className="flex items-center space-x-4">
              <NotificationHeader />
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-900">{user?.name || 'Tenant'}</span>
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-md overflow-hidden">
                  {profileData?.profileImage ? (
                    <img
                      src={profileData.profileImage.startsWith('/') 
                        ? `http://localhost:3001${profileData.profileImage}`
                        : `http://localhost:3001/uploads/profile_images/${profileData.profileImage}`
                      }
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-base font-bold text-white">
                      {user?.name?.charAt(0) || 'T'}
                    </span>
                  )}
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

            {/* Quick actions moved to body (below) to match design */}

            {/* Ticket list intentionally hidden to match simplified design. Submit Ticket opens modal. */}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h2>
              <p className="text-gray-600 mb-6">Find answers to common questions, get support, and learn about your rights as a tenant in Poland.</p>
              
              {/* Search Bar */}
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

            {/* Quick Actions (body) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleLiveChat}>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><MessageSquare className="w-6 h-6 text-gray-700" /></div>
                <h3 className="font-semibold text-gray-900 mb-1">Live Chat</h3>
                <p className="text-sm text-gray-600">Get instant help</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleSubmitTicket}>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><FileText className="w-6 h-6 text-gray-700" /></div>
                <h3 className="font-semibold text-gray-900 mb-1">Submit Ticket</h3>
                <p className="text-sm text-gray-600">Track your request</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleCallSupport}>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><Phone className="w-6 h-6 text-gray-700" /></div>
                <h3 className="font-semibold text-gray-900 mb-1">Call Support</h3>
                <p className="text-sm text-gray-600">+48 800 123 456</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleEmailSupport}>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><Mail className="w-6 h-6 text-gray-700" /></div>
                <h3 className="font-semibold text-gray-900 mb-1">Email Us</h3>
                <p className="text-sm text-gray-600">support@rentdash.pl</p>
              </div>
            </div>


            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'faq', label: 'FAQ' },
                    { id: 'guides', label: 'Guides' },
                    { id: 'legal-info', label: 'Legal Info' },
                    { id: 'emergency', label: 'Emergency' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* FAQ Tab */}
                {activeTab === 'faq' && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Frequently Asked Questions</h3>
                    <p className="text-gray-600 mb-6">Find answers to common tenant questions</p>
                    
                    {/* FAQ Sub-tabs */}
                    <div className="flex space-x-6 mb-6">
                      {[
                        { id: 'rental-payments', label: 'Rental & Payments' },
                        { id: 'maintenance', label: 'Maintenance' },
                        { id: 'legal-rights', label: 'Legal Rights' }
                      ].map((subTab) => (
                        <button
                          key={subTab.id}
                          onClick={() => setActiveSubTab(subTab.id)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium ${
                            activeSubTab === subTab.id
                              ? 'bg-purple-100 text-purple-700'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {subTab.label}
                        </button>
                      ))}
                    </div>

                    {/* FAQ Items */}
                    <div className="space-y-4">
                      {filteredFaq.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg">
                          <button
                            onClick={() => handleFaqToggle(index)}
                            className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-gray-50"
                          >
                            <span className="font-medium text-gray-900">{item.question}</span>
                            <svg
                              className={`w-5 h-5 text-gray-500 transform transition-transform ${
                                expandedFaq === index ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
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

                {/* Guides Tab */}
                {activeTab === 'guides' && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Guides</h3>
                    <p className="text-gray-600 mb-6">Helpful guides for your rental journey</p>
                    
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
                            {guide.points.map((point, pointIndex) => (
                              <li key={pointIndex} className="flex items-start">
                                <span className={`inline-block w-2 h-2 rounded-full mt-2 mr-3 bg-${guide.color}-500`}></span>
                                <span className="text-sm text-gray-600">{point}</span>
                              </li>
                            ))}
                          </ul>
                          <button
                            onClick={() => handleDownloadGuide(guide.title)}
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Full Guide
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legal Info Tab */}
                {activeTab === 'legal-info' && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Legal Info</h3>
                    <p className="text-gray-600 mb-6">Know your rights and protections under Polish law</p>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Tenant Rights */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Rights Include:</h4>
                        <ul className="space-y-3">
                          {legalRights.map((right, index) => (
                            <li key={index} className="flex items-center">
                              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <span className="text-gray-700">{right}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Legal Protections */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Legal Protections:</h4>
                        <ul className="space-y-3">
                          {legalProtections.map((protection, index) => (
                            <li key={index} className="flex items-center">
                              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              </div>
                              <span className="text-gray-700">{protection}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Legal Resources */}
                    <div className="mt-8">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Legal Resources:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {legalResources.map((resource, index) => (
                          <a
                            key={index}
                            href="#"
                            className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span className="text-gray-700">{resource}</span>
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Get Legal Help */}
                    <div className="mt-8">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Get Legal Help:</h4>
                      <div className="bg-gray-50 rounded-lg p-6">
                        <p className="text-gray-700 mb-4">Many cities in Poland offer free legal advice for tenants.</p>
                        <p className="text-gray-700 mb-4">Connect with local tenant advocacy groups for support.</p>
                        <button
                          onClick={handleFindLegalHelp}
                          className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          Find Legal Help Near You
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Emergency Tab */}
                {activeTab === 'emergency' && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Emergency Contacts</h3>
                    <div className="flex items-center mb-6">
                      <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <p className="text-gray-600">Important numbers for urgent situations</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {emergencyContacts.map((contact, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{contact.service}</h4>
                              <p className="text-sm text-gray-600">{contact.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">{contact.number}</p>
                              <button
                                onClick={() => window.open(`tel:${contact.number}`, '_self')}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                Call Now
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Property Emergencies */}
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Property Emergencies</h4>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h5 className="font-semibold text-red-800 mb-3">Immediate Action Required:</h5>
                        <ul className="space-y-2">
                          {propertyEmergencies.map((emergency, index) => (
                            <li key={index} className="flex items-start">
                              <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 mr-3"></span>
                              <span className="text-red-800">{emergency}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-red-800 mt-4 font-medium">
                          After ensuring safety, contact your landlord immediately about any emergency repairs needed.
                        </p>
                      </div>
                    </div>

                    {/* 24/7 Support */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">24/7 Support</h4>
                      <div className="bg-gray-100 rounded-lg p-6 text-center">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h5 className="font-semibold text-gray-900 mb-2">Emergency Hotline</h5>
                        <p className="text-2xl font-bold text-gray-900 mb-2">+48 800 911 911</p>
                        <p className="text-gray-600 mb-4">Available 24/7 for urgent tenant issues</p>
                        <button
                          onClick={handleEmergencyCall}
                          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center mx-auto"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Call Emergency Support
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Still Need Help Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Still Need Help?</h3>
              <p className="text-gray-600 mb-6">Our support team is here to assist you</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Live Chat</h4>
                  <p className="text-sm text-gray-600 mb-3">Average response: 2 minutes</p>
                  <button
                    onClick={handleLiveChat}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Chat
                  </button>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Email Support</h4>
                  <p className="text-sm text-gray-600 mb-3">Response within 4 hours</p>
                  <button
                    onClick={handleEmailSupport}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Send Email
                  </button>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Phone Support</h4>
                  <p className="text-sm text-gray-600 mb-3">Mon-Fri, 9 AM - 6 PM CET</p>
                  <button
                    onClick={handleCallSupport}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Call Now
                  </button>
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

export default TenantHelpCenter; 