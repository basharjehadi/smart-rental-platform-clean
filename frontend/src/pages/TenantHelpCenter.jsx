import React, { useState } from 'react';
import { MessageSquare, FileText, HelpCircle, Phone, Mail, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import SupportTicketModal from '../components/support/SupportTicketModal';
import LiveChatModal from '../components/LiveChatModal';
import SupportTicketList from '../components/SupportTicketList';
import SupportTicketDetail from '../components/SupportTicketDetail';

const TenantHelpCenter = () => {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isTicketDetailOpen, setIsTicketDetailOpen] = useState(false);

  const handleSubmitTicket = () => {
    setIsTicketModalOpen(true);
  };

  const handleLiveChat = () => {
    setIsChatModalOpen(true);
  };

  const handleTicketCreated = () => {
    setIsTicketModalOpen(false);
    // Refresh the ticket list if needed
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setIsTicketDetailOpen(true);
  };

  const handleTicketDetailClose = () => {
    setIsTicketDetailOpen(false);
    setSelectedTicket(null);
  };

  const handleTicketDetailBack = () => {
    setIsTicketDetailOpen(false);
    setSelectedTicket(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
        <p className="text-gray-600">Get help and support for your rental needs</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center mb-4">
            <FileText className="w-8 h-8 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Submit Support Ticket</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Create a detailed support ticket for technical issues, billing questions, or general inquiries.
          </p>
          <button
            onClick={handleSubmitTicket}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Submit Ticket
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center mb-4">
            <MessageSquare className="w-8 h-8 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Live Chat Support</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Get immediate help from our support team through live chat.
          </p>
          <button
            onClick={handleLiveChat}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
          >
            Start Chat
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center mb-4">
            <Phone className="w-8 h-8 text-purple-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Phone Support</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Call us directly for urgent matters or complex issues.
          </p>
          <div className="text-purple-600 font-semibold">1-800-SUPPORT</div>
        </div>
      </div>

      {/* Support Ticket List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Support Tickets</h2>
        <SupportTicketList 
          onNewTicket={handleSubmitTicket}
          onViewTicket={handleViewTicket}
        />
      </div>

      {/* FAQ Section */}
      <div className="mt-8 bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="font-medium text-gray-900 mb-2">How do I search for properties?</h3>
            <p className="text-gray-600">Use the search filters on the homepage to find properties that match your criteria.</p>
          </div>
          <div className="border-b border-gray-200 pb-4">
            <h3 className="font-medium text-gray-900 mb-2">How do I submit a rental request?</h3>
            <p className="text-gray-600">Click "Submit Request" on any property listing to send your rental request to the landlord.</p>
          </div>
          <div className="border-b border-gray-200 pb-4">
            <h3 className="font-medium text-gray-900 mb-2">What happens after I submit a request?</h3>
            <p className="text-gray-600">The landlord will review your request and may send you an offer or contact you directly.</p>
          </div>
          <div className="pb-4">
            <h3 className="font-medium text-gray-900 mb-2">How do I manage my rental requests?</h3>
            <p className="text-gray-600">View and track all your rental requests in the "My Requests" section of your dashboard.</p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="mt-8 bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Customer Support</h3>
            <div className="space-y-2 text-gray-600">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                support@smartrental.com
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                1-800-SUPPORT
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Mon-Fri: 9AM-6PM EST
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Emergency Support</h3>
            <div className="space-y-2 text-gray-600">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                24/7 Emergency Line
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                1-800-EMERGENCY
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SupportTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        onTicketCreated={handleTicketCreated}
      />

      <LiveChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
      />

      <SupportTicketDetail
        ticket={selectedTicket}
        isOpen={isTicketDetailOpen}
        onClose={handleTicketDetailClose}
        onBack={handleTicketDetailBack}
      />
    </div>
  );
};

export default TenantHelpCenter; 