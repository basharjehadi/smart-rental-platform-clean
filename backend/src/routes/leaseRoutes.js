import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import {
  updateLeaseStatus,
  handleEarlyMoveOut,
  handle24HourTermination,
  getLeaseStatusHistory
} from '../controllers/leaseController.js';

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

export default router;


