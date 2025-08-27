import { prisma } from '../utils/prisma.js';
import { getUnifiedPaymentData, getPaymentStatus, getUpcomingPayments } from '../services/paymentService.js';

// Get all tenants for a landlord
export const getLandlordTenants = async (req, res) => {
  try {
    const landlordId = req.user.id;
    console.log('🔍 Fetching tenants for landlord:', landlordId);
    console.log('🔍 User object:', req.user);

    // Very simple test - just return basic info
    console.log('🔍 Testing basic functionality...');
    
    // Let's test the database queries now
    console.log('🔍 Testing database queries...');

    // Get all PAID offers (only show tenants after payment is completed)
    console.log('🔍 Looking for offers with landlordId:', landlordId, 'and status: PAID');
    
    const paidOffers = await prisma.offer.findMany({
      where: {
        organization: {
          members: { some: { userId: landlordId } }
        },
        status: 'PAID',
        // Exclude unwinded/cancelled bookings
        moveInVerificationStatus: { not: 'CANCELLED' },
        rentalRequest: {
          NOT: { status: 'CANCELLED' }
        }
      },
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
                        name: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phoneNumber: true,
                        profileImage: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            district: true,
            city: true,
            zipCode: true,
            propertyType: true,
            bedrooms: true,
            bathrooms: true,
            size: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('📊 Found paid offers:', paidOffers.length);
    console.log('📊 Paid offers details:', JSON.stringify(paidOffers, null, 2));

    // Also check all offers for this landlord
    const allOffersForLandlord = await prisma.offer.findMany({
      where: {
        organization: { members: { some: { userId: landlordId } } }
      },
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
                        name: true,
                        email: true,
                        firstName: true,
                        lastName: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        property: true
      }
    });
    
    console.log('📊 All offers for this landlord:', allOffersForLandlord.length);
    allOffersForLandlord.forEach(offer => {
      const primaryMember = offer.rentalRequest?.tenantGroup?.members?.[0];
      const tenant = primaryMember?.user;
      console.log(`Offer ID: ${offer.id}, Status: ${offer.status}, Tenant: ${tenant?.name}`);
    });

    // Now let's process the data and return real tenants
    console.log('✅ Processing tenant data...');

    // Transform data to tenant format
    const tenants = await Promise.all(paidOffers.map(async (offer) => {
      // Get the primary tenant from the tenant group
      const primaryMember = offer.rentalRequest.tenantGroup?.members?.[0];
      const tenant = primaryMember?.user;
      
      // Use unified payment service for consistent data
      const paymentData = await getUnifiedPaymentData(tenant.id, landlordId);
      
      // Calculate payment status based on unified data
      let paymentStatus = 'paid';
      if (paymentData.paymentStatus === 'pending' || paymentData.paymentStatus === 'overdue') {
        paymentStatus = paymentData.paymentStatus;
      }

      // Calculate days rented
      const moveInDate = new Date(offer.rentalRequest.moveInDate);
      const today = new Date();
      const daysRented = Math.floor((today - moveInDate) / (1000 * 60 * 60 * 24));

      // Get next payment date from upcoming payments
      const upcomingPayments = await getUpcomingPayments(tenant.id);
      const nextPayment = upcomingPayments.length > 0 ? upcomingPayments[0] : null;

      return {
        offerId: offer.id,
        id: tenant.id,
        name: tenant.firstName && tenant.lastName 
          ? `${tenant.firstName} ${tenant.lastName}`
          : tenant.name,
        email: tenant.email,
        phone: tenant.phoneNumber,
        profileImage: tenant.profileImage || null,
        moveInDate: offer.rentalRequest.moveInDate,
        monthlyRent: offer.rentAmount,
        securityDeposit: offer.depositAmount,
        paymentStatus: paymentStatus,
        totalPaid: paymentData.totalPaid || 0,
        onTimePayments: paymentData.onTimePayments || 0,
        daysRented: Math.max(0, daysRented),
        nextPaymentDate: nextPayment?.dueDate,
        rentalRequestId: offer.rentalRequest.id,
        property: {
          id: offer.property.id,
          title: offer.property.name,
          address: offer.property.address,
          district: offer.property.district || null,
          city: offer.property.city,
          zipCode: offer.property.zipCode,
          propertyType: offer.property.propertyType,
          bedrooms: offer.property.bedrooms,
          bathrooms: offer.property.bathrooms,
          size: offer.property.size
        }
      };
    }));

    console.log('✅ Returning tenants:', tenants.length);
    console.log('✅ Tenants data:', JSON.stringify(tenants, null, 2));

    res.json({
      success: true,
      tenants: tenants
    });

  } catch (error) {
    console.error('❌ Error fetching landlord tenants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tenants'
    });
  }
};

