import prisma from '../lib/prisma.js';
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
          bedrooms: bedrooms ? parseInt(bedrooms) : null,
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
    res.status(500).json({
      error: 'Internal server error.'
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

    // 🏠 Get landlord profile for auto-fill templates
    const landlordProfile = await prisma.landlordProfile.findUnique({
      where: { userId: req.user.id }
    });

    // 🚀 SCALABILITY: Auto-fill from profile templates
    let finalPropertyImages = propertyImages || [];
    let finalPropertyVideo = propertyVideo || null;
    let finalPropertyDescription = propertyDescription || '';
    let finalRulesText = rulesText || '';

    if (landlordProfile) {
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
          propertyAddress: propertyAddress || null,
          propertyImages: JSON.stringify(finalPropertyImages),
          propertyVideo: finalPropertyVideo || null,
          propertyType: propertyType || null,
          propertySize: propertySize || null,
          propertyAmenities: propertyAmenities || null,
          propertyDescription: finalPropertyDescription || null,
          rulesText: finalRulesText || null,
          rulesPdf: rulesPdf || null,
          rentalRequestId: parseInt(requestId),
          landlordId: req.user.id,
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
        await sendOfferNotification(result);
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

    const rentalRequests = await prisma.rentalRequest.findMany({
      where: {
        tenantId: tenantId
      },
      include: {
        offer: {
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

// 🚀 SCALABILITY: Update rental request
const updateRentalRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: tenantId } = req.user;
    const updateData = req.body;

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

    const updatedRequest = await prisma.rentalRequest.update({
      where: {
        id: parseInt(id)
      },
      data: updateData,
      include: {
        offer: {
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
    if (existingRequest.offer && existingRequest.offer.status === 'ACCEPTED') {
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

// Export all functions
export {
  createRentalRequest,
  getAllActiveRequests,
  markRequestAsViewed,
  createOffer,
  updateOfferStatus,
  updateLandlordCapacity,
  getPoolStats,
  cleanupExpiredRequests,
  getMyRequests,
  updateRentalRequest,
  deleteRentalRequest
}; 