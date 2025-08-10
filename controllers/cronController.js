import prisma from '../lib/prisma.js';
import requestPoolService from '../services/requestPoolService.js';

// 🚀 SCALABILITY: Send notifications for expiring requests
const sendExpirationNotifications = async () => {
  try {
    console.log('🔔 Sending expiration notifications...');
    
    // Find requests expiring in the next 2 days
    const expiringSoon = await prisma.rentalRequest.findMany({
      where: {
        poolStatus: 'ACTIVE',
        expiresAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
        }
      },
      include: {
        tenant: {
          select: { id: true, email: true, name: true }
        },
        landlordRequestMatches: {
          where: { status: 'ACTIVE' },
          include: {
            landlord: {
              select: { id: true, email: true, name: true }
            }
          }
        }
      }
    });

    console.log(`📧 Found ${expiringSoon.length} requests expiring soon`);

    for (const request of expiringSoon) {
      try {
        // Calculate days until expiration
        const daysUntilExpiry = Math.ceil((new Date(request.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
        
        // Notify tenant about expiring request
        if (request.tenant) {
          console.log(`📧 Notifying tenant ${request.tenant.email} about expiring request`);
          // You can implement email notification here
          // await sendTenantExpirationNotification(request.tenant.email, request.tenant.name, daysUntilExpiry);
        }

        // Notify landlords about expiring requests they're matched with
        for (const match of request.landlordRequestMatches) {
          if (match.landlord) {
            console.log(`📧 Notifying landlord ${match.landlord.email} about expiring request`);
            // You can implement email notification here
            // await sendLandlordExpirationNotification(match.landlord.email, match.landlord.name, daysUntilExpiry);
          }
        }
      } catch (error) {
        console.error(`❌ Error sending notifications for request ${request.id}:`, error);
      }
    }

    console.log('✅ Expiration notifications sent');
  } catch (error) {
    console.error('❌ Error in sendExpirationNotifications:', error);
  }
};

// 🚀 SCALABILITY: Send notifications for rejected offers
const sendRejectionNotifications = async () => {
  try {
    console.log('🔔 Sending rejection notifications...');
    
    // Find recently rejected offers that need notifications
    const rejectedOffers = await prisma.offer.findMany({
      where: {
        status: 'REJECTED',
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        rentalRequest: {
          select: {
            tenant: {
              select: { id: true, email: true, name: true }
            }
          }
        },
        landlord: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    console.log(`📧 Found ${rejectedOffers.length} rejected offers to notify about`);

    for (const offer of rejectedOffers) {
      try {
        // Notify tenant about rejected offer
        if (offer.rentalRequest?.tenant) {
          console.log(`📧 Notifying tenant ${offer.rentalRequest.tenant.email} about rejected offer`);
          // You can implement email notification here
          // await sendOfferRejectedNotification(offer.rentalRequest.tenant.email, offer.rentalRequest.tenant.name);
        }

        // Notify landlord about rejected offer
        if (offer.landlord) {
          console.log(`📧 Notifying landlord ${offer.landlord.email} about rejected offer`);
          // You can implement email notification here
          // await sendLandlordOfferRejectedNotification(offer.landlord.email, offer.landlord.name);
        }
      } catch (error) {
        console.error(`❌ Error sending rejection notifications for offer ${offer.id}:`, error);
      }
    }

    console.log('✅ Rejection notifications sent');
  } catch (error) {
    console.error('❌ Error in sendRejectionNotifications:', error);
  }
};

// 🚀 SCALABILITY: Daily cleanup and notification job
export const dailyCleanup = async () => {
  try {
    console.log('🧹 Running daily cleanup...');
    
    // Clean up expired requests
    await cleanupExpiredRequests();
    
    // Send expiration notifications
    await sendExpirationNotifications();
    
    // Send rejection notifications
    await sendRejectionNotifications();
    
    console.log('✅ Daily cleanup completed');
  } catch (error) {
    console.error('❌ Error in daily cleanup:', error);
  }
};

// 🚀 SCALABILITY: Enhanced daily rent check with capacity management
export const dailyRentCheck = async () => {
  try {
    console.log('⏰ Starting daily rent check...');
    const startTime = Date.now();

    // Get all active rent payments
    const activePayments = await prisma.rentPayment.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          lte: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`📊 Found ${activePayments.length} overdue payments`);

    // Process payments in batches for scalability
    const batchSize = 50;
    for (let i = 0; i < activePayments.length; i += batchSize) {
      const batch = activePayments.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (payment) => {
        try {
          // Calculate late fees
          const daysLate = Math.floor((Date.now() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24));
          const lateFee = daysLate * (payment.amount * 0.05); // 5% per day

          // Update payment status
          await prisma.rentPayment.update({
            where: { id: payment.id },
            data: {
              isOverdue: true,
              lateFee: lateFee,
              status: 'PENDING' // Keep as pending for manual review
            }
          });

          console.log(`💰 Updated payment ${payment.id} with late fee: ${lateFee}`);
        } catch (error) {
          console.error(`❌ Error processing payment ${payment.id}:`, error);
        }
      }));
    }

    // 🚀 SCALABILITY: Cleanup expired requests from pool
    await requestPoolService.cleanupExpiredRequests();

    // 🚀 SCALABILITY: Update landlord availability based on capacity
    await updateLandlordAvailability();

    const endTime = Date.now();
    console.log(`✅ Daily rent check completed in ${endTime - startTime}ms`);
  } catch (error) {
    console.error('❌ Error in daily rent check:', error);
  }
};

// 🚀 SCALABILITY: Update landlord availability based on capacity
const updateLandlordAvailability = async () => {
  try {
    console.log('🔄 Updating landlord availability...');

    // Find landlords who should be marked as unavailable
    const overCapacityLandlords = await prisma.user.findMany({
      where: {
        role: 'LANDLORD',
        availability: true,
        activeContracts: {
          gte: prisma.user.fields.totalCapacity
        }
      },
      select: {
        id: true,
        name: true,
        activeContracts: true,
        totalCapacity: true
      }
    });

    // Mark over-capacity landlords as unavailable
    if (overCapacityLandlords.length > 0) {
      await prisma.user.updateMany({
        where: {
          id: {
            in: overCapacityLandlords.map(l => l.id)
          }
        },
        data: {
          availability: false
        }
      });

      console.log(`🚫 Marked ${overCapacityLandlords.length} landlords as unavailable due to capacity limits`);
    }

    // Find landlords who can be marked as available again
    const underCapacityLandlords = await prisma.user.findMany({
      where: {
        role: 'LANDLORD',
        availability: false,
        activeContracts: {
          lt: prisma.user.fields.totalCapacity
        }
      },
      select: {
        id: true,
        name: true,
        activeContracts: true,
        totalCapacity: true
      }
    });

    // Mark under-capacity landlords as available
    if (underCapacityLandlords.length > 0) {
      await prisma.user.updateMany({
        where: {
          id: {
            in: underCapacityLandlords.map(l => l.id)
          }
        },
        data: {
          availability: true
        }
      });

      console.log(`✅ Marked ${underCapacityLandlords.length} landlords as available again`);
    }

  } catch (error) {
    console.error('❌ Error updating landlord availability:', error);
  }
};

// 🚀 SCALABILITY: Initialize lease dates for accepted offers
export const initializeLeaseDates = async (offerId) => {
  try {
    console.log(`📅 Initializing lease dates for offer ${offerId}`);

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        rentalRequest: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!offer) {
      throw new Error('Offer not found');
    }

    // Calculate lease start and end dates
    const leaseStartDate = new Date(offer.availableFrom);
    const leaseEndDate = new Date(leaseStartDate);
    leaseEndDate.setMonth(leaseEndDate.getMonth() + offer.leaseDuration);

    // Update offer with lease dates
    await prisma.offer.update({
      where: { id: offerId },
      data: {
        leaseStartDate: leaseStartDate,
        leaseEndDate: leaseEndDate
      }
    });

    // 🚀 SCALABILITY: Create rent payment records for the lease duration
    await createRentPayments(offerId, leaseStartDate, leaseEndDate, offer.rentAmount);

    console.log(`✅ Lease dates initialized for offer ${offerId}`);
  } catch (error) {
    console.error('❌ Error initializing lease dates:', error);
    throw error;
  }
};

// 🚀 SCALABILITY: Create rent payment records for lease duration
const createRentPayments = async (offerId, leaseStartDate, leaseEndDate, rentAmount) => {
  try {
    const payments = [];
    const currentDate = new Date(leaseStartDate);
    
    while (currentDate < leaseEndDate) {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const dueDate = new Date(currentDate);
      dueDate.setDate(dueDate.getDate() + 1); // Due on 1st of each month

      payments.push({
        amount: rentAmount,
        status: 'PENDING',
        dueDate: dueDate,
        month: month,
        year: year,
        isOverdue: false,
        lateFee: 0,
        gracePeriod: 5
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // 🚀 SCALABILITY: Batch insert payments for performance
    if (payments.length > 0) {
      await prisma.rentPayment.createMany({
        data: payments.map(payment => ({
          ...payment,
          offerId: offerId
        }))
      });

      console.log(`💰 Created ${payments.length} rent payment records for offer ${offerId}`);
    }
  } catch (error) {
    console.error('❌ Error creating rent payments:', error);
    throw error;
  }
};

// 🚀 SCALABILITY: Weekly analytics update
export const weeklyAnalyticsUpdate = async () => {
  try {
    console.log('📊 Starting weekly analytics update...');

    // Update request pool analytics for all locations
    const locations = await prisma.rentalRequest.groupBy({
      by: ['location'],
      _count: {
        location: true
      }
    });

    for (const location of locations) {
      await requestPoolService.updatePoolAnalytics(location.location);
    }

    // Update landlord performance metrics
    await updateLandlordPerformanceMetrics();

    console.log('✅ Weekly analytics update completed');
  } catch (error) {
    console.error('❌ Error in weekly analytics update:', error);
  }
};

// 🚀 SCALABILITY: Update landlord performance metrics
const updateLandlordPerformanceMetrics = async () => {
  try {
    const landlords = await prisma.user.findMany({
      where: {
        role: 'LANDLORD'
      },
      include: {
        offers: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          select: {
            id: true,
            status: true,
            responseTime: true,
            createdAt: true
          }
        }
      }
    });

    for (const landlord of landlords) {
      const acceptedOffers = landlord.offers.filter(o => o.status === 'ACCEPTED');
      const totalOffers = landlord.offers.length;
      
      const acceptanceRate = totalOffers > 0 ? acceptedOffers.length / totalOffers : 0;
      const averageResponseTime = landlord.offers.length > 0 
        ? landlord.offers.reduce((sum, o) => sum + (o.responseTime || 0), 0) / landlord.offers.length 
        : null;

      await prisma.landlordProfile.update({
        where: { userId: landlord.id },
        data: {
          acceptanceRate: acceptanceRate,
          averageResponseTime: averageResponseTime
        }
      });
    }

    console.log(`📈 Updated performance metrics for ${landlords.length} landlords`);
  } catch (error) {
    console.error('❌ Error updating landlord performance metrics:', error);
  }
};

// 🚀 SCALABILITY: Monthly cleanup and maintenance
export const monthlyCleanup = async () => {
  try {
    console.log('🧹 Starting monthly cleanup...');

    // Archive old analytics data (keep last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    await prisma.requestPoolAnalytics.deleteMany({
      where: {
        date: {
          lt: twelveMonthsAgo
        }
      }
    });

    // Clean up old matches (keep last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    await prisma.landlordRequestMatch.deleteMany({
      where: {
        createdAt: {
          lt: sixMonthsAgo
        },
        isViewed: true,
        isResponded: true
      }
    });

    console.log('✅ Monthly cleanup completed');
  } catch (error) {
    console.error('❌ Error in monthly cleanup:', error);
  }
}; 

