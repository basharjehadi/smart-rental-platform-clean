import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const ProfileCompletionGuard = ({ children, required = true }) => {
  const [profileStatus, setProfileStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const { api } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const checkProfileStatus = async () => {
      try {
        const response = await api.get('/users/profile/status');
        setProfileStatus(response.data);
        
        // If profile is incomplete and this route requires complete profile
        if (required && !response.data.isComplete) {
          // Redirect to profile page with message
          navigate('/profile', { 
            state: { 
              message: 'Please complete your profile information before proceeding',
              missingFields: response.data.missingFields 
            } 
          });
        }
      } catch (error) {
        console.error('Error checking profile status:', error);
        // If there's an error, allow access (fail open)
        setProfileStatus({ isComplete: true });
      } finally {
        setLoading(false);
      }
    };

    checkProfileStatus();
  }, [api, navigate, required]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking profile status...</p>
        </div>
      </div>
    );
  }

  // If profile is complete or not required, render children
  if (!required || profileStatus?.isComplete) {
    return children;
  }

  // This should not be reached due to redirect, but just in case
  return null;
};

export default ProfileCompletionGuard; 