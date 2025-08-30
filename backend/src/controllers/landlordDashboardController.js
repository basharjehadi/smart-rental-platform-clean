import { PrismaClient } from '@prisma/client';
import {
  getLandlordPaymentData,
  getLandlordMonthlyRevenue,
} from '../services/paymentService.js';

const prisma = new PrismaClient();

const getLandlordDashboard = async (req, res) => {
  try {
    const landlordId = req.user.id;

    // Get properties and calculate portfolio metrics
    const properties = await prisma.property.findMany({
      where: {
        organization: {
          members: { some: { userId: landlordId } },
        },
      },
      include: {
        offers: {
          include: {
            rentalRequest: {
              include: {
                tenantGroup: {
                  include: {
                    members: {
                      where: { isPrimary: true },
                      include: {
                        user: {
                          select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Calculate portfolio metrics based on offers
    const totalProperties = properties.length;
    const totalOffers = properties.reduce(
      (sum, property) => sum + property.offers.length,
      0
    );
    // Only count PAID offers that were not cancelled via move-in review
    const activeOffers = properties.reduce(
      (sum, property) =>
        sum +
        property.offers.filter(
          (offer) =>
            offer.status === 'PAID' &&
            offer.moveInVerificationStatus !== 'CANCELLED'
        ).length,
      0
    );
    const vacantProperties = totalProperties - activeOffers;
    const occupancyRate =
      totalProperties > 0
        ? Math.round((activeOffers / totalProperties) * 100)
        : 0;

    // Calculate monthly revenue based on actual payments (prorated first month + rent payments)
    const monthlyRevenue = await getLandlordMonthlyRevenue(landlordId);

    // Get recent tenants from PAID offers
    const recentTenants = await prisma.offer.findMany({
      where: {
        organization: {
          members: { some: { userId: landlordId } },
        },
        status: 'PAID',
        moveInVerificationStatus: { not: 'CANCELLED' },
      },
      include: {
        property: true,
        rentalRequest: {
          include: {
            tenantGroup: {
              include: {
                members: {
                  where: { isPrimary: true },
                  include: {
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    const tenantData = recentTenants.map((offer) => {
      const primaryMember = offer.rentalRequest.tenantGroup?.members?.[0];
      const tenant = primaryMember?.user || {};
      const tenantName =
        tenant.firstName && tenant.lastName
          ? `${tenant.firstName} ${tenant.lastName}`
          : tenant.email || 'Tenant';

      return {
        name: tenantName,
        property: offer.property?.title || offer.property?.name || 'Property',
        status: 'Paid',
      };
    });

    // Get upcoming tasks (lease renewals, inspections, etc.)
    const upcomingTasks = [];

    // Add lease renewals based on offer end dates
    const expiringOffers = await prisma.offer.findMany({
      where: {
        organization: {
          members: { some: { userId: landlordId } },
        },
        status: 'PAID',
        moveInVerificationStatus: { not: 'CANCELLED' },
        leaseEndDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
        },
      },
      include: {
        property: true,
        rentalRequest: {
          include: {
            tenantGroup: {
              include: {
                members: {
                  where: { isPrimary: true },
                  include: {
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    expiringOffers.forEach((offer) => {
      // Get the primary tenant from the tenant group
      const primaryMember = offer.rentalRequest.tenantGroup?.members?.[0];
      const tenant = primaryMember?.user;

      upcomingTasks.push({
        title: 'Lease Renewal Due',
        description: `${tenant?.firstName || ''} ${tenant?.lastName || ''} - ${offer.property.title || offer.property.name}`,
        type: 'renewal',
        bgColor: 'bg-red-50',
        date: offer.leaseEndDate,
      });
    });

    // Add property inspections (mock data for now)
    upcomingTasks.push({
      title: 'Property Inspection',
      description: 'Żoliborz Studios - Dec 20',
      type: 'inspection',
      bgColor: 'bg-yellow-50',
    });

    upcomingTasks.push({
      title: 'Rent Collection',
      description: 'Follow-up required - Dec 25',
      type: 'collection',
      bgColor: 'bg-blue-50',
    });

    // Use unified payment service for consistent data
    const paymentData = await getLandlordPaymentData(landlordId);

    // Get tenant reviews - Since reviews are not implemented yet, we'll use mock data
    const reviews = [];
    const reviewData = [];
    const allReviews = [];

    // Mock review data for now
    reviewData.push({
      tenantName: 'John Doe',
      property: 'Sample Property',
      rating: 5,
      comment: 'Great landlord, very responsive!',
      date: new Date(),
    });

    const averageRating =
      allReviews.length > 0
        ? Math.round(
            (allReviews.reduce((sum, review) => sum + review.rating, 0) /
              allReviews.length) *
              10
          ) / 10
        : 0;

    // Get maintenance requests - Since maintenance requests are not implemented yet, we'll use mock data
    const maintenanceRequests = [];
    const maintenanceData = [];

    // Mock maintenance data for now
    maintenanceData.push({
      title: 'Heating System Repair',
      tenant: 'John Doe',
      property: 'Sample Property',
      status: 'In Progress',
    });

    // Get upcoming renewals count - Fixed query to go through offers
    const upcomingRenewals = await prisma.offer.count({
      where: {
        organization: {
          members: { some: { userId: landlordId } },
        },
        status: 'PAID',
        leaseEndDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
        },
      },
    });

    const dashboardData = {
      // Portfolio metrics
      totalProperties,
      activeProperties: totalProperties,
      totalUnits: totalOffers, // Using offers instead of units
      occupiedUnits: activeOffers, // Using active offers instead of occupied units
      vacantUnits: vacantProperties, // Using vacant properties instead of vacant units
      occupancyRate,
      monthlyRevenue,
      expiringContracts: upcomingRenewals, // Renamed for clarity

      // Recent data
      recentTenants: tenantData,
      upcomingTasks: upcomingTasks.slice(0, 3),
      paymentHistory: paymentData.payments, // Renamed to match frontend
      reviews: reviewData, // Renamed to match frontend
      maintenanceRequests: maintenanceData,

      // Aggregated data
      averageRating: 4.5, // Mock data for now
      totalReviews: 1, // Mock data for now
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching landlord dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

export { getLandlordDashboard };
