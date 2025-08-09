import { prisma } from '../utils/prisma.js';

// Helper function to get tenant payment data
const getTenantPaymentsData = async (tenantId) => {
  try {
    console.log('🔍 getTenantPaymentsData called with tenantId:', tenantId);
    
    // Get general payments (deposits, first month payments, etc.)
    // Look for payments by userId OR by rentalRequestId where the rental request belongs to this tenant
    const generalPayments = await prisma.payment.findMany({
      where: {
        OR: [
          {
            userId: tenantId,
            status: 'SUCCEEDED'
          },
          {
            rentalRequest: {
              tenantId: tenantId
            },
            status: 'SUCCEEDED'
          }
        ]
      },
      include: {
        rentalRequest: {
          include: {
            tenant: true
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
        userId: tenantId,
        status: 'SUCCEEDED'
      },
      include: {
        user: true
      },
      orderBy: {
        paidDate: 'desc'
      }
    });

    // Combine and format all payments
    const allPayments = [];

    // Add general payments
    generalPayments.forEach(payment => {
      allPayments.push({
        month: new Date(payment.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        date: payment.createdAt,
        amount: payment.amount,
        status: payment.status === 'SUCCEEDED' ? 'Paid' : payment.status,
        purpose: payment.purpose,
        type: 'general'
      });
    });

    // Add rent payments
    rentPayments.forEach(payment => {
      allPayments.push({
        month: new Date(payment.paidDate || payment.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        date: payment.paidDate || payment.createdAt,
        amount: payment.amount,
        status: payment.status === 'SUCCEEDED' ? 'Paid' : payment.status,
        purpose: 'RENT',
        type: 'rent'
      });
    });

    // Sort by date (most recent first)
    allPayments.sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log('🔍 getTenantPaymentsData returning payments:', allPayments.length);
    console.log('🔍 Payment details:', allPayments);

    return allPayments;
  } catch (error) {
    console.error('Error fetching tenant payments:', error);
    return [];
  }
};

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
        propertyType: activeLease.propertyType || activeLease.rentalRequest.propertyType || 'Apartment',
        rooms: activeLease.rentalRequest.bedrooms || 2,
        bathrooms: activeLease.rentalRequest.bathrooms || 1,
        area: activeLease.propertySize || '65 m²',
        leaseTerm: activeLease.leaseDuration || 12,
        amenities: activeLease.propertyAmenities ? (() => {
          try {
            return typeof activeLease.propertyAmenities === 'string' ? JSON.parse(activeLease.propertyAmenities) : activeLease.propertyAmenities;
          } catch (error) {
            console.warn('Failed to parse propertyAmenities:', activeLease.propertyAmenities, error);
            return ['No amenities listed'];
          }
        })() : ['No amenities listed']
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
      payments: await getTenantPaymentsData(tenantId),
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
    console.log('🔍 Payments data in response:', responseData.payments);
    console.log('🔍 Payments count:', responseData.payments?.length || 0);
    console.log('🔍 Full response data:', JSON.stringify(responseData, null, 2));
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

    // Use the enhanced payment query that looks for payments by userId OR rentalRequestId
    const payments = await getTenantPaymentsData(tenantId);

    res.json({
      payments: payments
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
              amenities: activeLease.propertyAmenities ? (() => {
          try {
            return typeof activeLease.propertyAmenities === 'string' ? JSON.parse(activeLease.propertyAmenities) : activeLease.propertyAmenities;
          } catch (error) {
            console.warn('Failed to parse propertyAmenities:', activeLease.propertyAmenities, error);
            return ['Parking Space', 'Washing Machine', 'Air Conditioning', 'Balcony', 'Internet', 'Elevator'];
          }
        })() : ['Parking Space', 'Washing Machine', 'Air Conditioning', 'Balcony', 'Internet', 'Elevator']
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

// Get tenant's payment history with upcoming payments
export const getTenantPaymentHistory = async (req, res) => {
  try {
    const tenantId = req.user.id;

    // Get past payments
    const pastPayments = await getTenantPaymentsData(tenantId);

    // Get lease information to generate upcoming payments
    const activeLease = await prisma.offer.findFirst({
      where: {
        rentalRequest: {
          tenantId: tenantId
        },
        status: 'PAID'
      },
      include: {
        rentalRequest: true
      }
    });

    let upcomingPayments = [];
    if (activeLease) {
      upcomingPayments = generateUpcomingPayments(activeLease);
    }

    res.json({
      payments: pastPayments,
      upcomingPayments: upcomingPayments,
      lease: activeLease ? {
        startDate: activeLease.rentalRequest.moveInDate,
        endDate: activeLease.leaseEndDate || new Date(activeLease.rentalRequest.moveInDate).setFullYear(
          new Date(activeLease.rentalRequest.moveInDate).getFullYear() + 1
        ),
        monthlyRent: activeLease.rentAmount || activeLease.rentalRequest.budget || 0,
        securityDeposit: activeLease.depositAmount || activeLease.rentalRequest.budget || 0
      } : null
    });

  } catch (error) {
    console.error('Error fetching tenant payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};

// Helper function to generate upcoming payments
const generateUpcomingPayments = (lease) => {
  if (!lease || !lease.rentalRequest.moveInDate || !lease.rentAmount) {
    return [];
  }

  const upcoming = [];
  const startDate = new Date(lease.rentalRequest.moveInDate);
  const endDate = lease.leaseEndDate ? new Date(lease.leaseEndDate) : new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
  const monthlyRent = lease.rentAmount;

  // Polish landlord-friendly approach: Standard monthly payments
  // First month is already paid with deposit (prorated for partial month)
  // All other months: Full monthly rent due on 10th of each month
  
  // Start from the second month (first month is already paid)
  let currentDate = new Date(startDate);
  currentDate.setMonth(currentDate.getMonth() + 1);
  
  // Set to 1st of the month for consistent calculation
  currentDate.setDate(1);

  // Generate payments for each month until lease end
  while (currentDate < endDate) {
    // Calculate due date (10th of the month)
    const dueDate = new Date(currentDate);
    dueDate.setDate(10);

    // Check if this is the last month (August 2026)
    const isLastMonth = currentDate.getMonth() === endDate.getMonth() && currentDate.getFullYear() === endDate.getFullYear();
    
    let amount = monthlyRent;
    let description = 'Monthly Rent';
    
    if (isLastMonth) {
      // Last month: prorated for August 1-16 (16 days)
      const daysInLastMonth = endDate.getDate(); // 16 days
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

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return upcoming;
}; 