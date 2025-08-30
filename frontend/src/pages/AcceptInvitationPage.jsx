import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

const AcceptInvitationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending'); // 'pending' | 'success' | 'error'
  const [message, setMessage] = useState('Validating your invitation...');

  useEffect(() => {
    const accept = async () => {
      try {
        const res = await api.post('/tenant-groups/accept-invitation', {
          token,
        });
        setStatus('success');
        setMessage('Invitation accepted! Redirecting to your group...');
        setTimeout(() => navigate('/tenant-group-management'), 1200);
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          'Invalid or expired invitation token.';
        setStatus('error');
        setMessage(msg);
      }
    };
    if (token) accept();
  }, [token, navigate]);

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center px-4'>
      <div
        className={`max-w-md w-full rounded-lg shadow-sm border p-6 ${status === 'success' ? 'border-green-200 bg-green-50' : status === 'error' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}
      >
        <h1 className='text-xl font-semibold mb-2'>Accept Invitation</h1>
        <p className='text-sm text-gray-700'>{message}</p>
        {status === 'error' && (
          <div className='mt-4 flex space-x-2'>
            <button
              onClick={() => navigate('/tenant-dashboard')}
              className='px-4 py-2 rounded bg-gray-200 text-gray-800 text-sm'
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/tenant-group-management')}
              className='px-4 py-2 rounded bg-blue-600 text-white text-sm'
            >
              Open Group
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptInvitationPage;
