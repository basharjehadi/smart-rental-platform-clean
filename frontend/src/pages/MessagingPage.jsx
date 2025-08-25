import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRef } from 'react';
import Chat from '../components/chat/Chat';
import { ArrowLeft } from 'lucide-react';

// Custom hook to refresh conversations when needed
const useConversationRefresh = (selectedConversationId) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  useEffect(() => {
    if (selectedConversationId) {
      // Trigger a refresh when a new conversation is selected
      setRefreshTrigger(prev => prev + 1);
    }
  }, [selectedConversationId]);
  
  return refreshTrigger;
};

const MessagingPage = () => {
  const { user, api } = useAuth();
  const creatingRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { conversationId } = useParams();
  
  const [selectedConversationId, setSelectedConversationId] = useState(conversationId);
  
  // Use the refresh hook to trigger conversation reloads
  const refreshTrigger = useConversationRefresh(selectedConversationId);

  // Ensure unread badge refreshes when leaving the messaging page
  useEffect(() => {
    return () => {
      try { window.dispatchEvent(new Event('chat-unread-refresh')); } catch {}
    };
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  

  // Handle URL parameters for new conversations
  useEffect(() => {
    console.log('🔍 MessagingPage: useEffect triggered');
    console.log('🔍 location.search:', location.search);
    console.log('🔍 conversationId param:', conversationId);
    
    // Check if we have conversationId=new in query params
    const urlParams = new URLSearchParams(location.search);
    const conversationIdParam = urlParams.get('conversationId');
    const propertyId = urlParams.get('propertyId');
    
    console.log('🔍 conversationIdParam from query:', conversationIdParam);
    console.log('🔍 propertyId from query:', propertyId);
    
    if (conversationId && conversationId !== 'new') {
      console.log('✅ Setting selected conversation from route param:', conversationId);
      // Handle conversation ID from route parameter (highest priority)
      setSelectedConversationId(conversationId);
    } else if (conversationIdParam && conversationIdParam !== 'new') {
      console.log('✅ Setting selected conversation from query param:', conversationIdParam);
      // Handle conversation ID from query parameter (fallback)
      setSelectedConversationId(conversationIdParam);
    } else if (conversationIdParam === 'new' && propertyId) {
      // Auto-create or fetch conversation by property, then select it
      (async () => {
        try {
          if (creatingRef.current) return;
          creatingRef.current = true;
          console.log('🔧 Creating/finding conversation by property (once):', propertyId);
          const res = await api.post(`/messaging/conversations/by-property/${propertyId}`);
          const convId = res?.conversationId || res?.data?.conversationId;
          if (convId) {
            setSelectedConversationId(convId);
          }
        } catch (e) {
          console.error('Failed to create conversation by property:', e);
        } finally {
          creatingRef.current = false;
        }
      })();
    } else {
      console.log('⚠️ No conversation parameters found');
    }
  }, [conversationId, location.search]);

  // Get propertyId from URL if available
  const urlParams = new URLSearchParams(location.search);
  const propertyId = urlParams.get('propertyId');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
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
          
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <Chat 
          conversationStatus="ACTIVE"
          paymentStatus="PAID"
          selectedConversationId={selectedConversationId}
          className="flex-1"
          onConversationSelect={setSelectedConversationId}
          key={refreshTrigger} // Force re-render when conversations refresh
        />
      </div>

      
    </div>
  );
};

export default MessagingPage;
