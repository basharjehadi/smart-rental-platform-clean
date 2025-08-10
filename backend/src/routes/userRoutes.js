import express from 'express';
import {
  getUserIdentity, getUserProfile, updateUserProfile,
  updateUserIdentity, saveUserSignature, saveContractSignatures, getContractSignatures,
  uploadIdentityDocument, getProfileStatus, uploadProfilePhoto, deleteProfilePhoto,
  getPendingKYC, reviewKYC, findUserByEmail
} from '../controllers/userController.js';
import { validateProfileData } from '../middlewares/profileValidationMiddleware.js';
import verifyToken from '../middlewares/verifyToken.js';
import { uploadIdentityDocument as uploadIdentityMiddleware, uploadProfileImage } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.use(verifyToken);

// Profile management routes
router.get('/profile', getUserProfile);
router.put('/profile', validateProfileData, updateUserProfile); // Re-enabled validation
router.get('/profile/status', getProfileStatus);

// Profile photo routes
router.post('/profile/photo', uploadProfileImage, uploadProfilePhoto);
router.delete('/profile/photo', deleteProfilePhoto);

// Identity and signature routes
router.get('/identity', getUserIdentity);
router.put('/identity', validateProfileData, updateUserIdentity);
router.post('/signature', saveUserSignature);
router.delete('/signature', saveUserSignature); // TODO: Create separate deleteSignature function
router.post('/upload-identity-document', uploadIdentityMiddleware, uploadIdentityDocument);
router.get('/contracts/:rentalRequestId/signatures', getContractSignatures);
router.post('/contracts/:rentalRequestId/signatures', saveContractSignatures);

// Admin KYC management routes
router.get('/admin/kyc/pending', getPendingKYC);
router.post('/admin/kyc/review', reviewKYC);

// User search routes
router.post('/find-by-email', findUserByEmail);

export default router; 