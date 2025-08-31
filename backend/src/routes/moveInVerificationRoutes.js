import { Router } from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import upload from '../middlewares/uploadMiddleware.js';
import {
  getMoveInStatus,
  verifyMoveInSuccess,
  denyMoveIn,
  getLatestPaidOfferStatusForProperty,
  getOfferMoveInIssues,
  adminApproveCancellation,
  adminRejectCancellation,
  getMoveInUIState,
} from '../controllers/moveInVerificationController.js';
import {
  runMoveInReminders,
  runMoveInFinalization,
} from '../services/moveInVerificationService.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';

const router = Router();

// Tenant and landlord must be authenticated
router.get('/offers/:id/status', verifyToken, getMoveInStatus);
router.get('/offers/:id/move-in/ui-state', verifyToken, getMoveInUIState);
router.post('/offers/:id/verify', verifyToken, verifyMoveInSuccess);
router.post('/offers/:id/deny', verifyToken, denyMoveIn);
router.get('/offers/:id/issues', verifyToken, getOfferMoveInIssues);

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
