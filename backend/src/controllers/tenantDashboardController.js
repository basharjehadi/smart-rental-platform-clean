import { prisma } from '../utils/prisma.js';

// Get tenant's active lease and dashboard data
export const getTenantDashboardData = async (req, res) => {
  try {
    const tenantId = req.user.id;
    console.log('🔍 Fetching dashboard data for tenant:', tenantId);

    // Get tenant's active lease (paid offers represent active leases)
    const activeLease = await prisma.offer.findFirst({
      where: {
        rentalRequest: {
          tenantId: tenantId
        },
        status: 'PAID' // Paid offers represent active leases
      },
      include: {
        rentalRequest: {
          include: {
            tenant: true
          }
        },
        landlord: true
      }
    });

    console.log('🔍 Active lease found:', activeLease ? 'Yes' : 'No');
    console.log('🔍 Active lease ID:', activeLease?.id);
    
    // If no active lease, return appropriate empty state data
    if (!activeLease) {
      console.log('❌ No active lease found for tenant:', tenantId);
      return res.json({
        tenant: req.user,
        hasActiveLease: false,
        offerId: null,
        property: null,
        landlord: null,
        lease: null,
        payments: [],
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

    // Simplified response with basic data
    const responseData = {
      tenant: req.user,
      hasActiveLease: true,
      offerId: activeLease.id,
      property: {
        address: activeLease.rentalRequest.location,
        rooms: activeLease.rentalRequest.bedrooms || 2,
        bathrooms: activeLease.rentalRequest.bathrooms || 1,
        area: activeLease.propertySize || '65 m²',
        leaseTerm: activeLease.leaseDuration || 12,
        amenities: ['Parking Space', 'Washing Machine', 'Air Conditioning', 'Balcony', 'Internet', 'Elevator']
      },
      landlord: {
        name: activeLease.landlord.firstName && activeLease.landlord.lastName ? 
          `${activeLease.landlord.firstName} ${activeLease.landlord.lastName}` : 
          activeLease.landlord.name || 'Landlord',
        company: 'Individual Landlord',
        email: activeLease.landlord.email,
        phone: activeLease.landlord.phoneNumber || 'Not provided',
        address: activeLease.landlord.street && activeLease.landlord.city ? 
          `${activeLease.landlord.street}, ${activeLease.landlord.city} ${activeLease.landlord.zipCode}, ${activeLease.landlord.country}` : 
          'Not provided'
      },
      lease: {
        startDate: activeLease.rentalRequest.moveInDate,
        endDate: activeLease.leaseEndDate || new Date(activeLease.rentalRequest.moveInDate).setFullYear(
          new Date(activeLease.rentalRequest.moveInDate).getFullYear() + 1
        ),
        monthlyRent: activeLease.rentAmount || activeLease.rentalRequest.budget || 0,
        securityDeposit: activeLease.depositAmount || activeLease.rentalRequest.budget || 0
      },
      payments: [],
      accountStatus: {
        paymentHistory: 'No Data',
        leaseCompliance: 'Good',
        communication: 'Responsive'
      },
      upcomingActions: [
        'Lease renewal decision due in 30 days',
        'Annual inspection scheduled for next month',
        'Update emergency contact information'
      ]
    };

    console.log('✅ Dashboard data prepared successfully');
    console.log('🔍 Offer ID in response:', responseData.offerId);
    res.json(responseData);

  } catch (error) {
    console.error('Error fetching tenant dashboard data:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      details: error.message
    });
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
        status: 'PAID'
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