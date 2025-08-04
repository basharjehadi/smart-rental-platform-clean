import express from 'express';
import { 
  createPaymentIntent, 
  getMyPayments, 
  handleWebhook 
} from '../controllers/paymentController.js';
import verifyToken from '../middlewares/verifyToken.js';

const router = express.Router();

// Protected payment routes (require authentication)
router.post('/create-payment-intent', verifyToken, createPaymentIntent);
router.get('/my-payments', verifyToken, getMyPayments);

// Stripe webhook (no authentication required - uses signature verification)
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router; 