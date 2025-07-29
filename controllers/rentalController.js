import prisma from '../lib/prisma.js';
import { initializeLeaseDates } from './cronController.js';

// Create rental request (tenant only)
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

    // Create rental request
    const rentalRequest = await prisma.rentalRequest.create({
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
        tenantId: req.user.id
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

    res.status(201).json({
      message: 'Rental request created successfully.',
      rentalRequest
    });
  } catch (error) {
    console.error('Create rental request error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// Get my rental requests (tenant only)
const getMyRequests = async (req, res) => {
  try {
    const rentalRequests = await prisma.rentalRequest.findMany({
      where: {
        tenantId: req.user.id
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
      rentalRequests
    });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// Get all active rental requests (landlord only)
const getAllActiveRequests = async (req, res) => {
  try {
    const rentalRequests = await prisma.rentalRequest.findMany({
      where: {
        status: 'ACTIVE',
        // Exclude requests where the current landlord has already made an offer
        NOT: {
          offer: {
            landlordId: req.user.id
          }
        }
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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
      rentalRequests
    });
  } catch (error) {
    console.error('Get all active requests error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// Create offer for rental request (landlord only)
const createOffer = async (req, res) => {
  try {
    const { requestId } = req.params;
    const requestIdInt = parseInt(requestId);
    
    const {
      rentAmount,
      depositAmount,
      leaseDuration,
      description,
      availableFrom,
      utilitiesIncluded,
      propertyAddress,
      propertyImages,
      propertyVideo,
      propertyType,
      propertySize,
      propertyAmenities,
      propertyDescription
    } = req.body;

    // Validate required fields
    if (!rentAmount || !leaseDuration || !availableFrom) {
      return res.status(400).json({
        error: 'Rent amount, lease duration, and available from date are required.'
      });
    }

    // Validate property information
    if (!propertyAddress) {
      return res.status(400).json({
        error: 'Property address is required.'
      });
    }

    // Validate rent amount is positive
    if (rentAmount <= 0) {
      return res.status(400).json({
        error: 'Rent amount must be a positive number.'
      });
    }

    // Validate lease duration is positive
    if (leaseDuration <= 0) {
      return res.status(400).json({
        error: 'Lease duration must be a positive number.'
      });
    }

    // Check if rental request exists and is active
    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: requestIdInt }
    });

    if (!rentalRequest) {
      return res.status(404).json({
        error: 'Rental request not found.'
      });
    }

    if (rentalRequest.status !== 'ACTIVE') {
      return res.status(400).json({
        error: 'Cannot create offer for inactive rental request.'
      });
    }

    // Check if offer already exists for this request
    const existingOffer = await prisma.offer.findUnique({
      where: { rentalRequestId: requestIdInt }
    });

    if (existingOffer) {
      return res.status(409).json({
        error: 'An offer already exists for this rental request.'
      });
    }

    // Create offer
    const offer = await prisma.offer.create({
      data: {
        rentAmount: parseFloat(rentAmount),
        depositAmount: depositAmount ? parseFloat(depositAmount) : null,
        leaseDuration: parseInt(leaseDuration),
        description,
        availableFrom: new Date(availableFrom),
        utilitiesIncluded: utilitiesIncluded || false,
        propertyAddress,
        propertyImages: propertyImages ? JSON.stringify(propertyImages) : null,
        propertyVideo,
        propertyType,
        propertySize,
        propertyAmenities: propertyAmenities ? JSON.stringify(propertyAmenities) : null,
        propertyDescription,
        landlordId: req.user.id,
        rentalRequestId: requestIdInt
      },
      include: {
        landlord: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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

    res.status(201).json({
      message: 'Offer created successfully.',
      offer
    });
  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// Get offer for rental request (tenant only)
const getOfferForRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const requestIdInt = parseInt(requestId);

    // Check if rental request exists and belongs to the tenant
    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: requestIdInt },
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

    if (!rentalRequest) {
      return res.status(404).json({
        error: 'Rental request not found.'
      });
    }

    // Check if the request belongs to the logged-in tenant
    if (rentalRequest.tenantId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied. This rental request does not belong to you.'
      });
    }

    if (!rentalRequest.offer) {
      return res.status(404).json({
        error: 'No offer found for this rental request.'
      });
    }

    res.json({
      offer: rentalRequest.offer
    });
  } catch (error) {
    console.error('Get offer error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// Get all offers for the logged-in tenant
const getMyOffers = async (req, res) => {
  try {
    const offers = await prisma.offer.findMany({
      where: {
        rentalRequest: {
          tenantId: req.user.id
        }
      },
      include: {
        rentalRequest: {
          select: {
            id: true,
            title: true,
            location: true,
            status: true
          }
        },
        landlord: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      offers
    });
  } catch (error) {
    console.error('Get my offers error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// Update offer status (tenant only)
const updateOfferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['ACCEPTED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Status must be either ACCEPTED or REJECTED.'
      });
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
        }
      }
    });

    if (!offer) {
      return res.status(404).json({
        error: 'Offer not found.'
      });
    }

    // Check if the offer belongs to the logged-in tenant
    if (offer.rentalRequest.tenantId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied. This offer does not belong to you.'
      });
    }

    // Check if offer is still pending
    if (offer.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Cannot update offer status. Offer is not pending.'
      });
    }

    // Update offer status
    const updatedOffer = await prisma.offer.update({
      where: { id },
      data: { status },
      include: {
        landlord: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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

    // If offer is accepted, initialize lease dates and generate contract
    if (status === 'ACCEPTED') {
      try {
        await initializeLeaseDates(id);
        console.log(`Contract can now be generated for rental request ${updatedOffer.rentalRequestId}`);
      } catch (error) {
        console.error('Error initializing lease dates:', error);
        // Don't fail the request if lease date initialization fails
      }
    }

    res.json({
      message: `Offer ${status.toLowerCase()} successfully.`,
      offer: updatedOffer
    });
  } catch (error) {
    console.error('Update offer status error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// Update offer payment status (PAID)
const updateOfferPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentIntentId } = req.body;

    // Validate status
    if (status !== 'PAID') {
      return res.status(400).json({
        error: 'Status must be PAID.'
      });
    }

    // Find the offer and check if it belongs to the logged-in tenant
    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        rentalRequest: {
          select: {
            tenantId: true,
            status: true
          }
        }
      }
    });

    if (!offer) {
      return res.status(404).json({
        error: 'Offer not found.'
      });
    }

    // Check if the offer belongs to the logged-in tenant
    if (offer.rentalRequest.tenantId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied. This offer does not belong to you.'
      });
    }

    // Check if the offer is accepted
    if (offer.status !== 'ACCEPTED') {
      return res.status(400).json({
        error: 'Cannot update payment status. Offer is not accepted.'
      });
    }

    // Update the offer status to PAID
    const updatedOffer = await prisma.offer.update({
      where: { id },
      data: {
        status: 'PAID',
        paymentIntentId: paymentIntentId
      },
      include: {
        rentalRequest: {
          select: {
            id: true,
            title: true,
            location: true
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

    res.json({
      message: 'Payment status updated successfully.',
      offer: updatedOffer
    });
  } catch (error) {
    console.error('Update offer payment status error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// Get lock status for rental request
const getLockStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const idInt = parseInt(id);

    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: idInt },
      select: {
        id: true,
        title: true,
        isLocked: true,
        status: true,
        tenantId: true,
        offer: {
          select: {
            status: true
          }
        }
      }
    });

    if (!rentalRequest) {
      return res.status(404).json({
        error: 'Rental request not found.'
      });
    }

    // Check if user has access to this request
    if (rentalRequest.tenantId !== req.user.id && req.user.role !== 'LANDLORD' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Access denied. You do not have permission to view this rental request.'
      });
    }

    res.json({
      rentalRequestId: rentalRequest.id,
      title: rentalRequest.title,
      isLocked: rentalRequest.isLocked,
      status: rentalRequest.status,
      hasAcceptedOffer: rentalRequest.offer?.status === 'ACCEPTED'
    });
  } catch (error) {
    console.error('Get lock status error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// Get rent payment history for tenant
const getMyRentPayments = async (req, res) => {
  try {
    // Get all offers for the tenant
    const offers = await prisma.offer.findMany({
      where: {
        rentalRequest: {
          tenantId: req.user.id
        },
        status: {
          in: ['ACCEPTED', 'PAID']
        }
      },
      include: {
        rentalRequest: {
          select: {
            id: true,
            title: true,
            location: true,
            status: true,
            isLocked: true
          }
        },
        rentPayments: {
          orderBy: [
            { year: 'desc' },
            { month: 'desc' }
          ]
        }
      }
    });

    // Format the response
    const rentData = offers.map(offer => ({
      offerId: offer.id,
      rentalRequest: offer.rentalRequest,
      rentAmount: offer.rentAmount,
      leaseStartDate: offer.leaseStartDate,
      leaseEndDate: offer.leaseEndDate,
      rentPayments: offer.rentPayments
    }));

    res.json({
      rentData
    });
  } catch (error) {
    console.error('Get my rent payments error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// Get current rental request status for tenant
const getCurrentRentalStatus = async (req, res) => {
  try {
    // Get the tenant's most recent accepted offer (actual rental)
    const currentRental = await prisma.offer.findFirst({
      where: {
        rentalRequest: {
          tenantId: req.user.id
        },
        status: {
          in: ['ACCEPTED', 'PAID']
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        rentalRequest: {
          select: {
            id: true,
            title: true,
            location: true,
            status: true,
            isLocked: true
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

    if (!currentRental) {
      return res.json({
        hasRental: false,
        message: 'No active rental found'
      });
    }

    res.json({
      hasRental: true,
      rental: {
        id: currentRental.rentalRequest.id,
        title: `Rental Property - ${currentRental.rentalRequest.location}`,
        location: currentRental.rentalRequest.location,
        status: currentRental.rentalRequest.status,
        isLocked: currentRental.rentalRequest.isLocked,
        offer: {
          id: currentRental.id,
          rentAmount: currentRental.rentAmount,
          leaseStartDate: currentRental.leaseStartDate,
          leaseEndDate: currentRental.leaseEndDate,
          landlord: currentRental.landlord
        }
      }
    });
  } catch (error) {
    console.error('Get current rental status error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// Get rent overview for landlord
const getLandlordRentOverview = async (req, res) => {
  try {
    // Get all accepted offers for the landlord
    const offers = await prisma.offer.findMany({
      where: {
        landlordId: req.user.id,
        status: {
          in: ['ACCEPTED', 'PAID']
        }
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
        rentPayments: {
          orderBy: [
            { year: 'desc' },
            { month: 'desc' }
          ]
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate current month and year
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Process each offer to add current status
    const rentOverview = offers.map(offer => {
      // Find current month's payment
      const currentPayment = offer.rentPayments.find(payment => 
        payment.month === currentMonth && payment.year === currentYear
      );

      // Calculate overdue payments
      const overduePayments = offer.rentPayments.filter(payment => {
        if (payment.status !== 'PENDING') return false;
        const dueDate = new Date(payment.dueDate);
        return today > dueDate;
      });

      // Determine current status
      let currentStatus = 'UNPAID';
      if (currentPayment) {
        if (currentPayment.status === 'SUCCEEDED') {
          currentStatus = 'PAID';
        } else if (currentPayment.status === 'PENDING' && today > new Date(currentPayment.dueDate)) {
          currentStatus = 'OVERDUE';
        }
      }

      return {
        offerId: offer.id,
        rentalRequest: offer.rentalRequest,
        tenant: offer.rentalRequest.tenant,
        rentAmount: offer.rentAmount,
        leaseStartDate: offer.leaseStartDate,
        leaseEndDate: offer.leaseEndDate,
        currentStatus,
        currentPayment,
        overduePayments,
        allPayments: offer.rentPayments,
        totalPayments: offer.rentPayments.length,
        paidPayments: offer.rentPayments.filter(p => p.status === 'SUCCEEDED').length,
        pendingPayments: offer.rentPayments.filter(p => p.status === 'PENDING').length
      };
    });

    res.json({
      rentOverview
    });
  } catch (error) {
    console.error('Get landlord rent overview error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// Get accepted offers for landlord
const getAcceptedOffersForLandlord = async (req, res) => {
  try {
    const offers = await prisma.offer.findMany({
      where: {
        landlordId: req.user.id,
        status: 'ACCEPTED'
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
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.json({
      offers
    });
  } catch (error) {
    console.error('Get accepted offers for landlord error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
};

// Update rental request (tenant only)
const updateRentalRequest = async (req, res) => {
  try {
    const { id } = req.params;
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

    // Check if rental request exists and belongs to the user
    const existingRequest = await prisma.rentalRequest.findFirst({
      where: {
        id: parseInt(id),
        tenantId: req.user.id
      }
    });

    if (!existingRequest) {
      return res.status(404).json({
        error: 'Rental request not found or you are not authorized to edit it.'
      });
    }

    // Check if request has an accepted offer (can't edit if accepted)
    if (existingRequest.offer && existingRequest.offer.status === 'ACCEPTED') {
      return res.status(400).json({
        error: 'Cannot edit a rental request that has an accepted offer.'
      });
    }

    // Update rental request
    const updatedRequest = await prisma.rentalRequest.update({
      where: {
        id: parseInt(id)
      },
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
        flexibleOnMoveInDate: flexibleOnMoveInDate || false
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

// Delete rental request (tenant only)
const deleteRentalRequest = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if rental request exists and belongs to the user
    const existingRequest = await prisma.rentalRequest.findFirst({
      where: {
        id: parseInt(id),
        tenantId: req.user.id
      },
      include: {
        offer: true
      }
    });

    if (!existingRequest) {
      return res.status(404).json({
        error: 'Rental request not found or you are not authorized to delete it.'
      });
    }

    // Check if request has an accepted offer (can't delete if accepted)
    if (existingRequest.offer && existingRequest.offer.status === 'ACCEPTED') {
      return res.status(400).json({
        error: 'Cannot delete a rental request that has an accepted offer.'
      });
    }

    // Delete the rental request (cascade will handle related offers)
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

export {
  createRentalRequest,
  getMyRequests,
  getAllActiveRequests,
  createOffer,
  getOfferForRequest,
  getMyOffers,
  updateOfferStatus,
  updateOfferPaymentStatus,
  getLockStatus,
  getMyRentPayments,
  getLandlordRentOverview,
  getCurrentRentalStatus,
  getAcceptedOffersForLandlord,
  updateRentalRequest,
  deleteRentalRequest
}; 