import express from 'express';
import {
  getTenantDashboardData,
  getTenantPayments,
  getTenantActiveLease,
  getTenantPaymentHistory,
  getCurrentRental,
} from '../controllers/tenantDashboardController.js';
import { verifyToken, requireTenant } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Tenant dashboard routes
router.get('/dashboard', verifyToken, requireTenant, getTenantDashboardData);
router.get('/summary', verifyToken, requireTenant, getTenantDashboardData);
router.get('/payments', verifyToken, requireTenant, getTenantPayments);
router.get(
  '/payments/history',
  verifyToken,
  requireTenant,
  getTenantPaymentHistory
);
router.get('/active-lease', verifyToken, requireTenant, getTenantActiveLease);
router.get('/current-rental', verifyToken, requireTenant, getCurrentRental);

export default router;
