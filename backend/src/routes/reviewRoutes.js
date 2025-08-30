import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { canSubmitReview } from '../middleware/reviews/index.js';
import {
  getUserReviewSummary,
  createReview,
  updateReview,
  getPendingReviews,
  getLeaseReviews,
  initializeUserRating,
  triggerReviewByEvent,
  createMinimalReview,
  submitReview,
  editReviewText,
  reportReview,
  replyToReview,
  editReviewReply,
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

// Create a new review (full review with rating, comment, etc.)
router.post('/', createReview);

// Create a minimal review (just leaseId and stage)
router.post('/minimal', canSubmitReview, createMinimalReview);

// Update an existing review
router.put('/:reviewId', updateReview);

// Delete route removed - only accessible via admin routes

// Initialize user rating (admin only)
router.post('/initialize-rating', initializeUserRating);

// Trigger review by event (called by other services)
router.post('/trigger-event', triggerReviewByEvent);

// Submit a review (set status to SUBMITTED)
router.post('/:id/submit', submitReview);

// Edit review text (within 24 hours of submission)
router.patch('/:id/text', editReviewText);

// Report a review (any party can report)
router.post('/:id/report', reportReview);

// Reply to a review (reviewee only, once)
router.post('/:id/reply', replyToReview);

// Edit review reply (within 24 hours)
router.patch('/:id/reply', editReviewReply);

export default router;
