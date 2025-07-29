import express from 'express';
import { 
  getAllUsers,
  getAllRentals,
  getAllPayments,
  updateRentalLockStatus,
  triggerDailyCron
} from '../controllers/adminController.js';
import verifyToken from '../middlewares/verifyToken.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(requireAdmin);

// Get all users
router.get('/users', getAllUsers);

// Get all rental requests
router.get('/rentals', getAllRentals);

// Get all payments
router.get('/payments', getAllPayments);

// Update rental lock status
router.put('/rentals/:rentalId/lock-status', updateRentalLockStatus);

// Trigger daily cron job
router.post('/trigger-daily-check', triggerDailyCron);

export default router; 