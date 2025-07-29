import express from 'express';
import {
  createRentalRequest,
  getMyRequests,
  getAllActiveRequests,
  createOffer,
  getOfferForRequest,
  getMyOffers,
  updateOfferStatus,
  updateOfferPaymentStatus,
  getLockStatus,
  getMyRentPayments,
  getLandlordRentOverview,
  getCurrentRentalStatus,
  getAcceptedOffersForLandlord,
  updateRentalRequest,
  deleteRentalRequest
} from '../controllers/rentalController.js';
import verifyToken from '../middlewares/verifyToken.js';
import { requireTenant, requireLandlord } from '../middlewares/roleMiddleware.js';
import { requireCompleteProfile } from '../middlewares/profileValidationMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Tenant routes (require complete profile)
router.post('/rental-request', requireTenant, requireCompleteProfile, createRentalRequest);
router.get('/my-requests', requireTenant, getMyRequests);
router.put('/rental-request/:id', requireTenant, requireCompleteProfile, updateRentalRequest);
router.delete('/rental-request/:id', requireTenant, deleteRentalRequest);
router.get('/current-rental-status', requireTenant, getCurrentRentalStatus);
router.get('/my-rents', requireTenant, getMyRentPayments);
router.get('/offers/my', requireTenant, getMyOffers);
router.get('/offers/:requestId', requireTenant, getOfferForRequest);
router.put('/offers/:id/status', requireTenant, requireCompleteProfile, updateOfferStatus);
router.put('/offers/:id/payment-status', requireTenant, updateOfferPaymentStatus);

// Landlord routes (require complete profile)
router.get('/rental-requests', requireLandlord, getAllActiveRequests);
router.get('/landlord-rents', requireLandlord, getLandlordRentOverview);
router.get('/offers/landlord/accepted', requireLandlord, getAcceptedOffersForLandlord);
router.post('/rental-request/:requestId/offer', requireLandlord, requireCompleteProfile, createOffer);

// Lock status route (accessible by tenant, landlord, and admin)
router.get('/rental-request/:id/lock-status', getLockStatus);

export default router; 