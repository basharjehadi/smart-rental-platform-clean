import { prisma } from '../utils/prisma.js';

// Get tenant's active lease and dashboard data
export const getTenantDashboardData = async (req, res) => {
  try {
    const tenantId = req.user.id;

    // Get tenant's active lease (assuming there's an active offer/lease)
    const activeLease = await prisma.offer.findFirst({
      where: {
        rentalRequest: {
          tenantId: tenantId
        },
        status: 'ACCEPTED' // Assuming accepted offers represent active leases
      },
      include: {
        rentalRequest: {
          include: {
            tenant: true
          }
        },
        landlord: {
          include: {
            properties: true
          }
        }
      }
    });

    // Get payment history for the tenant
    const payments = await prisma.payment.findMany({
      where: {
        userId: tenantId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5 // Last 5 payments
    });

    // If no active lease, return appropriate empty state data
    if (!activeLease) {
      return res.json({
        tenant: req.user,
        hasActiveLease: false,
        property: null,
        landlord: null,
        lease: null,
        payments: payments,
        accountStatus: {
          paymentHistory: 'No Data',
          leaseCompliance: 'No Data',
          communication: 'No Data'
        },
        upcomingActions: [
          'Create your first rental request',
          'Complete your profile information',
          'Upload identity verification documents'
        ]
      });
    }

    // Get property details from the rental request and offer
    const propertyDetails = {
      address: activeLease.rentalRequest.location,
      rooms: activeLease.rentalRequest.bedrooms || 2,
      bathrooms: activeLease.rentalRequest.bathrooms || 1,
      area: activeLease.propertySize || '65 m²',
      leaseTerm: activeLease.leaseDuration || 12,
      amenities: activeLease.propertyAmenities ? JSON.parse(activeLease.propertyAmenities) : ['Parking Space', 'Washing Machine', 'Air Conditioning', 'Balcony', 'Internet', 'Elevator']
    };

    // Get landlord information
    const landlordInfo = {
      name: activeLease.landlord.firstName + ' ' + activeLease.landlord.lastName,
      company: activeLease.landlord.company || 'Individual Landlord',
      email: activeLease.landlord.email,
      phone: activeLease.landlord.phoneNumber || 'Not provided',
      address: activeLease.landlord.street && activeLease.landlord.city ? 
        `${activeLease.landlord.street}, ${activeLease.landlord.city} ${activeLease.landlord.zipCode}, ${activeLease.landlord.country}` : 
        'Not provided'
    };

    // Calculate lease information
    const leaseInfo = {
      startDate: activeLease.rentalRequest.moveInDate,
      endDate: activeLease.leaseEndDate || new Date(activeLease.rentalRequest.moveInDate).setFullYear(
        new Date(activeLease.rentalRequest.moveInDate).getFullYear() + 1
      ),
      monthlyRent: activeLease.rentAmount || activeLease.rentalRequest.budget || 0,
      securityDeposit: activeLease.depositAmount || activeLease.rentalRequest.budget || 0
    };

    // Calculate account status based on payment history
    const paidPayments = payments.filter(p => p.status === 'SUCCEEDED').length;
    const totalPayments = payments.length;
    const paymentHistoryStatus = totalPayments > 0 ? 
      (paidPayments / totalPayments > 0.8 ? 'Excellent' : 
       paidPayments / totalPayments > 0.6 ? 'Good' : 'Needs Improvement') : 'No Data';

    res.json({
      tenant: req.user,
      hasActiveLease: true,
      property: propertyDetails,
      landlord: landlordInfo,
      lease: leaseInfo,
      payments: payments.map(payment => ({
        month: new Date(payment.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        date: payment.createdAt,
        amount: payment.amount,
        status: payment.status === 'SUCCEEDED' ? 'Paid' : payment.status
      })),
      accountStatus: {
        paymentHistory: paymentHistoryStatus,
        leaseCompliance: 'Good',
        communication: 'Responsive'
      },
      upcomingActions: [
        'Lease renewal decision due in 30 days',
        'Annual inspection scheduled for next month',
        'Update emergency contact information'
      ]
    });

  } catch (error) {
    console.error('Error fetching tenant dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

// Get tenant's payment history
export const getTenantPayments = async (req, res) => {
  try {
    const tenantId = req.user.id;

    const payments = await prisma.payment.findMany({
      where: {
        userId: tenantId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      payments: payments.map(payment => ({
        month: new Date(payment.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        date: payment.createdAt,
        amount: payment.amount,
        status: payment.status === 'SUCCEEDED' ? 'Paid' : payment.status
      }))
    });

  } catch (error) {
    console.error('Error fetching tenant payments:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};

// Get tenant's active lease
export const getTenantActiveLease = async (req, res) => {
  try {
    const tenantId = req.user.id;

    const activeLease = await prisma.offer.findFirst({
      where: {
        rentalRequest: {
          tenantId: tenantId
        },
        status: 'ACCEPTED'
      },
      include: {
        rentalRequest: {
          include: {
            tenant: true
          }
        },
        landlord: {
          include: {
            properties: true
          }
        }
      }
    });

    if (!activeLease) {
      return res.json({
        property: null,
        landlord: null,
        lease: null
      });
    }

    // Format the response
    const propertyDetails = {
      address: activeLease.rentalRequest.location,
      rooms: activeLease.rentalRequest.bedrooms || 2,
      bathrooms: activeLease.rentalRequest.bathrooms || 1,
      area: activeLease.propertySize || '65 m²',
      leaseTerm: activeLease.leaseDuration || 12,
      amenities: activeLease.propertyAmenities ? JSON.parse(activeLease.propertyAmenities) : ['Parking Space', 'Washing Machine', 'Air Conditioning', 'Balcony', 'Internet', 'Elevator']
    };

    const landlordInfo = {
      name: activeLease.landlord.firstName + ' ' + activeLease.landlord.lastName,
      company: activeLease.landlord.company || 'Individual Landlord',
      email: activeLease.landlord.email,
      phone: activeLease.landlord.phoneNumber || 'Not provided',
      address: activeLease.landlord.street && activeLease.landlord.city ? 
        `${activeLease.landlord.street}, ${activeLease.landlord.city} ${activeLease.landlord.zipCode}, ${activeLease.landlord.country}` : 
        'Not provided'
    };

    const leaseInfo = {
      startDate: activeLease.rentalRequest.moveInDate,
      endDate: activeLease.leaseEndDate || new Date(activeLease.rentalRequest.moveInDate).setFullYear(
        new Date(activeLease.rentalRequest.moveInDate).getFullYear() + 1
      ),
      monthlyRent: activeLease.rentAmount || activeLease.rentalRequest.budget || 0,
      securityDeposit: activeLease.depositAmount || activeLease.rentalRequest.budget || 0
    };

    res.json({
      property: propertyDetails,
      landlord: landlordInfo,
      lease: leaseInfo
    });

  } catch (error) {
    console.error('Error fetching tenant active lease:', error);
    res.status(500).json({ error: 'Failed to fetch active lease' });
  }
}; 