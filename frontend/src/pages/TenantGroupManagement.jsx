import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, Plus, Mail, UserPlus, Trash2, Crown, CheckCircle, XCircle } from 'lucide-react';

const TenantGroupManagement = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  
  const [myGroup, setMyGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Group creation state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  
  // Invitation state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    fetchMyGroup();
  }, []);

  const fetchMyGroup = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await api.get('/tenant-groups/my-group');
      const group = response.data?.tenantGroup || response.data?.data?.tenantGroup;
      if (group) setMyGroup(group);
      else setMyGroup(null);
    } catch (error) {
      console.error('Error fetching group:', error);
      if (error.response?.status === 404) {
        // No group yet – this is expected for new tenants
        setMyGroup(null);
      } else {
        setError(error.response?.data?.message || 'Failed to fetch your group information');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      setCreatingGroup(true);
      setError('');
      
      const response = await api.post('/tenant-groups', { name: groupName.trim() });
      
      if (response.status === 201) {
        setSuccess('Group created successfully!');
        setGroupName('');
        setShowCreateForm(false);
        fetchMyGroup(); // Refresh group data
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error creating group:', error);
      setError(error.response?.data?.message || 'Failed to create group');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setSendingInvite(true);
      setError('');
      
      const response = await api.post(`/tenant-groups/${myGroup.id}/invite`, {
        email: inviteEmail.trim(),
        message: inviteMessage.trim()
      });
      
      if (response.status === 200) {
        setSuccess('Invitation sent successfully!');
        setInviteEmail('');
        setInviteMessage('');
        setShowInviteForm(false);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      setError(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member from the group?')) {
      return;
    }

    try {
      // Note: This endpoint would need to be implemented in the backend
      await api.delete(`/tenant-groups/${myGroup.id}/members/${memberId}`);
      setSuccess('Member removed successfully!');
      fetchMyGroup(); // Refresh group data
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error removing member:', error);
      setError('Failed to remove member');
    }
  };

  const handleTransferOwnership = async (memberId) => {
    if (!window.confirm('Are you sure you want to transfer ownership to this member? This action cannot be undone.')) {
      return;
    }

    try {
      await api.post(`/tenant-groups/${myGroup.id}/transfer-ownership`, {
        newPrimaryMemberId: memberId
      });
      setSuccess('Ownership transferred successfully!');
      fetchMyGroup(); // Refresh group data
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error transferring ownership:', error);
      setError('Failed to transfer ownership');
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/tenant-groups/${myGroup.id}/leave`);
      setSuccess('You have left the group successfully!');
      setMyGroup(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error leaving group:', error);
      setError('Failed to leave group');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your group information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Users className="w-12 h-12 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Tenant Group Management</h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Create and manage your tenant group for shared rentals
            </p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              {success}
            </div>
          </div>
        )}
        
        {error && myGroup && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {!myGroup ? (
          /* No Group - Show Create Form */
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Create Your Tenant Group
              </h2>
              <p className="text-gray-600">
                Start a group to rent properties together with friends or family
              </p>
            </div>

            <form onSubmit={handleCreateGroup} className="max-w-md mx-auto">
              <div className="mb-6">
                <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Friends Group, Family Renters"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={creatingGroup}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {creatingGroup ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Group...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Group
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Has Group - Show Group Details */
          <div className="space-y-6">
            {/* Group Info Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{myGroup.name}</h2>
                  <p className="text-gray-600">Created on {new Date(myGroup.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowInviteForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Member
                  </button>
                  <button
                    onClick={handleLeaveGroup}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                  >
                    Leave Group
                  </button>
                </div>
              </div>

              {/* Members List */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Group Members</h3>
                <div className="space-y-3">
                  {myGroup.members?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {member.user.profileImage ? (
                          <img
                            src={member.user.profileImage}
                            alt={member.user.name || member.user.email}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {member.user.name?.charAt(0) || member.user.email?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.user.name || 'Unnamed User'}
                          </p>
                          <p className="text-sm text-gray-600">{member.user.email}</p>
                        </div>
                        {member.isPrimary && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Crown className="w-3 h-3 mr-1" />
                            Primary
                          </span>
                        )}
                      </div>
                      
                      {!member.isPrimary && myGroup.members?.find(m => m.userId === user.id)?.isPrimary && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleTransferOwnership(member.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Make Primary
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/request-form')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-center group"
                >
                  <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-blue-600" />
                  <p className="font-medium text-gray-900">Create Rental Request</p>
                  <p className="text-sm text-gray-600">Start looking for properties</p>
                </button>
                
                <button
                  onClick={() => setShowInviteForm(true)}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-center group"
                >
                  <Mail className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-blue-600" />
                  <p className="font-medium text-gray-900">Invite More Members</p>
                  <p className="text-sm text-gray-600">Grow your group</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Form Modal */}
        {showInviteForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Invite Member</h3>
                <button
                  onClick={() => setShowInviteForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="inviteEmail"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="friend@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="inviteMessage" className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Message (Optional)
                  </label>
                  <textarea
                    id="inviteMessage"
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Hey! I'd like you to join our tenant group..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInviteForm(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 font-medium rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingInvite}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {sendingInvite ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Invitation
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantGroupManagement;
