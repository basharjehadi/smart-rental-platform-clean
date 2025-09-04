import { prisma } from '../utils/prisma.js';

// Global variable to store socket.io instance
let io = null;

// Function to set socket.io instance
export function setSocketIO(socketInstance) {
  io = socketInstance;
}

export class NotificationService {
  // Create notification for new rental request
  static async createRentalRequestNotification(
    landlordId,
    rentalRequestId,
    tenantName
  ) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: landlordId,
          type: 'NEW_RENTAL_REQUEST',
          entityId: rentalRequestId.toString(),
          title: 'New Rental Request',
          body: `${tenantName} sent you a rental request`,
        },
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
  static async createOfferNotification(
    tenantId,
    offerId,
    landlordName,
    propertyAddress
  ) {
    try {
      if (!tenantId) {
        console.warn('createOfferNotification skipped: tenantId is undefined', {
          offerId,
        });
        return null;
      }
      const notification = await prisma.notification.create({
        data: {
          userId: tenantId,
          type: 'NEW_OFFER',
          entityId: offerId,
          title: 'New Offer',
          body: `${landlordName} sent you an offer for ${propertyAddress}`,
        },
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
          isRead: false,
        },
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
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    } catch (error) {
      console.error('Error marking notifications as read by type:', error);
      throw error;
    }
  }

  // Create payment notification
  static async createPaymentNotification(userId, paymentId, status, amount) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: status === 'SUCCEEDED' ? 'PAYMENT_CONFIRMED' : 'PAYMENT_FAILED',
          entityId: paymentId.toString(),
          title:
            status === 'SUCCEEDED' ? 'Payment Confirmed' : 'Payment Failed',
          body:
            status === 'SUCCEEDED'
              ? `Your payment of $${amount} has been confirmed successfully.`
              : `Your payment of $${amount} could not be processed. Please try again.`,
        },
      });

      if (io) {
        await io.emitNotification(userId, notification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating payment notification:', error);
      throw error;
    }
  }

  // Create contract notification
  static async createContractNotification(
    userId,
    contractId,
    type,
    contractTitle
  ) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: type === 'SIGNED' ? 'CONTRACT_SIGNED' : 'CONTRACT_UPDATED',
          entityId: contractId.toString(),
          title: type === 'SIGNED' ? 'Contract Signed' : 'Contract Updated',
          body:
            type === 'SIGNED'
              ? `Your contract "${contractTitle}" has been signed by all parties.`
              : `Your contract "${contractTitle}" has been updated.`,
        },
      });

      if (io) {
        await io.emitNotification(userId, notification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating contract notification:', error);
      throw error;
    }
  }

  // Create KYC notification
  static async createKYCNotification(userId, status, reason = '') {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: status === 'APPROVED' ? 'KYC_APPROVED' : 'KYC_REJECTED',
          entityId: userId.toString(),
          title: status === 'APPROVED' ? 'KYC Approved' : 'KYC Rejected',
          body:
            status === 'APPROVED'
              ? 'Your KYC verification has been approved successfully.'
              : `Your KYC verification has been rejected. Reason: ${reason}`,
        },
      });

      if (io) {
        await io.emitNotification(userId, notification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating KYC notification:', error);
      throw error;
    }
  }

  // Create property status notification
  static async createPropertyStatusNotification(
    userId,
    propertyId,
    propertyAddress,
    newStatus
  ) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'PROPERTY_STATUS_CHANGED',
          entityId: propertyId.toString(),
          title: 'Property Status Changed',
          body: `The status of your property at ${propertyAddress} has changed to ${newStatus}.`,
        },
      });

      if (io) {
        await io.emitNotification(userId, notification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating property status notification:', error);
      throw error;
    }
  }

  // Create system announcement notification
  static async createSystemAnnouncementNotification(userIds, title, body) {
    try {
      const notifications = await Promise.all(
        userIds.map((userId) =>
          prisma.notification.create({
            data: {
              userId,
              type: 'SYSTEM_ANNOUNCEMENT',
              entityId: 'system',
              title,
              body,
            },
          })
        )
      );

      // Emit to all users
      if (io) {
        for (const notification of notifications) {
          await io.emitNotification(notification.userId, notification);
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error creating system announcement notification:', error);
      throw error;
    }
  }

  // Create account update notification
  static async createAccountUpdateNotification(userId, updateType) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'ACCOUNT_UPDATED',
          entityId: userId.toString(),
          title: 'Account Updated',
          body: `Your account ${updateType} has been updated successfully.`,
        },
      });

      if (io) {
        await io.emitNotification(userId, notification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating account update notification:', error);
      throw error;
    }
  }
}

// Bulk notification creation for rental requests
export async function createManyRentalRequestNotifications(items) {
  if (!Array.isArray(items) || !items.length) return;
  const orgIds = Array.from(new Set(items.map((i) => i.organizationId)));
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: { in: orgIds } },
    select: { organizationId: true, userId: true },
  });
  const byOrg = new Map();
  for (const m of members) {
    if (!byOrg.has(m.organizationId)) byOrg.set(m.organizationId, []);
    byOrg.get(m.organizationId).push(m.userId);
  }
  const notifications = [];
  for (const it of items) {
    const userIds = byOrg.get(it.organizationId) || [];
    for (const userId of userIds) {
      notifications.push({
        userId,
        type: 'NEW_RENTAL_REQUEST',
        entityId: String(it.rentalRequestId),
        title: `New rental request: ${it.title}`,
        body: `${it.tenantName || 'A tenant'} has a request matching your portfolio.`,
        isRead: false,
        createdAt: new Date(),
      });
    }
  }
  if (notifications.length) {
    await prisma.notification.createMany({
      data: notifications,
      skipDuplicates: true,
    });
  }
}
