import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Handshake, 
  HelpCircle, 
  User, 
  Menu,
  X
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, children, isActive, isCollapsed }) => {
  return (
    <Link
      to={to}
      className={`
        flex items-center font-medium rounded-lg transition-all duration-200 group relative
        ${isCollapsed ? 'justify-center p-3 mx-1 my-1' : 'px-4 py-3 text-sm justify-start'}
        ${isActive 
          ? isCollapsed 
            ? 'bg-blue-600 text-white shadow-lg' 
            : 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600'
          : isCollapsed
            ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }
      `}
      title={isCollapsed ? children : undefined}
    >
      <Icon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`} />
      {!isCollapsed && <span>{children}</span>}
      
      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
          {children}
          <div className="absolute top-1/2 -left-1 w-2 h-2 bg-gray-900 transform -translate-y-1/2 rotate-45"></div>
        </div>
      )}
    </Link>
  );
};

const TenantSidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      to: '/tenant-dashboard',
      icon: Home,
      label: 'Dashboard'
    },
    {
      to: '/tenant-request-for-landlord',
      icon: FileText,
      label: 'My Requests'
    },
    {
      to: '/my-offers',
      icon: Handshake,
      label: 'View Offers'
    },
    {
      to: '/tenant-help-center',
      icon: HelpCircle,
      label: 'Help Center'
    },
    {
      to: '/tenant-profile',
      icon: User,
      label: 'Profile'
    }
  ];

  const toggleSidebar = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Toggle clicked, current state:', isCollapsed);
    setIsCollapsed(prevState => {
      const newState = !prevState;
      console.log('Setting new state:', newState);
      return newState;
    });
  };

  return (
    <div 
      className={`
        bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-lg overflow-hidden
        ${isCollapsed ? 'w-20' : 'w-60'}
      `}
      onMouseEnter={(e) => {
        // Prevent any hover-based expansion
        e.stopPropagation();
      }}
    >
      {/* Header with Logo and Toggle */}
      <div className={`border-b border-gray-200 ${isCollapsed ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">RentPlatform</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            onMouseDown={(e) => e.preventDefault()}
            className={`rounded-lg hover:bg-gray-100 transition-colors p-2 z-10 relative`}
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
        <div className={`${isCollapsed ? 'space-y-3' : 'space-y-2'}`}>
          {menuItems.map((item) => (
            <SidebarItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              isActive={location.pathname === item.to}
              isCollapsed={isCollapsed}
            >
              {item.label}
            </SidebarItem>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default TenantSidebar; 