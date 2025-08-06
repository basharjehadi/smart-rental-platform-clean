import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  FileText, 
  HelpCircle, 
  BookOpen, 
  Scale, 
  AlertTriangle,
  ChevronDown,
  Search,
  Users,
  Home,
  Shield,
  DollarSign,
  Heart,
  Gavel,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LandlordSidebar from '../components/LandlordSidebar';

const LandlordHelpCenter = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeSection, setActiveSection] = useState('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  React.useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setProfileLoading(true);
      const response = await fetch('http://localhost:3001/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProfileData(data.user);
      }
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
  };

  const faqData = {
    'Tenant & Payments': [
      {
        question: "How do I handle late rent payments?",
        answer: "Send a written notice within 3 days of the due date. If payment isn't received within 5 days, you can begin eviction proceedings according to your state's laws."
      },
      {
        question: "What should I include in a rental agreement?",
        answer: "Include rent amount, due date, security deposit, lease term, property rules, maintenance responsibilities, and any additional fees or policies."
      },
      {
        question: "How much can I charge for a security deposit?",
        answer: "Security deposit limits vary by state, typically 1-2 months' rent. Check your local laws for specific limits and requirements."
      },
      {
        question: "When can I increase the rent?",
        answer: "You can increase rent at the end of a lease term with proper notice (usually 30-60 days). Rent control laws may apply in some areas."
      }
    ],
    'Maintenance': [
      {
        question: "What are my maintenance responsibilities?",
        answer: "You're responsible for structural repairs, plumbing, electrical, heating/cooling systems, and ensuring the property meets health and safety codes."
      },
      {
        question: "How quickly must I respond to repair requests?",
        answer: "Emergency repairs (heat, water, electrical) require immediate attention. Non-emergency repairs should be addressed within 7-14 days."
      },
      {
        question: "Can I enter the property for maintenance?",
        answer: "Yes, with proper notice (usually 24-48 hours) except for emergencies. Always respect tenant privacy and follow state laws."
      }
    ],
    'Lease Rights': [
      {
        question: "What are valid reasons for eviction?",
        answer: "Non-payment of rent, lease violations, property damage, illegal activities, and expiration of lease term are common valid reasons."
      },
      {
        question: "How do I handle tenant complaints?",
        answer: "Document all complaints, investigate promptly, communicate clearly, and take appropriate action to resolve issues fairly."
      },
      {
        question: "What are my rights during an eviction?",
        answer: "You have the right to file for eviction, but must follow proper legal procedures and cannot use self-help methods like changing locks."
      }
    ]
  };

  const guidesData = {
    'Getting Started as a Landlord': [
      'Setting Up Your First Rental Property',
      'Understanding Landlord Insurance Requirements',
      'Creating Effective Rental Listings',
      'Screening Tenants: Best Practices'
    ],
    'Property Management': [
      'Monthly Property Inspection Checklist',
      'Maintenance Scheduling and Planning',
      'Working with Contractors and Vendors',
      'Energy Efficiency Improvements'
    ],
    'Financial Management': [
      'Tax Deductions for Landlords',
      'Setting Competitive Rental Rates',
      'Managing Cash Flow and Expenses',
      'Understanding Depreciation'
    ]
  };

  const legalData = {
    'Fair Housing Laws': [
      'Protected Classes and Discrimination',
      'Reasonable Accommodations',
      'Advertising and Marketing Compliance',
      'Documenting Fair Housing Practices'
    ],
    'Eviction Process': [
      'Notice Requirements by State',
      'Court Filing Procedures',
      'Tenant Rights During Eviction',
      'Post-Eviction Property Recovery'
    ]
  };

  const emergencyData = {
    'Immediate Response Needed': [
      {
        issue: 'No Heat/Air Conditioning',
        description: 'Contact HVAC contractor immediately',
        timeline: 'Within 24 hours'
      },
      {
        issue: 'Water Leaks',
        description: 'Shut off water, call plumber, notify tenant',
        timeline: 'Immediately'
      },
      {
        issue: 'Electrical Issues',
        description: 'Contact licensed electrician, ensure tenant safety',
        timeline: 'Immediately'
      },
      {
        issue: 'Gas Leaks',
        description: 'Evacuate, call gas company and emergency services',
        timeline: 'Immediately'
      }
    ],
    'Emergency Contacts': [
      'Emergency Services: 911',
      'Gas Company: 1-800-XXX-XXXX',
      'Electric Company: 1-800-XXX-XXXX'
    ]
  };

  const renderFAQ = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Frequently Asked Questions</h2>
        <p className="text-gray-600">Find answers to common landlord-related questions.</p>
      </div>

      <div className="space-y-4">
        {Object.entries(faqData).map(([category, questions]) => (
          <div key={category} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {category === 'Tenant & Payments' && <DollarSign className="w-6 h-6 text-blue-600" />}
                {category === 'Maintenance' && <Home className="w-6 h-6 text-green-600" />}
                {category === 'Lease Rights' && <Shield className="w-6 h-6 text-purple-600" />}
                <h3 className="text-lg font-semibold text-gray-800">{category}</h3>
                <span className="text-sm text-gray-500">{questions.length} questions</span>
              </div>
              <button
                onClick={() => setExpandedFaq(expandedFaq === category ? null : category)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ChevronDown className={`w-5 h-5 transition-transform ${expandedFaq === category ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            {expandedFaq === category && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                {questions.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium text-gray-800">{item.question}</h4>
                    <p className="text-gray-600 text-sm">{item.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Still Need Help Section */}
      <div className="bg-gray-50 rounded-lg p-8">
        <h3 className="text-xl font-bold text-purple-600 mb-2">Still Need Help?</h3>
        <p className="text-gray-600 mb-6">Our support team is here to assist you</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-800">Live Chat</h4>
            <p className="text-sm text-gray-600">Average response 2 minutes</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
              Start Chat
            </button>
          </div>

          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-800">Email Support</h4>
            <p className="text-sm text-gray-600">Response within 6 hours</p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">
              Send Email
            </button>
          </div>

          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <Phone className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-800">Phone Support</h4>
            <p className="text-sm text-gray-600">Mon-Fri, 9 AM - 6 PM</p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors">
              Call Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGuides = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-green-600">Landlord Guides</h2>
        <p className="text-gray-600">Step-by-step guides to help you manage your properties effectively</p>
      </div>

      <div className="space-y-6">
        {Object.entries(guidesData).map(([category, guides]) => (
          <div key={category} className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              {category === 'Getting Started as a Landlord' && <Users className="w-6 h-6 text-green-600" />}
              {category === 'Property Management' && <Home className="w-6 h-6 text-blue-600" />}
              {category === 'Financial Management' && <DollarSign className="w-6 h-6 text-purple-600" />}
              <h3 className="text-lg font-semibold text-gray-800">{category}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guides.map((guide, index) => (
                <button
                  key={index}
                  className="text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium text-gray-800">{guide}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Still Need Help Section */}
      <div className="bg-gray-50 rounded-lg p-8">
        <h3 className="text-xl font-bold text-purple-600 mb-2">Still Need Help?</h3>
        <p className="text-gray-600 mb-6">Our support team is here to assist you</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-800">Live Chat</h4>
            <p className="text-sm text-gray-600">Average response 2 minutes</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
              Start Chat
            </button>
          </div>

          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-800">Email Support</h4>
            <p className="text-sm text-gray-600">Response within 6 hours</p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">
              Send Email
            </button>
          </div>

          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <Phone className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-800">Phone Support</h4>
            <p className="text-sm text-gray-600">Mon-Fri, 9 AM - 6 PM</p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors">
              Call Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLegal = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-purple-600">Legal Information</h2>
        <p className="text-gray-600">Important legal requirements and compliance information for landlords</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(legalData).map(([category, topics]) => (
          <div key={category} className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              {category === 'Fair Housing Laws' && <Heart className="w-6 h-6 text-purple-600" />}
              {category === 'Eviction Process' && <Gavel className="w-6 h-6 text-pink-600" />}
              <h3 className="text-lg font-semibold text-gray-800">{category}</h3>
            </div>
            
            <div className="space-y-3">
              {topics.map((topic, index) => (
                <button
                  key={index}
                  className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium text-gray-800">{topic}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Still Need Help Section */}
      <div className="bg-gray-50 rounded-lg p-8">
        <h3 className="text-xl font-bold text-purple-600 mb-2">Still Need Help?</h3>
        <p className="text-gray-600 mb-6">Our support team is here to assist you</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-800">Live Chat</h4>
            <p className="text-sm text-gray-600">Average response 2 minutes</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
              Start Chat
            </button>
          </div>

          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-800">Email Support</h4>
            <p className="text-sm text-gray-600">Response within 6 hours</p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">
              Send Email
            </button>
          </div>

          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <Phone className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-800">Phone Support</h4>
            <p className="text-sm text-gray-600">Mon-Fri, 9 AM - 6 PM</p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors">
              Call Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmergency = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-red-600">Emergency Response Guide</h2>
        <p className="text-gray-600">Quick reference for handling emergency situations in your rental properties</p>
      </div>

      <div className="space-y-6">
        {/* Immediate Response Needed */}
        <div className="border border-red-200 rounded-lg p-6 bg-red-50">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-800">Immediate Response Needed</h3>
          </div>
          
          <div className="space-y-4">
            {emergencyData['Immediate Response Needed'].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-800">{item.issue}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                  {item.timeline}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="border border-red-200 rounded-lg p-6 bg-red-50">
          <div className="flex items-center space-x-3 mb-4">
            <Phone className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-800">Emergency Contacts</h3>
          </div>
          
          <div className="space-y-3">
            {emergencyData['Emergency Contacts'].map((contact, index) => (
              <div key={index} className="p-4 bg-white rounded-lg">
                <span className="font-medium text-gray-800">{contact}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Still Need Help Section */}
      <div className="bg-gray-50 rounded-lg p-8">
        <h3 className="text-xl font-bold text-purple-600 mb-2">Still Need Help?</h3>
        <p className="text-gray-600 mb-6">Our support team is here to assist you</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-800">Live Chat</h4>
            <p className="text-sm text-gray-600">Average response 2 minutes</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
              Start Chat
            </button>
          </div>

          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-800">Email Support</h4>
            <p className="text-sm text-gray-600">Response within 6 hours</p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">
              Send Email
            </button>
          </div>

          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <Phone className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-800">Phone Support</h4>
            <p className="text-sm text-gray-600">Mon-Fri, 9 AM - 6 PM</p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors">
              Call Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'faq':
        return renderFAQ();
      case 'guides':
        return renderGuides();
      case 'legal':
        return renderLegal();
      case 'emergency':
        return renderEmergency();
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <LandlordSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-800">Help Center</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                  {profileLoading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  ) : profileData && profileData.profileImage ? (
                    <img
                      src={getProfilePhotoUrl(profileData.profileImage)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-blue-600">
                      {profileData?.name?.charAt(0) || 'L'}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700">{profileData?.name || 'Landlord'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="text-center space-y-4 mb-8">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-purple-600" />
                </div>
                <h1 className="text-3xl font-bold text-purple-600">Landlord Help Center</h1>
              </div>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Find answers to common questions, get support, and learn about property management best practices.
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search help topics..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Support Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg text-center space-y-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-blue-800">Live Chat</h3>
                <p className="text-sm text-blue-600">Get instant help</p>
                <p className="text-xs text-blue-500">Chat with our support team</p>
              </div>

              <div className="bg-green-50 p-6 rounded-lg text-center space-y-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Phone className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-green-800">Call Support</h3>
                <p className="text-sm text-green-600">Call 888-XXX-XXX</p>
                <p className="text-xs text-green-500">Speak with an expert</p>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg text-center space-y-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-purple-800">Email Us</h3>
                <p className="text-sm text-purple-600">support@landlord.ai</p>
                <p className="text-xs text-purple-500">Send us a message</p>
              </div>

              <div className="bg-orange-50 p-6 rounded-lg text-center space-y-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-orange-800">Submit Ticket</h3>
                <p className="text-sm text-orange-600">Track your request</p>
                <p className="text-xs text-orange-500">Create a support ticket</p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <button 
                onClick={() => setActiveSection('faq')}
                className={`p-6 rounded-lg text-center space-y-3 transition-colors ${
                  activeSection === 'faq' 
                    ? 'bg-blue-100 border-2 border-blue-300' 
                    : 'bg-blue-50 hover:bg-blue-100'
                }`}
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <HelpCircle className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-blue-800">FAQ</h3>
              </button>

              <button 
                onClick={() => setActiveSection('guides')}
                className={`p-6 rounded-lg text-center space-y-3 transition-colors ${
                  activeSection === 'guides' 
                    ? 'bg-green-100 border-2 border-green-300' 
                    : 'bg-green-50 hover:bg-green-100'
                }`}
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-green-800">Guides</h3>
              </button>

              <button 
                onClick={() => setActiveSection('legal')}
                className={`p-6 rounded-lg text-center space-y-3 transition-colors ${
                  activeSection === 'legal' 
                    ? 'bg-purple-100 border-2 border-purple-300' 
                    : 'bg-purple-50 hover:bg-purple-100'
                }`}
              >
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Scale className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-purple-800">Legal Info</h3>
              </button>

              <button 
                onClick={() => setActiveSection('emergency')}
                className={`p-6 rounded-lg text-center space-y-3 transition-colors ${
                  activeSection === 'emergency' 
                    ? 'bg-red-100 border-2 border-red-300' 
                    : 'bg-red-50 hover:bg-red-100'
                }`}
              >
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-semibold text-red-800">Emergency</h3>
              </button>
            </div>

            {/* Content Section */}
            {activeSection !== 'main' && (
              <div className="mt-8">
                {renderContent()}
              </div>
            )}

            {/* FAQ Preview - Only show when no section is selected */}
            {activeSection === 'main' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800">Frequently Asked Questions</h2>
                <p className="text-gray-600">Find answers to common landlord-related questions.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LandlordHelpCenter; 