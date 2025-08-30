import express from 'express';
import tenantGroupController from '../controllers/tenantGroupController.js';
import verifyToken from '../middlewares/verifyToken.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

/**
 * @route   POST /api/tenant-groups
 * @desc    Create a new tenant group
 * @access  Private (authenticated users)
 */
router.post('/', tenantGroupController.createTenantGroup);

/**
 * @route   GET /api/tenant-groups/my-group
 * @desc    Get current user's tenant group
 * @access  Private (authenticated users)
 */
router.get('/my-group', tenantGroupController.getMyTenantGroup);

/**
 * @route   GET /api/tenant-groups/my-invitations
 * @desc    Get pending invitations for current user
 * @access  Private (authenticated users)
 */
router.get('/my-invitations', tenantGroupController.getMyInvitations);

/**
 * @route   POST /api/tenant-groups/accept-invitation
 * @desc    Accept invitation by token
 * @access  Private (authenticated users)
 */
router.post(
  '/accept-invitation',
  tenantGroupController.acceptInvitationByToken
);

/**
 * @route   POST /api/tenant-groups/decline-invitation
 * @desc    Decline invitation by token
 * @access  Private (authenticated users)
 */
router.post(
  '/decline-invitation',
  tenantGroupController.declineInvitationByToken
);

/**
 * @route   POST /api/tenant-groups/:tenantGroupId/invite
 * @desc    Invite user to tenant group by email
 * @access  Private (group members)
 */
router.post('/:tenantGroupId/invite', tenantGroupController.inviteUserToGroup);

/**
 * @route   POST /api/tenant-groups/:tenantGroupId/accept
 * @desc    Accept invitation to join tenant group (legacy by group id)
 * @access  Private (authenticated users)
 */
router.post(
  '/:tenantGroupId/accept',
  tenantGroupController.acceptGroupInvitation
);

/**
 * @route   GET /api/tenant-groups/:tenantGroupId/members
 * @desc    View members of a tenant group
 * @access  Private (group members)
 */
router.get('/:tenantGroupId/members', tenantGroupController.getGroupMembers);

/**
 * @route   PUT /api/tenant-groups/:tenantGroupId
 * @desc    Update tenant group details
 * @access  Private (primary members only)
 */
router.put('/:tenantGroupId', tenantGroupController.updateTenantGroup);

/**
 * @route   DELETE /api/tenant-groups/:tenantGroupId/leave
 * @desc    Leave tenant group
 * @access  Private (group members)
 */
router.delete('/:tenantGroupId/leave', tenantGroupController.leaveTenantGroup);

/**
 * @route   POST /api/tenant-groups/:tenantGroupId/transfer-ownership
 * @desc    Transfer primary membership to another member
 * @access  Private (primary members only)
 */
router.post(
  '/:tenantGroupId/transfer-ownership',
  tenantGroupController.transferPrimaryMembership
);

export default router;
