import express from 'express';
import {
  createRentalRequest,
  getAllActiveRequests,
  markRequestAsViewed,
  createOffer,
  updateOfferStatus,
  updateLandlordCapacity,
  getPoolStats,
  cleanupExpiredRequests
} from '../controllers/rentalController.js';
import { uploadRulesPdf } from '../middlewares/uploadMiddleware.js';
import verifyToken from '../middlewares/verifyToken.js';
import { requireLandlord, requireTenant, requireAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// 🚀 SCALABILITY: Tenant routes
router.post('/rental-request', verifyToken, requireTenant, createRentalRequest);

// 🚀 SCALABILITY: Landlord routes with pool integration
router.get('/rental-requests', verifyToken, requireLandlord, getAllActiveRequests);
router.post('/rental-request/:requestId/view', verifyToken, requireLandlord, markRequestAsViewed);
router.post('/rental-request/:requestId/offer', verifyToken, requireLandlord, uploadRulesPdf, createOffer);

// 🚀 SCALABILITY: Offer management
router.put('/offers/:id/status', verifyToken, requireTenant, updateOfferStatus);

// 🚀 SCALABILITY: Pool management routes
router.get('/pool/stats', verifyToken, getPoolStats);
router.post('/pool/cleanup', verifyToken, requireAdmin, cleanupExpiredRequests);

export default router; 