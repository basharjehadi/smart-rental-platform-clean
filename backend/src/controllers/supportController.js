import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middlewares/authMiddleware.js';

const prisma = new PrismaClient();

// Create a new support ticket
export const createTicket = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!title || !description || !category || !priority) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, category, and priority are required'
      });
    }

    // Validate category and priority values
    const validCategories = ['TECHNICAL', 'BILLING', 'GENERAL', 'EMERGENCY', 'PROPERTY_ISSUE', 'PAYMENT_ISSUE'];
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category. Must be one of: ' + validCategories.join(', ')
      });
    }

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid priority. Must be one of: ' + validPriorities.join(', ')
      });
    }

    // Create the ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        title,
        description,
        category,
        priority,
        status: 'OPEN'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    console.log(`✅ Support ticket created: ${ticket.id} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      ticket
    });

  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create support ticket'
    });
  }
};

// Get user's support tickets
export const getUserTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, category, priority } = req.query;

    // Build where clause
    const where = { userId };
    
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      tickets
    });

  } catch (error) {
    console.error('Get user tickets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch support tickets'
    });
  }
};

// Get specific ticket details
export const getTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id,
        userId // Ensure user can only access their own tickets
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Support ticket not found'
      });
    }

    res.json({
      success: true,
      ticket
    });

  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch support ticket'
    });
  }
};

// Add message to ticket
export const addTicketMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Verify ticket exists and belongs to user
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Support ticket not found'
      });
    }

    // Add message
    const ticketMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        userId,
        message,
        isInternal: false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    // Update ticket status to IN_PROGRESS if it was OPEN
    if (ticket.status === 'OPEN') {
      await prisma.supportTicket.update({
        where: { id },
        data: { status: 'IN_PROGRESS' }
      });
    }

    console.log(`✅ Message added to ticket ${id} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Message added successfully',
      ticketMessage
    });

  } catch (error) {
    console.error('Add ticket message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add message to ticket'
    });
  }
};

// Update ticket status
export const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    // Validate status
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    // Verify ticket exists and belongs to user
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Support ticket not found'
      });
    }

    // Update ticket status
    const updatedTicket = await prisma.supportTicket.update({
      where: { id },
      data: { status }
    });

    console.log(`✅ Ticket ${id} status updated to ${status} by user ${userId}`);

    res.json({
      success: true,
      message: 'Ticket status updated successfully',
      ticket: updatedTicket
    });

  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update ticket status'
    });
  }
};

// Start a new live chat session
export const startChatSession = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user already has an active session
    const existingSession = await prisma.chatSession.findFirst({
      where: {
        userId,
        status: {
          in: ['WAITING', 'ACTIVE']
        }
      }
    });

    if (existingSession) {
      return res.json({
        success: true,
        message: 'Chat session already exists',
        session: existingSession
      });
    }

    // Create new chat session
    const session = await prisma.chatSession.create({
      data: {
        userId,
        status: 'WAITING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    console.log(`✅ Chat session started: ${session.id} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Chat session started successfully',
      session
    });

  } catch (error) {
    console.error('Start chat session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start chat session'
    });
  }
};

// Get chat session messages
export const getChatMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Verify session belongs to user
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' }
    });

    res.json({
      success: true,
      messages
    });

  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat messages'
    });
  }
};

// Send chat message
export const sendChatMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Verify session belongs to user and is active
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
        status: {
          in: ['WAITING', 'ACTIVE']
        }
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found or inactive'
      });
    }

    // Update session status to ACTIVE if it was WAITING
    if (session.status === 'WAITING') {
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { status: 'ACTIVE' }
      });
    }

    // Create message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        senderId: userId,
        message
      }
    });

    console.log(`✅ Chat message sent: ${chatMessage.id} in session ${sessionId}`);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      chatMessage
    });

  } catch (error) {
    console.error('Send chat message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send chat message'
    });
  }
};

// End chat session
export const endChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Verify session belongs to user
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    // End session
    const updatedSession = await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: 'ENDED',
        endedAt: new Date()
      }
    });

    console.log(`✅ Chat session ended: ${sessionId} by user ${userId}`);

    res.json({
      success: true,
      message: 'Chat session ended successfully',
      session: updatedSession
    });

  } catch (error) {
    console.error('End chat session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end chat session'
    });
  }
};
