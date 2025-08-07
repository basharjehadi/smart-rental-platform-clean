import { prisma } from '../utils/prisma.js';
import { initializeLeaseDates } from './cronController.js';
import { sendOfferNotification } from '../utils/emailService.js';
import requestPoolService from '../services/requestPoolService.js';

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

      // 🚀 SCALABILITY: Add to request pool asynchronously
      setImmediate(async () => {
        try {
          const matchCount = await requestPoolService.addToPool(rentalRequest);
          console.log(`🏊 Request ${rentalRequest.id} added to pool with ${matchCount} matches`);
        } catch (error) {
          console.error('❌ Error adding request to pool:', error);
        }
      });

      return rentalRequest;
    });

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
    const { page = 1, limit = 20, location, minBudget, maxBudget } = req.query;
    const offset = (page - 1) * limit;

    // 🚀 SCALABILITY: Get requests from pool service for this landlord
    const poolRequests = await requestPoolService.getRequestsForLandlord(
      req.user.id, 
      parseInt(page), 
      parseInt(limit)
    );

    // Transform data for frontend compatibility
    const requests = poolRequests.requests.map(match => ({
      ...match.rentalRequest,
      matchScore: match.matchScore,
      matchReason: match.matchReason,
      tenant: match.rentalRequest.tenant
    }));

    res.json({
      rentalRequests: requests,
      pagination: poolRequests.pagination,
      poolStats: await requestPoolService.getPoolStats()
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
      rentAmount,
      depositAmount,
      leaseDuration,
      description,
      utilitiesIncluded,
      availableFrom,
      propertyId, // 🏠 Link to existing property
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

    // Validate required fields
    if (!rentAmount || !leaseDuration || !availableFrom) {
      return res.status(400).json({
        error: 'Rent amount, lease duration, and available from date are required.'
      });
    }

    // 🚀 SCALABILITY: Check landlord capacity before creating offer
    const landlord = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { 
        currentTenants: true, 
        maxTenants: true, 
        availability: true,
        autoAvailability: true
      }
    });

    if (!landlord.availability) {
      return res.status(400).json({
        error: 'You are currently not accepting new requests due to capacity limits.'
      });
    }

    if (landlord.currentTenants >= landlord.maxTenants && landlord.autoAvailability) {
      return res.status(400).json({
        error: 'You have reached your maximum capacity for managing properties.'
      });
    }

    // 🏠 Get property details if propertyId is provided
    let propertyData = null;
    if (propertyId) {
      propertyData = await prisma.property.findFirst({
        where: {
          id: propertyId,
          landlordId: req.user.id // Ensure landlord owns this property
        }
      });

      if (!propertyData) {
        return res.status(404).json({
          error: 'Property not found or you do not have permission to use it.'
        });
      }
    }

    // 🏠 Get landlord profile for auto-fill templates
    const landlordProfile = await prisma.landlordProfile.findUnique({
      where: { userId: req.user.id }
    });

    // 🚀 SCALABILITY: Auto-fill from property or profile templates
    let finalPropertyImages = propertyImages || [];
    let finalPropertyVideo = propertyVideo || null;
    let finalPropertyDescription = propertyDescription || '';
    let finalRulesText = rulesText || '';
    let finalPropertyAddress = propertyAddress || '';
    let finalPropertyType = propertyType || '';
    let finalPropertySize = propertySize || '';
    let finalPropertyAmenities = propertyAmenities || '';

    // 🏠 Priority 1: Use property data if available
    if (propertyData) {
      finalPropertyAddress = propertyData.address + ', ' + propertyData.zipCode + ', ' + propertyData.city;
      finalPropertyType = propertyData.propertyType;
      finalPropertySize = propertyData.size?.toString() || propertyData.bedrooms?.toString() || '';
      finalPropertyDescription = propertyData.name || propertyData.description || '';
      
      // Parse and use property images
      if (propertyData.images) {
        try {
          const images = JSON.parse(propertyData.images);
          finalPropertyImages = images;
        } catch (error) {
          console.error('Error parsing property images:', error);
        }
      }

      // Create amenities array from property features
      const amenities = [];
      if (propertyData.furnished) amenities.push('Furnished');
      if (propertyData.parking) amenities.push('Parking');
      if (propertyData.petsAllowed) amenities.push('Pets Allowed');
      if (propertyData.bedrooms) amenities.push(`${propertyData.bedrooms} Bedrooms`);
      if (propertyData.bathrooms) amenities.push(`${propertyData.bathrooms} Bathrooms`);
      if (propertyData.size) amenities.push(`${propertyData.size} m²`);
      
      finalPropertyAmenities = JSON.stringify(amenities);
    }
    // Priority 2: Use profile templates if no property data
    else if (landlordProfile) {
      // Auto-fill media if enabled
      if (landlordProfile.autoFillMedia) {
        if (landlordProfile.propertyImages && (!propertyImages || propertyImages.length === 0)) {
          try {
            const profileImages = JSON.parse(landlordProfile.propertyImages);
            finalPropertyImages = profileImages.slice(0, 5); // Limit to 5 images
          } catch (error) {
            console.error('Error parsing property images from profile:', error);
          }
        }
        
        if (landlordProfile.propertyVideos && !propertyVideo) {
          try {
            const profileVideos = JSON.parse(landlordProfile.propertyVideos);
            finalPropertyVideo = profileVideos[0]; // Use first video
          } catch (error) {
            console.error('Error parsing property videos from profile:', error);
          }
        }
      }

      // Auto-fill description if enabled
      if (landlordProfile.autoFillDescription && landlordProfile.propertyDescription && !propertyDescription) {
        finalPropertyDescription = landlordProfile.propertyDescription;
      }

      // Auto-fill rules if enabled
      if (landlordProfile.autoFillRules && landlordProfile.propertyRules && !rulesText) {
        finalRulesText = landlordProfile.propertyRules;
      }
    }

    // Validate rental request exists and is active
    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: parseInt(requestId) },
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

    // 🚀 SCALABILITY: Create offer with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create offer
      const offer = await tx.offer.create({
        data: {
          rentAmount: parseFloat(rentAmount),
          depositAmount: depositAmount ? parseFloat(depositAmount) : null,
          leaseDuration: parseInt(leaseDuration),
          description: description || null,
          utilitiesIncluded: utilitiesIncluded || false,
          availableFrom: new Date(availableFrom),
          propertyAddress: finalPropertyAddress || null,
          propertyImages: JSON.stringify(finalPropertyImages),
          propertyVideo: finalPropertyVideo || null,
          propertyType: finalPropertyType || null,
          propertySize: finalPropertySize || null,
          propertyAmenities: finalPropertyAmenities || null,
          propertyDescription: finalPropertyDescription || null,
          rulesText: finalRulesText || null,
          rulesPdf: rulesPdf || null,
          rentalRequestId: parseInt(requestId),
          landlordId: req.user.id,
          propertyId: propertyId || null, // 🏠 Link to existing property
          responseTime: Date.now() - new Date(rentalRequest.createdAt).getTime()
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
          }
        }
      });

      // Update request response count
      await tx.rentalRequest.update({
        where: { id: parseInt(requestId) },
        data: {
          responseCount: {
            increment: 1
          }
        }
      });

      return offer;
    });

    // 🚀 SCALABILITY: Send notification asynchronously
    setImmediate(async () => {
      try {
        await sendOfferNotification(
          result.rentalRequest.tenant.email,
          result.rentalRequest.tenant.name,
          req.user.name,
          result.propertyAddress || 'Property',
          result.rentAmount,
          result.id
        );
      } catch (error) {
        console.error('❌ Error sending offer notification:', error);
      }
    });

    res.status(201).json({
      message: 'Offer created successfully.',
      offer: result
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
          propertyAddress: `${offer.property.address}, ${offer.property.zipCode}, ${offer.property.city}`,
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
            petsAllowed: offer.property.petsAllowed
          },
          isPaid: offer.status === 'ACCEPTED' && offer.paymentIntentId ? true : false
        };
      }
      
      // Priority 2: Use offer data (fallback)
      return {
        ...offer,
        propertyTitle: offer.propertyDescription || offer.rentalRequest?.title || 'Property Offer',
        propertyAddress: offer.propertyAddress || offer.rentalRequest?.location || 'Location not specified',
        propertyImages: offer.propertyImages || null,
        propertyVideo: offer.propertyVideo || null,
        propertyAmenities: offer.propertyAmenities || null,
        propertyType: offer.propertyType || 'Apartment',
        propertySize: offer.propertySize || offer.rentalRequest?.bedrooms?.toString() || '1',
        isPaid: offer.status === 'ACCEPTED' && offer.paymentIntentId ? true : false
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
          },
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                signatureBase64: true
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
            signatureBase64: true
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

    // Simplified transformation to avoid complex logic
    const transformedOffer = {
      id: offer.id,
      status: offer.status,
      rentAmount: offer.rentAmount,
      depositAmount: offer.depositAmount,
      leaseDuration: offer.leaseDuration,
      description: offer.description,
      availableFrom: offer.availableFrom,
      isPaid: offer.isPaid,
      paymentIntentId: offer.paymentIntentId,
      paymentDate: offer.paymentDate,
      leaseStartDate: offer.leaseStartDate,
      leaseEndDate: offer.leaseEndDate,
      propertyAddress: offer.propertyAddress,
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
          offer.landlord?.name || 'Landlord'
      },
      
      // Include property data if available
      property: offer.property,
      
      // Include tenant data
      tenant: {
        id: offer.rentalRequest.tenantId,
        name: offer.rentalRequest.tenant?.name || 'Tenant',
        email: offer.rentalRequest.tenant?.email || 'tenant@email.com',
        signatureBase64: offer.rentalRequest.tenant?.signatureBase64 || null
      }
    };

    console.log('✅ Transformation completed successfully');
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

