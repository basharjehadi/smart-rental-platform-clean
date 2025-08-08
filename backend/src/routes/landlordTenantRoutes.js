import express from 'express';
import { verifyToken, requireLandlord } from '../middlewares/authMiddleware.js';
import { getLandlordTenants, getLandlordTenantDetails, getLandlordTenantOffer } from '../controllers/landlordTenantController.js';

const router = express.Router();

// Get all tenants for a landlord
router.get('/tenants', verifyToken, requireLandlord, getLandlordTenants);

// Get individual tenant details
router.get('/tenants/:tenantId', verifyToken, requireLandlord, getLandlordTenantDetails);

// Get offer data for contract generation
router.get('/tenant-offer/:rentalRequestId', verifyToken, requireLandlord, getLandlordTenantOffer);

export default router;

