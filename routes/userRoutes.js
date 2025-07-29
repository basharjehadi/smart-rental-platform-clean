import express from 'express';
import {
  getUserIdentity, getUserProfile, updateUserProfile,
  updateUserIdentity, saveUserSignature, saveContractSignatures, getContractSignatures
} from '../controllers/userController.js';
import { getProfileStatus } from '../middlewares/profileValidationMiddleware.js';
import verifyToken from '../middlewares/verifyToken.js';

const router = express.Router();

router.use(verifyToken);

// Profile management routes
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.get('/profile/status', getProfileStatus);

// Identity and signature routes
router.get('/identity', getUserIdentity);
router.put('/identity', updateUserIdentity);
router.post('/signature', saveUserSignature);
router.get('/contracts/:rentalRequestId/signatures', getContractSignatures);
router.post('/contracts/:rentalRequestId/signatures', saveContractSignatures);

export default router; 