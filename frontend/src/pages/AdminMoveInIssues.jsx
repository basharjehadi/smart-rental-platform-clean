import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import MoveInIssueCommentThread from '../components/MoveInIssueCommentThread';
import AdminDecisionModal from '../components/AdminDecisionModal';

const AdminMoveInIssues = () => {
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionIssue, setDecisionIssue] = useState(null);
  const navigate = useNavigate();

  const loadIssues = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/move-in-issues');
      setIssues(res.data.issues || []);
    } catch (e) {
      console.error('Error loading issues:', e);
      setError('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  const handleCommentSubmit = async (content) => {
    if (!selectedIssue) return;
    
    try {
      const response = await api.post(`/api/move-in-issues/${selectedIssue.id}/comments`, { content });
      
      // Update the issue with the new comment
      setSelectedIssue(prevIssue => ({
        ...prevIssue,
        comments: [...prevIssue.comments, response.data.comment],
      }));
      
      // Also update the issue in the list
      setIssues(prevIssues => 
        prevIssues.map(issue => 
          issue.id === selectedIssue.id 
            ? { ...issue, comments: [...issue.comments, response.data.comment] }
            : issue
        )
      );
      
      return response.data.comment;
    } catch (error) {
      console.error('Error submitting comment:', error);
      throw error;
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedIssue) return;
    
    try {
      const response = await api.put(`/api/move-in-issues/${selectedIssue.id}/status`, { status: newStatus });
      
      // Update both the selected issue and the issue in the list
      const updatedIssue = response.data.issue;
      setSelectedIssue(updatedIssue);
      setIssues(prevIssues => 
        prevIssues.map(issue => 
          issue.id === selectedIssue.id ? updatedIssue : issue
        )
      );
      
      return updatedIssue;
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  };

  const handleAdminDecision = async (decisionData) => {
    try {
      const response = await api.post(`/api/move-in-issues/${decisionIssue.id}/admin-decision`, decisionData);
      
      // Update the issue in the list
      setIssues(prevIssues => 
        prevIssues.map(issue => 
          issue.id === decisionIssue.id 
            ? { ...issue, ...response.data.issue }
            : issue
        )
      );
      
      // Update the selected issue if it's the same one
      if (selectedIssue && selectedIssue.id === decisionIssue.id) {
        setSelectedIssue(response.data.issue);
      }
      
      // Refresh the issues list to get updated data
      loadIssues();
      
      toast.success(`Admin decision submitted successfully`);
    } catch (error) {
      console.error('Error submitting admin decision:', error);
      toast.error('Failed to submit admin decision');
      throw error;
    }
  };

  const openDecisionModal = (issue) => {
    setDecisionIssue(issue);
    setShowDecisionModal(true);
  };

  const handleIssueSelect = (issue) => {
    setSelectedIssue(issue);
  };

  const handleBackToList = () => {
    setSelectedIssue(null);
  };

  if (loading) return <div className='p-6'>Loading…</div>;
  if (error) return <div className='p-6 text-red-600'>{error}</div>;

  // If an issue is selected, show the comment thread
  if (selectedIssue) {
    return (
      <div className='p-6'>
        <div className='mb-6'>
          <button
            onClick={handleBackToList}
            className='flex items-center text-blue-600 hover:text-blue-800 transition-colors'
          >
            <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
            </svg>
            Back to Issues List
          </button>
        </div>
        
        <MoveInIssueCommentThread
          issue={selectedIssue}
          onCommentSubmit={handleCommentSubmit}
          onStatusUpdate={handleStatusUpdate}
          userRole="ADMIN"
          showStatusUpdate={true}
          showCommentForm={true}
        />
      </div>
    );
  }

  // Show issues list
  return (
    <div className='p-6'>
      <h1 className='text-2xl font-semibold mb-6'>Move-in Issues</h1>
      
      {issues.length === 0 ? (
        <div className='text-gray-600'>No move-in issues found.</div>
      ) : (
        <div className='space-y-4'>
          {issues.map(issue => (
            <div key={issue.id} className='p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center space-x-3 mb-2'>
                    <h3 className='font-medium text-gray-900'>{issue.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      issue.status === 'OPEN' ? 'bg-red-100 text-red-800' :
                      issue.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                      issue.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {issue.status}
                    </span>
                  </div>
                  
                  <p className='text-sm text-gray-600 mb-2'>{issue.description}</p>
                  
                  <div className='flex items-center space-x-4 text-xs text-gray-500'>
                    <span>Property: {issue.lease?.property?.name || 'Unknown'}</span>
                    <span>Tenant: {issue.lease?.tenantGroup?.members?.[0]?.user?.name || 'Unknown'}</span>
                    <span>Reported: {new Date(issue.createdAt).toLocaleDateString()}</span>
                    <span>{issue.comments?.length || 0} comments</span>
                  </div>
                </div>
                
                <div className='ml-4 flex space-x-2'>
                  <button
                    onClick={() => handleIssueSelect(issue)}
                    className='px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors'
                  >
                    View Details
                  </button>
                  
                  {/* Admin Decision Button - only show for issues without admin decisions */}
                  {!issue.adminDecision && (
                    <button
                      onClick={() => openDecisionModal(issue)}
                      className='px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors'
                    >
                      Make Decision
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Admin Decision Modal */}
      <AdminDecisionModal
        isOpen={showDecisionModal}
        onClose={() => setShowDecisionModal(false)}
        issue={decisionIssue}
        onDecisionSubmit={handleAdminDecision}
      />
    </div>
  );
};

export default AdminMoveInIssues;
