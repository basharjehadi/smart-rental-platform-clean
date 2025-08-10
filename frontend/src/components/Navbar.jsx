import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import NotificationHeader from './common/NotificationHeader';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              to={user ? "/dashboard" : "/"} 
              className="flex-shrink-0 flex items-center"
            >
              <span className="text-xl font-bold text-blue-600">Smart Rental</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            
            {user ? (
              <>
                <div className="hidden md:flex items-center space-x-4">
                  <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    {t('navigation.dashboard')}
                  </Link>
                  
                  {user.role === 'TENANT' && (
                    <>
                      <Link to="/post-request" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                        {t('navigation.postRequest')}
                      </Link>
                      <Link to="/my-offers" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                        {t('navigation.myOffers')}
                      </Link>
                      <Link to="/my-rents" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                        {t('navigation.myRents')}
                      </Link>
                    </>
                  )}
                  
                  <Link to="/profile-view" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    My Profile
                  </Link>
                  
                  {user.role === 'LANDLORD' && (
                    <>
                      <Link to="/landlord-dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                        Dashboard
                      </Link>
                      <Link to="/landlord-my-property" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                        My Properties
                      </Link>
                    </>
                  )}
                  
                  {user.role === 'ADMIN' && (
                    <Link to="/admin" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                      {t('navigation.admin')}
                    </Link>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  {/* Notification Header */}
                  <NotificationHeader />
                  
                  <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {t('navigation.logout')}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  {t('navigation.login')}
                </Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                  {t('navigation.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 

