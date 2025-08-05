import express from 'express';
import {
  getTenantDashboardData,
  getTenantPayments,
  getTenantActiveLease
} from '../controllers/tenantDashboardController.js';
import { verifyToken, requireTenant } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Tenant dashboard routes
router.get('/dashboard', verifyToken, requireTenant, getTenantDashboardData);
router.get('/payments', verifyToken, requireTenant, getTenantPayments);
router.get('/active-lease', verifyToken, requireTenant, getTenantActiveLease);

export default router; 