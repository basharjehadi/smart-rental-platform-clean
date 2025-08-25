import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Handshake, 
  HelpCircle, 
  User, 
  MessageCircle,
  Menu,
  X,
  Building,
  Settings,
  Users
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useChatBadge } from '../contexts/ChatBadgeContext';
import NotificationBadge from './common/NotificationBadge';

const SidebarItem = ({ to, icon: Icon, children, isActive, isCollapsed, badge }) => {
  return (
    <Link
      to={to}
      className={`
        flex items-center font-medium rounded-lg transition-all duration-200 group relative overflow-hidden
        ${isCollapsed ? 'justify-center p-3 mx-2 my-1' : 'px-4 py-3 text-sm justify-start mx-2'}
        ${isActive 
          ? isCollapsed 
            ? 'bg-blue-600 text-white shadow-sm' 
            : 'bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-600'
          : isCollapsed
            ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }
      `}
      title={isCollapsed ? children : undefined}
    >
      <Icon className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4 mr-3'} transition-colors duration-200`} />
      {!isCollapsed && <span className="font-medium">{children}</span>}
      
      {/* Notification Badge */}
      {badge && (
        <div className={`${isCollapsed ? 'absolute -top-1 -right-1' : 'ml-auto'}`}>
          <NotificationBadge count={badge} />
        </div>
      )}
      
      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
          {children}
          <div className="absolute top-1/2 -left-1 w-2 h-2 bg-gray-900 transform -translate-y-1/2 rotate-45"></div>
        </div>
      )}
      
      {/* Active indicator for collapsed state */}
      {isActive && isCollapsed && (
        <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
      )}
    </Link>
  );
};

const LandlordSidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { counts } = useNotifications();
  const { unreadCount, offersUnread, rentalRequestsUnread } = useChatBadge();

  const menuItems = [
    {
      to: '/landlord-dashboard',
      icon: Home,
      label: 'Dashboard'
    },
    {
      to: '/landlord-my-tenants',
      icon: Users,
      label: 'My Tenants'
    },
    {
      to: '/tenant-rental-requests',
      icon: FileText,
      label: 'Rental Requests',
      badge: (rentalRequestsUnread || counts.rentalRequests) > 0 ? (rentalRequestsUnread || counts.rentalRequests) : null
    },
    {
      to: '/landlord-my-property',
      icon: Building,
      label: 'My Properties'
    },
    {
      to: '/messaging',
      icon: MessageCircle,
      label: 'Messages',
      badge: unreadCount > 0 ? unreadCount : null
    },
    {
      to: '/landlord-help-center',
      icon: HelpCircle,
      label: 'Help Center'
    },
    {
      to: '/landlord-profile',
      icon: User,
      label: 'Profile'
    }
  ];

  const toggleSidebar = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCollapsed(prevState => !prevState);
  };

  return (
    <div 
      className={`
        sidebar-modern flex flex-col transition-all duration-500 ease-in-out overflow-hidden
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Header with Logo and Toggle */}
      <div className={`border-b border-gray-100 ${isCollapsed ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center animate-fade-in-up">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900 font-poppins">RentPlatform</span>
                <p className="text-xs text-gray-500 font-medium">Landlord Portal</p>
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="rounded-xl hover:bg-gray-100 transition-all duration-200 p-2 z-10 relative hover:shadow-md"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            type="button"
          >
            {isCollapsed ? (
              <Menu className="w-6 h-6 text-gray-700" />
            ) : (
              <X className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className={`flex-1 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <div className={`${isCollapsed ? 'space-y-2' : 'space-y-3'}`}>
          {menuItems.map((item, index) => (
            <div key={item.to} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <SidebarItem
                to={item.to}
                icon={item.icon}
                isActive={location.pathname === item.to}
                isCollapsed={isCollapsed}
                badge={item.badge}
              >
                {item.label}
              </SidebarItem>
            </div>
          ))}
        </div>
        

      </nav>

      {/* Footer */}
      <div className={`border-t border-gray-100 ${isCollapsed ? 'p-4' : 'p-4'}`}>
        {!isCollapsed && (
          <div className="text-center">
            <p className="text-xs text-gray-500 font-medium">Landlord Portal v2.0</p>
            <p className="text-xs text-gray-400 mt-1">Professional Property Management</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandlordSidebar; 