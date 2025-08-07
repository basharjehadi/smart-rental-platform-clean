import express from 'express';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';
import { uploadMultipleFiles } from '../middlewares/uploadMiddleware.js';
import {
  getLandlordProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  updatePropertyStatus
} from '../controllers/propertyController.js';

const router = express.Router();

// All routes require authentication and landlord role
router.use(verifyToken);
router.use(requireRole('LANDLORD'));

// Get all properties for the logged-in landlord
router.get('/landlord-properties', getLandlordProperties);

// Get a specific property by ID
router.get('/:id', getPropertyById);

// Create a new property with file upload support
router.post('/', uploadMultipleFiles, createProperty);

// Update a property
router.put('/:id', uploadMultipleFiles, updateProperty);

// Delete a property
router.delete('/:id', deleteProperty);

// Update property status
router.patch('/:id/status', updatePropertyStatus);

export default router; 