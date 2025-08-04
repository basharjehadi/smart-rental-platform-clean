import express from 'express';
import { 
  uploadPropertyImages, 
  uploadPropertyVideo, 
  deletePropertyFile,
  getFileInfo 
} from '../controllers/propertyUploadController.js';
import { 
  uploadPropertyImages as uploadImagesMiddleware, 
  uploadPropertyVideo as uploadVideoMiddleware 
} from '../middlewares/uploadMiddleware.js';
import verifyToken from '../middlewares/verifyToken.js';
import { requireLandlord } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// All routes require authentication and landlord role
router.use(verifyToken);
router.use(requireLandlord);

// Upload property images (multiple)
router.post('/images', uploadImagesMiddleware, uploadPropertyImages);

// Upload property video (single)
router.post('/video', uploadVideoMiddleware, uploadPropertyVideo);

// Delete property file
router.delete('/file', deletePropertyFile);

// Get file info
router.get('/file/:fileUrl(*)', getFileInfo);

export default router; 