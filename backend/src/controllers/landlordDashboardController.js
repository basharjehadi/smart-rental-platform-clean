import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const getLandlordDashboard = async (req, res) => {
  try {
    const landlordId = req.user.id;

    // Get properties and calculate portfolio metrics
    const properties = await prisma.property.findMany({
      where: { landlordId },
      include: {
        units: {
          include: {
            lease: {
              include: {
                tenant: true
              }
            }
          }
        }
      }
    });

    // Calculate portfolio metrics
    const totalProperties = properties.length;
    const totalUnits = properties.reduce((sum, property) => sum + property.units.length, 0);
    const occupiedUnits = properties.reduce((sum, property) => 
      sum + property.units.filter(unit => unit.lease && unit.lease.status === 'ACTIVE').length, 0
    );
    const vacantUnits = totalUnits - occupiedUnits;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    // Calculate monthly revenue - Fixed query to go through unit.property
    const activeLeases = await prisma.lease.findMany({
      where: {
        unit: {
          property: { landlordId }
        },
        status: 'ACTIVE'
      },
      include: {
        unit: {
          include: {
            property: true
          }
        }
      }
    });

    const monthlyRevenue = activeLeases.reduce((sum, lease) => sum + (lease.rentAmount || 0), 0);

    // Get recent tenants - Fixed query to go through unit.property
    const recentTenants = await prisma.lease.findMany({
      where: {
        unit: {
          property: { landlordId }
        },
        status: 'ACTIVE'
      },
      include: {
        tenant: true,
        unit: {
          include: {
            property: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    });

    const tenantData = recentTenants.map(lease => ({
      name: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
      property: `${lease.unit.property.name} #${lease.unit.unitNumber}`,
      status: 'Paid' // You can add payment status logic here
    }));

    // Get upcoming tasks (lease renewals, inspections, etc.)
    const upcomingTasks = [];
    
    // Add lease renewals - Fixed query to go through unit.property
    const expiringLeases = await prisma.lease.findMany({
      where: {
        unit: {
          property: { landlordId }
        },
        status: 'ACTIVE',
        endDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
        }
      },
      include: {
        tenant: true,
        unit: {
          include: {
            property: true
          }
        }
      }
    });

    expiringLeases.forEach(lease => {
      upcomingTasks.push({
        title: 'Lease Renewal Due',
        description: `${lease.tenant.firstName} ${lease.tenant.lastName} - ${lease.unit.property.name}`,
        type: 'renewal',
        bgColor: 'bg-red-50',
        date: lease.endDate
      });
    });

    // Add property inspections (mock data for now)
    upcomingTasks.push({
      title: 'Property Inspection',
      description: 'Żoliborz Studios - Dec 20',
      type: 'inspection',
      bgColor: 'bg-yellow-50'
    });

    upcomingTasks.push({
      title: 'Rent Collection',
      description: 'Follow-up required - Dec 25',
      type: 'collection',
      bgColor: 'bg-blue-50'
    });

    // Get recent payments - Fixed query to go through lease.unit.property
    const recentPayments = await prisma.payment.findMany({
      where: {
        lease: {
          unit: {
            property: { landlordId }
          }
        }
      },
      include: {
        lease: {
          include: {
            unit: {
              include: {
                property: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 6
    });

    const paymentData = recentPayments.map(payment => ({
      month: new Date(payment.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      collectedDate: `Collected on ${new Date(payment.createdAt).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })}`,
      amount: payment.amount,
      status: payment.status === 'SUCCEEDED' ? 'Complete' : 'Late Payment'
    }));

    // Get tenant reviews - Fixed query to go through lease.unit.property
    const reviews = await prisma.review.findMany({
      where: {
        lease: {
          unit: {
            property: { landlordId }
          }
        }
      },
      include: {
        tenant: true,
        lease: {
          include: {
            unit: {
              include: {
                property: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    });

    const reviewData = reviews.map(review => ({
      tenantName: `${review.tenant.firstName} ${review.tenant.lastName}`,
      property: review.lease.unit.property.name,
      rating: review.rating,
      comment: review.comment,
      date: review.createdAt
    }));

    // Calculate average rating - Fixed query to go through lease.unit.property
    const allReviews = await prisma.review.findMany({
      where: {
        lease: {
          unit: {
            property: { landlordId }
          }
        }
      }
    });

    const averageRating = allReviews.length > 0 
      ? Math.round((allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length) * 10) / 10
      : 0;

    // Get maintenance requests - Fixed query to go through lease.unit.property
    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      where: {
        lease: {
          unit: {
            property: { landlordId }
          }
        }
      },
      include: {
        lease: {
          include: {
            tenant: true,
            unit: {
              include: {
                property: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 2
    });

    const maintenanceData = maintenanceRequests.map(request => ({
      title: request.title,
      tenant: `${request.lease.tenant.firstName} ${request.lease.tenant.lastName}`,
      property: request.lease.unit.property.name,
      status: request.status
    }));

    // Get upcoming renewals count - Fixed query to go through unit.property
    const upcomingRenewals = await prisma.lease.count({
      where: {
        unit: {
          property: { landlordId }
        },
        status: 'ACTIVE',
        endDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
        }
      }
    });

    const dashboardData = {
      // Portfolio metrics
      totalProperties,
      activeProperties: totalProperties,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      occupancyRate,
      monthlyRevenue,
      upcomingRenewals,

      // Recent data
      recentTenants: tenantData,
      upcomingTasks: upcomingTasks.slice(0, 3),
      recentPayments: paymentData,
      recentReviews: reviewData,
      maintenanceRequests: maintenanceData,

      // Aggregated data
      averageRating,
      totalReviews: allReviews.length
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching landlord dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

export {
  getLandlordDashboard
}; 