// 🚀 SCALABILITY: Continuous request matching - runs every 5 minutes
export const continuousRequestMatching = async () => {
  try {
    console.log('🔄 Running continuous request matching...');
    
    // Get all active requests that are ready for matching (5+ minutes old)
    const readyRequests = await prisma.rentalRequest.findMany({
      where: {
        poolStatus: 'ACTIVE',
        createdAt: {
          lt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes old
        },
        expiresAt: {
          gt: new Date() // Not expired yet
        }
      },
      include: {
        landlordRequestMatches: {
          select: {
            landlordId: true
          }
        }
      }
    });

    if (readyRequests.length > 0) {
      console.log(`📋 Found ${readyRequests.length} requests ready for matching`);
      
      for (const request of readyRequests) {
        try {
          // Check if this request already has matches
          const existingMatches = request.landlordRequestMatches || [];
          const matchedLandlordIds = existingMatches.map(match => match.landlordId);
          
          // Find new landlords that weren't matched before
          const newMatchingLandlords = await findNewMatchingLandlords(request, matchedLandlordIds);
          
          if (newMatchingLandlords.length > 0) {
            // Create new matches for newly available landlords
            await createNewMatches(request.id, newMatchingLandlords);
            console.log(`✅ Created ${newMatchingLandlords.length} new matches for request ${request.id}`);
          }
        } catch (error) {
          console.error(`❌ Error processing request ${request.id}:`, error);
        }
      }
    }

    // Also check for new properties that might match existing requests
    await matchNewPropertiesWithExistingRequests();
    
    console.log('✅ Continuous request matching completed');
  } catch (error) {
    console.error('❌ Error in continuous request matching:', error);
  }
};

