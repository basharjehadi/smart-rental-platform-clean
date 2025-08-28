import express from 'express';
import {
  createRentalRequest,
  getAllActiveRequests,
  markRequestAsViewed,
  createOffer,
  updateOfferStatus,
  updateTenantOfferStatus,
  updateLandlordCapacity,
  getPoolStats,
  cleanupExpiredRequests,
  getMyRequests,
  updateRentalRequest,
  deleteRentalRequest,
  getMyOffers,
  getAllRentalRequests,
  declineRentalRequest,
  getOfferDetails,
  getLandlordAcceptedRequests
} from '../controllers/rentalController.js';
import { uploadRulesPdf } from '../middlewares/uploadMiddleware.js';
import { verifyToken, requireLandlord, requireTenant, requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 🚀 SCALABILITY: Tenant routes (MUST come first to avoid conflicts)
router.post('/rental-request', verifyToken, requireTenant, createRentalRequest);
// Removed per product decision: tenants manage requests via /tenant-request-for-landlord UI only
router.put('/rental-request/:id', verifyToken, requireTenant, updateRentalRequest);
router.delete('/rental-request/:id', verifyToken, requireTenant, deleteRentalRequest);

// 🚀 SCALABILITY: Tenant offer routes
router.get('/tenant/offers', verifyToken, requireTenant, getMyOffers);
router.get('/tenant/offer/:offerId', verifyToken, requireTenant, getOfferDetails);
router.patch('/tenant/offer/:offerId', verifyToken, requireTenant, updateTenantOfferStatus);

// 🚀 SCALABILITY: Landlord routes with pool integration (MUST come after tenant routes)
router.get('/rental-requests', verifyToken, requireLandlord, getAllRentalRequests);
router.get('/accepted-requests', verifyToken, requireLandlord, getLandlordAcceptedRequests);
router.get('/pool/rental-requests', verifyToken, requireLandlord, getAllActiveRequests);
router.post('/rental-request/:requestId/view', verifyToken, requireLandlord, markRequestAsViewed);
router.post('/rental-request/:requestId/offer', verifyToken, requireLandlord, uploadRulesPdf, createOffer);
router.post('/rental-request/:requestId/decline', verifyToken, requireLandlord, declineRentalRequest);

// 🚀 SCALABILITY: Offer management
router.put('/offers/:id/status', verifyToken, requireTenant, updateOfferStatus);

// 🚀 SCALABILITY: Pool management routes
router.get('/pool/stats', verifyToken, getPoolStats);
router.post('/pool/cleanup', verifyToken, requireAdmin, cleanupExpiredRequests);

export default router; 