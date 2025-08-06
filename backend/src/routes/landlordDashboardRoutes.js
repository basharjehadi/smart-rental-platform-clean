import express from 'express';
import { verifyToken, requireLandlord } from '../middlewares/authMiddleware.js';
import { getLandlordDashboard } from '../controllers/landlordDashboardController.js';

const router = express.Router();

// Get landlord dashboard data
router.get('/dashboard', verifyToken, requireLandlord, getLandlordDashboard);

export default router; 