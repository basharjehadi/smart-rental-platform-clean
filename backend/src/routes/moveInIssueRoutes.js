import express from 'express';
import {
  createComment,
  getMoveInIssue,
  createMoveInIssue,
  updateIssueStatus,
  listLeaseMoveInIssues,
  adminDecision,
} from '../controllers/moveInIssueController.js';
import verifyToken from '../middlewares/verifyToken.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Create a new move-in issue
// POST /api/move-in-issues
router.post('/', createMoveInIssue);

// Get a single move-in issue with all comments and author profiles
// GET /api/move-in-issues/:issueId
router.get('/:issueId', getMoveInIssue);

// Create a new comment on a move-in issue
// POST /api/move-in-issues/:issueId/comments
router.post('/:issueId/comments', upload.array('evidence', 5), createComment);

// Update move-in issue status
// PUT /api/move-in-issues/:issueId/status
router.put('/:issueId/status', updateIssueStatus);

// Admin decision on move-in issue
// POST /api/move-in-issues/:issueId/admin-decision
router.post('/:issueId/admin-decision', adminDecision);

// List move-in issues for a specific lease
// GET /api/leases/:leaseId/move-in-issues
// Note: This route will be mounted under /api/leases in the main routes file

export default router;
