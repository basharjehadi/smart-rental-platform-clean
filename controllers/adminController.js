import prisma from '../lib/prisma.js';

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// Get all rental requests
const getAllRentals = async (req, res) => {
  try {
    const rentals = await prisma.rentalRequest.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ rentals });
  } catch (error) {
    console.error('Get all rentals error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// Get all payments
const getAllPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ payments });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// Update rental lock status
const updateRentalLockStatus = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const { isLocked } = req.body;

    const rental = await prisma.rentalRequest.update({
      where: { id: rentalId },
      data: {
        isLocked: isLocked,
        status: isLocked ? 'LOCKED' : 'ACTIVE'
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`🔒 Admin ${isLocked ? 'locked' : 'unlocked'} rental: ${rentalId}`);

    res.json({
      message: `Rental ${isLocked ? 'locked' : 'unlocked'} successfully`,
      rental
    });
  } catch (error) {
    console.error('Update rental lock status error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// Trigger daily cron job
const triggerDailyCron = async (req, res) => {
  try {
    console.log('🔧 Admin triggered daily cron job');
    
    // Import the daily rent check function
    const { dailyRentCheck } = await import('./cronController.js');
    
    // Run the daily rent check
    await dailyRentCheck();
    
    res.json({
      message: 'Daily cron job completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Trigger daily cron error:', error);
    res.status(500).json({
      error: 'Failed to trigger daily cron job',
      message: error.message
    });
  }
};

export {
  getAllUsers,
  getAllRentals,
  getAllPayments,
  updateRentalLockStatus,
  triggerDailyCron
}; 