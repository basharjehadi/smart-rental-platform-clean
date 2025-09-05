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

export default router;
