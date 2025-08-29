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
  triggerSystemMaintenance,
  getAllContracts,
  adminDownloadContract,
  getContractDetails,
  listMoveInIssues,
  getOfferDetails
} from '../controllers/adminController.js';
import { redactReview } from '../controllers/reviewController.js';
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

// Contract Management
router.get('/contracts', getAllContracts);
router.get('/contracts/:contractId', getContractDetails);
router.get('/contracts/:contractId/download', adminDownloadContract);

// Move-in issues
router.get('/move-in/issues', listMoveInIssues);
router.get('/move-in/offers/:offerId', getOfferDetails);

// Add this route for review publisher job management
router.post('/jobs/review-publisher/trigger', requireAdmin, async (req, res) => {
  try {
    const { triggerReviewPublishing } = await import('../jobs/reviewPublisher.js');
    await triggerReviewPublishing();
    
    res.json({
      success: true,
      message: 'Review publisher job triggered successfully'
    });
  } catch (error) {
    console.error('Error triggering review publisher job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger review publisher job',
      message: error.message
    });
  }
});

// Add route to get review publisher job stats
router.get('/jobs/review-publisher/stats', requireAdmin, async (req, res) => {
  try {
    const { getJobStats } = await import('../jobs/reviewPublisher.js');
    const stats = await getJobStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting review publisher job stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get review publisher job stats',
      message: error.message
    });
  }
});

// Add route to get cron job status
router.get('/jobs/cron/status', requireAdmin, async (req, res) => {
  try {
    const { getCronJobStatus } = await import('../services/reviewCronService.js');
    const status = getCronJobStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting cron job status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cron job status',
      message: error.message
    });
  }
});

// Review Management
router.post('/reviews/:id/redact', redactReview);

export default router; 