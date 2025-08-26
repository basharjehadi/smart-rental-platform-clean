import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { canChat } from '../utils/chatGuard.js';

const prisma = new PrismaClient();

// Helper function to get notification counts
const getNotificationCounts = async (userId) => {
  try {
    const [rentalRequests, offers, allUnread] = await Promise.all([
      prisma.notification.count({
        where: {
          userId,
          type: 'NEW_RENTAL_REQUEST',
          isRead: false
        }
      }),
      prisma.notification.count({
        where: {
          userId,
          type: 'NEW_OFFER',
          isRead: false
        }
      }),
      prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      })
    ]);

    // total should represent ALL unread notifications
    return {
      rentalRequests,
      offers,
      total: allUnread
    };
  } catch (error) {
    console.error('Error getting notification counts:', error);
    return { rentalRequests: 0, offers: 0, total: 0 };
  }
};

// Rate limiting storage (in-memory sliding window)
const rateLimitMap = new Map();

// Rate limiting helper
const checkRateLimit = (socketId, eventType) => {
  const now = Date.now();
  const windowMs = 10000; // 10 seconds
  const maxEvents = 10; // Max 10 events per window
  
  if (!rateLimitMap.has(socketId)) {
    rateLimitMap.set(socketId, {});
  }
  
  const userLimits = rateLimitMap.get(socketId);
  
  if (!userLimits[eventType]) {
    userLimits[eventType] = [];
  }
  
  // Remove old events outside the window
  userLimits[eventType] = userLimits[eventType].filter(timestamp => now - timestamp < windowMs);
  
  // Check if limit exceeded
  if (userLimits[eventType].length >= maxEvents) {
    return false;
  }
  
  // Add current event
  userLimits[eventType].push(now);
  return true;
};

// Cleanup rate limit data for disconnected sockets
const cleanupRateLimit = (socketId) => {
  rateLimitMap.delete(socketId);
};

