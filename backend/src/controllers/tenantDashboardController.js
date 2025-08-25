import { prisma } from '../utils/prisma.js';
import { getUnifiedPaymentData, getUpcomingPayments } from '../services/paymentService.js';

// Helper function to get tenant payment data - Now using unified service
const getTenantPaymentsData = async (tenantId) => {
  try {
    console.log('🔍 getTenantPaymentsData called with tenantId:', tenantId);
    
    // Use unified payment service
    const paymentData = await getUnifiedPaymentData(tenantId);
    
    console.log('✅ getTenantPaymentsData returning payments:', paymentData.payments.length);
    console.log('✅ Total paid amount:', paymentData.totalPaid);
    
    return paymentData.payments;
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

    // Get tenant's active leases (paid offers represent active leases)
    const activeLeases = await prisma.offer.findMany({
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
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            street: true,
            city: true,
            zipCode: true,
            country: true,
            profileImage: true
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
            size: true,
            houseRules: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('🔍 Active leases found:', activeLeases.length);
    const activeLease = activeLeases[0] || null;
    console.log('🔍 Primary active lease ID:', activeLease?.id);
    
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
        leases: [],
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

    // Build leases array
    const leases = activeLeases.map((offer) => {
      const propertyAddress = (() => {
        if (offer.property && offer.property.address) {
          let completeAddress = offer.property.address;
          if (offer.property.district) completeAddress += `, ${offer.property.district}`;
          completeAddress += `, ${offer.property.zipCode}, ${offer.property.city}`;
          return completeAddress;
        }
        return offer.rentalRequest.location || 'Address not specified';
      })();

      const areaString = offer.property?.size ? `${offer.property.size} m²` : (offer.propertySize || '');

      const leaseStartDate = offer.rentalRequest.moveInDate;
      const leaseEndDate = offer.leaseEndDate || (() => { const start = new Date(leaseStartDate); const end = new Date(start); end.setMonth(end.getMonth() + (offer.leaseDuration || 12)); return end; })();

      return {
        offerId: offer.id,
        rentalRequestId: offer.rentalRequest.id,
        property: {
          id: offer.property?.id,
          address: propertyAddress,
          propertyType: offer.property?.propertyType || offer.propertyType || offer.rentalRequest.propertyType || 'Apartment',
          rooms: offer.property?.bedrooms || offer.rentalRequest.bedrooms || 2,
          bathrooms: offer.property?.bathrooms || offer.rentalRequest.bathrooms || 1,
          area: areaString,
          leaseTerm: offer.leaseDuration || 12,
          amenities: (() => {
            if (offer.property?.houseRules) {
              try { const parsed = JSON.parse(offer.property.houseRules); if (Array.isArray(parsed) && parsed.length > 0) return parsed; } catch {}
            }
            if (offer.propertyAmenities) {
              try { return typeof offer.propertyAmenities === 'string' ? JSON.parse(offer.propertyAmenities) : offer.propertyAmenities; } catch { return ['No amenities listed']; }
            }
            return ['No amenities listed'];
          })()
        },
        landlord: {
          name: offer.landlord.firstName && offer.landlord.lastName ? `${offer.landlord.firstName} ${offer.landlord.lastName}` : (offer.landlord.name || 'Landlord'),
          email: offer.landlord.email,
          phone: offer.landlord.phoneNumber || 'Not provided',
          address: offer.landlord.street && offer.landlord.city ? `${offer.landlord.street}, ${offer.landlord.city} ${offer.landlord.zipCode}, ${offer.landlord.country}` : 'Not provided',
          profileImage: offer.landlord.profileImage || null
        },
        lease: {
          startDate: leaseStartDate,
          endDate: leaseEndDate,
          monthlyRent: offer.rentAmount || offer.rentalRequest.budget || 0,
          securityDeposit: offer.depositAmount || offer.rentalRequest.budget || 0
        }
      };
    });

    // Simplified response with primary lease and full leases list
    const responseData = {
      tenant: req.user,
      hasActiveLease: true,
      offerId: activeLease.id,
      property: {
        address: (() => {
          // Use the actual property address if available, otherwise fallback to rental request location
          if (activeLease.property && activeLease.property.address) {
            let completeAddress = activeLease.property.address;
            if (activeLease.property.district) {
              completeAddress += ', ' + activeLease.property.district;
            }
            completeAddress += ', ' + activeLease.property.zipCode + ', ' + activeLease.property.city;
            return completeAddress;
          }
          return activeLease.rentalRequest.location || 'Address not specified';
        })(),
        propertyType: activeLease.property?.propertyType || activeLease.propertyType || activeLease.rentalRequest.propertyType || 'Apartment',
        rooms: activeLease.property?.bedrooms || activeLease.rentalRequest.bedrooms || 2,
        bathrooms: activeLease.property?.bathrooms || activeLease.rentalRequest.bathrooms || 1,
        area: activeLease.property?.size ? `${activeLease.property.size} m²` : (activeLease.propertySize || ''),
        leaseTerm: activeLease.leaseDuration || 12,
        amenities: (() => {
          // Use the actual property houseRules (amenities) if available
          if (activeLease.property && activeLease.property.houseRules) {
            try {
              const propertyAmenities = JSON.parse(activeLease.property.houseRules);
              if (Array.isArray(propertyAmenities) && propertyAmenities.length > 0) {
                return propertyAmenities;
              }
            } catch (error) {
              console.warn('Failed to parse property houseRules:', activeLease.property.houseRules, error);
            }
          }
          
          // Fallback to offer amenities if property houseRules not available
          if (activeLease.propertyAmenities) {
            try {
              return typeof activeLease.propertyAmenities === 'string' ? JSON.parse(activeLease.propertyAmenities) : activeLease.propertyAmenities;
            } catch (error) {
              console.warn('Failed to parse offer propertyAmenities:', activeLease.propertyAmenities, error);
              return ['No amenities listed'];
            }
          }
          
          return ['No amenities listed'];
        })(),
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
          'Not provided',
        profileImage: activeLease.landlord.profileImage || null
      },
      lease: {
        startDate: activeLease.rentalRequest.moveInDate,
        endDate: (() => { if (activeLease.leaseEndDate) return activeLease.leaseEndDate; const start = new Date(activeLease.rentalRequest.moveInDate); const end = new Date(start); end.setMonth(end.getMonth() + (activeLease.leaseDuration || 12)); return end; })(),
        monthlyRent: activeLease.rentAmount || activeLease.rentalRequest.budget || 0,
        securityDeposit: activeLease.depositAmount || activeLease.rentalRequest.budget || 0
      },
      leases,
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
        },
        property: true
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
      address: (() => {
        // Use the actual property address if available, otherwise fallback to rental request location
        if (activeLease.property && activeLease.property.address) {
          let completeAddress = activeLease.property.address;
          if (activeLease.property.district) {
            completeAddress += ', ' + activeLease.property.district;
          }
          completeAddress += ', ' + activeLease.property.zipCode + ', ' + activeLease.property.city;
          return completeAddress;
        }
        return activeLease.rentalRequest.location || 'Address not specified';
      })(),
      rooms: activeLease.property?.bedrooms || activeLease.rentalRequest.bedrooms || 2,
      bathrooms: activeLease.property?.bathrooms || activeLease.rentalRequest.bathrooms || 1,
      area: activeLease.property?.size ? `${activeLease.property.size} m²` : activeLease.propertySize || '65 m²',
      leaseTerm: activeLease.leaseDuration || 12,
              amenities: (() => {
                // Use the actual property houseRules (amenities) if available
                if (activeLease.property && activeLease.property.houseRules) {
                  try {
                    const propertyAmenities = JSON.parse(activeLease.property.houseRules);
                    if (Array.isArray(propertyAmenities) && propertyAmenities.length > 0) {
                      return propertyAmenities;
                    }
                  } catch (error) {
                    console.warn('Failed to parse property houseRules:', activeLease.property.houseRules, error);
                  }
                }
                
                // Fallback to offer amenities if property houseRules not available
                if (activeLease.propertyAmenities) {
                  try {
                    return typeof activeLease.propertyAmenities === 'string' ? JSON.parse(activeLease.propertyAmenities) : activeLease.propertyAmenities;
                  } catch (error) {
                    console.warn('Failed to parse offer propertyAmenities:', activeLease.propertyAmenities, error);
                    return ['No amenities listed'];
                  }
                }
                
                return ['No amenities listed'];
              })(),
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
        upcomingPayments = await getUpcomingPayments(tenantId);
    }

    res.json({
      payments: pastPayments,
      upcomingPayments: upcomingPayments,
      lease: activeLease ? {
        startDate: activeLease.rentalRequest.moveInDate,
        endDate: (() => {
          if (activeLease.leaseEndDate) return activeLease.leaseEndDate;
          const start = new Date(activeLease.rentalRequest.moveInDate);
          const end = new Date(start);
          end.setMonth(end.getMonth() + (activeLease.leaseDuration || 12));
          return end;
        })(),
        monthlyRent: activeLease.rentAmount || activeLease.rentalRequest.budget || 0,
        securityDeposit: activeLease.depositAmount || activeLease.rentalRequest.budget || 0
      } : null
    });

  } catch (error) {
    console.error('Error fetching tenant payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};

// Get tenant's current rental information for monthly rent payments
export const getCurrentRental = async (req, res) => {
  try {
    const tenantId = req.user.id;
    console.log('🔍 Fetching current rental info for tenant:', tenantId);

    // Get tenant's active lease (paid offer represents active lease)
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
            tenant: {
              select: {
                id: true,
                name: true,
                email: true
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
            size: true,
            description: true,
            images: true,
            houseRules: true
          }
        },
        landlord: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profileImage: true,
            createdAt: true,
            averageRating: true,
            totalReviews: true,
            rank: true
          }
        }
      }
    });

    if (!activeLease) {
      return res.status(404).json({ 
        error: 'No active lease found. Please ensure you have an accepted and paid offer.' 
      });
    }

    // Build complete address string
    const buildCompleteAddress = (property) => {
      if (!property) return 'Address not available';
      
      let addressParts = [];
      if (property.address) addressParts.push(property.address);
      if (property.district) addressParts.push(property.district);
      if (property.zipCode) addressParts.push(property.zipCode);
      if (property.city) addressParts.push(property.city);
      
      return addressParts.length > 0 ? addressParts.join(', ') : 'Address not available';
    };

    // Parse property images from JSON string
    const parsePropertyImages = (propertyImagesString) => {
      if (!propertyImagesString) return [];
      try {
        const parsed = JSON.parse(propertyImagesString);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.warn('Failed to parse property images:', propertyImagesString, error);
        return [];
      }
    };

    // Format the response
    const rentalData = {
      offerId: activeLease.id,
      rentalRequestId: activeLease.rentalRequestId,
      rentalRequest: {
        id: activeLease.rentalRequest.id,
        moveInDate: activeLease.rentalRequest.moveInDate,
        propertyType: activeLease.rentalRequest.propertyType,
        bedrooms: activeLease.rentalRequest.bedrooms,
        bathrooms: activeLease.rentalRequest.bathrooms,
        budget: activeLease.rentalRequest.budget
      },
      lease: {
        startDate: activeLease.rentalRequest.moveInDate,
        endDate: activeLease.leaseEndDate || (() => {
          const start = new Date(activeLease.rentalRequest.moveInDate);
          const end = new Date(start);
          end.setMonth(end.getMonth() + (activeLease.leaseDuration || 12));
          return end;
        })(),
        monthlyRent: activeLease.rentAmount,
        securityDeposit: activeLease.depositAmount,
        leaseDuration: activeLease.leaseDuration
      },
      property: activeLease.property ? {
        id: activeLease.property.id,
        title: activeLease.property.name || activeLease.property.propertyType || 'Property',
        type: activeLease.property.propertyType || 'Apartment',
        rooms: activeLease.property.bedrooms || activeLease.rentalRequest.bedrooms || 2,
        address: buildCompleteAddress(activeLease.property),
        district: activeLease.property.district,
        city: activeLease.property.city,
        zipCode: activeLease.property.zipCode,
        images: parsePropertyImages(activeLease.property.images),
        size: activeLease.property.size,
        description: activeLease.property.description
      } : null,
      landlord: {
        id: activeLease.landlord.id,
        name: activeLease.landlord.firstName && activeLease.landlord.lastName ? 
          `${activeLease.landlord.firstName} ${activeLease.landlord.lastName}` : 
          activeLease.landlord.name || 'Landlord',
        email: activeLease.landlord.email,
        phone: activeLease.landlord.phoneNumber,
        profileImage: activeLease.landlord.profileImage
      }
    };

    console.log('🔍 Returning current rental data:', rentalData);
    res.json(rentalData);

  } catch (error) {
    console.error('Error fetching current rental:', error);
    res.status(500).json({ error: 'Failed to fetch current rental information' });
  }
}; 