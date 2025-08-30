import express from 'express';
import {
  uploadProfileImage,
  deleteProfileImage,
} from '../controllers/uploadController.js';
import { uploadProfileImage as uploadProfileImageMiddleware } from '../middlewares/uploadMiddleware.js';
import verifyToken from '../middlewares/verifyToken.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Upload profile image
router.post('/profile-image', uploadProfileImageMiddleware, uploadProfileImage);

// Delete profile image
router.delete('/profile-image', deleteProfileImage);

export default router;
