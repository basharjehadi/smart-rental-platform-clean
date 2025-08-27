import express from 'express';
import organizationController from '../controllers/organizationController.js';
import verifyToken from '../middlewares/verifyToken.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

/**
 * @route   POST /api/organizations/upgrade
 * @desc    Upgrade user account to business account
 * @access  Private (authenticated users)
 */
router.post('/upgrade', organizationController.upgradeToBusinessAccount);

/**
 * @route   GET /api/organizations/my-organization
 * @desc    Get current user's organization details
 * @access  Private (authenticated users)
 */
router.get('/my-organization', organizationController.getMyOrganization);

/**
 * @route   PUT /api/organizations/:organizationId
 * @desc    Update organization details
 * @access  Private (organization owners and admins)
 */
router.put('/:organizationId', organizationController.updateOrganization);

/**
 * @route   POST /api/organizations/:organizationId/members
 * @desc    Add member to organization
 * @access  Private (organization owners and admins)
 */
router.post('/:organizationId/members', organizationController.addOrganizationMember);

/**
 * @route   DELETE /api/organizations/:organizationId/members/:memberUserId
 * @desc    Remove member from organization
 * @access  Private (organization owners and admins)
 */
router.delete('/:organizationId/members/:memberUserId', organizationController.removeOrganizationMember);

/**
 * @route   GET /api/organizations
 * @desc    Get all organizations (admin only)
 * @access  Private (admin users only)
 */
router.get('/', requireAdmin, organizationController.getAllOrganizations);

export default router;
