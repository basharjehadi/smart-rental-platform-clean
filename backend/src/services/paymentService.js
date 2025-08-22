import { prisma } from '../utils/prisma.js';

/**
 * Unified Payment Service for consistent payment data across the application
 */

/**
 * Get unified payment data for a tenant
 * @param {string} userId - Tenant ID
 * @param {string} landlordId - Optional landlord ID for filtering
 * @returns {Object} Unified payment data
 */
export const getUnifiedPaymentData = async (userId, landlordId = null) => {
  try {
    console.log('🔍 getUnifiedPaymentData called with userId:', userId, 'landlordId:', landlordId);
    
    // Get general payments (deposits, first month payments, etc.)
    const generalPayments = await prisma.payment.findMany({
      where: {
        OR: [
          {
            userId: userId,
            status: 'SUCCEEDED'
          },
          {
            rentalRequest: {
              tenantId: userId
            },
            status: 'SUCCEEDED'
          }
        ]
      },
      include: {
        rentalRequest: {
          include: {
            tenant: true,
            offers: {
              where: landlordId ? { landlordId } : {},
              include: {
                property: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get rent payments (monthly rent)
    const rentPayments = await prisma.rentPayment.findMany({
      where: {
        userId: userId,
        status: 'SUCCEEDED'
      },
      include: {
        user: true
      },
      orderBy: {
        paidDate: 'desc'
      }
    });

    // Filter general payments if landlordId is provided
    let filteredGeneralPayments = generalPayments;
    if (landlordId) {
      filteredGeneralPayments = generalPayments.filter(payment => {
        // Check if payment is related to this landlord's property
        return payment.rentalRequest?.offers?.some(offer => offer.landlordId === landlordId);
      });
    }

    // Combine and format all payments
    const allPayments = [];

    // Add general payments (but exclude monthly rent payments to avoid duplicates)
    filteredGeneralPayments.forEach(payment => {
      // Skip general payments that are for monthly rent (these are handled by RentPayment table)
      if (payment.purpose !== 'RENT') {
        allPayments.push({
          description: payment.purpose === 'DEPOSIT_AND_FIRST_MONTH' ? 'Deposit & First Month' : payment.purpose,
          month: new Date(payment.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          date: payment.createdAt,
          amount: payment.amount,
          status: 'paid',
          purpose: payment.purpose,
          type: 'general'
        });
      }
    });

    // Add rent payments
    rentPayments.forEach(payment => {
      allPayments.push({
        description: `Rent - ${new Date(payment.dueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        month: new Date(payment.paidDate || payment.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        date: payment.paidDate || payment.createdAt,
        amount: payment.amount,
        status: 'paid',
        purpose: 'RENT',
        type: 'rent'
      });
    });

    // Sort by date (most recent first)
    allPayments.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate total paid from both sources - ensure consistency
    const totalPaid = await prisma.$transaction(async (tx) => {
      // For general payments, use the filtered version if landlordId is provided
      const generalTotal = await tx.payment.aggregate({
        where: {
          OR: [
            {
              userId: userId,
              status: 'SUCCEEDED'
            },
            {
              rentalRequest: {
                tenantId: userId
              },
              status: 'SUCCEEDED'
            }
          ],
          // Apply landlord filter if provided
          ...(landlordId && {
            rentalRequest: {
              offers: {
                some: { landlordId: landlordId }
              }
            }
          })
        },
        _sum: { amount: true }
      });

      const rentTotal = await tx.rentPayment.aggregate({
        where: {
          userId: userId,
          status: 'SUCCEEDED'
        },
        _sum: { amount: true }
      });

      return (generalTotal._sum.amount || 0) + (rentTotal._sum.amount || 0);
    });

    // Get payment status
    const paymentStatus = await getPaymentStatus(userId);

    // Get on-time payments count
    const onTimePayments = await prisma.rentPayment.count({
      where: {
        userId: userId,
        status: 'SUCCEEDED'
      }
    });

    console.log('✅ getUnifiedPaymentData returning:', {
      totalPayments: allPayments.length,
      totalPaid: totalPaid,
      paymentStatus: paymentStatus,
      onTimePayments: onTimePayments,
      landlordId: landlordId,
      generalPaymentsCount: filteredGeneralPayments.length,
      rentPaymentsCount: rentPayments.length
    });

    return {
      payments: allPayments,
      totalPaid: totalPaid,
      paymentStatus: paymentStatus,
      onTimePayments: onTimePayments,
      generalPayments: filteredGeneralPayments,
      rentPayments: rentPayments
    };
  } catch (error) {
    console.error('❌ Error in getUnifiedPaymentData:', error);
    throw error;
  }
};

/**
 * Get unified payment data for landlord dashboard
 * @param {string} landlordId - Landlord ID
 * @returns {Object} Unified payment data for landlord
 */
export const getLandlordPaymentData = async (landlordId) => {
  try {
    console.log('🔍 getLandlordPaymentData called with landlordId:', landlordId);
    
    // Get all payments related to this landlord's properties
    const recentPayments = await prisma.payment.findMany({
      where: {
        rentalRequest: {
          offers: {
            some: {
              landlordId: landlordId
            }
          }
        },
        status: 'SUCCEEDED'
      },
      include: {
        rentalRequest: {
          include: {
            offers: {
              where: { landlordId: landlordId },
              include: {
                property: true
              }
            },
            tenant: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get all rent payments related to this landlord's properties
    const recentRentPayments = await prisma.rentPayment.findMany({
      where: {
        user: {
          rentalRequests: {
            some: {
              offers: {
                some: {
                  landlordId: landlordId
                }
              }
            }
          }
        },
        status: 'SUCCEEDED'
      },
      include: {
        user: true
      },
      orderBy: { paidDate: 'desc' },
      take: 10
    });

    // Combine and format payments for landlord dashboard
    const allPayments = [
      ...recentPayments.map(payment => ({
        month: new Date(payment.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        collectedDate: `Collected on ${new Date(payment.createdAt).toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })}`,
        amount: payment.amount,
        status: 'Complete',
        type: 'general',
        tenant: payment.rentalRequest?.tenant?.firstName 
          ? `${payment.rentalRequest.tenant.firstName} ${payment.rentalRequest.tenant.lastName}`
          : payment.rentalRequest?.tenant?.name || 'Tenant',
        property: payment.rentalRequest?.offers?.[0]?.property?.name || 'Property'
      })),
      ...recentRentPayments.map(payment => ({
        month: new Date(payment.paidDate || payment.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        collectedDate: `Collected on ${new Date(payment.paidDate || payment.createdAt).toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })}`,
        amount: payment.amount,
        status: 'Complete',
        type: 'rent',
        tenant: payment.user?.firstName 
          ? `${payment.user.firstName} ${payment.user.lastName}`
          : payment.user?.name || 'Tenant',
        property: 'Monthly Rent'
      }))
    ].sort((a, b) => new Date(b.collectedDate.replace('Collected on ', '')) - new Date(a.collectedDate.replace('Collected on ', '')));

    // Calculate total revenue
    const totalRevenue = allPayments.reduce((sum, payment) => sum + payment.amount, 0);

    console.log('✅ getLandlordPaymentData returning:', {
      totalPayments: allPayments.length,
      totalRevenue: totalRevenue
    });

    return {
      payments: allPayments.slice(0, 6), // Return only 6 most recent for dashboard
      totalRevenue: totalRevenue,
      allPayments: allPayments
    };
  } catch (error) {
    console.error('❌ Error in getLandlordPaymentData:', error);
    throw error;
  }
};

/**
 * Get unified payment status for a tenant
 * @param {string} userId - Tenant ID
 * @returns {string} Payment status
 */
export const getPaymentStatus = async (userId) => {
  try {
    const latestRentPayment = await prisma.rentPayment.findFirst({
      where: {
        userId: userId,
        status: 'PENDING'
      },
      orderBy: {
        dueDate: 'desc'
      }
    });

    if (!latestRentPayment) {
      return 'paid';
    }

    const today = new Date();
    const dueDate = new Date(latestRentPayment.dueDate);

    if (dueDate < today) {
      return 'overdue';
    }

    return 'pending';
  } catch (error) {
    console.error('❌ Error in getPaymentStatus:', error);
    return 'unknown';
  }
};

/**
 * Get upcoming payments for a tenant
 * @param {string} userId - Tenant ID
 * @returns {Array} Upcoming payments
 */
export const getUpcomingPayments = async (userId) => {
  try {
    // Get tenant's active lease
    const activeLease = await prisma.offer.findFirst({
      where: {
        rentalRequest: {
          tenantId: userId
        },
        status: 'PAID'
      },
      include: {
        rentalRequest: true
      }
    });

    if (!activeLease || !activeLease.rentalRequest.moveInDate || !activeLease.rentAmount) {
      return [];
    }

    // Get all paid rent payments for this tenant to exclude them
    const paidRentPayments = await prisma.rentPayment.findMany({
      where: {
        userId: userId,
        status: 'SUCCEEDED'
      },
      select: {
        month: true,
        year: true
      }
    });

    // Create a set of paid month-year combinations for fast lookup
    const paidMonths = new Set();
    paidRentPayments.forEach(payment => {
      paidMonths.add(`${payment.month}-${payment.year}`);
    });

    const upcoming = [];
    const startDate = new Date(activeLease.rentalRequest.moveInDate);
    const endDate = activeLease.leaseEndDate ? new Date(activeLease.leaseEndDate) : new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
    const monthlyRent = activeLease.rentAmount;

    let currentDate = new Date(startDate);
    currentDate.setMonth(currentDate.getMonth() + 1);
    currentDate.setDate(1);

    while (currentDate < endDate) {
      const monthKey = `${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;

      if (!paidMonths.has(monthKey)) {
        const dueDate = new Date(currentDate);
        dueDate.setDate(10);

        const isLastMonth = currentDate.getMonth() === endDate.getMonth() && currentDate.getFullYear() === endDate.getFullYear();

        let amount = monthlyRent;
        let description = 'Monthly Rent';

        if (isLastMonth) {
          const daysInLastMonth = endDate.getDate();
          amount = Math.round((monthlyRent * daysInLastMonth) / 30);
          description = 'Final Month (Prorated)';
        }

        upcoming.push({
          month: currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          dueDate: dueDate,
          amount: amount,
          status: 'PENDING',
          type: 'monthly_rent',
          description: description,
          isLastMonth: isLastMonth
        });
      }
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return upcoming;
  } catch (error) {
    console.error('❌ Error in getUpcomingPayments:', error);
    return [];
  }
};
