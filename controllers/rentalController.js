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

    // 🚀 SCALABILITY: Check landlord availability and property status before creating offer
    console.log('🔍 Checking landlord availability for user:', req.user.id);
    const landlord = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { 
        availability: true,
        properties: {
          where: {
            status: 'AVAILABLE',
            availability: true
          },
          select: {
            id: true,
            name: true,
            status: true,
            availability: true
          }
        }
      }
    });

    if (!landlord || !landlord.availability || landlord.properties.length === 0) {
      return res.status(400).json({
        error: 'You are not available to accept new requests or have no available properties.'
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
        landlordId: req.user.id,
        rentalRequestId: parseInt(requestId),
        rentAmount: parseFloat(rentAmount),
        depositAmount: parseFloat(depositAmount || 0),
        leaseDuration: parseInt(leaseDuration),
        description: description || '',
        utilitiesIncluded: utilitiesIncluded || false,
        availableFrom: new Date(availableFrom),
        propertyAddress: propertyAddress || '',
        propertyImages: propertyImages || [],
        propertyVideo: propertyVideo || '',
        propertyType: propertyType || '',
        propertySize: propertySize || '',
        propertyAmenities: propertyAmenities || [],
        propertyDescription: propertyDescription || '',
        rulesText: rulesText || '',
        rulesPdf: rulesPdf || '',
        status: 'PENDING'
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

    console.log(`✅ Offer created successfully for request ${requestId} by landlord ${req.user.id}`);
    console.log(`🏆 Competition: This request now has multiple offers from different landlords`);

    res.json({
      success: true,
      message: 'Offer sent successfully! The tenant will be notified.',
      offer: {
        id: offer.id,
        rentAmount: offer.rentAmount,
        depositAmount: offer.depositAmount,
        leaseDuration: offer.leaseDuration,
        status: offer.status,
        createdAt: offer.createdAt
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

// 🚀 SCALABILITY: Decline rental request - request stays in pool for other landlords
const declineRentalRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

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
        declineReason: reason || 'No reason provided',
        declinedAt: new Date(),
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

// 🚀 SCALABILITY: Update tenant offer status (Accept/Decline)
const updateTenantOfferStatus = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { status } = req.body;

    console.log(`🔄 Tenant updating offer ${offerId} status to ${status}`);

    // Validate offer exists and belongs to the tenant
    const offer = await prisma.offer.findUnique({
      where: { id: parseInt(offerId) },
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
          where: { id: parseInt(offerId) },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date(),
            updatedAt: new Date()
          }
        });

        // 🚀 SCALABILITY: Reject all other offers for the same rental request
        const otherOffers = await tx.offer.updateMany({
          where: {
            rentalRequestId: offer.rentalRequest.id,
            id: { not: parseInt(offerId) },
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
        where: { id: parseInt(offerId) },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
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

    } else {
      return res.status(400).json({
        error: 'Invalid status. Only ACCEPTED or REJECTED are allowed.'
      });
    }

  } catch (error) {
    console.error('Update tenant offer status error:', error);
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
  deleteRentalRequest,
  declineRentalRequest,
  updateTenantOfferStatus
}; 