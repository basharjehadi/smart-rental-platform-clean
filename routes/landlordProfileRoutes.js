import express from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import { requireLandlord } from '../middlewares/roleMiddleware.js';
import {
  getLandlordProfile,
  updateLandlordProfile,
  uploadPropertyImages,
  uploadPropertyVideos,
  deletePropertyImages,
  deletePropertyVideos,
  toggleAvailability,
  getCapacityStatus
} from '../controllers/landlordProfileController.js';

const router = express.Router();

// 🏠 Landlord Profile Management Routes
router.get('/profile', verifyToken, requireLandlord, getLandlordProfile);
router.put('/profile', verifyToken, requireLandlord, updateLandlordProfile);

// 🖼️ Property Media Management
router.post('/property-images', verifyToken, requireLandlord, uploadPropertyImages);
router.post('/property-videos', verifyToken, requireLandlord, uploadPropertyVideos);
router.delete('/property-images', verifyToken, requireLandlord, deletePropertyImages);
router.delete('/property-videos', verifyToken, requireLandlord, deletePropertyVideos);

// 🎛️ Availability Management
router.put('/availability', verifyToken, requireLandlord, toggleAvailability);
router.get('/capacity-status', verifyToken, requireLandlord, getCapacityStatus);

export default router; 