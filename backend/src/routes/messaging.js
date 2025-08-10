import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middlewares/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import { canChat } from '../utils/chatGuard.js';

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

// Send a message with file upload and enhanced guard
router.post('/conversations/:conversationId/messages', verifyToken, upload.single('attachment'), async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, messageType = 'TEXT', replyToId } = req.body;

    // Check if user can chat using enhanced guard
    const chatGuard = await canChat(conversationId, req.user.id);
    
    if (!chatGuard.ok) {
      const statusCode = chatGuard.errorCode === 'NOT_FOUND' ? 404 : 403;
      return res.status(statusCode).json({ 
        error: chatGuard.error,
        errorCode: chatGuard.errorCode
      });
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

// Mark messages as read with enhanced guard
router.put('/conversations/:conversationId/messages/read', verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { messageIds } = req.body;

    // Check if user can chat using enhanced guard
    const chatGuard = await canChat(conversationId, req.user.id);
    
    if (!chatGuard.ok) {
      const statusCode = chatGuard.errorCode === 'NOT_FOUND' ? 404 : 403;
      return res.status(statusCode).json({ 
        error: chatGuard.error,
        errorCode: chatGuard.errorCode
      });
    }

    // Mark messages as read
    const updatedMessages = await prisma.message.updateMany({
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

    res.json({ 
      success: true, 
      updatedCount: updatedMessages.count,
      message: 'Messages marked as read'
    });
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

// Get conversation details with enhanced guard
router.get('/conversations/:conversationId', verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Check if user can chat using enhanced guard
    const chatGuard = await canChat(conversationId, req.user.id);
    
    if (!chatGuard.ok) {
      const statusCode = chatGuard.errorCode === 'NOT_FOUND' ? 404 : 403;
      return res.status(statusCode).json({ 
        error: chatGuard.error,
        errorCode: chatGuard.errorCode
      });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
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
        },
        offer: {
          select: {
            id: true,
            status: true,
            rentAmount: true,
            depositAmount: true
          }
        }
      }
    });

    res.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Get eligible chat targets for current user (based on properties they can chat about)
router.get('/eligible', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { prisma } = await import('../utils/prisma.js');

    // Get all properties where the user can chat
    let eligibleTargets = [];

    if (req.user.role === 'TENANT') {
      // For tenants: get properties they have paid for or have offers on
      const tenantPayments = await prisma.payment.findMany({
        where: {
          userId: userId,
          status: 'SUCCEEDED',
          purpose: { in: ['DEPOSIT', 'RENT', 'DEPOSIT_AND_FIRST_MONTH'] }
        },
        include: {
          offer: {
            include: {
              property: {
                include: {
                  landlord: true
                }
              }
            }
          }
        }
      });

      // Get unique properties from successful payments
      const paidProperties = new Map();
      tenantPayments.forEach(payment => {
        if (payment.offer?.property) {
          const property = payment.offer.property;
          if (!paidProperties.has(property.id)) {
            paidProperties.set(property.id, {
              propertyId: property.id,
              propertyTitle: property.name,
              landlordId: property.landlord.id,
              landlordName: property.landlord.name,
              landlordAvatar: property.landlord.profileImage,
              isLocked: false, // Chat is unlocked after payment
              paymentPurpose: payment.purpose,
              paidAt: payment.paidAt
            });
          }
        }
      });

      eligibleTargets = Array.from(paidProperties.values()).map(property => ({
        propertyId: property.propertyId,
        conversationId: null, // Will be created when needed
        counterpartUserId: property.landlordId,
        counterpartName: property.landlordName,
        counterpartAvatar: property.landlordAvatar,
        propertyTitle: property.propertyTitle,
        isLocked: false, // Always unlocked after payment
        paymentPurpose: property.paymentPurpose,
        paidAt: property.paidAt
      }));

    } else if (req.user.role === 'LANDLORD') {
      // For landlords: get properties they own where tenants have paid
      const landlordProperties = await prisma.property.findMany({
        where: {
          landlordId: userId
        },
        include: {
          offers: {
            include: {
              payments: {
                where: {
                  status: 'SUCCEEDED',
                  purpose: { in: ['DEPOSIT', 'RENT', 'DEPOSIT_AND_FIRST_MONTH'] }
                }
              },
              tenant: true
            }
          }
        }
      });

      landlordProperties.forEach(property => {
        property.offers.forEach(offer => {
          if (offer.payments.length > 0) {
            const payment = offer.payments[0]; // Get the successful payment
            eligibleTargets.push({
              propertyId: property.id,
              conversationId: null, // Will be created when needed
              counterpartUserId: offer.tenant.id,
              counterpartName: offer.tenant.name,
              counterpartAvatar: offer.tenant.profileImage,
              propertyTitle: property.name,
              isLocked: false, // Always unlocked after payment
              paymentPurpose: payment.purpose,
              paidAt: payment.paidAt
            });
          }
        });
      });
    }

    res.json({
      success: true,
      eligibleTargets
    });

  } catch (error) {
    console.error('Error fetching eligible chat targets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch eligible chat targets'
    });
  }
});

