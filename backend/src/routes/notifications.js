import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get unread notification counts for the current user
router.get('/unread-counts', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { prisma } = await import('../utils/prisma.js');

    // Get counts by type
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
      // Total unread (all types) to power the bell badge for system notifications too
      prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      })
    ]);

    // Total is ALL unread notifications (business + system)
    const total = allUnread;

    res.json({
      success: true,
      rentalRequests,
      offers,
      total
    });
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread counts'
    });
  }
});

// Get notifications for the current user
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const { prisma } = await import('../utils/prisma.js');

    const notifications = await prisma.notification.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

// Mark a specific notification as read
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { prisma } = await import('../utils/prisma.js');

    const notification = await prisma.notification.update({
      where: {
        id,
        userId // Ensure user can only mark their own notifications as read
      },
      data: {
        isRead: true
      }
    });

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read for the current user
router.put('/read-all', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { prisma } = await import('../utils/prisma.js');

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
});

// Mark notifications by type as read (for when user visits specific pages)
router.put('/read-by-type/:type', verifyToken, async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.user.id;
    const { prisma } = await import('../utils/prisma.js');

    // Validate notification type
    const validTypes = [
      'NEW_RENTAL_REQUEST', 'NEW_OFFER', 'PAYMENT_CONFIRMED', 'PAYMENT_FAILED',
      'CONTRACT_UPDATED', 'CONTRACT_SIGNED', 'KYC_APPROVED', 'KYC_REJECTED',
      'PROPERTY_STATUS_CHANGED', 'SYSTEM_ANNOUNCEMENT', 'ACCOUNT_UPDATED'
    ];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid notification type'
      });
    }

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

    res.json({
      success: true,
      message: `All ${type} notifications marked as read`
    });
  } catch (error) {
    console.error('Error marking notifications by type as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read'
    });
  }
});

export default router;