// 🚀 SCALABILITY: Update tenant offer status (Accept/Decline)
const updateTenantOfferStatus = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { status, paymentDate } = req.body;
    const { id: tenantId } = req.user;

    console.log('🔍 UpdateTenantOfferStatus called:', { offerId, status, tenantId });

    // Validate status
    if (!['ACCEPTED', 'DECLINED', 'PAID'].includes(status)) {
      console.log('❌ Invalid status:', status);
      return res.status(400).json({
        error: 'Invalid status. Must be either ACCEPTED, DECLINED, or PAID.'
      });
    }

    // Verify the offer belongs to the tenant
    const offer = await prisma.offer.findFirst({
      where: {
        id: offerId,
        rentalRequest: {
          tenantId: tenantId
        }
      },
      include: {
        rentalRequest: true
      }
    });

    console.log('🔍 Found offer:', offer ? { id: offer.id, status: offer.status, tenantId: offer.rentalRequest?.tenantId } : 'Not found');

    if (!offer) {
      console.log('❌ Offer not found for tenant');
      return res.status(404).json({
        error: 'Offer not found or you do not have permission to update it.'
      });
    }

    console.log('🔍 Current offer status:', offer.status);
    console.log('🔍 Requested status:', status);

    if (offer.status !== 'PENDING' && offer.status !== 'ACCEPTED') {
      console.log('❌ Invalid offer status for update:', offer.status);
      return res.status(400).json({
        error: 'Only pending or accepted offers can be updated.'
      });
    }

    // Additional validation for PAID status
    if (status === 'PAID' && offer.status !== 'ACCEPTED') {
      console.log('❌ Cannot mark as PAID - offer not accepted:', offer.status);
      return res.status(400).json({
        error: 'Only accepted offers can be marked as paid.'
      });
    }

    // Update offer status
    const updateData = {
      status: status
    };
    
    // Add payment date if provided and status is PAID
    if (status === 'PAID' && paymentDate) {
      updateData.paymentDate = new Date(paymentDate);
    }
    
    await prisma.offer.update({
      where: {
        id: offerId
      },
      data: updateData
    });

    console.log('✅ Offer status updated successfully to:', status);

    // If accepted, update rental request status
    if (status === 'ACCEPTED') {
      await prisma.rentalRequest.update({
        where: {
          id: offer.rentalRequestId
        },
        data: {
          status: 'COMPLETED',
          poolStatus: 'MATCHED'
        }
      });
    }

    res.json({
      message: `Offer ${status.toLowerCase()} successfully.`,
      offer: {
        id: offerId,
        status: status
      }
    });
  } catch (error) {
    console.error('❌ Update offer status error:', error);
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
            profileImage: true
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

// Decline rental request (for landlords)
const declineRentalRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    // Validate rental request exists and is active
    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: parseInt(requestId) },
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

    // Update request status to declined
    await prisma.rentalRequest.update({
      where: { id: parseInt(requestId) },
      data: {
        poolStatus: 'CANCELLED',
        status: 'CANCELLED'
      }
    });

    res.json({
      message: 'Rental request declined successfully.',
      requestId: parseInt(requestId)
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