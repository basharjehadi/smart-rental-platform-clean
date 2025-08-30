import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Bot,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SupportTicketDetail = ({ ticket, isOpen, onClose, onBack }) => {
  const { api } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (ticket) {
      fetchMessages();
    }
  }, [ticket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/support/tickets/${ticket.id}`);
      setMessages(response.data.ticket.messages || []);
    } catch (error) {
      console.error('Error fetching ticket messages:', error);
      setError('Failed to load ticket messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async e => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const response = await api.post(
        `/support/tickets/${ticket.id}/messages`,
        {
          message: newMessage.trim(),
        }
      );

      const newMsg = response.data.message;
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = status => {
    switch (status) {
      case 'OPEN':
        return <Clock className='w-5 h-5 text-blue-600' />;
      case 'IN_PROGRESS':
        return <AlertCircle className='w-5 h-5 text-yellow-600' />;
      case 'RESOLVED':
        return <CheckCircle className='w-5 h-5 text-green-600' />;
      case 'CLOSED':
        return <XCircle className='w-5 h-5 text-gray-600' />;
      default:
        return <Clock className='w-5 h-5 text-gray-600' />;
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = priority => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen || !ticket) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200'>
          <div className='flex items-center space-x-3'>
            <button
              onClick={onBack}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            >
              <ArrowLeft className='w-5 h-5' />
            </button>
            <div>
              <h3 className='text-lg font-semibold text-gray-900'>
                {ticket.title}
              </h3>
              <div className='flex items-center space-x-2 mt-1'>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}
                >
                  {ticket.status.replace('_', ' ')}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}
                >
                  {ticket.priority}
                </span>
                <span className='text-sm text-gray-500'>
                  #{ticket.id.slice(-8)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Ticket Info */}
        <div className='p-4 border-b border-gray-200 bg-gray-50'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
            <div>
              <span className='font-medium text-gray-700'>Category:</span>
              <span className='ml-2 text-gray-900'>
                {ticket.category.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className='font-medium text-gray-700'>Created:</span>
              <span className='ml-2 text-gray-900'>
                {formatDate(ticket.createdAt)}
              </span>
            </div>
            <div>
              <span className='font-medium text-gray-700'>Last Updated:</span>
              <span className='ml-2 text-gray-900'>
                {formatDate(ticket.updatedAt)}
              </span>
            </div>
          </div>
          <div className='mt-3'>
            <span className='font-medium text-gray-700'>Description:</span>
            <p className='mt-1 text-gray-900'>{ticket.description}</p>
          </div>
        </div>

        {/* Messages */}
        <div className='flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]'>
          {loading ? (
            <div className='flex items-center justify-center h-32'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            </div>
          ) : error ? (
            <div className='text-center py-8'>
              <AlertCircle className='w-12 h-12 text-red-500 mx-auto mb-4' />
              <p className='text-red-600 mb-4'>{error}</p>
              <button
                onClick={fetchMessages}
                className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.userId === ticket.userId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.userId === ticket.userId
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className='flex items-center space-x-2 mb-1'>
                      {msg.userId === ticket.userId ? (
                        <User className='w-4 h-4' />
                      ) : (
                        <Bot className='w-4 h-4' />
                      )}
                      <span className='text-xs opacity-75'>
                        {msg.userId === ticket.userId ? 'You' : 'Support'}
                      </span>
                    </div>
                    <p className='text-sm'>{msg.message}</p>
                    <p className='text-xs opacity-75 mt-1'>
                      {formatDate(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className='p-4 border-t border-gray-200'>
          <form onSubmit={sendMessage} className='flex space-x-2'>
            <input
              type='text'
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder='Type your message...'
              className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              disabled={sending || ticket.status === 'CLOSED'}
            />
            <button
              type='submit'
              disabled={
                !newMessage.trim() || sending || ticket.status === 'CLOSED'
              }
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              <Send className='w-4 h-4' />
            </button>
          </form>
          {ticket.status === 'CLOSED' && (
            <p className='text-sm text-gray-500 mt-2 text-center'>
              This ticket is closed and cannot receive new messages
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportTicketDetail;
