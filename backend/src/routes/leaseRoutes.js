import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import {
  updateLeaseStatus,
  handleEarlyMoveOut,
  handle24HourTermination,
  getLeaseStatusHistory,
  getLeaseByOffer,
} from '../controllers/leaseController.js';
import { listLeaseMoveInIssues } from '../controllers/moveInIssueController.js';
import { getActiveLeaseByOffer, getActiveLeaseByTenant } from '../controllers/leaseController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// 🏠 LEASE ROUTES - Status Management & Early Termination

// Update lease status (general status change)
router.patch('/:leaseId/status', updateLeaseStatus);

// Handle early move-out request (tenant-initiated)
router.post('/:leaseId/early-moveout', handleEarlyMoveOut);

// Handle 24-hour termination notice (landlord-initiated)
router.post('/:leaseId/terminate-24h', handle24HourTermination);

// Get lease status history and related reviews
router.get('/:leaseId/status-history', getLeaseStatusHistory);

// List move-in issues for a specific lease
router.get('/:leaseId/move-in-issues', listLeaseMoveInIssues);

// Lookup lease by offer (used by landlord UI); safe read-only
router.get('/by-offer/:offerId', getLeaseByOffer);
router.get('/active-by-offer/:offerId', getActiveLeaseByOffer);
router.get('/active-by-tenant/:tenantId', getActiveLeaseByTenant);

export default router;