// Find or create conversation by property ID (payment-based)
router.post('/conversations/by-property/:propertyId', verifyToken, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;
    const { prisma } = await import('../utils/prisma.js');

    // Verify user has access to this property (either as tenant who paid or as landlord)
    let hasAccess = false;
    let counterpartUserId = null;
    let property = null;

    if (req.user.role === 'TENANT') {
      // Check if tenant has paid for this property
      const payment = await prisma.payment.findFirst({
        where: {
          userId: userId,
          status: 'SUCCEEDED',
          purpose: { in: ['DEPOSIT', 'RENT', 'DEPOSIT_AND_FIRST_MONTH'] },
          offer: {
            propertyId: propertyId
          }
        },
        include: {
          offer: {
            include: {
              property: {
                include: {
                  landlord: true
                }
              }
            }
          }
        }
      });

      if (payment) {
        hasAccess = true;
        counterpartUserId = payment.offer.property.landlord.id;
        property = payment.offer.property;
      }
    } else if (req.user.role === 'LANDLORD') {
      // Check if landlord owns this property and has tenants who paid
      property = await prisma.property.findFirst({
        where: {
          id: propertyId,
          landlordId: userId
        },
        include: {
          offers: {
            include: {
              payments: {
                where: {
                  status: 'SUCCEEDED',
                  purpose: { in: ['DEPOSIT', 'RENT', 'DEPOSIT_AND_FIRST_MONTH'] }
                }
              },
              tenant: true
            }
          }
        }
      });

      if (property && property.offers.some(offer => offer.payments.length > 0)) {
        hasAccess = true;
        // Get the first tenant who paid
        const paidOffer = property.offers.find(offer => offer.payments.length > 0);
        counterpartUserId = paidOffer.tenant.id;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You must have paid for this property or own it with paying tenants.'
      });
    }

    // Find existing conversation or create new one
    let conversation = await prisma.conversation.findFirst({
      where: {
        propertyId: propertyId,
        participants: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        participants: true
      }
    });

    if (!conversation) {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          title: `${property.name}`,
          type: 'PROPERTY',
          propertyId: propertyId,
          status: 'ACTIVE', // Always active after payment
          participants: {
            create: [
              { userId: userId, role: 'MEMBER' },
              { userId: counterpartUserId, role: 'MEMBER' }
            ]
          }
        },
        include: {
          participants: true
        }
      });
    }

    res.json({
      success: true,
      conversationId: conversation.id,
      status: conversation.status,
      isLocked: false, // Always unlocked after payment
      propertyId: propertyId
    });

  } catch (error) {
    console.error('Error creating conversation by property:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create conversation'
    });
  }
});

export default router;
