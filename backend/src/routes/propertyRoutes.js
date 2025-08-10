import express from 'express';
import { 
  getLandlordProperties, 
  getPropertyById, 
  createProperty, 
  updateProperty, 
  deleteProperty,
  updatePropertyStatus,
  updatePropertyAvailability,
  getPropertyAvailabilitySummary
} from '../controllers/propertyController.js';
import { verifyToken, requireLandlord } from '../middlewares/authMiddleware.js';
import { uploadMultipleFiles } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Get all properties for a landlord
router.get('/', verifyToken, requireLandlord, getLandlordProperties);

// Get a specific property
router.get('/:id', verifyToken, requireLandlord, getPropertyById);

// Create a new property
router.post('/', verifyToken, requireLandlord, uploadMultipleFiles, createProperty);

// Update a property
router.put('/:id', verifyToken, requireLandlord, uploadMultipleFiles, updateProperty);

// Delete a property
router.delete('/:id', verifyToken, requireLandlord, deleteProperty);

// Update property status
router.patch('/:id/status', verifyToken, requireLandlord, updatePropertyStatus);

// NEW: Update property availability
router.patch('/:id/availability', verifyToken, requireLandlord, updatePropertyAvailability);

// NEW: Get property availability summary
router.get('/availability/summary', verifyToken, requireLandlord, getPropertyAvailabilitySummary);

export default router; 