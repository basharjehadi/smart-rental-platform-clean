import { prisma } from '../utils/prisma.js';
import { sendOfferNotification } from '../utils/emailService.js';
import requestPoolService from '../services/requestPoolService.js';
import { NotificationService } from '../services/notificationService.js';
import propertyAvailabilityService from '../services/propertyAvailabilityService.js';

// 🚀 SCALABILITY: Create rental request with pool integration
const createRentalRequest = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      moveInDate,
      budget,
      budgetFrom,
      budgetTo,
      propertyType,
      district,
      city,
      bedrooms,
      bathrooms,
      furnished,
      parking,
      petsAllowed,
      additionalRequirements,
      preferredNeighborhood,
      maxCommuteTime,
      mustHaveFeatures,
      flexibleOnMoveInDate
    } = req.body;

    // Validate required fields
    if (!title || !location || !moveInDate || !budget) {
      return res.status(400).json({
        error: 'Title, location, moveInDate, and budget are required.'
      });
    }

    // Validate moveInDate is in the future
    const moveInDateObj = new Date(moveInDate);
    if (moveInDateObj <= new Date()) {
      return res.status(400).json({
        error: 'Move-in date must be in the future.'
      });
    }

    // Validate budget is positive
    if (budget <= 0) {
      return res.status(400).json({
        error: 'Budget must be a positive number.'
      });
    }

    // Validate property type and set bedrooms automatically
    const validPropertyTypes = ['Room', 'Shared Room', 'Studio', 'Apartment', 'House'];
    if (propertyType && !validPropertyTypes.includes(propertyType)) {
      return res.status(400).json({
        error: 'Invalid property type. Must be one of: Room, Shared Room, Studio, Apartment, House.'
      });
    }

    // Auto-set bedrooms for single-room property types
    let finalBedrooms = bedrooms;
    const singleRoomTypes = ['Room', 'Shared Room', 'Studio'];
    if (propertyType && singleRoomTypes.includes(propertyType)) {
      finalBedrooms = 1;
    }

    // 🚀 SCALABILITY: Create rental request with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create rental request
      const rentalRequest = await tx.rentalRequest.create({
        data: {
          title,
          description,
          location,
          moveInDate: moveInDateObj,
          budget: parseFloat(budget),
          budgetFrom: budgetFrom ? parseFloat(budgetFrom) : null,
          budgetTo: budgetTo ? parseFloat(budgetTo) : null,
          propertyType: propertyType || null,
          district: district || null,
          bedrooms: finalBedrooms ? parseInt(finalBedrooms) : null,
          bathrooms: bathrooms ? parseInt(bathrooms) : null,
          furnished: furnished || false,
          parking: parking || false,
          petsAllowed: petsAllowed || false,
          additionalRequirements: additionalRequirements || null,
          preferredNeighborhood: preferredNeighborhood || null,
          maxCommuteTime: maxCommuteTime || null,
          mustHaveFeatures: mustHaveFeatures || null,
          flexibleOnMoveInDate: flexibleOnMoveInDate || false,
          tenantId: req.user.id,
          poolStatus: 'ACTIVE' // Start in active pool
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

      return rentalRequest;
    });

    // 🚀 Run matching OUTSIDE the transaction to avoid cross-client conflicts
    try {
      const matchCount = await requestPoolService.addToPool(result);
      console.log(`🏊 Request ${result.id} added to pool with ${matchCount} matches`);
    } catch (error) {
      console.error('❌ Error adding request to pool (post-tx):', error);
    }

    res.status(201).json({
      message: 'Rental request created successfully and added to request pool.',
      rentalRequest: result,
      poolStatus: 'ACTIVE'
    });
  } catch (error) {
    console.error('Create rental request error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({
      error: 'Internal server error.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 🚀 SCALABILITY: Get all active requests for landlords with pool integration
const getAllActiveRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
 
     // 1) Pending (unresponded, unseen) via pool service (already excludes declined)
     const poolRequests = await requestPoolService.getRequestsForLandlord(
       req.user.id,
       parseInt(page),
       parseInt(limit)
     );
 
     const mapBestProperty = (match) => {
       const bestProperty = match.property || match.rentalRequest.bestMatchingProperty || null;
       if (!bestProperty) return null;
       return {
         id: bestProperty.id,
         name: bestProperty.name,
         city: bestProperty.city,
         address: bestProperty.address,
         rent: `${bestProperty.monthlyRent.toLocaleString('pl-PL')} zł`,
         available: bestProperty.availableFrom ? new Date(bestProperty.availableFrom).toISOString() : null,
         bedrooms: bestProperty.bedrooms,
         propertyType: bestProperty.propertyType,
         furnished: bestProperty.furnished,
         parking: bestProperty.parking,
         petsAllowed: bestProperty.petsAllowed
       };
     };
 
     const normalizePending = poolRequests.requests.map((match) => ({
       ...match.rentalRequest,
       matchScore: match.matchScore,
       matchReason: match.matchReason,
       tenant: {
         id: match.rentalRequest.tenant?.id,
         name: match.rentalRequest.tenant?.name,
         email: match.rentalRequest.tenant?.email,
         firstName: match.rentalRequest.tenant?.firstName,
         lastName: match.rentalRequest.tenant?.lastName,
         profileImage: match.rentalRequest.tenant?.profileImage,
         phoneNumber: match.rentalRequest.tenant?.phoneNumber,
         profession: match.rentalRequest.tenant?.profession,
         age: match.rentalRequest.tenant?.dateOfBirth
           ? Math.max(18, Math.floor((Date.now() - new Date(match.rentalRequest.tenant.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)))
           : null,
         rating: match.rentalRequest.tenant?.averageRating ?? 5.0,
         reviews: match.rentalRequest.tenant?.totalReviews ?? 1,
         rank: match.rentalRequest.tenant?.rank
       },
       landlord: null, // RentalRequest doesn't have landlord field
       propertyMatch: mapBestProperty(match),
       status: 'pending'
     }));
 
     // 2) Offered (responded=true and an offer from this landlord exists)
     const offeredMatchesRaw = await prisma.landlordRequestMatch.findMany({
       where: {
         landlordId: req.user.id,
         isResponded: true,
         status: 'ACTIVE',
         rentalRequest: { poolStatus: 'ACTIVE', expiresAt: { gt: new Date() } }
       },
       include: {
         rentalRequest: {
           include: {
             tenant: { select: { id: true, name: true, email: true, firstName: true, lastName: true, profileImage: true, phoneNumber: true, profession: true, dateOfBirth: true, averageRating: true, totalReviews: true, rank: true } },
             offers: { where: { landlordId: req.user.id }, select: { id: true } }
           }
         },
         property: {
           select: { id: true, name: true, address: true, city: true, monthlyRent: true, propertyType: true, bedrooms: true, furnished: true, parking: true, petsAllowed: true, availableFrom: true }
         }
       },
       orderBy: [{ matchScore: 'desc' }, { createdAt: 'desc' }],
       take: parseInt(limit)
     });
 
     const offeredMatches = offeredMatchesRaw.filter(m => (m.rentalRequest.offers || []).length > 0);
     const normalizeOffered = offeredMatches.map((match) => ({
       ...match.rentalRequest,
       matchScore: match.matchScore,
       matchReason: match.matchReason,
       tenant: {
         id: match.rentalRequest.tenant?.id,
         name: match.rentalRequest.tenant?.name,
         email: match.rentalRequest.tenant?.email,
         firstName: match.rentalRequest.tenant?.firstName,
         lastName: match.rentalRequest.tenant?.lastName,
         profileImage: match.rentalRequest.tenant?.profileImage,
         phoneNumber: match.rentalRequest.tenant?.phoneNumber,
         profession: match.rentalRequest.tenant?.profession,
         age: match.rentalRequest.tenant?.dateOfBirth
           ? Math.max(18, Math.floor((Date.now() - new Date(match.rentalRequest.tenant.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)))
           : null,
         rating: match.rentalRequest.tenant?.averageRating ?? 5.0,
         reviews: match.rentalRequest.tenant?.totalReviews ?? 1,
         rank: match.rentalRequest.tenant?.rank
       },
       propertyMatch: mapBestProperty(match),
       status: 'offered'
     }));
 
          // 3) Accepted (property rented - request accepted)
     // Find rental requests where this landlord has a PAID offer and the property is RENTED
     const acceptedOffers = await prisma.offer.findMany({
       where: {
         landlordId: req.user.id,
         status: 'PAID' // Offer has been paid for
       },
       include: {
         rentalRequest: {
           include: {
             tenant: { select: { id: true, name: true, email: true, firstName: true, lastName: true, profileImage: true, phoneNumber: true, profession: true, dateOfBirth: true, averageRating: true, totalReviews: true, rank: true } }
           }
         },
         property: {
           select: { id: true, name: true, address: true, city: true, monthlyRent: true, propertyType: true, bedrooms: true, furnished: true, parking: true, petsAllowed: true, availableFrom: true, status: true }
         }
       },
       orderBy: [{ updatedAt: 'desc' }],
       take: parseInt(limit)
     });

     // Filter to only include offers where the property status is RENTED
     const acceptedOffersFiltered = acceptedOffers.filter(offer => 
       offer.property && offer.property.status === 'RENTED'
     );

     const normalizeAccepted = acceptedOffersFiltered.map((offer) => ({
       ...offer.rentalRequest,
       matchScore: offer.matchScore || 0,
       matchReason: 'Property rented - request accepted',
       tenant: {
         id: offer.rentalRequest.tenant?.id,
         name: offer.rentalRequest.tenant?.name,
         email: offer.rentalRequest.tenant?.email,
         firstName: offer.rentalRequest.tenant?.firstName,
         lastName: offer.rentalRequest.tenant?.lastName,
         profileImage: offer.rentalRequest.tenant?.profileImage,
         phoneNumber: offer.rentalRequest.tenant?.phoneNumber,
         profession: offer.rentalRequest.tenant?.profession,
         age: offer.rentalRequest.tenant?.dateOfBirth
           ? Math.max(18, Math.floor((Date.now() - new Date(offer.rentalRequest.tenant.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)))
           : null,
         rating: offer.rentalRequest.tenant?.averageRating ?? 5.0,
         reviews: offer.rentalRequest.tenant?.totalReviews ?? 1,
         rank: offer.rentalRequest.tenant?.rank
       },
       propertyMatch: {
         id: offer.property?.id,
         name: offer.property?.name || 'Your Property',
         address: offer.property?.address || 'Address not specified',
         rent: offer.property?.monthlyRent ? `${offer.property.monthlyRent.toLocaleString('pl-PL')} zł` : 'Rent not specified',
         available: offer.property?.availableFrom ? new Date(offer.property.availableFrom).toISOString() : 'Date not specified',
         propertyType: offer.property?.propertyType || 'Apartment'
       },
       status: 'accepted'
     }));

     // 4) Declined (by this landlord)
     const declinedMatches = await prisma.landlordRequestMatch.findMany({
       where: {
         landlordId: req.user.id,
         status: 'DECLINED'
       },
       include: {
         rentalRequest: {
           include: {
             tenant: { select: { id: true, name: true, email: true, firstName: true, lastName: true, profileImage: true, phoneNumber: true, profession: true, dateOfBirth: true, averageRating: true, totalReviews: true, rank: true } }
           }
         },
         property: {
           select: { id: true, name: true, address: true, city: true, monthlyRent: true, propertyType: true, bedrooms: true, furnished: true, parking: true, petsAllowed: true, availableFrom: true }
         }
       },
       orderBy: [{ updatedAt: 'desc' }],
       take: parseInt(limit)
     });

     const normalizeDeclined = declinedMatches.map((match) => ({
       ...match.rentalRequest,
       matchScore: match.matchScore,
       matchReason: match.matchReason,
       tenant: {
         id: match.rentalRequest.tenant?.id,
         name: match.rentalRequest.tenant?.name,
         email: match.rentalRequest.tenant?.email,
         firstName: match.rentalRequest.tenant?.firstName,
         lastName: match.rentalRequest.tenant?.lastName,
         profileImage: match.rentalRequest.tenant?.profileImage,
         phoneNumber: match.rentalRequest.tenant?.phoneNumber,
         profession: match.rentalRequest.tenant?.profession,
         age: match.rentalRequest.tenant?.dateOfBirth
           ? Math.max(18, Math.floor((Date.now() - new Date(match.rentalRequest.tenant.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)))
           : null,
         rating: match.rentalRequest.tenant?.averageRating ?? 5.0,
         reviews: match.rentalRequest.tenant?.totalReviews ?? 1,
         rank: match.rentalRequest.tenant?.rank
       },
       propertyMatch: mapBestProperty(match),
       status: 'declined'
     }));
 
     return res.json({
       pending: normalizePending,
       offered: normalizeOffered,
       accepted: normalizeAccepted,
       declined: normalizeDeclined,
       pagination: poolRequests.pagination
     });
   } catch (error) {
     console.error('Get all active requests error:', error);
     res.status(500).json({
       error: 'Internal server error.'
     });
   }
 };

// 🚀 SCALABILITY: Mark request as viewed
const markRequestAsViewed = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    await requestPoolService.markAsViewed(req.user.id, parseInt(requestId));
    
    res.json({
      message: 'Request marked as viewed successfully.'
    });
  } catch (error) {
    console.error('Mark request as viewed error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// 🚀 SCALABILITY: Create offer with capacity management and profile templates
const createOffer = async (req, res) => {
  try {
    const { requestId } = req.params;
    const {
      propertyId, // 🚀 SCALABILITY: Property ID is required to link offer to specific property
      rentAmount,
      depositAmount,
      leaseDuration,
      description,
      utilitiesIncluded,
      availableFrom,
      propertyAddress,
      propertyImages,
      propertyVideo,
      propertyType,
      propertySize,
      propertyAmenities,
      propertyDescription,
      rulesText,
      rulesPdf
    } = req.body;

    // Debug: log incoming identifiers and types
    console.log('createOffer params:', { requestIdRaw: requestId, requestIdType: typeof requestId, propertyIdRaw: propertyId, propertyIdType: typeof propertyId });

    // Validate required fields
    if (!propertyId || !rentAmount || !leaseDuration || !availableFrom) {
      return res.status(400).json({
        error: 'Property ID, rent amount, lease duration, and available from date are required.'
      });
    }

    // 🚀 SCALABILITY: Check landlord availability and property status before creating offer
    console.log('🔍 Checking landlord availability for user:', req.user.id);
    
    // First, validate that the property exists and belongs to this landlord
    // NOTE: Property IDs are strings (cuid). Do NOT parseInt here.
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        landlordId: req.user.id,
        status: 'AVAILABLE',
        availability: true
      },
      select: {
        id: true,
        name: true,
        address: true,
        status: true,
        availability: true,
        monthlyRent: true,
        propertyType: true
      }
    });

    if (!property) {
      return res.status(400).json({
        error: 'Property not found, not available, or does not belong to you.'
      });
    }

    // Check landlord availability
    const landlord = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { 
        availability: true
      }
    });

    if (!landlord || !landlord.availability) {
      return res.status(400).json({
        error: 'You are not available to accept new requests.'
      });
    }

    // 🚀 SCALABILITY: Check if this landlord already sent an offer for this request
    const existingOffer = await prisma.offer.findFirst({
      where: {
        landlordId: req.user.id,
        rentalRequestId: parseInt(requestId)
      }
    });

    if (existingOffer) {
      return res.status(400).json({
        error: 'You have already sent an offer for this rental request.'
      });
    }

    // 🚀 SCALABILITY: Check if the rental request is still active and not expired
    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: parseInt(requestId) },
      select: {
        id: true,
        status: true,
        poolStatus: true,
        expiresAt: true,
        tenantId: true
      }
    });

    if (!rentalRequest) {
      return res.status(404).json({
        error: 'Rental request not found.'
      });
    }

    if (rentalRequest.status !== 'ACTIVE' || rentalRequest.poolStatus !== 'ACTIVE') {
      return res.status(400).json({
        error: 'This rental request is no longer active.'
      });
    }

    if (rentalRequest.expiresAt && new Date() > rentalRequest.expiresAt) {
      return res.status(400).json({
        error: 'This rental request has expired.'
      });
    }

    // 🚀 SCALABILITY: Check if the tenant already accepted/paid for another offer
    const acceptedOffer = await prisma.offer.findFirst({
      where: {
        rentalRequestId: parseInt(requestId),
        status: { in: ['ACCEPTED', 'PAID'] }
      }
    });

    if (acceptedOffer) {
      return res.status(400).json({
        error: 'This rental request has already been accepted by the tenant.'
      });
    }

    // 🚀 SCALABILITY: Create the offer - multiple landlords can offer on the same request
    const offer = await prisma.offer.create({
      data: {
        // Connect required relations explicitly
        landlord: { connect: { id: req.user.id } },
        rentalRequest: { connect: { id: parseInt(requestId) } },
        property: { connect: { id: propertyId } },
        rentAmount: parseFloat(rentAmount),
        depositAmount: parseFloat(depositAmount || 0),
        leaseDuration: parseInt(leaseDuration),
        description: description || null,
        utilitiesIncluded: Boolean(utilitiesIncluded),
        availableFrom: new Date(availableFrom),
        propertyAddress: propertyAddress || null,
        propertyImages: Array.isArray(propertyImages) ? JSON.stringify(propertyImages) : (propertyImages || null),
        propertyVideo: propertyVideo || null,
        propertyType: propertyType || null,
        propertySize: propertySize || null,
        propertyAmenities: Array.isArray(propertyAmenities) ? JSON.stringify(propertyAmenities) : (propertyAmenities || null),
        propertyDescription: propertyDescription || null,
        rulesText: rulesText || null,
        rulesPdf: rulesPdf || null,
        // Prisma strict relations: connect tenant by ID
        tenant: { connect: { id: rentalRequest.tenantId } }
      }
    });

    // 🚀 SCALABILITY: Update the match status to show landlord has responded
    await prisma.landlordRequestMatch.updateMany({
      where: {
        landlordId: req.user.id,
        rentalRequestId: parseInt(requestId)
      },
      data: {
        isResponded: true,
        updatedAt: new Date()
      }
    });

    // 🚀 NOTIFICATION: Create notification for the tenant about the new offer
    try {
      const tenant = await prisma.user.findUnique({
        where: { id: rentalRequest.tenantId },
        select: { name: true, email: true }
      });

      if (tenant) {
        // Send email notification
        await sendOfferNotification(
          tenant.email,
          tenant.name,
          req.user.name || 'Landlord',
          property.name || 'Property',
          rentAmount,
          offer.id
        );

        // Create database notification for real-time updates
        await NotificationService.createOfferNotification(
          rentalRequest.tenantId,
          offer.id,
          req.user.name || 'Landlord',
          property.address || 'Property'
        );
      }
    } catch (notificationError) {
      console.error('Warning: Failed to send offer notification:', notificationError);
      // Don't fail the offer creation if notification fails
    }

    console.log(`✅ Offer created successfully for request ${requestId} by landlord ${req.user.id}`);
    console.log(`🏆 Competition: This request now has multiple offers from different landlords`);
    console.log(`🔔 Tenant notification sent for offer ${offer.id}`);

    res.json({
      success: true,
      message: 'Offer sent successfully! The tenant will be notified.',
      offer: {
        id: offer.id,
        propertyId: offer.propertyId, // 🚀 SCALABILITY: Include property ID in response
        rentAmount: offer.rentAmount,
        depositAmount: offer.depositAmount,
        leaseDuration: offer.leaseDuration,
        status: offer.status,
        createdAt: offer.createdAt
      },
      property: {
        id: property.id,
        name: property.name,
        address: property.address,
        propertyType: property.propertyType
      },
      competition: {
        message: 'Multiple landlords are competing for this request. First to get accepted and paid wins!',
        tip: 'Consider making your offer more attractive to increase chances of acceptance.'
      }
    });

  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// 🚀 SCALABILITY: Update offer status with capacity management
const updateOfferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, preferredPaymentGateway } = req.body;

    // Validate status
    const validStatuses = ['ACCEPTED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Status must be either ACCEPTED or REJECTED.'
      });
    }

    // Validate payment gateway if accepting offer
    if (status === 'ACCEPTED' && !preferredPaymentGateway) {
      return res.status(400).json({
        error: 'Payment gateway is required when accepting an offer.'
      });
    }

    if (status === 'ACCEPTED' && preferredPaymentGateway) {
      const validGateways = ['STRIPE', 'PAYU', 'P24', 'TPAY'];
      if (!validGateways.includes(preferredPaymentGateway)) {
        return res.status(400).json({
          error: 'Invalid payment gateway. Must be one of: STRIPE, PAYU, P24, TPAY.'
        });
      }
    }

    // Get the offer with rental request details
    const offer = await prisma.offer.findUnique({
      where: { id },
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
        landlord: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!offer) {
      return res.status(404).json({
        error: 'Offer not found.'
      });
    }

    // Verify tenant owns the request
    if (offer.rentalRequest.tenant.id !== req.user.id) {
      return res.status(403).json({
        error: 'You can only update offers for your own rental requests.'
      });
    }

    // 🚀 SCALABILITY: Update offer status with transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedOffer = await tx.offer.update({
        where: { id },
        data: {
          status: status,
          preferredPaymentGateway: status === 'ACCEPTED' ? preferredPaymentGateway : null
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
          landlord: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // If accepted, remove request from pool
      if (status === 'ACCEPTED') {
        await requestPoolService.removeFromPool(offer.rentalRequestId, 'MATCHED');
      }

      return updatedOffer;
    });

    res.json({
      message: `Offer ${status.toLowerCase()} successfully.`,
      offer: result
    });
  } catch (error) {
    console.error('Update offer status error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// 🚀 SCALABILITY: Update landlord capacity after contract completion
const updateLandlordCapacity = async (landlordId, increment = true) => {
  try {
    await requestPoolService.updateLandlordCapacity(landlordId, increment);
  } catch (error) {
    console.error('❌ Error updating landlord capacity:', error);
  }
};

// 🚀 SCALABILITY: Get pool statistics
const getPoolStats = async (req, res) => {
  try {
    const stats = await requestPoolService.getPoolStats();
    res.json(stats);
  } catch (error) {
    console.error('Get pool stats error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// 🚀 SCALABILITY: Cleanup expired requests (admin endpoint)
const cleanupExpiredRequests = async (req, res) => {
  try {
    await requestPoolService.cleanupExpiredRequests();
    res.json({
      message: 'Expired requests cleaned up successfully.'
    });
  } catch (error) {
    console.error('Cleanup expired requests error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// 🚀 SCALABILITY: Get tenant's rental requests
const getMyRequests = async (req, res) => {
  try {
    const { id: tenantId } = req.user;

    // First, auto-update expired requests
    await autoUpdateRequestStatus(tenantId);

    const rentalRequests = await prisma.rentalRequest.findMany({
      where: {
        tenantId: tenantId
      },
      include: {
        offers: {
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

    res.json({
      message: 'Rental requests retrieved successfully.',
      rentalRequests: rentalRequests
    });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// 🚀 NEW: Auto-update request status logic
const autoUpdateRequestStatus = async (tenantId) => {
  try {
    const now = new Date();
    
    // Update requests where move-in date is in the past
    await prisma.rentalRequest.updateMany({
      where: {
        tenantId: tenantId,
        moveInDate: {
          lt: now
        },
        status: {
          not: 'CANCELLED'
        }
      },
      data: {
        status: 'CANCELLED',
        poolStatus: 'EXPIRED'
      }
    });

    // Update requests where tenant has accepted an offer
    await prisma.rentalRequest.updateMany({
      where: {
        tenantId: tenantId,
        offers: {
          some: {
            status: 'ACCEPTED'
          }
        },
        status: {
          not: 'CANCELLED'
        }
      },
      data: {
        status: 'CANCELLED',
        poolStatus: 'MATCHED'
      }
    });

    console.log('✅ Auto-updated request statuses for tenant:', tenantId);
  } catch (error) {
    console.error('❌ Error auto-updating request statuses:', error);
  }
};

// 🚀 SCALABILITY: Update rental request
const updateRentalRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: tenantId } = req.user;
    const updateData = req.body;

    console.log('🔍 Update Request Debug:');
    console.log('Request ID:', id, 'Type:', typeof id);
    console.log('Tenant ID:', tenantId, 'Type:', typeof tenantId);

    // Validate that the request belongs to the tenant
    const existingRequest = await prisma.rentalRequest.findFirst({
      where: {
        id: parseInt(id),
        tenantId: tenantId
      }
    });

    if (!existingRequest) {
      return res.status(404).json({
        error: 'Rental request not found or you do not have permission to edit it.'
      });
    }

    // Validate moveInDate is in the future if provided
    if (updateData.moveInDate) {
      const moveInDateObj = new Date(updateData.moveInDate);
      if (moveInDateObj <= new Date()) {
        return res.status(400).json({
          error: 'Move-in date must be in the future.'
        });
      }
      updateData.moveInDate = moveInDateObj;
    }

    // Validate budget is positive if provided
    if (updateData.budget && updateData.budget <= 0) {
      return res.status(400).json({
        error: 'Budget must be a positive number.'
      });
    }

    // Validate property type and set bedrooms automatically
    const validPropertyTypes = ['Room', 'Shared Room', 'Studio', 'Apartment', 'House'];
    if (updateData.propertyType && !validPropertyTypes.includes(updateData.propertyType)) {
      return res.status(400).json({
        error: 'Invalid property type. Must be one of: Room, Shared Room, Studio, Apartment, House.'
      });
    }

    // Auto-set bedrooms for single-room property types
    const singleRoomTypes = ['Room', 'Shared Room', 'Studio'];
    if (updateData.propertyType && singleRoomTypes.includes(updateData.propertyType)) {
      updateData.bedrooms = 1;
    }

    // Filter out fields that don't exist in the database schema
    const allowedFields = [
      'title', 'description', 'location', 'budget', 'budgetFrom', 'budgetTo', 'moveInDate', 
      'propertyType', 'district', 'bedrooms', 'additionalRequirements',
      'bathrooms', 'furnished', 'parking', 'petsAllowed', 'status', 
      'isLocked', 'preferredNeighborhood', 'maxCommuteTime', 'mustHaveFeatures',
      'flexibleOnMoveInDate', 'poolStatus', 'matchScore', 'viewCount', 
      'responseCount', 'expiresAt'
    ];

    const filteredUpdateData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdateData[key] = updateData[key];
      }
    });

    console.log('🔍 Filtered update data:', filteredUpdateData);

    const updatedRequest = await prisma.rentalRequest.update({
      where: {
        id: parseInt(id)
      },
      data: filteredUpdateData,
      include: {
        offers: {
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
      }
    });

    res.json({
      message: 'Rental request updated successfully.',
      rentalRequest: updatedRequest
    });
  } catch (error) {
    console.error('Update rental request error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// 🚀 SCALABILITY: Delete rental request
const deleteRentalRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: tenantId } = req.user;

    // Validate that the request belongs to the tenant
    const existingRequest = await prisma.rentalRequest.findFirst({
      where: {
        id: parseInt(id),
        tenantId: tenantId
      }
    });

    if (!existingRequest) {
      return res.status(404).json({
        error: 'Rental request not found or you do not have permission to delete it.'
      });
    }

    // Check if request has an accepted offer
    const hasAcceptedOffer = await prisma.offer.findFirst({
      where: {
        rentalRequestId: parseInt(id),
        status: 'ACCEPTED'
      }
    });
    
    if (hasAcceptedOffer) {
      return res.status(400).json({
        error: 'Cannot delete a request that has an accepted offer.'
      });
    }

    // Remove from request pool if active
    if (existingRequest.poolStatus === 'ACTIVE') {
      await requestPoolService.removeFromPool(parseInt(id), 'CANCELLED');
    }

    await prisma.rentalRequest.delete({
      where: {
        id: parseInt(id)
      }
    });

    res.json({
      message: 'Rental request deleted successfully.'
    });
  } catch (error) {
    console.error('Delete rental request error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// 🚀 SCALABILITY: Get tenant's offers
const getMyOffers = async (req, res) => {
  try {
    const { id: tenantId } = req.user;

    const offers = await prisma.offer.findMany({
      where: {
        rentalRequest: {
          tenantId: tenantId
        }
      },
      include: {
        rentalRequest: {
          select: {
            id: true,
            title: true,
            location: true,
            description: true,
            budgetFrom: true,
            budgetTo: true,
            bedrooms: true,
            moveInDate: true,
            status: true
          }
        },
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            profileImage: true
          }
        },
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            district: true,
            zipCode: true,
            propertyType: true,
            bedrooms: true,
            bathrooms: true,
            size: true,
            furnished: true,
            parking: true,
            petsAllowed: true,
            description: true,
            images: true,
            videos: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform offers to include actual property data from the offer or linked property
    const transformedOffers = offers.map(offer => {
      // 🏠 Priority 1: Use linked property data if available
      if (offer.property) {
        return {
          ...offer,
          propertyTitle: offer.property.name || offer.property.description || 'Property Offer',
          // For paid offers, show full address; for others, show masked address
          propertyAddress: (() => {
            if (offer.status === 'PAID') {
              // Show full address for paid offers
              let completeAddress = offer.property.address;
              if (offer.property.district) {
                completeAddress += ', ' + offer.property.district;
              }
              completeAddress += ', ' + offer.property.zipCode + ', ' + offer.property.city;
              return completeAddress;
            } else {
              // Show masked address for unpaid offers
              const addressParts = offer.property.address.split(' ');
              // Remove the last part if it contains numbers (house/apartment number)
              const streetParts = addressParts.filter(part => !/\d/.test(part));
              const streetName = streetParts.join(' ');
              const maskedAddress = `${streetName}, ${offer.property.district || ''}, ${offer.property.city}`;
              return maskedAddress;
            }
          })(),
          propertyImages: offer.property.images || offer.propertyImages || null,
          propertyVideo: offer.property.videos || offer.propertyVideo || null,
          propertyAmenities: offer.propertyAmenities || JSON.stringify([
            offer.property.furnished ? 'Furnished' : 'Unfurnished',
            offer.property.parking ? 'Parking' : 'No Parking',
            offer.property.petsAllowed ? 'Pets Allowed' : 'No Pets',
            offer.property.bedrooms ? `${offer.property.bedrooms} Bedrooms` : '',
            offer.property.bathrooms ? `${offer.property.bathrooms} Bathrooms` : '',
            offer.property.size ? `${offer.property.size} m²` : ''
          ].filter(Boolean)),
          propertyType: offer.property.propertyType || offer.propertyType || 'Apartment',
          propertySize: offer.property.bedrooms?.toString() || offer.property.size?.toString() || offer.propertySize || '1',
          // 🏠 Pass property data explicitly
          property: {
            bedrooms: offer.property.bedrooms,
            bathrooms: offer.property.bathrooms,
            size: offer.property.size,
            furnished: offer.property.furnished,
            parking: offer.property.parking,
            petsAllowed: offer.property.petsAllowed,
            smokingAllowed: offer.property.smokingAllowed
          },
          isPaid: offer.status === 'PAID'
        };
      }
      
      // Priority 2: Use offer data (fallback)
      return {
        ...offer,
        propertyTitle: offer.propertyDescription || offer.rentalRequest?.title || 'Property Offer',
        propertyAddress: offer.propertyAddress || offer.rentalRequest?.location || 'Location not specified',
        propertyImages: offer.propertyImages || null,
        propertyVideo: offer.propertyVideo || null,
        propertyAmenities: offer.propertyAmenities ? (typeof offer.propertyAmenities === 'string' && offer.propertyAmenities.startsWith('[') ? offer.propertyAmenities : JSON.stringify([offer.propertyAmenities])) : null,
        propertyType: offer.propertyType || 'Apartment',
        propertySize: offer.propertySize || offer.rentalRequest?.bedrooms?.toString() || '1',
        isPaid: offer.status === 'PAID'
      };
    });

    res.json({
      offers: transformedOffers
    });
  } catch (error) {
    console.error('Get my offers error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// 🚀 SCALABILITY: Get single offer details for property view
const getOfferDetails = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { id: tenantId } = req.user;
    
    console.log('🔍 GetOfferDetails called with:', { offerId, tenantId });

    const offer = await prisma.offer.findFirst({
      where: {
        id: offerId,
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
                firstName: true,
                lastName: true,
                email: true,
                signatureBase64: true,
                pesel: true,
                passportNumber: true,
                kartaPobytuNumber: true,
                phoneNumber: true,
                street: true,
                city: true,
                zipCode: true,
                country: true,
                address: true
              }
            }
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
            averageRating: true,
            totalReviews: true,
            rank: true,
            rankPoints: true,
            signatureBase64: true,
            pesel: true,
            street: true,
            city: true,
            zipCode: true,
            country: true,
            address: true
          }
        },
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            district: true,
            zipCode: true,
            propertyType: true,
            bedrooms: true,
            bathrooms: true,
            size: true,
            floor: true,
            totalFloors: true,
            furnished: true,
            parking: true,
            petsAllowed: true,
            smokingAllowed: true,
            description: true,
            images: true,
            videos: true,
            houseRules: true
          }
        }
      }
    });

    if (!offer) {
      console.log('❌ Offer not found for:', { offerId, tenantId });
      return res.status(404).json({
        error: 'Offer not found or you do not have permission to view it.'
      });
    }
    
    console.log('✅ Offer found:', { 
      offerId: offer.id, 
      status: offer.status, 
      landlordId: offer.landlordId,
      landlordName: offer.landlord?.name,
      landlordFirstName: offer.landlord?.firstName,
      landlordLastName: offer.landlord?.lastName
    });

    // Optional: compute landlord rank info
    let landlordRankInfo = null;
    try {
      const rankService = (await import('../services/rankService.js')).default;
      if (offer.landlord?.rank) {
        landlordRankInfo = rankService.getRankInfo(offer.landlord.rank);
      }
    } catch (e) {
      console.warn('⚠️ Could not compute landlord rank info:', e?.message || e);
    }

    // Simplified transformation to avoid complex logic
    const transformedOffer = {
      id: offer.id,
      status: offer.status,
      rentAmount: offer.rentAmount,
      depositAmount: offer.depositAmount,
      leaseDuration: offer.leaseDuration,
      description: offer.description,
      availableFrom: offer.availableFrom,
      isPaid: offer.status === 'PAID' || (offer.status === 'ACCEPTED' && offer.paymentIntentId),
      paymentIntentId: offer.paymentIntentId,
      paymentDate: offer.paymentDate,
      leaseStartDate: offer.leaseStartDate,
      leaseEndDate: offer.leaseEndDate,
      propertyAddress: (() => {
        // For paid offers, show full address; for others, show offer address
        if (offer.status === 'PAID' && offer.property) {
          // Show full address for paid offers
          let completeAddress = offer.property.address;
          if (offer.property.district) {
            completeAddress += ', ' + offer.property.district;
          }
          completeAddress += ', ' + offer.property.zipCode + ', ' + offer.property.city;
          return completeAddress;
        } else {
          // Show offer address for unpaid offers
          return offer.propertyAddress || offer.rentalRequest?.location || 'Location not specified';
        }
      })(),
      propertyImages: offer.propertyImages,
      propertyVideo: offer.propertyVideo,
      propertyType: offer.propertyType,
      propertySize: offer.propertySize,
      propertyAmenities: offer.propertyAmenities,
      propertyDescription: offer.propertyDescription,
      rulesText: offer.rulesText,
      rulesPdf: offer.rulesPdf,
      preferredPaymentGateway: offer.preferredPaymentGateway,
      responseTime: offer.responseTime,
      matchScore: offer.matchScore,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
      rentalRequestId: offer.rentalRequestId,
      landlordId: offer.landlordId,
      propertyId: offer.propertyId,
      
      // Include rental request data
      rentalRequest: offer.rentalRequest,
      
      // Include landlord data
      landlord: {
        ...offer.landlord,
        name: offer.landlord?.firstName && offer.landlord?.lastName ? 
          `${offer.landlord.firstName} ${offer.landlord.lastName}` : 
          offer.landlord?.name || 'Landlord',
        signatureBase64: offer.landlord?.signatureBase64 || null,
        rankInfo: landlordRankInfo
      },
      
      // Include property data if available
      property: offer.property,
      
      // Include tenant data
      tenant: {
        id: offer.rentalRequest.tenantId,
        name: offer.rentalRequest.tenant?.firstName && offer.rentalRequest.tenant?.lastName ? 
          `${offer.rentalRequest.tenant.firstName} ${offer.rentalRequest.tenant.lastName}` : 
          offer.rentalRequest.tenant?.name || 'Tenant',
        email: offer.rentalRequest.tenant?.email || 'tenant@email.com',
        signatureBase64: offer.rentalRequest.tenant?.signatureBase64 || null,
        pesel: offer.rentalRequest.tenant?.pesel || null,
        passportNumber: offer.rentalRequest.tenant?.passportNumber || null,
        kartaPobytuNumber: offer.rentalRequest.tenant?.kartaPobytuNumber || null,
        phoneNumber: offer.rentalRequest.tenant?.phoneNumber || null,
        street: offer.rentalRequest.tenant?.street || null,
        city: offer.rentalRequest.tenant?.city || null,
        zipCode: offer.rentalRequest.tenant?.zipCode || null,
        country: offer.rentalRequest.tenant?.country || null,
        address: offer.rentalRequest.tenant?.address || null
      }
    };

    console.log('✅ Transformation completed successfully');
    console.log('🔍 Signature Debug in getOfferDetails:');
    console.log('Tenant signature present:', !!transformedOffer.tenant.signatureBase64);
    console.log('Landlord signature present:', !!transformedOffer.landlord.signatureBase64);
    console.log('Tenant signature length:', transformedOffer.tenant.signatureBase64?.length || 0);
    console.log('Landlord signature length:', transformedOffer.landlord.signatureBase64?.length || 0);
    
    res.json({
      offer: transformedOffer
    });
  } catch (error) {
    console.error('Get offer details error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Internal server error.',
      details: error.message
    });
  }
};

// 🚀 SCALABILITY: Update tenant offer status (Accept/Decline/Mock Pay)
const updateTenantOfferStatus = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { status } = req.body;

    console.log(`🔄 Tenant updating offer ${offerId} status to ${status}`);

    // Validate offer exists and belongs to the tenant
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        rentalRequest: {
          select: {
            id: true,
            tenantId: true,
            poolStatus: true,
            expiresAt: true
          }
        }
      }
    });

    if (!offer) {
      return res.status(404).json({
        error: 'Offer not found.'
      });
    }

    if (offer.rentalRequest.tenantId !== req.user.id) {
      return res.status(403).json({
        error: 'You can only update your own offers.'
      });
    }

    // 🚀 SCALABILITY: Handle different status updates
    if (status === 'ACCEPTED') {
      // 🚀 SCALABILITY: When tenant accepts an offer, reject ALL other offers for the same request
      const result = await prisma.$transaction(async (tx) => {
        // Update the accepted offer
        const updatedOffer = await tx.offer.update({
          where: { id: offerId },
          data: {
            status: 'ACCEPTED',
            updatedAt: new Date()
          }
        });

        // 🚀 SCALABILITY: Reject all other offers for the same rental request
        const otherOffers = await tx.offer.updateMany({
          where: {
            rentalRequestId: offer.rentalRequest.id,
            id: { not: offerId },
            status: { in: ['PENDING', 'ACCEPTED'] }
          },
          data: {
            status: 'REJECTED',
            updatedAt: new Date()
          }
        });

        console.log(`✅ Accepted offer ${offerId}, rejected ${otherOffers.count} other offers`);
        return { updatedOffer, rejectedCount: otherOffers.count };
      });

      res.json({
        success: true,
        message: 'Offer accepted successfully! Other offers for this request have been automatically rejected.',
        offer: result.updatedOffer,
        competition: {
          message: 'You have exclusive rights to this property. Other tenants can no longer accept offers for this request.',
          nextStep: 'Complete payment to secure the property and unlock communication with the landlord.'
        }
      });

    } else if (status === 'REJECTED') {
      // 🚀 SCALABILITY: When tenant rejects an offer, it stays rejected but request remains in pool
      const updatedOffer = await prisma.offer.update({
        where: { id: offerId },
        data: {
          status: 'REJECTED',
          updatedAt: new Date()
        }
      });

      console.log(`✅ Offer ${offerId} rejected by tenant`);

      res.json({
        success: true,
        message: 'Offer rejected successfully. You can still receive other offers for your request.',
        offer: updatedOffer,
        note: 'Your rental request remains active in the pool for other landlords to consider.'
        });
    } else if (status === 'PAID') {
      // 🔧 DEV/Mock payment path: mark offer as PAID and perform all side effects
      const result = await prisma.$transaction(async (tx) => {
        // Update offer to PAID with payment timestamp
        const paidAt = new Date();
        const updatedOffer = await tx.offer.update({
          where: { id: offerId },
          data: {
            status: 'PAID',
            isPaid: true,
            paymentDate: paidAt,
            updatedAt: paidAt
          },
          select: {
            id: true,
            rentAmount: true,
            depositAmount: true,
            rentalRequestId: true,
            propertyId: true,
            landlordId: true
          }
        });

        // Compute prorated first-month amount based on move-in date
        const reqRecord = await tx.rentalRequest.findUnique({
          where: { id: updatedOffer.rentalRequestId },
          select: { moveInDate: true, tenantId: true }
        });

        const moveInDate = reqRecord?.moveInDate ? new Date(reqRecord.moveInDate) : null;
        let proratedFirstMonth = Number(updatedOffer.rentAmount) || 0;
        if (moveInDate && Number.isFinite(proratedFirstMonth)) {
          const endOfMonth = new Date(moveInDate.getFullYear(), moveInDate.getMonth() + 1, 0);
          const days = Math.ceil((endOfMonth - moveInDate) / 86400000) + 1; // inclusive
          proratedFirstMonth = Math.round((proratedFirstMonth * days) / 30);
        }

        const amountTotal = (updatedOffer.depositAmount || 0) + (proratedFirstMonth || 0);

        // Create a successful general payment (deposit + prorated first month) - idempotent
        const existingCombined = await tx.payment.findFirst({
          where: {
            userId: req.user.id,
            purpose: 'DEPOSIT_AND_FIRST_MONTH',
            status: 'SUCCEEDED',
            offerId: updatedOffer.id
          }
        });
        if (!existingCombined) {
          await tx.payment.create({
            data: {
              amount: amountTotal,
              status: 'SUCCEEDED',
              purpose: 'DEPOSIT_AND_FIRST_MONTH',
              gateway: 'STRIPE',
              userId: req.user.id,
              rentalRequestId: updatedOffer.rentalRequestId,
              offerId: updatedOffer.id,
              paymentIntentId: `mock_${Date.now()}_${updatedOffer.id}`,
              createdAt: paidAt
            }
          });
        }

        // Note: We don't create a separate RentPayment record for the first month
        // because it's already included in the combined DEPOSIT_AND_FIRST_MONTH payment above.
        // The first month's rent is covered by the prorated amount in the total payment.
        // Future monthly payments will create RentPayment records as needed.

        // Invalidate all other offers for the same property (first-to-pay wins)
        if (updatedOffer.propertyId) {
          await tx.offer.updateMany({
            where: {
              propertyId: updatedOffer.propertyId,
              id: { not: offerId },
              status: { in: ['PENDING', 'ACCEPTED'] }
            },
            data: { status: 'REJECTED', updatedAt: new Date() }
          });
        }

        return updatedOffer;
      });

      // Remove the rental request from the pool and update its status
      try {
        console.log(`🔄 Updating rental request ${result.rentalRequestId} status to MATCHED...`);
        
        // First, update the rental request status to MATCHED
        const updatedRequest = await prisma.rentalRequest.update({
          where: { id: result.rentalRequestId },
          data: {
            status: 'MATCHED',
            poolStatus: 'MATCHED',
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ Rental request ${result.rentalRequestId} status updated:`, {
          id: updatedRequest.id,
          status: updatedRequest.status,
          poolStatus: updatedRequest.poolStatus
        });
        
        // Then remove from request pool
        await requestPoolService.removeFromPool(result.rentalRequestId, 'MATCHED');
        console.log('✅ Rental request removed from pool');
      } catch (poolError) {
        console.error('❌ Error removing request from pool:', poolError);
      }

      // Update property availability to RENTED (not OCCUPIED)
      try {
        if (result.propertyId) {
          console.log(`🔄 Updating property ${result.propertyId} status to RENTED...`);
          await propertyAvailabilityService.updatePropertyAvailability(result.propertyId, false, 'RENTED');
          console.log('✅ Property status updated to RENTED');
        }
      } catch (availabilityError) {
        console.error('❌ Error updating property availability:', availabilityError);
      }

      // Generate contract (idempotent if already exists)
      try {
        const { generateContractForRentalRequest } = await import('./contractController.js');
        await generateContractForRentalRequest(result.rentalRequestId);
      } catch (contractError) {
        console.error('❌ Error generating contract after mock payment:', contractError);
      }

      return res.json({
        success: true,
        message: 'Payment completed. Offer marked as PAID and contract generated.',
        offer: { id: result.id, status: 'PAID', paymentDate: new Date() }
      });

    } else {
      return res.status(400).json({
        error: 'Invalid status. Only ACCEPTED, REJECTED, or PAID are allowed.'
      });
    }

  } catch (error) {
    console.error('Update tenant offer status error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// Get all rental requests (for landlords to browse) - only those matching their properties
const getAllRentalRequests = async (req, res) => {
  try {
    const landlordId = req.user.id;

    // First, get all properties owned by this landlord
    const landlordProperties = await prisma.property.findMany({
      where: {
        landlordId: landlordId,
        status: 'AVAILABLE' // Only available properties
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        district: true,
        zipCode: true,
        monthlyRent: true,
        propertyType: true,
        bedrooms: true,
        bathrooms: true,
        furnished: true,
        parking: true,
        petsAllowed: true,
        availableFrom: true // Include available from date
      }
    });

    // If landlord has no properties, return empty array
    if (landlordProperties.length === 0) {
      return res.json({
        success: true,
        rentalRequests: [],
        message: 'No properties found. Add properties to see matching rental requests.'
      });
    }

    // Find rental requests that match any of the landlord's properties
    const requests = await prisma.rentalRequest.findMany({
      where: {
        AND: [
          {
            poolStatus: 'ACTIVE',
            status: 'ACTIVE'
          },
          {
            OR: landlordProperties.map(property => ({
              AND: [
                // Location matching (improved - check both city and full location)
                {
                  OR: [
                    { location: { contains: property.city } },
                    { location: { contains: property.city.toLowerCase() } },
                    { location: { contains: property.city.toUpperCase() } }
                  ]
                },
                // Budget matching
                {
                  AND: [
                    { budgetFrom: { lte: property.monthlyRent * 1.2 } },
                    { budgetTo: { gte: property.monthlyRent * 0.8 } }
                  ]
                },
                // Property type matching (case-insensitive)
                {
                  OR: [
                    { propertyType: property.propertyType },
                    { propertyType: property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1) },
                    { propertyType: property.propertyType.toLowerCase() }
                  ]
                },
                // Date matching
                { moveInDate: { gte: property.availableFrom || new Date() } }
              ]
            }))
          }
        ]
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
            profession: true,
            dateOfBirth: true,
            phoneNumber: true,
            pesel: true
          }
        },
        offers: {
          where: {
            landlordId: landlordId
          },
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // For each rental request, find the best matching property
    const requestsWithMatchedProperties = requests.map(request => {
      // Find the best matching property for this request
      const matchedProperty = landlordProperties.find(property => {
        const locationMatch = request.location.toLowerCase().includes(property.city.toLowerCase());
        const budgetMatch = request.budgetFrom <= property.monthlyRent * 1.2 && 
                           request.budgetTo >= property.monthlyRent * 0.8;
        const typeMatch = request.propertyType === property.propertyType;
        const dateMatch = new Date(request.moveInDate) >= (property.availableFrom || new Date());
        
        // More flexible matching - only require location and budget match
        return locationMatch && budgetMatch;
      });

      // If no specific match found, use the first available property as fallback
      const finalMatchedProperty = matchedProperty || landlordProperties[0];

      return {
        ...request,
        matchedProperty: finalMatchedProperty
      };
    });

    res.json({
      success: true,
      rentalRequests: requestsWithMatchedProperties,
      totalProperties: landlordProperties.length
    });
  } catch (error) {
    console.error('Error fetching rental requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rental requests'
    });
  }
};

// 🚀 SCALABILITY: Decline rental request - request stays in pool for other landlords
const declineRentalRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    // Debug: log incoming requestId and its type
    console.log('declineRentalRequest params:', { requestIdRaw: requestId, requestIdType: typeof requestId });

    console.log(`🚫 Landlord ${req.user.id} declining request ${requestId}`);

    // Validate rental request exists and is active
    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: parseInt(requestId) },
      include: {
        landlordRequestMatches: {
          where: { landlordId: req.user.id }
        }
      }
    });

    if (!rentalRequest) {
      return res.status(404).json({
        error: 'Rental request not found.'
      });
    }

    if (rentalRequest.poolStatus !== 'ACTIVE') {
      return res.status(400).json({
        error: 'This rental request is no longer active.'
      });
    }

    // 🚀 SCALABILITY: Check if this landlord was matched with this request
    const match = rentalRequest.landlordRequestMatches[0];
    if (!match) {
      return res.status(400).json({
        error: 'You are not matched with this rental request.'
      });
    }

    // 🚀 SCALABILITY: Update the match status to declined but keep request in pool
    await prisma.landlordRequestMatch.update({
      where: { id: match.id },
      data: {
        status: 'DECLINED',
        isResponded: true,
        updatedAt: new Date()
      }
    });

    // 🚀 SCALABILITY: Update request analytics
    await prisma.rentalRequest.update({
      where: { id: parseInt(requestId) },
      data: {
        responseCount: {
          increment: 1
        },
        updatedAt: new Date()
      }
    });

    console.log(`✅ Request ${requestId} declined by landlord ${req.user.id}`);
    console.log(`🔄 Request remains in pool for other landlords to consider`);

    res.json({
      success: true,
      message: 'Request declined successfully. The request remains active for other landlords.',
      note: 'This rental request will continue searching for other matching properties until expiration.',
      requestStatus: {
        id: rentalRequest.id,
        poolStatus: rentalRequest.poolStatus,
        expiresAt: rentalRequest.expiresAt,
        remainingTime: rentalRequest.expiresAt ? 
          Math.ceil((new Date(rentalRequest.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) : null
      }
    });

  } catch (error) {
    console.error('Decline rental request error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// Export all functions
export {
  createRentalRequest,
  getAllActiveRequests,
  markRequestAsViewed,
  createOffer,
  updateOfferStatus,
  updateTenantOfferStatus,
  updateLandlordCapacity,
  getPoolStats,
  cleanupExpiredRequests,
  getMyRequests,
  updateRentalRequest,
  deleteRentalRequest,
  getMyOffers,
  getAllRentalRequests,
  declineRentalRequest,
  getOfferDetails
}; 