// Get individual tenant details
export const getLandlordTenantDetails = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const { tenantId } = req.params;
    
    console.log('🔍 Fetching tenant details for landlord:', landlordId, 'tenant:', tenantId);

    // Get the specific tenant's paid offer
    const paidOffer = await prisma.offer.findFirst({
      where: {
        organization: { members: { some: { userId: landlordId } } },
        status: 'PAID',
        rentalRequest: {
          tenantId: tenantId
        }
      },
      select: {
        id: true,
        rentAmount: true,
        depositAmount: true,
        leaseDuration: true,
        leaseStartDate: true,
        createdAt: true,
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
                        name: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phoneNumber: true,
                        profileImage: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            zipCode: true,
            propertyType: true,
            bedrooms: true,
            bathrooms: true,
            size: true
          }
        }
      }
    });

    if (!paidOffer) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found or not associated with this landlord'
      });
    }

    // Get contract information
    const contract = await prisma.contract.findFirst({
      where: {
        rentalRequestId: paidOffer.rentalRequest.id
      },
      select: {
        id: true,
        contractNumber: true,
        status: true,
        pdfUrl: true,
        signedAt: true,
        createdAt: true
      }
    });

    // Use unified payment service for consistent data
    let paymentData;
    try {
      paymentData = await getUnifiedPaymentData(tenantId, landlordId);
      console.log('✅ Payment data retrieved successfully:', {
        totalPayments: paymentData.payments?.length || 0,
        totalPaid: paymentData.totalPaid || 0,
        paymentStatus: paymentData.paymentStatus || 'unknown'
      });
    } catch (error) {
      console.error('❌ Error getting unified payment data:', error);
      // Fallback to basic payment data
      paymentData = {
        payments: [],
        totalPaid: 0,
        paymentStatus: 'unknown',
        onTimePayments: 0
      };
    }
    
    // Calculate lease dates correctly (using months, not years)
    // Use offer's leaseStartDate if available, otherwise fall back to moveInDate
    let leaseStartDate;
    if (paidOffer.leaseStartDate) {
      leaseStartDate = new Date(paidOffer.leaseStartDate);
    } else if (paidOffer.rentalRequest.moveInDate) {
      leaseStartDate = new Date(paidOffer.rentalRequest.moveInDate);
    } else {
      // Fallback to offer creation date if no other date is available
      leaseStartDate = new Date(paidOffer.createdAt);
    }

    // Validate that lease start date is not in the future (unless it's a future lease)
    const today = new Date();
    if (leaseStartDate > today) {
      console.log('⚠️ Warning: Lease start date is in the future:', leaseStartDate);
    }

    const leaseEndDate = new Date(leaseStartDate);
    leaseEndDate.setMonth(leaseEndDate.getMonth() + (paidOffer.leaseDuration || 12));

    // Log lease date calculations for debugging
    console.log('🔍 Lease Date Debug Info:', {
      offerLeaseStartDate: paidOffer.leaseStartDate,
      moveInDate: paidOffer.rentalRequest.moveInDate,
      calculatedLeaseStartDate: leaseStartDate,
      calculatedLeaseEndDate: leaseEndDate,
      leaseDuration: paidOffer.leaseDuration,
      today: today
    });

    // Calculate days rented
    const daysRented = Math.floor((today - leaseStartDate) / (1000 * 60 * 60 * 24));

    // Get next payment date using unified payment service
    const upcomingPayments = await getUpcomingPayments(tenant.id);
    const nextPayment = upcomingPayments.length > 0 ? upcomingPayments[0] : null;
    const nextPaymentDate = nextPayment ? nextPayment.dueDate : null;

    // TODO: Remove this query once payment table structure is fixed
    // const nextUnpaidRentPayment = null;

    // TODO: Fix payment table structure first, then implement proper next payment date calculation
    // const nextPaymentDate = null;

    // Create recent activity
    const recentActivity = [
      {
        description: 'Lease agreement signed',
        date: paidOffer.createdAt
      }
    ];

    // Add first payment activity if payments exist
    if (paymentData.payments && paymentData.payments.length > 0) {
      recentActivity.push({
        description: 'First payment received',
        date: paymentData.payments[0].date
      });
    }

    // Get the primary tenant from the tenant group
    const primaryMember = paidOffer.rentalRequest.tenantGroup?.members?.[0];
    const tenant = primaryMember?.user;

    const tenantData = {
      id: tenant.id,
      name: tenant.firstName && tenant.lastName 
        ? `${tenant.firstName} ${tenant.lastName}`
        : tenant.name,
      email: tenant.email,
      phone: tenant.phoneNumber,
      profileImage: tenant.profileImage,
      moveInDate: paidOffer.rentalRequest.moveInDate,
      leaseStartDate: leaseStartDate,
      leaseEndDate: leaseEndDate,
      leaseDuration: `${paidOffer.leaseDuration || 12} months`,
      monthlyRent: paidOffer.rentAmount,
      securityDeposit: paidOffer.depositAmount,
      paymentStatus: paymentData?.paymentStatus || 'unknown',
      totalPaid: paymentData?.totalPaid || 0,
      onTimePayments: paymentData?.onTimePayments || 0,
      daysRented: Math.max(0, daysRented),
      nextPaymentDate: nextPaymentDate,
      contractStatus: 'Active',
      rentalRequestId: paidOffer.rentalRequest.id,
      contract: contract,
      paymentHistory: paymentData?.payments || [],
      recentActivity: recentActivity,
      property: {
        id: paidOffer.property.id,
        title: paidOffer.property.name,
        address: paidOffer.property.address,
        city: paidOffer.property.city,
        zipCode: paidOffer.property.zipCode,
        propertyType: paidOffer.property.propertyType,
        bedrooms: paidOffer.property.bedrooms,
        bathrooms: paidOffer.property.bathrooms,
        size: paidOffer.property.size
      }
    };

    console.log('✅ Returning tenant details for:', tenant.name);

    res.json({
      success: true,
      tenant: tenantData
    });

  } catch (error) {
    console.error('❌ Error fetching tenant details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tenant details'
    });
  }
};

