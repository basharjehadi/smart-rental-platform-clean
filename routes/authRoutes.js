import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import verifyToken from '../middlewares/verifyToken.js';

const router = express.Router();

// POST /api/auth/register - Register new user
router.post('/register', register);

// POST /api/auth/login - Login user
router.post('/login', login);

// GET /api/auth/me - Get current user info (protected route)
router.get('/me', verifyToken, getMe);

export default router; 