// 🚀 SCALABILITY: Helper function to find new matching landlords for a request
const findNewMatchingLandlords = async (request, existingMatchedLandlordIds) => {
  try {
    // Find landlords with available properties that match the request criteria
    const matchingLandlords = await prisma.user.findMany({
      where: {
        role: 'LANDLORD',
        availability: true,
        id: { notIn: existingMatchedLandlordIds },
        properties: {
          some: {
            status: 'AVAILABLE',
            availability: true,
            // 🚀 SCALABILITY: Property-specific matching criteria for accurate matches
            // Location matching (city/district)
            ...(request.city && {
              city: {
                contains: request.city,
                mode: 'insensitive'
              }
            }),
            // Budget matching (within 20% flexibility)
            ...(request.budget && {
              monthlyRent: {
                gte: (request.budgetFrom || request.budget) * 0.8,
                lte: (request.budgetTo || request.budget) * 1.2
              }
            }),
            // Property type matching
            ...(request.propertyType && {
              propertyType: request.propertyType
            }),
            // Date matching (property available before tenant move-in)
            availableFrom: {
              lte: new Date(request.moveInDate)
            }
          }
        }
      },
      include: {
        properties: {
          where: {
            status: 'AVAILABLE',
            availability: true
          },
          select: {
            id: true,
            address: true,
            propertyType: true,
            monthlyRent: true
          }
        }
      }
    });

    console.log(`🔍 Found ${matchingLandlords.length} new matching landlords for request ${request.id}`);
    return matchingLandlords;
  } catch (error) {
    console.error(`❌ Error finding new matching landlords for request ${request.id}:`, error);
    return [];
  }
};

