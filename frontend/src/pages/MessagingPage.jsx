import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Chat from '../components/chat/Chat';
import ChatSelector from '../components/chat/ChatSelector';
import { ArrowLeft, MessageCircle, Plus, Search } from 'lucide-react';

const MessagingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { conversationId } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [showChatSelector, setShowChatSelector] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(conversationId);

  const handleBack = () => {
    navigate(-1);
  };

  const handleNewConversation = () => {
    setShowChatSelector(true);
  };

  // Handle URL parameters for new conversations
  useEffect(() => {
    if (conversationId) {
      if (conversationId === 'new') {
        // Check if we have a propertyId in the URL
        const urlParams = new URLSearchParams(location.search);
        const propertyId = urlParams.get('propertyId');
        // Automatically open the chat selector (ChatSelector will handle auto-starting if propertyId is present)
        setShowChatSelector(true);
      } else {
        setSelectedConversationId(conversationId);
      }
    }
  }, [conversationId, location.search]);

  // Get propertyId from URL if available
  const urlParams = new URLSearchParams(location.search);
  const propertyId = urlParams.get('propertyId');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
              <p className="text-sm text-gray-600">Chat with landlords and tenants</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleNewConversation}
              className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="h-[calc(100vh-80px)]">
        <Chat 
          conversationStatus="ACTIVE"
          paymentStatus="PAID"
          className="h-full"
          selectedConversationId={selectedConversationId}
          onConversationSelect={setSelectedConversationId}
        />
      </div>

      {/* Chat Selector Modal */}
      <ChatSelector 
        isOpen={showChatSelector}
        onClose={() => setShowChatSelector(false)}
        propertyId={propertyId}
      />
    </div>
  );
};

export default MessagingPage;
