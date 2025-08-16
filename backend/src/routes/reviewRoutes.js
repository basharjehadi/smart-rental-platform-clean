import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import {
  getUserReviewSummary,
  createReview,
  updateReview,
  getPendingReviews,
  deleteReview,
  getLeaseReviews,
  initializeUserRating,
  triggerReviewByEvent
} from '../controllers/reviewController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// 🏆 REVIEW ROUTES - 3-Stage Review System

// Get user's review summary
router.get('/user/:userId/summary', getUserReviewSummary);

// Get pending reviews for a specific user
router.get('/pending/:userId', getPendingReviews);

// Get reviews for a specific lease
router.get('/lease/:leaseId', getLeaseReviews);

// Create a new review
router.post('/', createReview);

// Update an existing review
router.put('/:reviewId', updateReview);

// Delete a review (admin only)
router.delete('/:reviewId', deleteReview);

// Initialize user rating (admin only)
router.post('/initialize-rating', initializeUserRating);

// Trigger review by event (called by other services)
router.post('/trigger-event', triggerReviewByEvent);

export default router;
