import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ContractManagementPage = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [signingContract, setSigningContract] = useState(null);
  const [signature, setSignature] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  const { user, api } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch contracts based on user role
      if (user?.role === 'TENANT') {
        const response = await api.get('/contracts/my-contracts');
        setContracts(response.data.contracts || []);
      } else if (user?.role === 'LANDLORD') {
        const response = await api.get('/contracts/landlord-contracts');
        setContracts(response.data.contracts || []);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setError('Failed to fetch contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContract = async rentalRequestId => {
    try {
      setLoading(true);
      setError('');

      const response = await api.post(`/contracts/generate/${rentalRequestId}`);

      setSuccess('Contract generated successfully!');
      setTimeout(() => setSuccess(''), 3000);

      // Refresh contracts list
      await fetchContracts();
    } catch (error) {
      console.error('Error generating contract:', error);
      setError(error.response?.data?.error || 'Failed to generate contract');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewContract = async contractId => {
    try {
      setLoading(true);
      const response = await api.get(`/contracts/preview/${contractId}`);

      // Open contract preview in new window
      const newWindow = window.open('', '_blank');
      newWindow.document.write(response.data.html);
      newWindow.document.close();
    } catch (error) {
      console.error('Error previewing contract:', error);
      setError('Failed to preview contract');
    } finally {
      setLoading(false);
    }
  };

  const handleSignContract = async contractId => {
    try {
      setSigningContract(contractId);
      setShowSignatureModal(true);
    } catch (error) {
      console.error('Error preparing contract signing:', error);
      setError('Failed to prepare contract signing');
    }
  };

  const handleConfirmSignature = async () => {
    try {
      if (!signature.trim()) {
        setError('Please provide a signature');
        return;
      }

      setLoading(true);
      const response = await api.post(`/contracts/sign/${signingContract}`, {
        signature: signature,
      });

      setSuccess('Contract signed successfully!');
      setShowSignatureModal(false);
      setSignature('');
      setSigningContract(null);

      // Refresh contracts list
      await fetchContracts();
    } catch (error) {
      console.error('Error signing contract:', error);
      setError(error.response?.data?.error || 'Failed to sign contract');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadContract = async contractId => {
    try {
      setLoading(true);
      const response = await api.get(`/contracts/download/${contractId}`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contract-${contractId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading contract:', error);
      setError('Failed to download contract');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = status => {
    const statusConfig = {
      GENERATED: { color: 'bg-blue-100 text-blue-800', text: 'Generated' },
      SIGNED: { color: 'bg-green-100 text-green-800', text: 'Signed' },
      COMPLETED: { color: 'bg-purple-100 text-purple-800', text: 'Completed' },
      EXPIRED: { color: 'bg-red-100 text-red-800', text: 'Expired' },
    };

    const config = statusConfig[status] || {
      color: 'bg-gray-100 text-gray-800',
      text: status,
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  const getActionButton = contract => {
    if (user?.role === 'LANDLORD') {
      if (contract.status === 'GENERATED') {
        return (
          <button
            onClick={() => handlePreviewContract(contract.id)}
            className='px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm'
          >
            Preview
          </button>
        );
      }
    } else if (user?.role === 'TENANT') {
      if (contract.status === 'GENERATED') {
        return (
          <div className='flex space-x-2'>
            <button
              onClick={() => handlePreviewContract(contract.id)}
              className='px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm'
            >
              Preview
            </button>
            <button
              onClick={() => handleSignContract(contract.id)}
              className='px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm'
            >
              Sign
            </button>
          </div>
        );
      } else if (contract.status === 'SIGNED') {
        return (
          <button
            onClick={() => handleDownloadContract(contract.id)}
            className='px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm'
          >
            Download
          </button>
        );
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-100 py-8'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
            <p className='mt-4 text-gray-600'>Loading contracts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-100 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                📋 Contract Management
              </h1>
              <p className='mt-2 text-gray-600'>
                Manage your rental contracts and agreements
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className='px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors'
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className='mb-6 p-4 bg-green-50 border border-green-200 rounded-lg'>
            <div className='flex'>
              <svg
                className='w-5 h-5 text-green-400 mr-3'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                  clipRule='evenodd'
                />
              </svg>
              <span className='text-green-800'>{success}</span>
            </div>
          </div>
        )}

        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <div className='flex'>
              <svg
                className='w-5 h-5 text-red-400 mr-3'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                />
              </svg>
              <span className='text-red-800'>{error}</span>
            </div>
          </div>
        )}

        {/* Contracts List */}
        <div className='bg-white shadow overflow-hidden sm:rounded-md'>
          {contracts.length === 0 ? (
            <div className='text-center py-12'>
              <div className='text-gray-400 text-4xl mb-4'>📄</div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No Contracts Found
              </h3>
              <p className='text-gray-600'>
                {user?.role === 'TENANT'
                  ? "You don't have any contracts yet. Accept an offer to generate a contract."
                  : 'No contracts have been generated for your properties yet.'}
              </p>
            </div>
          ) : (
            <ul className='divide-y divide-gray-200'>
              {contracts.map(contract => (
                <li key={contract.id} className='px-6 py-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h3 className='text-lg font-medium text-gray-900'>
                            Contract #{contract.contractNumber}
                          </h3>
                          <p className='text-sm text-gray-600 mt-1'>
                            {contract.rentalRequest?.title ||
                              'Rental Agreement'}
                          </p>
                          <div className='flex items-center mt-2 space-x-4 text-sm text-gray-500'>
                            <span>
                              Created: {formatDate(contract.createdAt)}
                            </span>
                            {contract.signedAt && (
                              <span>
                                Signed: {formatDate(contract.signedAt)}
                              </span>
                            )}
                            <span>
                              Status: {getStatusBadge(contract.status)}
                            </span>
                          </div>
                        </div>
                        <div className='flex items-center space-x-3'>
                          {getActionButton(contract)}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Signature Modal */}
        {showSignatureModal && (
          <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
            <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
              <div className='mt-3'>
                <h3 className='text-lg font-medium text-gray-900 mb-4'>
                  Sign Contract
                </h3>
                <div className='mb-4'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Digital Signature
                  </label>
                  <textarea
                    value={signature}
                    onChange={e => setSignature(e.target.value)}
                    placeholder='Type your full name as your digital signature...'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    rows='3'
                  />
                </div>
                <div className='flex justify-end space-x-3'>
                  <button
                    onClick={() => {
                      setShowSignatureModal(false);
                      setSignature('');
                      setSigningContract(null);
                    }}
                    className='px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSignature}
                    disabled={!signature.trim() || loading}
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50'
                  >
                    {loading ? 'Signing...' : 'Sign Contract'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractManagementPage;
