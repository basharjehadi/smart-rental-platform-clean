import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const SupportTicketModal = ({ isOpen, onClose, onTicketCreated }) => {
  const { api } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const categories = [
    { value: 'TECHNICAL', label: 'Technical Issue', icon: '🔧' },
    { value: 'BILLING', label: 'Billing & Payment', icon: '💳' },
    { value: 'GENERAL', label: 'General Inquiry', icon: '❓' },
    { value: 'EMERGENCY', label: 'Emergency', icon: '🚨' },
    { value: 'PROPERTY_ISSUE', label: 'Property Issue', icon: '🏠' },
    { value: 'PAYMENT_ISSUE', label: 'Payment Issue', icon: '💰' },
  ];

  const priorities = [
    { value: 'LOW', label: 'Low', color: 'text-green-600 bg-green-100' },
    {
      value: 'MEDIUM',
      label: 'Medium',
      color: 'text-yellow-600 bg-yellow-100',
    },
    { value: 'HIGH', label: 'High', color: 'text-orange-600 bg-orange-100' },
    { value: 'URGENT', label: 'Urgent', color: 'text-red-600 bg-red-100' },
  ];

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.description ||
      !formData.category ||
      !formData.priority
    ) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await api.post('/support/tickets', formData);

      if (response.data.success) {
        setSuccess(true);
        setFormData({
          title: '',
          description: '',
          category: '',
          priority: '',
        });

        // Call the callback to refresh tickets list
        if (onTicketCreated) {
          onTicketCreated(response.data.ticket);
        }

        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      setError(
        error.response?.data?.error || 'Failed to create support ticket'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        title: '',
        description: '',
        category: '',
        priority: '',
      });
      setError('');
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Submit Support Ticket
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className='text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50'
          >
            <X className='w-6 h-6' />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className='mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg'>
            <div className='flex items-center space-x-2'>
              <CheckCircle className='w-5 h-5 text-green-600' />
              <span className='text-green-800 font-medium'>
                Support ticket created successfully! We'll get back to you soon.
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className='mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <div className='flex items-center space-x-2'>
              <AlertCircle className='w-5 h-5 text-red-600' />
              <span className='text-red-800'>{error}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-6 space-y-6'>
          {/* Title */}
          <div>
            <label
              htmlFor='title'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Ticket Title *
            </label>
            <input
              type='text'
              id='title'
              name='title'
              value={formData.title}
              onChange={handleInputChange}
              placeholder='Brief description of your issue'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              required
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor='category'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Category *
            </label>
            <div className='grid grid-cols-2 gap-3'>
              {categories.map(category => (
                <label
                  key={category.value}
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.category === category.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type='radio'
                    name='category'
                    value={category.value}
                    checked={formData.category === category.value}
                    onChange={handleInputChange}
                    className='text-blue-600 focus:ring-blue-500'
                    required
                  />
                  <span className='text-lg'>{category.icon}</span>
                  <span className='text-sm font-medium text-gray-700'>
                    {category.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label
              htmlFor='priority'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Priority Level *
            </label>
            <div className='grid grid-cols-2 gap-3'>
              {priorities.map(priority => (
                <label
                  key={priority.value}
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.priority === priority.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type='radio'
                    name='priority'
                    value={priority.value}
                    checked={formData.priority === priority.value}
                    onChange={handleInputChange}
                    className='text-blue-600 focus:ring-blue-500'
                    required
                  />
                  <span
                    className={`text-sm font-medium px-2 py-1 rounded-full ${priority.color}`}
                  >
                    {priority.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor='description'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Detailed Description *
            </label>
            <textarea
              id='description'
              name='description'
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder='Please provide detailed information about your issue, including any error messages, steps to reproduce, and what you were trying to do.'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
              required
            />
          </div>

          {/* Footer */}
          <div className='flex items-center justify-end space-x-3 pt-4 border-t border-gray-200'>
            <button
              type='button'
              onClick={handleClose}
              disabled={isSubmitting}
              className='px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isSubmitting}
              className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2'
            >
              {isSubmitting ? (
                <>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                  <span>Creating...</span>
                </>
              ) : (
                <span>Submit Ticket</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupportTicketModal;
