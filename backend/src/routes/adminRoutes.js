import express from 'express';
import { 
  getAllUsers,
  getPendingKYCUsers,
  verifyUserKYC,
  getSystemAnalytics,
  getAllRentalRequests,
  getAllPayments,
  getOverduePayments,
  toggleUserSuspension,
  getSystemHealth,
  triggerSystemMaintenance
} from '../controllers/adminController.js';
import verifyToken from '../middlewares/verifyToken.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(requireAdmin);

// User Management
router.get('/users', getAllUsers);
router.get('/users/pending-kyc', getPendingKYCUsers);
router.put('/users/:userId/kyc', verifyUserKYC);
router.put('/users/:userId/suspension', toggleUserSuspension);

// Analytics & System Health
router.get('/analytics', getSystemAnalytics);
router.get('/health', getSystemHealth);

// Rental Management
router.get('/rental-requests', getAllRentalRequests);

// Payment Management
router.get('/payments', getAllPayments);
router.get('/payments/overdue', getOverduePayments);

// System Maintenance
router.post('/maintenance', triggerSystemMaintenance);

export default router; 