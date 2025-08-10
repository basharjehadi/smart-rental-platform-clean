import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import {
  createTicket,
  getUserTickets,
  getTicket,
  addTicketMessage,
  updateTicketStatus,
  startChatSession,
  getChatMessages,
  sendChatMessage,
  endChatSession
} from '../controllers/supportController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Support Ticket Routes
router.post('/tickets', createTicket);
router.get('/tickets', getUserTickets);
router.get('/tickets/:id', getTicket);
router.post('/tickets/:id/messages', addTicketMessage);
router.put('/tickets/:id/status', updateTicketStatus);

// Live Chat Routes
router.post('/chat/start', startChatSession);
router.get('/chat/:sessionId/messages', getChatMessages);
router.post('/chat/:sessionId/message', sendChatMessage);
router.put('/chat/:sessionId/end', endChatSession);

export default router;
