import { prisma } from '../utils/prisma.js';

// Global variable to store socket.io instance
let io = null;

// Function to set socket.io instance
export function setSocketIO(socketInstance) {
  io = socketInstance;
}

export class NotificationService {
  // Create notification for new rental request
  static async createRentalRequestNotification(landlordId, rentalRequestId, tenantName) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: landlordId,
          type: 'NEW_RENTAL_REQUEST',
          entityId: rentalRequestId.toString(),
          title: 'New Rental Request',
          body: `${tenantName} sent you a rental request`
        }
      });

      // Emit real-time notification if socket.io is available
      if (io) {
        await io.emitNotification(landlordId, notification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating rental request notification:', error);
      throw error;
    }
  }

  // Create notification for new offer
  static async createOfferNotification(tenantId, offerId, landlordName, propertyAddress) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: tenantId,
          type: 'NEW_OFFER',
          entityId: offerId,
          title: 'New Offer',
          body: `${landlordName} sent you an offer for ${propertyAddress}`
        }
      });

      // Emit real-time notification if socket.io is available
      if (io) {
        await io.emitNotification(tenantId, notification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating offer notification:', error);
      throw error;
    }
  }

  // Get unread count for a specific user and type
  static async getUnreadCount(userId, type) {
    try {
      return await prisma.notification.count({
        where: {
          userId,
          type,
          isRead: false
        }
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Mark notifications as read by type
  static async markAsReadByType(userId, type) {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          type,
          isRead: false
        },
        data: {
          isRead: true
        }
      });
    } catch (error) {
      console.error('Error marking notifications as read by type:', error);
      throw error;
    }
  }
}
