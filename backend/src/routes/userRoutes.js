import express from 'express';
import {
  getUserIdentity, getUserProfile, updateUserProfile,
  updateUserIdentity, saveUserSignature, saveContractSignatures, getContractSignatures,
  uploadIdentityDocument, getProfileStatus
} from '../controllers/userController.js';
import { validateProfileData } from '../middlewares/profileValidationMiddleware.js';
import verifyToken from '../middlewares/verifyToken.js';
import { uploadIdentityDocument as uploadIdentityDoc } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.use(verifyToken);

// Profile management routes
router.get('/profile', getUserProfile);
router.put('/profile', validateProfileData, updateUserProfile); // Re-enabled validation
router.get('/profile/status', getProfileStatus);

// Identity and signature routes
router.get('/identity', getUserIdentity);
router.put('/identity', validateProfileData, updateUserIdentity);
router.post('/signature', saveUserSignature);
router.delete('/signature', saveUserSignature); // TODO: Create separate deleteSignature function
router.post('/upload-identity-document', uploadIdentityDoc, uploadIdentityDocument);
router.get('/contracts/:rentalRequestId/signatures', getContractSignatures);
router.post('/contracts/:rentalRequestId/signatures', saveContractSignatures);

export default router; 