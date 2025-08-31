import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LandlordSidebar from '../components/LandlordSidebar';
import NotificationHeader from '../components/common/NotificationHeader';

const LandlordPropertyIssuesPage = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { user, logout, api } = useAuth();
  
  const [property, setProperty] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPropertyAndIssues();
  }, [propertyId]);

  const fetchPropertyAndIssues = async () => {
    try {
      setLoading(true);
      
      // Fetch property details
      const propertyResponse = await api.get(`/properties/${propertyId}`);
      if (propertyResponse.data.success) {
        setProperty(propertyResponse.data.property);
      }

      // Fetch move-in issues for this property
      const issuesResponse = await api.get(`/properties/${propertyId}/move-in-issues`);
      if (issuesResponse.data.success) {
        setIssues(issuesResponse.data.issues || []);
      }
    } catch (error) {
      console.error('Error fetching property issues:', error);
      setError('Failed to load property issues');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'ESCALATED':
        return 'bg-purple-100 text-purple-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    return status.replace('_', ' ');
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <LandlordSidebar />
        <div className='ml-64 p-6'>
          <div className='flex justify-center items-center h-64'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <LandlordSidebar />
        <div className='ml-64 p-6'>
          <div className='bg-white rounded-lg shadow p-6 text-center'>
            <div className='text-red-500 text-xl mb-4'>⚠️</div>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>Error Loading Issues</h2>
            <p className='text-gray-600 mb-4'>{error}</p>
            <button
              onClick={fetchPropertyAndIssues}
              className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <LandlordSidebar />
      <div className='ml-64'>
        <NotificationHeader user={user} onLogout={logout} />
        
        <main className='p-6'>
          <div className='max-w-7xl mx-auto'>
            {/* Header */}
            <div className='mb-6'>
              <button
                onClick={() => navigate('/landlord-my-property')}
                className='flex items-center text-gray-600 hover:text-gray-900 mb-4'
              >
                <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                </svg>
                Back to My Properties
              </button>
              
              <div className='flex items-center justify-between'>
                <div>
                  <h1 className='text-3xl font-bold text-gray-900'>
                    Move-In Issues
                  </h1>
                  {property && (
                    <p className='text-gray-600 mt-2'>
                      {property.name} • {property.address}
                    </p>
                  )}
                </div>
                
                <div className='text-right'>
                  <div className='text-2xl font-bold text-red-600'>
                    {issues.length} Issue{issues.length !== 1 ? 's' : ''}
                  </div>
                  <div className='text-sm text-gray-500'>
                    {issues.filter(i => i.status === 'OPEN' || i.status === 'ESCALATED').length} urgent
                  </div>
                </div>
              </div>
            </div>

            {/* Issues List */}
            {issues.length === 0 ? (
              <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center'>
                <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <svg className='w-8 h-8 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                </div>
                <h3 className='text-xl font-semibold text-gray-900 mb-2'>No Move-In Issues</h3>
                <p className='text-gray-600'>This property has no reported move-in issues. Great job!</p>
              </div>
            ) : (
              <div className='space-y-4'>
                {issues.map((issue) => (
                  <div key={issue.id} className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <div className='flex items-center space-x-3 mb-3'>
                          <h3 className='text-lg font-semibold text-gray-900'>{issue.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                            {getStatusText(issue.status)}
                          </span>
                        </div>
                        
                        <p className='text-gray-600 mb-3'>{issue.description}</p>
                        
                        <div className='flex items-center space-x-4 text-sm text-gray-500'>
                          <span>
                            Tenant: {issue.lease?.tenantGroup?.members?.[0]?.user?.firstName} {issue.lease?.tenantGroup?.members?.[0]?.user?.lastName}
                          </span>
                          <span>•</span>
                          <span>Created: {new Date(issue.createdAt).toLocaleDateString()}</span>
                          {issue.comments?.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{issue.comments.length} comment{issue.comments.length > 1 ? 's' : ''}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => navigate(`/landlord/issue/${issue.id}`)}
                        className='ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors'
                      >
                        View Details
                      </button>
                    </div>
                    
                    {/* Latest Comments Preview */}
                    {issue.comments?.length > 0 && (
                      <div className='border-t border-gray-200 pt-4 mt-4'>
                        <h4 className='text-sm font-medium text-gray-900 mb-2'>Latest Activity</h4>
                        <div className='space-y-2'>
                          {issue.comments.slice(0, 2).map((comment) => (
                            <div key={comment.id} className='flex items-start space-x-3 p-3 bg-gray-50 rounded-lg'>
                              <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0'>
                                <span className='text-xs font-medium text-blue-600'>
                                  {comment.author?.firstName?.[0] || comment.author?.name?.[0] || '?'}
                                </span>
                              </div>
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center space-x-2 mb-1'>
                                  <span className='text-sm font-medium text-gray-900'>
                                    {comment.author?.firstName} {comment.author?.lastName || comment.author?.name}
                                  </span>
                                  <span className='text-xs text-gray-500'>
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className='text-sm text-gray-600'>{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {issue.comments.length > 2 && (
                          <p className='text-xs text-gray-500 mt-2'>
                            +{issue.comments.length - 2} more comment{issue.comments.length - 2 > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LandlordPropertyIssuesPage;
