import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = decoded.userId;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.name} connected: ${socket.id}`);

    // Join user's conversations
    socket.on('join-conversations', async () => {
      try {
        const conversations = await prisma.conversationParticipant.findMany({
          where: { userId: socket.userId },
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
                        profileImage: true
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
                }
              }
            }
          }
        });

        conversations.forEach(participant => {
          socket.join(`conversation-${participant.conversation.id}`);
        });

        socket.emit('conversations-loaded', conversations.map(p => p.conversation));
      } catch (error) {
        console.error('Error joining conversations:', error);
      }
    });

    // Join a specific conversation
    socket.on('join-conversation', async (conversationId) => {
      try {
        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            conversationId,
            userId: socket.userId
          }
        });

        if (participant) {
          socket.join(`conversation-${conversationId}`);
          socket.emit('joined-conversation', conversationId);
        }
      } catch (error) {
        console.error('Error joining conversation:', error);
      }
    });

    // Send a message
    socket.on('send-message', async (data) => {
      try {
        const { conversationId, content, messageType = 'TEXT', attachmentUrl, attachmentName, attachmentSize, attachmentType, replyToId } = data;

        // Verify user is participant in conversation
        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            conversationId,
            userId: socket.userId
          }
        });

        if (!participant) {
          socket.emit('error', 'Not a participant in this conversation');
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
            senderId: socket.userId
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
        socket.emit('error', 'Failed to send message');
      }
    });

    // Mark message as read
    socket.on('mark-read', async (messageId) => {
      try {
        const message = await prisma.message.update({
          where: { id: messageId },
          data: {
            isRead: true,
            readAt: new Date()
          }
        });

        io.to(`conversation-${message.conversationId}`).emit('message-read', {
          messageId,
          readAt: message.readAt
        });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Typing indicator
    socket.on('typing', (conversationId) => {
      socket.to(`conversation-${conversationId}`).emit('user-typing', {
        userId: socket.userId,
        userName: socket.user.name
      });
    });

    socket.on('stop-typing', (conversationId) => {
      socket.to(`conversation-${conversationId}`).emit('user-stop-typing', {
        userId: socket.userId
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.name} disconnected: ${socket.id}`);
    });
  });

  return io;
}
