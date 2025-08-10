import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, User, Bot } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LiveChatModal = ({ isOpen, onClose }) => {
  const { api } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && !chatSession) {
      startChatSession();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startChatSession = async () => {
    try {
      setIsLoading(true);
      const response = await api.post('/support/chat/start');
      setChatSession(response.data.session);
      
      // Initialize with empty messages - no welcome message
      setMessages([]);
    } catch (error) {
      console.error('Error starting chat session:', error);
      setMessages([
        {
          id: 'error',
          message: 'Sorry, we couldn\'t start the chat session. Please try again or submit a support ticket.',
          senderId: 'system',
          timestamp: new Date(),
          isRead: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatSession) return;

    const userMessage = {
      id: Date.now().toString(),
      message: newMessage.trim(),
      senderId: 'user',
      timestamp: new Date(),
      isRead: true
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    try {
      const response = await api.post(`/support/chat/${chatSession.id}/message`, {
        message: userMessage.message
      });

      // Add support response
      const supportMessage = {
        id: response.data.message.id,
        message: response.data.message.message,
        senderId: 'support',
        timestamp: new Date(response.data.message.timestamp),
        isRead: true
      };

      setMessages(prev => [...prev, supportMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage = {
        id: Date.now().toString(),
        message: 'Sorry, there was an error sending your message. Please try again.',
        senderId: 'system',
        timestamp: new Date(),
        isRead: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const endChatSession = async () => {
    if (chatSession) {
      try {
        await api.put(`/support/chat/${chatSession.id}/end`);
      } catch (error) {
        console.error('Error ending chat session:', error);
      }
    }
    setChatSession(null);
    setMessages([]);
    onClose();
  };

  const handleClose = () => {
    if (messages.length > 0) {
      // Ask for confirmation if there are actual messages
      if (window.confirm('Are you sure you want to end this chat session?')) {
        endChatSession();
      }
    } else {
      endChatSession();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Live Chat Support</h3>
              <p className="text-sm text-gray-600">
                {chatSession ? 'Connected' : 'Connecting...'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.senderId === 'user'
                        ? 'bg-blue-600 text-white'
                        : msg.senderId === 'support'
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {msg.senderId === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : msg.senderId === 'support' ? (
                        <Bot className="w-4 h-4" />
                      ) : null}
                      <span className="text-xs opacity-75">
                        {msg.senderId === 'user' ? 'You' : msg.senderId === 'support' ? 'Support' : 'System'}
                      </span>
                    </div>
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-4 h-4" />
                      <span className="text-xs opacity-75">Support</span>
                    </div>
                    <div className="flex space-x-1 mt-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={sendMessage} className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Start typing your message to begin chatting..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!chatSession || isLoading}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || !chatSession || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <p className="text-xs text-gray-600 text-center">
            Type your message to start chatting with support. This session will be saved for future reference.
            {chatSession && (
              <span className="ml-2">
                Session ID: {chatSession.id.slice(-8)}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveChatModal;