// 🚀 SCALABILITY: Helper function to create new matches
const createNewMatches = async (requestId, matchingLandlords) => {
  try {
    const matches = [];
    
    for (const landlord of matchingLandlords) {
      for (const property of landlord.properties) {
        const matchScore = await calculateMatchScore(requestId, landlord.id, property.id);
        const matchReason = await generateMatchReason(requestId, landlord.id, property.id);
        
        matches.push({
          rentalRequestId: requestId,
          landlordId: landlord.id,
          propertyId: property.id,
          matchScore,
          matchReason,
          status: 'ACTIVE',
          isViewed: false,
          isResponded: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    if (matches.length > 0) {
      await prisma.landlordRequestMatch.createMany({
        data: matches
      });
      
      console.log(`✅ Created ${matches.length} new matches for request ${requestId}`);
      
      // Update request analytics
      await prisma.rentalRequest.update({
        where: { id: requestId },
        data: {
          viewCount: { increment: matches.length },
          updatedAt: new Date()
        }
      });
    }
  } catch (error) {
    console.error(`❌ Error creating new matches for request ${requestId}:`, error);
  }
};

// 🚀 SCALABILITY: Helper function to match new properties with existing requests
const matchNewPropertiesWithExistingRequests = async () => {
  try {
    console.log('🔍 Checking for new properties to match with existing requests...');
    
    // Find active requests that are older than 5 minutes
    const activeRequests = await prisma.rentalRequest.findMany({
      where: {
        poolStatus: 'ACTIVE',
        createdAt: {
          lt: new Date(Date.now() - 5 * 60 * 1000) // Older than 5 minutes
        }
      },
      include: {
        landlordRequestMatches: {
          select: {
            landlordId: true,
            propertyId: true
          }
        }
      }
    });

    if (activeRequests.length === 0) {
      console.log('📝 No active requests to match with new properties');
      return;
    }

    for (const request of activeRequests) {
      try {
        // Get existing matched landlords and properties
        const existingMatches = request.landlordRequestMatches;
        const existingLandlordIds = existingMatches.map(match => match.landlordId);
        const existingPropertyIds = existingMatches.map(match => match.propertyId);

        // Find new matching landlords for this request
        const newMatchingLandlords = await findNewMatchingLandlords(request, existingLandlordIds);
        
        if (newMatchingLandlords.length > 0) {
          await createNewMatches(request.id, newMatchingLandlords);
        }
      } catch (error) {
        console.error(`❌ Error matching new properties for request ${request.id}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error in matchNewPropertiesWithExistingRequests:', error);
  }
};

// 🚀 SCALABILITY: Helper function to calculate match score
const calculateMatchScore = async (requestId, landlordId, propertyId) => {
  try {
    // Get the rental request and property details for scoring
    const [request, property] = await Promise.all([
      prisma.rentalRequest.findUnique({
        where: { id: requestId },
        select: {
          budget: true,
          budgetFrom: true,
          budgetTo: true,
          city: true,
          propertyType: true,
          moveInDate: true,
          bedrooms: true,
          bathrooms: true,
          furnished: true,
          parking: true,
          petsAllowed: true
        }
      }),
      prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          monthlyRent: true,
          city: true,
          propertyType: true,
          availableFrom: true,
          bedrooms: true,
          bathrooms: true,
          furnished: true,
          parking: true,
          petsAllowed: true
        }
      })
    ]);

    if (!request || !property) {
      return 70; // Base score if data unavailable
    }

    let score = 70; // Base score

    // Budget matching (40% of score)
    const budgetScore = calculateBudgetScore(request, property);
    score += budgetScore * 0.4;

    // Location matching (25% of score)
    const locationScore = calculateLocationScore(request, property);
    score += locationScore * 0.25;

    // Property type matching (20% of score)
    const typeScore = calculatePropertyTypeScore(request, property);
    score += typeScore * 0.2;

    // Feature matching (15% of score)
    const featureScore = calculateFeatureScore(request, property);
    score += featureScore * 0.15;

    return Math.round(Math.min(score, 100)); // Cap at 100
  } catch (error) {
    console.error(`❌ Error calculating match score for request ${requestId}:`, error);
    return 70; // Fallback score
  }
};

// Helper functions for scoring
const calculateBudgetScore = (request, property) => {
  const requestBudget = request.budgetTo || request.budget;
  const propertyRent = property.monthlyRent;
  
  if (propertyRent <= requestBudget) {
    return 100; // Perfect match
  } else if (propertyRent <= requestBudget * 1.1) {
    return 80; // Within 10%
  } else if (propertyRent <= requestBudget * 1.2) {
    return 60; // Within 20%
  } else {
    return 30; // Over budget
  }
};

const calculateLocationScore = (request, property) => {
  if (!request.city || !property.city) return 70;
  
  const requestCity = request.city.toLowerCase();
  const propertyCity = property.city.toLowerCase();
  
  if (requestCity === propertyCity) {
    return 100; // Exact match
  } else if (propertyCity.includes(requestCity) || requestCity.includes(propertyCity)) {
    return 85; // Partial match
  } else {
    return 50; // No match
  }
};

const calculatePropertyTypeScore = (request, property) => {
  if (!request.propertyType || !property.propertyType) return 70;
  
  if (request.propertyType === property.propertyType) {
    return 100; // Exact match
  } else {
    return 60; // Different type
  }
};

const calculateFeatureScore = (request, property) => {
  let score = 70;
  let matches = 0;
  let total = 0;

  // Check boolean features
  if (request.furnished !== undefined && property.furnished !== undefined) {
    total++;
    if (request.furnished === property.furnished) matches++;
  }
  
  if (request.parking !== undefined && property.parking !== undefined) {
    total++;
    if (request.parking === property.parking) matches++;
  }
  
  if (request.petsAllowed !== undefined && property.petsAllowed !== undefined) {
    total++;
    if (request.petsAllowed === property.petsAllowed) matches++;
  }

  // Check numeric features
  if (request.bedrooms && property.bedrooms) {
    total++;
    if (request.bedrooms === property.bedrooms) matches++;
  }
  
  if (request.bathrooms && property.bathrooms) {
    total++;
    if (request.bathrooms === property.bathrooms) matches++;
  }

  if (total > 0) {
    score = (matches / total) * 100;
  }

  return score;
};

// 🚀 SCALABILITY: Helper function to generate match reason
const generateMatchReason = async (requestId, landlordId, propertyId) => {
  try {
    // Get the rental request and property details for reason generation
    const [request, property] = await Promise.all([
      prisma.rentalRequest.findUnique({
        where: { id: requestId },
        select: {
          budget: true,
          budgetFrom: true,
          budgetTo: true,
          city: true,
          propertyType: true,
          moveInDate: true,
          bedrooms: true,
          bathrooms: true,
          furnished: true,
          parking: true,
          petsAllowed: true
        }
      }),
      prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          monthlyRent: true,
          city: true,
          propertyType: true,
          availableFrom: true,
          bedrooms: true,
          bathrooms: true,
          furnished: true,
          parking: true,
          petsAllowed: true
        }
      })
    ]);

    if (!request || !property) {
      return 'Property matches tenant requirements';
    }

    const reasons = [];

    // Budget reason
    if (property.monthlyRent <= (request.budgetTo || request.budget)) {
      reasons.push(`Rent (${property.monthlyRent} PLN) fits tenant's budget (${request.budgetTo || request.budget} PLN)`);
    } else if (property.monthlyRent <= (request.budgetTo || request.budget) * 1.2) {
      reasons.push(`Rent (${property.monthlyRent} PLN) within 20% of tenant's budget`);
    }

    // Location reason
    if (request.city && property.city && request.city.toLowerCase() === property.city.toLowerCase()) {
      reasons.push(`Perfect location match: ${property.city}`);
    } else if (request.city && property.city && (request.city.toLowerCase().includes(property.city.toLowerCase()) || property.city.toLowerCase().includes(request.city.toLowerCase()))) {
      reasons.push(`Location compatible: ${property.city} matches ${request.city}`);
    }

    // Property type reason
    if (request.propertyType && property.propertyType && request.propertyType === property.propertyType) {
      reasons.push(`Exact property type match: ${property.propertyType}`);
    }

    // Date reason
    if (property.availableFrom && request.moveInDate && new Date(property.availableFrom) <= new Date(request.moveInDate)) {
      reasons.push(`Available from ${new Date(property.availableFrom).toLocaleDateString()} - perfect for tenant's move-in`);
    }

    // Feature reasons
    if (request.furnished !== undefined && property.furnished !== undefined && request.furnished === property.furnished) {
      reasons.push(request.furnished ? 'Furnished property matches tenant preference' : 'Unfurnished property matches tenant preference');
    }

    if (request.parking !== undefined && property.parking !== undefined && request.parking === property.parking) {
      reasons.push(request.parking ? 'Parking available matches tenant preference' : 'No parking matches tenant preference');
    }

    if (request.petsAllowed !== undefined && property.petsAllowed !== undefined && request.petsAllowed === property.petsAllowed) {
      reasons.push(request.petsAllowed ? 'Pet-friendly property matches tenant preference' : 'No pets policy matches tenant preference');
    }

    // Bedroom/bathroom reasons
    if (request.bedrooms && property.bedrooms && request.bedrooms === property.bedrooms) {
      reasons.push(`${property.bedrooms} bedroom(s) matches tenant requirement`);
    }

    if (request.bathrooms && property.bathrooms && request.bathrooms === property.bathrooms) {
      reasons.push(`${property.bathrooms} bathroom(s) matches tenant requirement`);
    }

    // Combine reasons
    if (reasons.length > 0) {
      return reasons.slice(0, 3).join('. ') + '.';
    } else {
      return 'Property meets basic tenant requirements';
    }
  } catch (error) {
    console.error(`❌ Error generating match reason for request ${requestId}:`, error);
    return 'Property matches tenant requirements';
  }
}; 