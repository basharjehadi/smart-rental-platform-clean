import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const TenantDashboardRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'TENANT') {
      navigate('/tenant-dashboard');
    } else if (user?.role === 'LANDLORD') {
      navigate('/landlord-dashboard');
    } else if (user?.role === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/tenant-dashboard');
    }
  }, [user, navigate]);

  return (
    <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
        <p className='mt-4 text-gray-600'>Redirecting...</p>
      </div>
    </div>
  );
};

export default TenantDashboardRedirect;
