import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const MoveInIssueCommentThread = ({ 
  issue, 
  onCommentSubmit, 
  onStatusUpdate, 
  userRole = 'USER',
  showStatusUpdate = true,
  showCommentForm = true 
}) => {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileError, setFileError] = useState('');

  // Submit new comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      setCommentError('Comment cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      setCommentError('');
      setFileError('');
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('content', newComment.trim());
      
      // Add files if any are selected
      selectedFiles.forEach(file => {
        formData.append('evidence', file);
      });
      
      await onCommentSubmit(formData);
      setNewComment('');
      setSelectedFiles([]);
      toast.success('Comment submitted successfully');
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Update issue status
  const handleStatusUpdate = async (newStatus) => {
    try {
      await onStatusUpdate(newStatus);
      toast.success(`Issue status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update issue status');
    }
  };

  // Request admin review
  const handleRequestAdminReview = async () => {
    try {
      const response = await fetch(`/api/move-in-issues/${issue.id}/request-admin-review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          reason: 'Requesting administrator review of this issue' 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to request admin review');
      }

      const data = await response.json();
      
      // Add the admin review request comment to the issue
      if (onCommentSubmit) {
        await onCommentSubmit(data.comment.content);
      }
      
      toast.success('Admin review requested successfully');
    } catch (error) {
      console.error('Error requesting admin review:', error);
      toast.error('Failed to request admin review');
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setFileError('');
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || 
                         file.type.startsWith('video/') || 
                         file.type === 'application/pdf' ||
                         file.type === 'application/msword' ||
                         file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      
      if (!isValidType) {
        setFileError('Only images, videos, PDFs, and Word documents are allowed');
        return false;
      }
      
      if (!isValidSize) {
        setFileError('File size must be less than 50MB');
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length + selectedFiles.length > 5) {
      setFileError('Maximum 5 files allowed');
      return;
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  // Remove selected file
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'OPEN': 'bg-red-100 text-red-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'RESOLVED': 'bg-green-100 text-green-800',
      'CLOSED': 'bg-gray-100 text-gray-800',
      'ADMIN_APPROVED': 'bg-green-100 text-green-800',
      'ADMIN_REJECTED': 'bg-red-100 text-red-800',
      'ESCALATED': 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };



  // Get role color
  const getRoleColor = (role) => {
    const colors = {
      'TENANT': 'bg-blue-100 text-blue-800',
      'LANDLORD': 'bg-green-100 text-green-800',
      'ADMIN': 'bg-purple-100 text-purple-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (!issue) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Issue not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Issue Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{issue.title}</h2>
            <p className="text-gray-600 mt-1">{issue.description}</p>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(issue.status)}`}>
              {issue.status}
            </span>
          </div>
        </div>

        {/* Issue Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Reported:</span>
            <span className="ml-2 text-gray-900">{formatDate(issue.createdAt)}</span>
          </div>
          <div>
            <span className="text-gray-500">Last Updated:</span>
            <span className="ml-2 text-gray-900">{formatDate(issue.updatedAt)}</span>
          </div>
        </div>

        {/* Admin Decision Information */}
        {issue.adminDecision && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Admin Decision</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Decision:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  issue.adminDecision === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                  issue.adminDecision === 'REJECTED' ? 'bg-red-100 text-red-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {issue.adminDecision}
                </span>
              </div>
              <div>
                <span className="text-blue-600">Decided:</span>
                <span className="ml-2 text-blue-900">{formatDate(issue.adminDecisionAt)}</span>
              </div>
              {issue.refundAmount && (
                <div className="col-span-2">
                  <span className="text-blue-600">Refund Amount:</span>
                  <span className="ml-2 text-blue-900 font-medium">${issue.refundAmount}</span>
                </div>
              )}
              {issue.propertyHoldUntil && (
                <div className="col-span-2">
                  <span className="text-blue-600">Property Hold Until:</span>
                  <span className="ml-2 text-blue-900">{formatDate(issue.propertyHoldUntil)}</span>
                </div>
              )}
              {issue.adminNotes && (
                <div className="col-span-2">
                  <span className="text-blue-600">Admin Notes:</span>
                  <span className="ml-2 text-blue-900">{issue.adminNotes}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Update (if enabled) */}
        {showStatusUpdate && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Update Status</h3>
            
            {/* Role-based status controls */}
            {userRole === 'TENANT' && (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  Current status: <span className="font-medium">{issue.status}</span>
                </div>
                <div className="text-sm text-gray-500">
                  Tenants cannot change issue status. Use the button below to request admin review.
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleRequestAdminReview()}
                    className="px-4 py-2 text-sm font-medium bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                  >
                    Request Admin Review
                  </button>
                </div>
              </div>
            )}
            
            {userRole === 'LANDLORD' && (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  Current status: <span className="font-medium">{issue.status}</span>
                </div>
                <div className="text-sm text-gray-500">
                  Landlords can only mark OPEN issues as IN_PROGRESS. Only administrators can resolve or close issues.
                </div>
                {issue.status === 'OPEN' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStatusUpdate('IN_PROGRESS')}
                      className="px-4 py-2 text-sm font-medium bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                    >
                      Mark In Progress
                    </button>
                  </div>
                )}
                {issue.status === 'IN_PROGRESS' && (
                  <div className="text-sm text-gray-500">
                    Issue is in progress. Only administrators can resolve or close issues.
                  </div>
                )}
              </div>
            )}
            
            {userRole === 'ADMIN' && (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  Current status: <span className="font-medium">{issue.status}</span>
                </div>
                <div className="text-sm text-gray-500">
                  Administrators can resolve or close issues. These are final statuses that cannot be undone.
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {issue.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleStatusUpdate('RESOLVED')}
                      className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Resolve Issue
                    </button>
                  )}
                  {issue.status !== 'CLOSED' && (
                    <button
                      onClick={() => handleStatusUpdate('CLOSED')}
                      className="px-4 py-2 text-sm font-medium bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Close Issue
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Comments Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
          <p className="text-sm text-gray-600">
            {issue.comments?.length || 0} comment{issue.comments?.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Comments List */}
        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {issue.comments?.length > 0 ? (
            issue.comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                {/* Author Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    {comment.author?.profileImage ? (
                      <img
                        src={comment.author.profileImage}
                        alt={comment.author.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-700">
                        {comment.author?.firstName?.[0] || comment.author?.name?.[0] || 'U'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Comment Content */}
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {comment.author?.firstName && comment.author?.lastName
                            ? `${comment.author.firstName} ${comment.author.lastName}`
                            : comment.author?.name || 'Unknown User'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(comment.author?.role)}`}>
                          {comment.author?.role || 'USER'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-900">{comment.content}</p>
                    
                    {/* Render evidence if any */}
                    {comment.evidence && comment.evidence.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500 mb-2">
                          Evidence ({comment.evidence.length} file{comment.evidence.length !== 1 ? 's' : ''})
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {comment.evidence.map((filePath, idx) => {
                            const fileName = filePath.split('/').pop();
                            const isImage = comment.evidenceType === 'IMAGE';
                            const isVideo = comment.evidenceType === 'VIDEO';
                            
                            return (
                              <div key={idx} className="relative">
                                {isImage ? (
                                  <img
                                    src={`http://localhost:3001${filePath}`}
                                    alt={fileName}
                                    className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => window.open(`http://localhost:3001${filePath}`, '_blank')}
                                  />
                                ) : isVideo ? (
                                  <video
                                    src={`http://localhost:3001${filePath}`}
                                    className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                    controls
                                  />
                                ) : (
                                  <a
                                    href={`http://localhost:3001${filePath}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full h-20 bg-gray-100 rounded border flex items-center justify-center hover:bg-gray-200 transition-colors"
                                  >
                                    <div className="text-center">
                                      <svg className="w-8 h-8 mx-auto text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <span className="text-xs text-gray-600 truncate block px-1">{fileName}</span>
                                    </div>
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>No comments yet. Be the first to add a comment!</p>
            </div>
          )}
        </div>

        {/* Add Comment Form (if enabled) */}
        {showCommentForm && (
          <div className="px-6 py-4 border-t border-gray-200">
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                  Add a comment
                </label>
                <textarea
                  id="comment"
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    commentError ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Type your comment here..."
                  disabled={submitting}
                />
                {commentError && (
                  <p className="mt-1 text-sm text-red-600">{commentError}</p>
                )}
              </div>

              {/* File Upload Section */}
              <div>
                <label htmlFor="evidence" className="block text-sm font-medium text-gray-700 mb-2">
                  Add evidence (optional)
                </label>
                <div className="space-y-3">
                  {/* File Input */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      id="evidence"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      disabled={submitting}
                    />
                  </div>
                  
                  {/* File Error */}
                  {fileError && (
                    <p className="text-sm text-red-600">{fileError}</p>
                  )}
                  
                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Selected files ({selectedFiles.length}/5):
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            {file.type.startsWith('image/') ? (
                              <div className="relative">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={file.name}
                                  className="w-full h-20 object-cover rounded border"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <div className="relative">
                                <div className="w-full h-20 bg-gray-100 rounded border flex items-center justify-center">
                                  <div className="text-center">
                                    <svg className="w-8 h-8 mx-auto text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-xs text-gray-600 truncate block px-1">{file.name}</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Comment'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoveInIssueCommentThread;
