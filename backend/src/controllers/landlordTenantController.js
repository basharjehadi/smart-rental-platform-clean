import { prisma } from '../utils/prisma.js';

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

    // Get all paid offers (active tenants) for this landlord
    console.log('🔍 Looking for offers with landlordId:', landlordId, 'and status: PAID or ACCEPTED');
    
    const paidOffers = await prisma.offer.findMany({
      where: {
        landlordId: landlordId,
        status: { in: ['PAID', 'ACCEPTED'] } // Check both PAID and ACCEPTED statuses
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
                phoneNumber: true,
                profileImage: true
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
        landlordId: landlordId
      },
      include: {
        rentalRequest: {
          include: {
            tenant: true
          }
        },
        property: true
      }
    });
    
    console.log('📊 All offers for this landlord:', allOffersForLandlord.length);
    allOffersForLandlord.forEach(offer => {
      console.log(`Offer ID: ${offer.id}, Status: ${offer.status}, Tenant: ${offer.rentalRequest?.tenant?.name}`);
    });

    // Now let's process the data and return real tenants
    console.log('✅ Processing tenant data...');

    // Transform data to tenant format
    const tenants = await Promise.all(paidOffers.map(async (offer) => {
      // Get payment status for this tenant
      const latestPayment = await prisma.rentPayment.findFirst({
        where: {
          userId: offer.rentalRequest.tenant.id,
          status: 'PENDING'
        },
        orderBy: {
          dueDate: 'desc'
        }
      });

      // Calculate payment status
      let paymentStatus = 'paid';
      if (latestPayment) {
        const today = new Date();
        const dueDate = new Date(latestPayment.dueDate);
        if (dueDate < today) {
          paymentStatus = 'overdue';
        } else {
          paymentStatus = 'pending';
        }
      }

      // Get total paid amount
      const totalPaid = await prisma.payment.aggregate({
        where: {
          userId: offer.rentalRequest.tenant.id,
          status: 'SUCCEEDED'
        },
        _sum: {
          amount: true
        }
      });

             // Get on-time payments count - simplified for now
       const onTimePayments = await prisma.rentPayment.count({
         where: {
           userId: offer.rentalRequest.tenant.id,
           status: 'SUCCEEDED'
         }
       });

      // Calculate days rented
      const moveInDate = new Date(offer.rentalRequest.moveInDate);
      const today = new Date();
      const daysRented = Math.floor((today - moveInDate) / (1000 * 60 * 60 * 24));

      // Get next payment date
      const nextPayment = await prisma.rentPayment.findFirst({
        where: {
          userId: offer.rentalRequest.tenant.id,
          status: 'PENDING'
        },
        orderBy: {
          dueDate: 'asc'
        }
      });

      return {
        id: offer.rentalRequest.tenant.id,
        name: offer.rentalRequest.tenant.firstName && offer.rentalRequest.tenant.lastName 
          ? `${offer.rentalRequest.tenant.firstName} ${offer.rentalRequest.tenant.lastName}`
          : offer.rentalRequest.tenant.name,
        email: offer.rentalRequest.tenant.email,
        phone: offer.rentalRequest.tenant.phoneNumber,
        profileImage: offer.rentalRequest.tenant.profileImage || null,
        moveInDate: offer.rentalRequest.moveInDate,
        monthlyRent: offer.rentAmount,
        securityDeposit: offer.depositAmount,
        paymentStatus: paymentStatus,
        totalPaid: totalPaid._sum.amount || 0,
        onTimePayments: onTimePayments,
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
        landlordId: landlordId,
        status: 'PAID',
        rentalRequest: {
          tenantId: tenantId
        }
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
                phoneNumber: true
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

    // Get payment history
    const paymentHistory = await prisma.payment.findMany({
      where: {
        userId: tenantId,
        status: 'SUCCEEDED'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get rent payment history
    const rentPaymentHistory = await prisma.rentPayment.findMany({
      where: {
        userId: tenantId
      },
      orderBy: {
        dueDate: 'desc'
      }
    });

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

    // Combine payment histories
    const allPayments = [
      ...paymentHistory.map(payment => ({
        description: payment.purpose === 'DEPOSIT_AND_FIRST_MONTH' ? 'Deposit & First Month' : payment.purpose,
        date: payment.createdAt,
        amount: payment.amount,
        status: 'paid'
      })),
      ...rentPaymentHistory.map(payment => ({
        description: `Rent - ${new Date(payment.dueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        date: payment.paidDate || payment.dueDate,
        amount: payment.amount,
        status: payment.status === 'SUCCEEDED' ? 'paid' : payment.status === 'PENDING' ? 'pending' : 'overdue'
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Get current payment status
    const latestPayment = await prisma.rentPayment.findFirst({
      where: {
        userId: tenantId,
        status: 'PENDING'
      },
      orderBy: {
        dueDate: 'desc'
      }
    });

    let paymentStatus = 'paid';
    if (latestPayment) {
      const today = new Date();
      const dueDate = new Date(latestPayment.dueDate);
      if (dueDate < today) {
        paymentStatus = 'overdue';
      } else {
        paymentStatus = 'pending';
      }
    }

    // Calculate lease dates
    const moveInDate = new Date(paidOffer.rentalRequest.moveInDate);
    const leaseStartDate = moveInDate;
    const leaseEndDate = new Date(moveInDate);
    leaseEndDate.setFullYear(leaseEndDate.getFullYear() + (paidOffer.leaseDuration || 12));

    // Calculate total paid
    const totalPaid = await prisma.payment.aggregate({
      where: {
        userId: tenantId,
        status: 'SUCCEEDED'
      },
      _sum: {
        amount: true
      }
    });

         // Get on-time payments count - simplified for now
     const onTimePayments = await prisma.rentPayment.count({
       where: {
         userId: tenantId,
         status: 'SUCCEEDED'
       }
     });

    // Calculate days rented
    const today = new Date();
    const daysRented = Math.floor((today - moveInDate) / (1000 * 60 * 60 * 24));

    // Get next payment date
    const nextPayment = await prisma.rentPayment.findFirst({
      where: {
        userId: tenantId,
        status: 'PENDING'
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    // Create recent activity
    const recentActivity = [
      {
        description: 'Lease agreement signed',
        date: paidOffer.createdAt
      },
      {
        description: 'First payment received',
        date: paymentHistory[0]?.createdAt || paidOffer.createdAt
      }
    ];

    const tenant = {
      id: paidOffer.rentalRequest.tenant.id,
      name: paidOffer.rentalRequest.tenant.firstName && paidOffer.rentalRequest.tenant.lastName 
        ? `${paidOffer.rentalRequest.tenant.firstName} ${paidOffer.rentalRequest.tenant.lastName}`
        : paidOffer.rentalRequest.tenant.name,
      email: paidOffer.rentalRequest.tenant.email,
      phone: paidOffer.rentalRequest.tenant.phoneNumber,
      moveInDate: paidOffer.rentalRequest.moveInDate,
      leaseStartDate: leaseStartDate,
      leaseEndDate: leaseEndDate,
      leaseDuration: paidOffer.leaseDuration || 12,
      monthlyRent: paidOffer.rentAmount,
      securityDeposit: paidOffer.depositAmount,
      paymentStatus: paymentStatus,
      totalPaid: totalPaid._sum.amount || 0,
      onTimePayments: onTimePayments,
      daysRented: Math.max(0, daysRented),
      nextPaymentDate: nextPayment?.dueDate,
      contractStatus: 'Active',
      rentalRequestId: paidOffer.rentalRequest.id,
      contract: contract,
      paymentHistory: allPayments,
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
      tenant: tenant
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
        landlordId: landlordId,
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

