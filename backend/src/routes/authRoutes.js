import express from 'express';
import {
  register,
  login,
  getMe,
  changePassword,
} from '../controllers/authController.js';
import verifyToken from '../middlewares/verifyToken.js';

const router = express.Router();

// POST /api/auth/register - Register new user
router.post('/register', register);

// POST /api/auth/login - Login user
router.post('/login', login);

// GET /api/auth/me - Get current user info (protected route)
router.get('/me', verifyToken, getMe);

// POST /api/auth/change-password - Change password (protected route)
router.post('/change-password', verifyToken, changePassword);

export default router;
