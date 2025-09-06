import { Router } from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import {
  createRenewalRequest,
  counterRenewalRequest,
  acceptRenewalRequest,
  declineRenewalRequest,
  listRenewalsForLease,
  getRenewalWorkflow,
  expireOldRenewals,
  createTerminationRequest,
  getTerminationPolicyPreview,
  acceptTerminationRequest,
  declineTerminationRequest,
} from '../controllers/renewalController.js';

const router = Router();

// Create renewal request for a lease (either party). Landlord-only may set price.
router.post('/leases/:id/renewals', verifyToken, createRenewalRequest);

// Counter an open renewal (landlord may change price)
router.post('/renewals/:id/counter', verifyToken, counterRenewalRequest);

// Accept/Decline
router.post('/renewals/:id/accept', verifyToken, acceptRenewalRequest);
router.post('/renewals/:id/decline', verifyToken, declineRenewalRequest);

// List renewals for a lease
router.get('/leases/:id/renewals', verifyToken, listRenewalsForLease);

// Get renewal workflow state for a lease
router.get('/leases/:id/renewal-workflow', verifyToken, getRenewalWorkflow);

// Auto-expire old renewal requests (admin/cron endpoint)
router.post('/renewals/expire-old', verifyToken, expireOldRenewals);

// 🚀 NEW: Termination Request Routes (as outlined by ChatGPT)

// Create termination request for a lease (either party)
router.post('/leases/:id/terminations', verifyToken, createTerminationRequest);

// Get termination policy preview for a lease
router.get('/leases/:id/termination-policy', verifyToken, getTerminationPolicyPreview);

// Accept a termination request
router.post('/terminations/:id/accept', verifyToken, acceptTerminationRequest);

// Decline a termination request
router.post('/terminations/:id/decline', verifyToken, declineTerminationRequest);

export default router;
