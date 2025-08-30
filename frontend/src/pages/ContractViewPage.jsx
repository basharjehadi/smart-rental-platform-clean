import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft,
  Download,
  FileText,
  User,
  Building,
  Calendar,
  DollarSign,
} from 'lucide-react';

const ContractViewPage = () => {
  const { contractId } = useParams();
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContractDetails();
  }, [contractId]);

  const fetchContractDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/contracts/${contractId}`);

      if (response.data.success) {
        setContract(response.data.contract);
      } else {
        setError('Failed to fetch contract details');
      }
    } catch (error) {
      console.error('Error fetching contract details:', error);
      setError('Failed to fetch contract details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadContract = async () => {
    try {
      const response = await api.get(`/contracts/download/${contractId}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `rental-contract-${contract.contractNumber}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading contract:', error);
      alert('Failed to download contract');
    }
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading contract...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <FileText className='w-16 h-16 text-red-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            Contract Not Found
          </h3>
          <p className='text-gray-600 mb-6'>
            {error || 'Contract details not available'}
          </p>
          <button
            onClick={() => navigate(-1)}
            className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200'
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200 px-6 py-4'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <button
                onClick={() => navigate(-1)}
                className='p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200'
              >
                <ArrowLeft className='w-5 h-5' />
              </button>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>
                  Rental Contract
                </h1>
                <p className='text-gray-600'>
                  Contract #{contract.contractNumber}
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadContract}
              className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              <Download className='w-4 h-4 mr-2' />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-7xl mx-auto px-6 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Contract Details */}
          <div className='lg:col-span-2'>
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-6'>
                Contract Information
              </h2>

              <div className='space-y-6'>
                {/* Contract Status */}
                <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
                  <div>
                    <h3 className='font-medium text-gray-900'>Status</h3>
                    <p className='text-sm text-gray-600'>Contract Status</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      contract.status === 'SIGNED'
                        ? 'bg-green-100 text-green-800'
                        : contract.status === 'GENERATED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {contract.status}
                  </span>
                </div>

                {/* Contract Dates */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='p-4 bg-gray-50 rounded-lg'>
                    <div className='flex items-center space-x-3'>
                      <Calendar className='w-5 h-5 text-gray-400' />
                      <div>
                        <h3 className='font-medium text-gray-900'>Created</h3>
                        <p className='text-sm text-gray-600'>
                          {formatDate(contract.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {contract.signedAt && (
                    <div className='p-4 bg-gray-50 rounded-lg'>
                      <div className='flex items-center space-x-3'>
                        <Calendar className='w-5 h-5 text-gray-400' />
                        <div>
                          <h3 className='font-medium text-gray-900'>Signed</h3>
                          <p className='text-sm text-gray-600'>
                            {formatDate(contract.signedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contract Number */}
                <div className='p-4 bg-blue-50 rounded-lg'>
                  <div className='flex items-center space-x-3'>
                    <FileText className='w-5 h-5 text-blue-400' />
                    <div>
                      <h3 className='font-medium text-blue-900'>
                        Contract Number
                      </h3>
                      <p className='text-sm text-blue-700'>
                        {contract.contractNumber}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Quick Actions */}
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Quick Actions
              </h3>
              <div className='space-y-3'>
                <button
                  onClick={handleDownloadContract}
                  className='w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                >
                  <Download className='w-4 h-4 mr-2' />
                  Download Contract
                </button>
              </div>
            </div>

            {/* Contract Summary */}
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Contract Summary
              </h3>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Status</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      contract.status === 'SIGNED'
                        ? 'bg-green-100 text-green-800'
                        : contract.status === 'GENERATED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {contract.status}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Created</span>
                  <span className='text-sm font-medium text-gray-900'>
                    {formatDate(contract.createdAt)}
                  </span>
                </div>
                {contract.signedAt && (
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>Signed</span>
                    <span className='text-sm font-medium text-gray-900'>
                      {formatDate(contract.signedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractViewPage;
