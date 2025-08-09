import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middlewares/authMiddleware.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/messages/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and document files are allowed!'));
    }
  }
});

// Get all conversations for the authenticated user
router.get('/conversations', verifyToken, async (req, res) => {
  try {
    const conversations = await prisma.conversationParticipant.findMany({
      where: { userId: req.user.id },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    profileImage: true,
                    role: true
                  }
                }
              }
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: {
                sender: {
                  select: {
                    id: true,
                    name: true,
                    profileImage: true
                  }
                }
              }
            },
            property: {
              select: {
                id: true,
                name: true,
                address: true
              }
            }
          }
        }
      },
      orderBy: {
        conversation: {
          updatedAt: 'desc'
        }
      }
    });

    res.json(conversations.map(p => p.conversation));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is participant in conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: req.user.id
      }
    });

    if (!participant) {
      return res.status(403).json({ error: 'Not a participant in this conversation' });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true
          }
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    res.json(messages.reverse()); // Return in chronological order
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create a new conversation
router.post('/conversations', verifyToken, async (req, res) => {
  try {
    const { participantIds, propertyId, title } = req.body;

    if (!participantIds || participantIds.length === 0) {
      return res.status(400).json({ error: 'At least one participant is required' });
    }

    // Add current user to participants if not already included
    const allParticipantIds = participantIds.includes(req.user.id) 
      ? participantIds 
      : [...participantIds, req.user.id];

    // Check if conversation already exists between these participants
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        participants: {
          every: {
            userId: { in: allParticipantIds }
          }
        }
      },
      include: {
        participants: true
      }
    });

    if (existingConversation && existingConversation.participants.length === allParticipantIds.length) {
      return res.json(existingConversation);
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        title,
        type: allParticipantIds.length > 2 ? 'GROUP' : 'DIRECT',
        propertyId,
        participants: {
          create: allParticipantIds.map(userId => ({
            userId,
            role: userId === req.user.id ? 'ADMIN' : 'MEMBER'
          }))
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
                role: true
              }
            }
          }
        },
        property: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      }
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Send a message with file upload
router.post('/conversations/:conversationId/messages', verifyToken, upload.single('attachment'), async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, messageType = 'TEXT', replyToId } = req.body;

    // Verify user is participant in conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: req.user.id
      }
    });

    if (!participant) {
      return res.status(403).json({ error: 'Not a participant in this conversation' });
    }

    // Prepare message data
    const messageData = {
      content,
      messageType,
      conversationId,
      senderId: req.user.id,
      replyToId: replyToId || null
    };

    // Add attachment info if file was uploaded
    if (req.file) {
      messageData.attachmentUrl = `/uploads/messages/${req.file.filename}`;
      messageData.attachmentName = req.file.originalname;
      messageData.attachmentSize = req.file.size;
      messageData.attachmentType = req.file.mimetype;
      messageData.messageType = req.file.mimetype.startsWith('image/') ? 'IMAGE' : 'DOCUMENT';
    }

    const message = await prisma.message.create({
      data: messageData,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true
          }
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
router.put('/conversations/:conversationId/messages/read', verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { messageIds } = req.body;

    // Verify user is participant in conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: req.user.id
      }
    });

    if (!participant) {
      return res.status(403).json({ error: 'Not a participant in this conversation' });
    }

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        conversationId,
        senderId: { not: req.user.id } // Don't mark own messages as read
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get unread message count
router.get('/conversations/unread-count', verifyToken, async (req, res) => {
  try {
    const unreadCount = await prisma.message.count({
      where: {
        conversation: {
          participants: {
            some: {
              userId: req.user.id
            }
          }
        },
        senderId: { not: req.user.id },
        isRead: false
      }
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Get potential conversation participants (for creating new conversations)
router.get('/potential-participants', verifyToken, async (req, res) => {
  try {
    const { propertyId, role } = req.query;

    let whereClause = {};

    // If propertyId is provided, get participants related to that property
    if (propertyId) {
      if (role === 'TENANT') {
        // For tenants, show landlord of the property
        whereClause = {
          properties: {
            some: { id: propertyId }
          },
          role: 'LANDLORD'
        };
      } else {
        // For landlords, show tenants of the property
        whereClause = {
          leases: {
            some: {
              unit: {
                propertyId: propertyId
              }
            }
          },
          role: 'TENANT'
        };
      }
    } else {
      // Show all users of the opposite role
      whereClause = {
        role: req.user.role === 'TENANT' ? 'LANDLORD' : 'TENANT'
      };
    }

    const participants = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        role: true
      }
    });

    res.json(participants);
  } catch (error) {
    console.error('Error fetching potential participants:', error);
    res.status(500).json({ error: 'Failed to fetch potential participants' });
  }
});

export default router;
