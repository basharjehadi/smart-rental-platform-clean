import { Router } from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import upload from '../middlewares/uploadMiddleware.js';
import {
  getMoveInStatus,
  verifyMoveInSuccess,
  reportMoveInIssue,
  getLatestPaidOfferStatusForProperty,
  adminApproveCancellation,
  adminRejectCancellation,
} from '../controllers/moveInVerificationController.js';
import {
  runMoveInReminders,
  runMoveInFinalization,
} from '../services/moveInVerificationService.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';

const router = Router();

// Tenant and landlord must be authenticated
router.get('/offers/:id/status', verifyToken, getMoveInStatus);
router.post('/offers/:id/verify', verifyToken, verifyMoveInSuccess);
router.post(
  '/offers/:id/report-issue',
  verifyToken,
  upload.array('moveInEvidence', 10),
  reportMoveInIssue
);
router.get(
  '/property/:propertyId/latest-paid-status',
  verifyToken,
  getLatestPaidOfferStatusForProperty
);

export default router;

// Admin/testing endpoints (guard behind auth): manually trigger scheduler steps
router.post('/_run/reminders', verifyToken, async (req, res) => {
  await runMoveInReminders();
  res.json({ success: true });
});

router.post('/_run/finalize', verifyToken, async (req, res) => {
  await runMoveInFinalization();
  res.json({ success: true });
});

// Admin review endpoints
router.post(
  '/offers/:id/admin/approve',
  verifyToken,
  requireAdmin,
  adminApproveCancellation
);
router.post(
  '/offers/:id/admin/reject',
  verifyToken,
  requireAdmin,
  adminRejectCancellation
);
