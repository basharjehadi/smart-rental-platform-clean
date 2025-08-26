import { Router } from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';
import { requireLandlord, requireTenant } from '../middlewares/roleMiddleware.js';
import {
  postTerminationNotice,
  postRenewalDecline,
  getLeaseByOffer
} from '../controllers/leaseController.js';

const router = Router();

// Irreversible: either party can give termination notice
router.post('/:id/termination/notice', verifyToken, postTerminationNotice);

// Irreversible: either party can decline renewal
router.post('/:id/renewal/decline', verifyToken, postRenewalDecline);

// Helper: fetch lease by offerId for UI convenience
router.get('/by-offer/:offerId', verifyToken, getLeaseByOffer);

export default router;


