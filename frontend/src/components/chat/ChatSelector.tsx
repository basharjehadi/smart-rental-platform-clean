import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { MessageSquare, Lock, Building, User, Calendar } from 'lucide-react';

interface EligibleTarget {
  propertyId: string;
  conversationId: string | null;
  counterpartUserId: string;
  counterpartName: string;
  counterpartAvatar: string | null;
  propertyTitle: string;
  isLocked: boolean;
  paymentPurpose: string;
  paidAt: string;
}

interface ChatSelectorProps {
  onClose: () => void;
  isOpen: boolean;
  propertyId?: string; // Optional propertyId to auto-start chat for
}

const ChatSelector: React.FC<ChatSelectorProps> = ({ onClose, isOpen, propertyId }) => {
  const navigate = useNavigate();
  const [eligibleTargets, setEligibleTargets] = useState<EligibleTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEligibleTargets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/messaging/eligible');
      
      if (response.data.success) {
        setEligibleTargets(response.data.eligibleTargets || []);
      } else {
        setError('Failed to fetch eligible chat targets');
      }
    } catch (error) {
      console.error('Error fetching eligible targets:', error);
      setError('Failed to fetch eligible chat targets');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (targetPropertyId: string) => {
    try {
      console.log('🔍 handleStartChat called with propertyId:', targetPropertyId);
      setLoading(true);
      setError(null);

      const apiUrl = `/messaging/conversations/by-property/${targetPropertyId}`;
      console.log('🔍 Calling API:', apiUrl);

      const response = await api.post(apiUrl);
      console.log('🔍 API response:', response.data);
      
      if (response.data.success) {
        console.log('✅ Chat started successfully, navigating to conversation');
        console.log('🔍 Conversation ID:', response.data.conversationId);
        console.log('🔍 Navigating to:', `/messaging/${response.data.conversationId}`);
        
        // Navigate to the conversation using the proper route format
        navigate(`/messaging/${response.data.conversationId}`);
        onClose();
      } else {
        console.log('❌ API returned success: false');
        setError('Failed to start chat');
      }
    } catch (error) {
      console.error('❌ Error starting chat:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      setError('Failed to start chat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔍 ChatSelector: useEffect triggered');
    console.log('🔍 isOpen:', isOpen);
    console.log('🔍 propertyId:', propertyId);
    
    if (isOpen) {
      if (propertyId) {
        console.log('✅ Starting chat immediately for property:', propertyId);
        // If we have a specific propertyId, start the chat immediately
        handleStartChat(propertyId);
      } else {
        console.log('📋 Fetching all eligible targets');
        // Otherwise, fetch all eligible targets
        fetchEligibleTargets();
      }
    }
  }, [isOpen, propertyId]);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPaymentPurpose = (purpose: string) => {
    switch (purpose) {
      case 'DEPOSIT':
        return 'Deposit';
      case 'RENT':
        return 'Rent';
      case 'DEPOSIT_AND_FIRST_MONTH':
        return 'Deposit + First Month';
      default:
        return purpose;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Start a New Chat</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">{error}</div>
              <button
                onClick={fetchEligibleTargets}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Try again
              </button>
            </div>
          ) : eligibleTargets.length === 0 ? (
            <div className="text-center py-8">
              <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No properties available for chat</h3>
              <p className="text-gray-600">
                You need to have paid for a property to start chatting with the landlord.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {eligibleTargets.map((target) => (
                <div
                  key={target.propertyId}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => handleStartChat(target.propertyId)}
                >
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {target.counterpartAvatar ? (
                        <img
                          src={target.counterpartAvatar}
                          alt={target.counterpartName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {target.counterpartName}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {target.isLocked ? (
                            <Lock className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <MessageSquare className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        <Building className="w-4 h-4 inline mr-1" />
                        {target.propertyTitle}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Paid: {formatDate(target.paidAt)}
                        </span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {formatPaymentPurpose(target.paymentPurpose)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="text-sm text-gray-600 text-center">
            Chat is unlocked after payment for the property
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSelector;