export function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5173',
        'http://localhost:3002'
      ],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Enhanced authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          role: true,
          email: true,
          name: true
        }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      // Set user data in socket.data (standardized approach)
      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.data.user.name} connected: ${socket.id}`);

    // Join user's personal notification room
    socket.join(`user-${socket.data.user.id}`);

    // Per-connection guard to avoid repeated heavy joins
    socket.data.hasJoinedConversations = false;

    // Join user's conversations
    socket.on('join-conversations', async () => {
      try {
        if (socket.data.hasJoinedConversations) {
          return;
        }
        const conversations = await prisma.conversationParticipant.findMany({
          where: { userId: socket.data.user.id },
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
                    address: true,
                    city: true,
                    district: true,
                    zipCode: true,
                    country: true,
                    propertyType: true,
                    monthlyRent: true,
                    depositAmount: true,
                    bedrooms: true,
                    bathrooms: true,
                    size: true,
                    images: true
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
            }
          }
        });

        conversations.forEach(participant => {
          socket.join(`conversation-${participant.conversation.id}`);
        });

        socket.emit('conversations-loaded', conversations.map(p => p.conversation));
        socket.data.hasJoinedConversations = true;
      } catch (error) {
        console.error('Error joining conversations:', error);
      }
    });

    // Join a specific conversation with enhanced guard
    socket.on('join-conversation', async (conversationId) => {
      try {
        // Check if user can chat in this conversation
        const chatGuard = await canChat(conversationId, socket.data.user.id);
        
        if (!chatGuard.ok) {
          socket.emit('chat-error', {
            error: chatGuard.error,
            errorCode: chatGuard.errorCode
          });
          return;
        }

        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            conversationId,
            userId: socket.data.user.id
          }
        });

        if (participant) {
          socket.join(`conversation-${conversationId}`);
          socket.emit('joined-conversation', conversationId);
        }
      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('chat-error', {
          error: 'Failed to join conversation',
          errorCode: 'INTERNAL_ERROR'
        });
      }
    });

    // Send a message with enhanced guard and rate limiting
    socket.on('send-message', async (data) => {
      try {
        // Rate limiting check
        if (!checkRateLimit(socket.id, 'send-message')) {
          socket.emit('chat-error', {
            error: 'Rate limit exceeded. Please wait before sending more messages.',
            errorCode: 'RATE_LIMITED'
          });
          return;
        }

        const { conversationId, content, messageType = 'TEXT', attachmentUrl, attachmentName, attachmentSize, attachmentType, replyToId } = data;

        // Check if user can chat
        const chatGuard = await canChat(conversationId, socket.data.user.id);
        
        if (!chatGuard.ok) {
          socket.emit('chat-error', {
            error: chatGuard.error,
            errorCode: chatGuard.errorCode
          });
          return;
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            content,
            messageType,
            attachmentUrl,
            attachmentName,
            attachmentSize,
            attachmentType,
            replyToId,
            conversationId,
            senderId: socket.data.user.id
          },
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

        // Emit to all participants in the conversation
        io.to(`conversation-${conversationId}`).emit('new-message', message);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('chat-error', {
          error: 'Failed to send message',
          errorCode: 'INTERNAL_ERROR'
        });
      }
    });

    // Mark message as read with membership check
    socket.on('mark-read', async (messageId) => {
      try {
        // First verify user is participant in the conversation
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          select: { conversationId: true }
        });

        if (!message) {
          socket.emit('chat-error', {
            error: 'Message not found',
            errorCode: 'NOT_FOUND'
          });
          return;
        }

        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            conversationId: message.conversationId,
            userId: socket.data.user.id
          }
        });

        if (!participant) {
          socket.emit('chat-error', {
            error: 'Not a participant in this conversation',
            errorCode: 'NOT_MEMBER'
          });
          return;
        }

        const updatedMessage = await prisma.message.update({
          where: { id: messageId },
          data: {
            isRead: true,
            readAt: new Date()
          }
        });

        io.to(`conversation-${message.conversationId}`).emit('message-read', {
          messageId,
          readAt: updatedMessage.readAt
        });
      } catch (error) {
        console.error('Error marking message as read:', error);
        socket.emit('chat-error', {
          error: 'Failed to mark message as read',
          errorCode: 'INTERNAL_ERROR'
        });
      }
    });

    // Typing indicator with membership check
    socket.on('typing', async (conversationId) => {
      try {
        // Verify user is participant
        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            conversationId,
            userId: socket.data.user.id
          }
        });

        if (!participant) {
          return; // Silently ignore typing from non-participants
        }

        socket.to(`conversation-${conversationId}`).emit('user-typing', {
          userId: socket.data.user.id,
          userName: socket.data.user.name
        });
      } catch (error) {
        console.error('Error handling typing indicator:', error);
      }
    });

    socket.on('stop-typing', async (conversationId) => {
      try {
        // Verify user is participant
        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            conversationId,
            userId: socket.data.user.id
          }
        });

        if (!participant) {
          return; // Silently ignore stop-typing from non-participants
        }

        socket.to(`conversation-${conversationId}`).emit('user-stop-typing', {
          userId: socket.data.user.id
        });
      } catch (error) {
        console.error('Error handling stop-typing indicator:', error);
      }
    });

    // Notification events
    socket.on('fetch-notifications', async () => {
      try {
        const notifications = await prisma.notification.findMany({
          where: {
            userId: socket.data.user.id,
            isRead: false
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        });

        socket.emit('notifications-loaded', notifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        socket.emit('notification-error', {
          error: 'Failed to fetch notifications',
          errorCode: 'INTERNAL_ERROR'
        });
      }
    });

    socket.on('mark-notification-read', async (notificationId) => {
      try {
        await prisma.notification.update({
          where: { id: notificationId },
          data: { isRead: true }
        });

        // Emit updated notification counts to the user
        const counts = await getNotificationCounts(socket.data.user.id);
        socket.emit('notification-counts', counts);
      } catch (error) {
        console.error('Error marking notification as read:', error);
        socket.emit('notification-error', {
          error: 'Failed to mark notification as read',
          errorCode: 'INTERNAL_ERROR'
        });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.data.user.name} disconnected: ${socket.id}`);
      cleanupRateLimit(socket.id);
      socket.data.hasJoinedConversations = false;
    });
  });

  // Function to emit notifications to specific users
  io.emitNotification = async (userId, notification) => {
    try {
      const counts = await getNotificationCounts(userId);
      
      // Emit to the specific user's room
      io.to(`user-${userId}`).emit('notification:new', notification);
      io.to(`user-${userId}`).emit('notification:counts', counts);
      
      console.log(`🔔 Notification sent to user ${userId}:`, notification.title);
    } catch (error) {
      console.error('Error emitting notification:', error);
    }
  };

  // Function to emit move-in verification updates to landlords
  io.emitMoveInVerificationUpdate = async (landlordId, offerId, status) => {
    try {
      // Emit to the specific landlord's room
      io.to(`user-${landlordId}`).emit('movein-verification:update', {
        offerId,
        status,
        timestamp: new Date()
      });
      
      console.log(`🏠 Move-in verification update sent to landlord ${landlordId}: ${status}`);
    } catch (error) {
      console.error('Error emitting move-in verification update:', error);
    }
  };

  return io;
}
