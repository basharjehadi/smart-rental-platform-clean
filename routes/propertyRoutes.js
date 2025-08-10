import express from 'express';
import { 
  getProperties, 
  getProperty, 
  createProperty, 
  updateProperty, 
  deleteProperty,
  updatePropertyStatus,
  updatePropertyAvailability,
  getPropertyAvailabilitySummary
} from '../controllers/propertyController.js';
import { requireAuth, requireLandlord } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get all properties for a landlord
router.get('/properties', requireAuth, requireLandlord, getProperties);

// Get a specific property
router.get('/properties/:id', requireAuth, requireLandlord, getProperty);

// Create a new property
router.post('/properties', requireAuth, requireLandlord, createProperty);

// Update a property
router.put('/properties/:id', requireAuth, requireLandlord, updateProperty);

// Delete a property
router.delete('/properties/:id', requireAuth, requireLandlord, deleteProperty);

// Update property status
router.patch('/properties/:id/status', requireAuth, requireLandlord, updatePropertyStatus);

// NEW: Update property availability
router.patch('/properties/:id/availability', requireAuth, requireLandlord, updatePropertyAvailability);

// NEW: Get property availability summary
router.get('/properties/availability/summary', requireAuth, requireLandlord, getPropertyAvailabilitySummary);

export default router; 