import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  X,
  Check,
  MessageSquare,
  FileText,
  ExternalLink,
  CheckCircle,
  XCircle,
  Home,
  Megaphone,
  User,
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBadge from './NotificationBadge';

interface NotificationHeaderProps {
  className?: string;
}

const NotificationHeader: React.FC<NotificationHeaderProps> = ({
  className = '',
}) => {
  const { counts, notifications, markAsRead, markAllAsRead } =
    useNotifications();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Handle navigation based on notification type
    switch (notification.type) {
      case 'NEW_RENTAL_REQUEST':
        // Business notification - handled by sidebar
        break;
      case 'NEW_OFFER':
        // Business notification - handled by sidebar
        break;
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_FAILED':
        // Navigate to payment history
        window.location.href = '/payment-history';
        break;
      case 'CONTRACT_UPDATED':
      case 'CONTRACT_SIGNED':
        // Navigate to contract management
        window.location.href = '/contract-management';
        break;
      case 'KYC_APPROVED':
      case 'KYC_REJECTED':
        // Navigate to profile page
        window.location.href =
          user?.role === 'LANDLORD' ? '/landlord-profile' : '/tenant-profile';
        break;
      case 'PROPERTY_STATUS_CHANGED':
        // Navigate to property details or properties list
        if (user?.role === 'LANDLORD') {
          window.location.href = '/landlord-my-property';
        }
        break;
      case 'SYSTEM_ANNOUNCEMENT':
      case 'ACCOUNT_UPDATED':
        // System notifications - no specific navigation needed
        break;
      default:
        break;
    }

    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_RENTAL_REQUEST':
        return <FileText className='w-4 h-4 text-blue-600' />;
      case 'NEW_OFFER':
        return <MessageSquare className='w-4 h-4 text-green-600' />;
      case 'PAYMENT_CONFIRMED':
        return <CheckCircle className='w-4 h-4 text-green-600' />;
      case 'PAYMENT_FAILED':
        return <XCircle className='w-4 h-4 text-red-600' />;
      case 'CONTRACT_UPDATED':
      case 'CONTRACT_SIGNED':
        return <FileText className='w-4 h-4 text-blue-600' />;
      case 'KYC_APPROVED':
        return <CheckCircle className='w-4 h-4 text-green-600' />;
      case 'KYC_REJECTED':
        return <XCircle className='w-4 h-4 text-red-600' />;
      case 'PROPERTY_STATUS_CHANGED':
        return <Home className='w-4 h-4 text-orange-600' />;
      case 'SYSTEM_ANNOUNCEMENT':
        return <Megaphone className='w-4 h-4 text-purple-600' />;
      case 'ACCOUNT_UPDATED':
        return <User className='w-4 h-4 text-gray-600' />;
      default:
        return <Bell className='w-4 h-4 text-gray-600' />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'NEW_RENTAL_REQUEST':
        return 'bg-blue-50 border-blue-200';
      case 'NEW_OFFER':
        return 'bg-green-50 border-blue-200';
      case 'PAYMENT_CONFIRMED':
        return 'bg-green-50 border-green-200';
      case 'PAYMENT_FAILED':
        return 'bg-red-50 border-red-200';
      case 'CONTRACT_UPDATED':
      case 'CONTRACT_SIGNED':
        return 'bg-blue-50 border-blue-200';
      case 'KYC_APPROVED':
        return 'bg-green-50 border-green-200';
      case 'KYC_REJECTED':
        return 'bg-red-50 border-red-200';
      case 'PROPERTY_STATUS_CHANGED':
        return 'bg-orange-50 border-orange-200';
      case 'SYSTEM_ANNOUNCEMENT':
        return 'bg-purple-50 border-purple-200';
      case 'ACCOUNT_UPDATED':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200'
        title='Notifications'
      >
        <Bell className='w-5 h-5' />

        {/* Total Notification Badge - show ALL unread (business + system) */}
        {(() => {
          return counts.total > 0 ? (
            <div className='absolute -top-1 -right-1'>
              <NotificationBadge count={counts.total} />
            </div>
          ) : null;
        })()}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className='absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden'>
          {/* Header */}
          <div className='px-4 py-3 border-b border-gray-200 bg-gray-50'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-semibold text-gray-900'>
                Notifications
              </h3>
              <div className='flex items-center space-x-2'>
                {(() => {
                  return counts.total > 0 ? (
                    <button
                      onClick={markAllAsRead}
                      className='text-xs text-blue-600 hover:text-blue-700 font-medium'
                    >
                      Mark all read
                    </button>
                  ) : null;
                })()}
                <button
                  onClick={() => setIsOpen(false)}
                  className='text-gray-400 hover:text-gray-600'
                >
                  <X className='w-4 h-4' />
                </button>
              </div>
            </div>

            {/* System Notification Type Counts */}
            <div className='flex items-center space-x-4 mt-2 text-xs text-gray-600'>
              {counts.total > 0 ? (
                <span className='flex items-center space-x-1'>
                  <Bell className='w-3 h-3 text-purple-600' />
                  <span>{counts.total} unread notifications</span>
                </span>
              ) : null}
            </div>
          </div>

          {/* Notification List */}
          <div className='max-h-64 overflow-y-auto'>
            {(() => {
              // Filter notifications to show only system notifications (exclude business notifications)
              const businessNotificationTypes = [
                'NEW_RENTAL_REQUEST',
                'NEW_OFFER',
              ];
              const filteredNotifications = notifications.filter(
                n => !businessNotificationTypes.includes(n.type)
              );

              if (filteredNotifications.length === 0) {
                return (
                  <div className='px-4 py-8 text-center text-gray-500'>
                    <Bell className='w-8 h-8 mx-auto mb-2 text-gray-300' />
                    <p className='text-sm'>No notifications yet</p>
                    <p className='text-xs'>
                      You'll see updates here when they arrive
                    </p>
                  </div>
                );
              }

              return (
                <div className='divide-y divide-gray-100'>
                  {filteredNotifications.slice(0, 10).map(notification => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${
                        notification.isRead ? 'opacity-75' : ''
                      }`}
                    >
                      <div className='flex items-start space-x-3'>
                        <div className='flex-shrink-0 mt-0.5'>
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start justify-between'>
                            <p
                              className={`text-sm font-medium ${
                                notification.isRead
                                  ? 'text-gray-600'
                                  : 'text-gray-900'
                              }`}
                            >
                              {notification.title}
                            </p>

                            {!notification.isRead && (
                              <div className='flex-shrink-0 ml-2'>
                                <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                              </div>
                            )}
                          </div>

                          <p className='text-xs text-gray-600 mt-1 line-clamp-2'>
                            {notification.body}
                          </p>

                          <div className='flex items-center justify-between mt-2'>
                            <span className='text-xs text-gray-400'>
                              {formatTimeAgo(notification.createdAt)}
                            </span>

                            <div className='flex items-center space-x-2'>
                              {!notification.isRead && (
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className='text-xs text-blue-600 hover:text-blue-700 font-medium'
                                >
                                  Mark read
                                </button>
                              )}
                              <ExternalLink className='w-3 h-3 text-gray-400' />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Footer */}
          {(() => {
            // Filter notifications to show only system notifications (exclude business notifications)
            const businessNotificationTypes = [
              'NEW_RENTAL_REQUEST',
              'NEW_OFFER',
            ];
            const filteredNotifications = notifications.filter(
              n => !businessNotificationTypes.includes(n.type)
            );

            return filteredNotifications.length > 10 ? (
              <div className='px-4 py-3 border-t border-gray-200 bg-gray-50'>
                <button className='w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium'>
                  View all notifications
                </button>
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
};

export default NotificationHeader;
