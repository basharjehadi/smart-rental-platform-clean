import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

interface ToastNotificationProps {
  notification: {
    id: string;
    type: 'NEW_RENTAL_REQUEST' | 'NEW_OFFER';
    entityId: string;
    title: string;
    body: string;
  };
  onClose: (id: string) => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ notification, onClose }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-hide after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(notification.id), 300); // Wait for fade out animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  const handleClick = () => {
    // Navigate based on notification type
    if (notification.type === 'NEW_RENTAL_REQUEST') {
      navigate('/landlord/rental-requests');
    } else if (notification.type === 'NEW_OFFER') {
      navigate('/tenant/view-offers');
    }
    onClose(notification.id);
  };

  const getIcon = () => {
    if (notification.type === 'NEW_RENTAL_REQUEST') {
      return (
        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transition-all duration-300 ease-in-out">
      <div className="p-4">
        <div className="flex items-start">
          {getIcon()}
          <div className="ml-3 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
            <p className="mt-1 text-sm text-gray-500">{notification.body}</p>
            <button
              onClick={handleClick}
              className="mt-2 text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              View Details →
            </button>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => onClose(notification.id)}
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToastNotification;
