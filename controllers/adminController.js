import prisma from '../lib/prisma.js';
import { sendKYCApprovalEmail, sendKYCRejectionEmail } from '../utils/emailService.js';

// 🚀 SCALABILITY: Get all users with pagination and filtering
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (role) where.role = role;
    if (status === 'verified') where.isVerified = true;
    if (status === 'unverified') where.isVerified = false;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          _count: {
            select: {
              rentalRequests: true,
              offers: true,
              payments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 🚀 SCALABILITY: Get users pending KYC verification
export const getPendingKYCUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        identityDocument: { not: null },
        isVerified: false,
        role: { in: ['TENANT', 'LANDLORD'] }
      },
      include: {
        _count: {
          select: {
            rentalRequests: true,
            offers: true,
            payments: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get pending KYC users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 🚀 SCALABILITY: Verify user KYC
export const verifyUserKYC = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isApproved, rejectionReason } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        rentalRequests: true,
        offers: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.identityDocument) {
      return res.status(400).json({ error: 'User has no identity document uploaded' });
    }

    if (isApproved) {
      // Approve KYC
      await prisma.user.update({
        where: { id: userId },
        data: { 
          isVerified: true,
          verifiedAt: new Date()
        }
      });

      // Send approval email
      await sendKYCApprovalEmail(user.email, user.name);

      res.json({ 
        message: 'User KYC approved successfully',
        user: { ...user, isVerified: true }
      });
    } else {
      // Reject KYC
      if (!rejectionReason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { 
          isVerified: false,
          verificationRejectionReason: rejectionReason,
          verifiedAt: null
        }
      });

      // Send rejection email
      await sendKYCRejectionEmail(user.email, user.name, rejectionReason);

      res.json({ 
        message: 'User KYC rejected',
        user: { ...user, isVerified: false, verificationRejectionReason: rejectionReason }
      });
    }
  } catch (error) {
    console.error('Verify user KYC error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 🚀 SCALABILITY: Get system analytics
export const getSystemAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get analytics data (simplified for development)
    const totalUsers = await prisma.user.count().catch(() => 0);
    const newUsers = await prisma.user.count({
      where: { createdAt: { gte: startDate } }
    }).catch(() => 0);
    
    const totalRentalRequests = await prisma.rentalRequest.count().catch(() => 0);
    const newRentalRequests = await prisma.rentalRequest.count({
      where: { createdAt: { gte: startDate } }
    }).catch(() => 0);
    
    const totalOffers = await prisma.offer.count().catch(() => 0);
    const newOffers = await prisma.offer.count({
      where: { createdAt: { gte: startDate } }
    }).catch(() => 0);
    
    const totalPayments = await prisma.payment.count({
      where: { status: 'SUCCEEDED' }
    }).catch(() => 0);
    
    const totalRevenue = await prisma.payment.aggregate({
      where: { status: 'SUCCEEDED' },
      _sum: { amount: true }
    }).catch(() => ({ _sum: { amount: 0 } }));
    
    const pendingKYC = await prisma.user.count({
      where: {
        identityDocument: { not: null },
        isVerified: false
      }
    }).catch(() => 0);
    
    const activeContracts = await prisma.contract.count({
      where: { status: 'SIGNED' }
    }).catch(() => 0);

    // Get user growth over time (simplified for SQLite compatibility)
    const userGrowth = await prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true }
    }).catch(() => []); // Handle case where User table doesn't exist

    // Get payment trends (simplified for SQLite compatibility)
    const paymentTrends = await prisma.payment.findMany({
      where: { 
        status: 'SUCCEEDED',
        createdAt: { gte: startDate }
      },
      select: { createdAt: true, amount: true }
    }).catch(() => []); // Handle case where Payment table doesn't exist

    res.json({
      analytics: {
        totalUsers,
        newUsers,
        totalRentalRequests,
        newRentalRequests,
        totalOffers,
        newOffers,
        totalPayments,
        totalRevenue: totalRevenue._sum.amount || 0,
        pendingKYC,
        activeContracts
      },
      trends: {
        userGrowth: userGrowth.length,
        paymentTrends: paymentTrends.length
      },
      period
    });
  } catch (error) {
    console.error('Get system analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 🚀 SCALABILITY: Get all rental requests
export const getAllRentalRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.poolStatus = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [rentalRequests, total] = await Promise.all([
      prisma.rentalRequest.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
              isVerified: true
            }
          },
          offer: {
            include: {
              landlord: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  isVerified: true
                }
              }
            }
          },
          payments: {
            where: { status: 'SUCCEEDED' }
          },
          contract: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.rentalRequest.count({ where })
    ]);

    res.json({
      rentalRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all rental requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 🚀 SCALABILITY: Get all payments
export const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, purpose } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (purpose) where.purpose = purpose;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          rentalRequest: {
            include: {
              tenant: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              offer: {
                include: {
                  landlord: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.payment.count({ where })
    ]);

    res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 🚀 SCALABILITY: Suspend/unsuspend user
export const toggleUserSuspension = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isSuspended, reason } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: isSuspended,
        suspensionReason: isSuspended ? reason : null,
        suspendedAt: isSuspended ? new Date() : null
      }
    });

    res.json({
      message: `User ${isSuspended ? 'suspended' : 'unsuspended'} successfully`,
      user: { ...user, isSuspended, suspensionReason: isSuspended ? reason : null }
    });
  } catch (error) {
    console.error('Toggle user suspension error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 🚀 SCALABILITY: Get system health metrics
export const getSystemHealth = async (req, res) => {
  try {
    // Get health metrics (with error handling for missing tables)
    const totalUsers = await prisma.user.count().catch(() => 0);
    const activeUsers = await prisma.user.count({ 
      where: { lastLoginAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } 
    }).catch(() => 0);
    
    const totalRentalRequests = await prisma.rentalRequest.count().catch(() => 0);
    const activeRentalRequests = await prisma.rentalRequest.count({ 
      where: { poolStatus: 'ACTIVE' } 
    }).catch(() => 0);
    
    const totalOffers = await prisma.offer.count().catch(() => 0);
    const pendingKYC = await prisma.user.count({ 
      where: { identityDocument: { not: null }, isVerified: false } 
    }).catch(() => 0);
    
    const totalPayments = await prisma.payment.count().catch(() => 0);
    const successfulPayments = await prisma.payment.count({ 
      where: { status: 'SUCCEEDED' } 
    }).catch(() => 0);
    
    const systemUptime = process.uptime(); // System uptime in seconds

    const healthMetrics = {
      users: {
        total: totalUsers,
        active: activeUsers,
        activePercentage: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : 0
      },
      requests: {
        total: totalRentalRequests,
        active: activeRentalRequests,
        activePercentage: totalRentalRequests > 0 ? ((activeRentalRequests / totalRentalRequests) * 100).toFixed(2) : 0
      },
      offers: {
        total: totalOffers
      },
      kyc: {
        pending: pendingKYC
      },
      payments: {
        total: totalPayments,
        successful: successfulPayments,
        successRate: totalPayments > 0 ? ((successfulPayments / totalPayments) * 100).toFixed(2) : 0
      },
      system: {
        uptime: Math.floor(systemUptime / 3600), // Hours
        status: 'healthy'
      }
    };

    res.json({ healthMetrics });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 🚀 SCALABILITY: Trigger system maintenance
export const triggerSystemMaintenance = async (req, res) => {
  try {
    const { action } = req.body;

    switch (action) {
      case 'cleanup_expired_requests':
        // Clean up expired rental requests
        const expiredRequests = await prisma.rentalRequest.findMany({
          where: {
            moveInDate: { lt: new Date() },
            poolStatus: 'ACTIVE'
          }
        });

        await prisma.rentalRequest.updateMany({
          where: {
            moveInDate: { lt: new Date() },
            poolStatus: 'ACTIVE'
          },
          data: { poolStatus: 'EXPIRED' }
        });

        res.json({
          message: `Cleaned up ${expiredRequests.length} expired rental requests`
        });
        break;

      case 'generate_missing_contracts':
        // Generate missing contracts for paid offers
        const paidOffersWithoutContracts = await prisma.offer.findMany({
          where: {
            status: 'PAID',
            rentalRequest: {
              contract: null
            }
          },
          include: {
            rentalRequest: true
          }
        });

        // This would trigger contract generation for each offer
        // Implementation depends on your contract generation logic
        res.json({
          message: `Found ${paidOffersWithoutContracts.length} paid offers without contracts`
        });
        break;

      default:
        res.status(400).json({ error: 'Invalid maintenance action' });
    }
  } catch (error) {
    console.error('Trigger system maintenance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 