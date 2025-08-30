import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import MoveInIssueCommentThread from '../components/MoveInIssueCommentThread';

const TenantMoveInIssuePage = () => {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch issue details
  useEffect(() => {
    const fetchIssue = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/move-in-issues/${issueId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 403) {
            toast.error('You are not authorized to view this issue');
            navigate('/tenant-dashboard');
            return;
          }
          if (response.status === 404) {
            toast.error('Issue not found');
            navigate('/tenant-dashboard');
            return;
          }
          throw new Error('Failed to fetch issue');
        }

        const data = await response.json();
        setIssue(data.issue);
      } catch (error) {
        console.error('Error fetching issue:', error);
        toast.error('Failed to load issue details');
        navigate('/tenant-dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (issueId) {
      fetchIssue();
    }
  }, [issueId, navigate]);

  // Submit new comment
  const handleCommentSubmit = async (content) => {
    try {
      const response = await fetch(`/api/move-in-issues/${issueId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit comment');
      }

      const data = await response.json();
      
      // Add new comment to the issue
      setIssue(prevIssue => ({
        ...prevIssue,
        comments: [...prevIssue.comments, data.comment],
      }));

      return data.comment;
    } catch (error) {
      console.error('Error submitting comment:', error);
      throw error;
    }
  };

  // Update issue status (tenants can update their own issues)
  const handleStatusUpdate = async (newStatus) => {
    try {
      const response = await fetch(`/api/move-in-issues/${issueId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const data = await response.json();
      setIssue(data.issue);
      return data.issue;
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading issue details...</p>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Issue not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/tenant-dashboard')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Move-In Issue</h1>
              <p className="text-gray-600">
                {issue.lease?.property?.name || 'Property'} • {issue.lease?.tenantGroup?.members?.[0]?.user?.name || 'Tenant'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MoveInIssueCommentThread
          issue={issue}
          onCommentSubmit={handleCommentSubmit}
          onStatusUpdate={handleStatusUpdate}
          userRole="TENANT"
          showStatusUpdate={true}
          showCommentForm={true}
        />
      </div>
    </div>
  );
};

export default TenantMoveInIssuePage;