// Get offer data for a specific tenant (for contract generation)
export const getLandlordTenantOffer = async (req, res) => {
  try {
    const { rentalRequestId } = req.params;
    const landlordId = req.user.id;

    console.log('🔍 Getting offer data for rental request:', rentalRequestId, 'by landlord:', landlordId);

    // Find the paid offer for this rental request
    const paidOffer = await prisma.offer.findFirst({
      where: {
        rentalRequestId: parseInt(rentalRequestId),
        organization: { members: { some: { userId: landlordId } } },
        status: 'PAID'
      },
      include: {
        rentalRequest: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                firstName: true,
                lastName: true,
                pesel: true,
                passportNumber: true,
                kartaPobytuNumber: true,
                phoneNumber: true,
                signatureBase64: true,
                street: true,
                city: true,
                zipCode: true,
                country: true
              }
            }
          }
        },
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            dowodOsobistyNumber: true,
            phoneNumber: true,
            address: true,
            signatureBase64: true
          }
        },
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            zipCode: true,
            propertyType: true,
            bedrooms: true,
            bathrooms: true,
            size: true
          }
        }
      }
    });

    if (!paidOffer) {
      return res.status(404).json({
        success: false,
        error: 'Paid offer not found for this rental request'
      });
    }

    console.log('✅ Found paid offer for contract generation:', paidOffer.id);

    res.json({
      success: true,
      offer: paidOffer
    });

  } catch (error) {
    console.error('❌ Error getting landlord tenant offer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get offer data'
    });
  }
};

