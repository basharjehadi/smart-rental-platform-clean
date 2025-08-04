import { prisma } from '../utils/prisma.js';

// 🚀 SCALABILITY: Redis client for caching (disabled for development)
let redis = null;
let redisConnected = false;

// Initialize Redis only when needed (disabled for now)
const initializeRedis = async () => {
  // Redis disabled for development - will be enabled in production
  console.log('📝 Redis disabled for development');
  return;
};

class RequestPoolService {
  constructor() {
    this.cacheExpiry = 300; // 5 minutes
    this.batchSize = 50; // Process requests in batches
  }

  /**
   * 🚀 SCALABILITY: Add rental request to pool with simple matching
   */
  async addToPool(rentalRequest) {
    try {
      console.log(`🏊 Adding request ${rentalRequest.id} to pool`);

      // Update request status
      await prisma.rentalRequest.update({
        where: { id: rentalRequest.id },
        data: {
          poolStatus: 'ACTIVE',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });

      // 🚀 SCALABILITY: Find matching landlords based on their properties
      const matchingLandlords = await this.findMatchingLandlordsByProperties(rentalRequest);
      
      // Create matches in batch
      if (matchingLandlords.length > 0) {
        await this.createMatches(rentalRequest.id, matchingLandlords, rentalRequest);
      }

      // 🚀 SCALABILITY: Update analytics
      await this.updatePoolAnalytics(rentalRequest.location);

      console.log(`✅ Request ${rentalRequest.id} added to pool with ${matchingLandlords.length} matches`);
      return matchingLandlords.length;

    } catch (error) {
      console.error('❌ Error adding request to pool:', error);
      throw error;
    }
  }

  /**
   * 🚀 SCALABILITY: Find matching landlords based on their property listings
   */
  async findMatchingLandlordsByProperties(rentalRequest) {
    try {
      console.log(`🔍 Finding landlords with matching properties for request ${rentalRequest.id}`);
      console.log(`   📍 Request Location: ${rentalRequest.location}`);
      console.log(`   💰 Request Budget: ${rentalRequest.budgetFrom}-${rentalRequest.budgetTo} PLN`);
      console.log(`   🏠 Request Bedrooms: ${rentalRequest.bedrooms}`);
      console.log(`   📅 Request Move-in: ${rentalRequest.moveInDate}`);

      // Get all landlords who have properties that match the rental request criteria
      const matchingLandlords = await prisma.user.findMany({
        where: {
          role: 'LANDLORD',
          properties: {
            some: {
              // Location matching (simple string contains)
              OR: [
                { city: { contains: rentalRequest.location.split(',')[0].trim() } },
                { address: { contains: rentalRequest.location.split(',')[0].trim() } }
              ],
              // Budget matching
              monthlyRent: {
                gte: rentalRequest.budgetFrom || rentalRequest.budget * 0.8,
                lte: rentalRequest.budgetTo || rentalRequest.budget * 1.2
              },
              // Bedrooms matching (if specified)
              ...(rentalRequest.bedrooms && {
                bedrooms: rentalRequest.bedrooms
              }),
              // Property is available
              availableFrom: {
                lte: new Date(rentalRequest.moveInDate)
              }
            }
          }
        },
        include: {
          properties: {
            where: {
              // Location matching
              OR: [
                { city: { contains: rentalRequest.location.split(',')[0].trim() } },
                { address: { contains: rentalRequest.location.split(',')[0].trim() } }
              ],
              // Budget matching
              monthlyRent: {
                gte: rentalRequest.budgetFrom || rentalRequest.budget * 0.8,
                lte: rentalRequest.budgetTo || rentalRequest.budget * 1.2
              },
              // Bedrooms matching (if specified)
              ...(rentalRequest.bedrooms && {
                bedrooms: rentalRequest.bedrooms
              }),
              // Property is available
              availableFrom: {
                lte: new Date(rentalRequest.moveInDate)
              }
            },
            select: {
              id: true,
              name: true,
              city: true,
              address: true,
              monthlyRent: true,
              bedrooms: true,
              availableFrom: true
            }
          }
        }
      });

      console.log(`🔍 Found ${matchingLandlords.length} landlords with matching properties`);
      
      // Debug: Log each matching landlord and their properties
      matchingLandlords.forEach(landlord => {
        console.log(`   👤 Landlord ${landlord.id} (${landlord.email}):`);
        landlord.properties.forEach(property => {
          console.log(`      🏢 Property: ${property.name} - ${property.city}, ${property.monthlyRent} PLN, ${property.bedrooms} bedrooms`);
        });
      });

      // 🚀 SCALABILITY: Score and filter matches
      const scoredLandlords = matchingLandlords
        .map(landlord => ({
          ...landlord,
          matchScore: this.calculateSimpleMatchScore(landlord, rentalRequest),
          matchReason: this.generateSimpleMatchReason(landlord, rentalRequest),
          matchingProperties: landlord.properties
        }))
        .filter(landlord => landlord.matchScore > 0.3) // Only good matches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 20); // Top 20 matches

      console.log(`🎯 After scoring: ${scoredLandlords.length} landlords with score > 0.3`);
      
      // Debug: Log scored landlords
      scoredLandlords.forEach(landlord => {
        console.log(`   🏆 Landlord ${landlord.id}: Score ${landlord.matchScore}, Reason: ${landlord.matchReason}`);
      });

      return scoredLandlords;

    } catch (error) {
      console.error('❌ Error finding matching landlords:', error);
      return [];
    }
  }

  /**
   * 🚀 SCALABILITY: Calculate simple match score based on property criteria
   */
  calculateSimpleMatchScore(landlord, rentalRequest) {
    let score = 50; // Base score

    if (!landlord.properties || landlord.properties.length === 0) {
      return 0;
    }

    // Get the best matching property
    const bestProperty = landlord.properties[0]; // Already sorted by match criteria

    // 📍 Location match (40 points)
    const locationMatch = bestProperty.city.includes(rentalRequest.location.split(',')[0].trim()) ||
                         bestProperty.address.includes(rentalRequest.location.split(',')[0].trim());
    if (locationMatch) {
      score += 40;
    }

    // 💰 Budget match (30 points)
    const budgetRange = rentalRequest.budgetTo - rentalRequest.budgetFrom;
    const budgetTolerance = budgetRange * 0.1; // 10% tolerance
    
    if (bestProperty.monthlyRent >= (rentalRequest.budgetFrom - budgetTolerance) && 
        bestProperty.monthlyRent <= (rentalRequest.budgetTo + budgetTolerance)) {
      score += 30;
    } else if (bestProperty.monthlyRent >= rentalRequest.budgetFrom && 
               bestProperty.monthlyRent <= rentalRequest.budgetTo) {
      score += 25; // Within exact range
    } else if (bestProperty.monthlyRent <= rentalRequest.budgetTo) {
      score += 15; // Within max budget
    }

    // 🏠 Bedrooms match (20 points)
    if (rentalRequest.bedrooms && bestProperty.bedrooms === rentalRequest.bedrooms) {
      score += 20;
    } else if (rentalRequest.bedrooms && Math.abs(bestProperty.bedrooms - rentalRequest.bedrooms) <= 1) {
      score += 10; // Close match
    }

    // 📅 Availability match (10 points)
    const moveInDate = new Date(rentalRequest.moveInDate);
    const availableFrom = new Date(bestProperty.availableFrom);
    const daysDiff = Math.abs((moveInDate - availableFrom) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 7) {
      score += 10; // Available within a week
    } else if (daysDiff <= 30) {
      score += 5; // Available within a month
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 🚀 SCALABILITY: Generate simple match reason
   */
  generateSimpleMatchReason(landlord, rentalRequest) {
    const reasons = [];
    
    if (!landlord.properties || landlord.properties.length === 0) {
      return 'No matching properties';
    }

    const bestProperty = landlord.properties[0];

    // Location reasons
    if (bestProperty.city.includes(rentalRequest.location.split(',')[0].trim()) ||
        bestProperty.address.includes(rentalRequest.location.split(',')[0].trim())) {
      reasons.push('Location match');
    }

    // Budget reasons
    if (bestProperty.monthlyRent >= rentalRequest.budgetFrom && 
        bestProperty.monthlyRent <= rentalRequest.budgetTo) {
      reasons.push('Budget match');
    } else if (bestProperty.monthlyRent <= rentalRequest.budgetTo) {
      reasons.push('Within budget');
    }

    // Bedrooms reasons
    if (rentalRequest.bedrooms && bestProperty.bedrooms === rentalRequest.bedrooms) {
      reasons.push('Bedrooms match');
    }

    // Availability reasons
    const moveInDate = new Date(rentalRequest.moveInDate);
    const availableFrom = new Date(bestProperty.availableFrom);
    if (availableFrom <= moveInDate) {
      reasons.push('Available on time');
    }

    return reasons.join(', ') || 'Property criteria match';
  }

  /**
   * 🚀 SCALABILITY: Create landlord-request matches in batch
   */
  async createMatches(rentalRequestId, landlords, rentalRequest) {
    try {
      const matches = landlords.map(landlord => ({
        landlordId: landlord.id,
        rentalRequestId: rentalRequestId,
        matchScore: landlord.matchScore,
        matchReason: landlord.matchReason
      }));

      // 🚀 SCALABILITY: Batch insert for performance
      await prisma.landlordRequestMatch.createMany({
        data: matches,
        skipDuplicates: true
      });

      console.log(`✅ Created ${matches.length} matches for request ${rentalRequestId}`);
      
      // Debug: Log each match
      matches.forEach(match => {
        console.log(`   📍 Match: Landlord ${match.landlordId} -> Request ${match.rentalRequestId} (Score: ${match.matchScore})`);
      });

    } catch (error) {
      console.error('❌ Error creating matches:', error);
    }
  }

  /**
   * 🚀 SCALABILITY: Get requests for landlord with pagination
   */
  async getRequestsForLandlord(landlordId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const requests = await prisma.landlordRequestMatch.findMany({
        where: {
          landlordId: landlordId,
          isViewed: false,
          rentalRequest: {
            poolStatus: 'ACTIVE',
            expiresAt: {
              gt: new Date()
            }
          }
        },
        include: {
          rentalRequest: {
            include: {
              tenant: {
                select: {
                  id: true,
                  name: true,
                  profileImage: true
                }
              }
            }
          }
        },
        orderBy: [
          { matchScore: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: offset,
        take: limit
      });

      const total = await prisma.landlordRequestMatch.count({
        where: {
          landlordId: landlordId,
          isViewed: false,
          rentalRequest: {
            poolStatus: 'ACTIVE',
            expiresAt: {
              gt: new Date()
            }
          }
        }
      });

      const result = {
        requests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

      return result;

    } catch (error) {
      console.error('❌ Error getting requests for landlord:', error);
      throw error;
    }
  }

  /**
   * 🚀 SCALABILITY: Mark request as viewed by landlord
   */
  async markAsViewed(landlordId, rentalRequestId) {
    try {
      await prisma.landlordRequestMatch.updateMany({
        where: {
          landlordId: landlordId,
          rentalRequestId: rentalRequestId
        },
        data: {
          isViewed: true
        }
      });

      // 🚀 SCALABILITY: Update request view count
      await prisma.rentalRequest.update({
        where: { id: rentalRequestId },
        data: {
          viewCount: {
            increment: 1
          }
        }
      });

    } catch (error) {
      console.error('❌ Error marking request as viewed:', error);
    }
  }

  /**
   * 🚀 SCALABILITY: Remove request from pool (when accepted/expired)
   */
  async removeFromPool(rentalRequestId, reason = 'MATCHED') {
    try {
      // Update request status
      await prisma.rentalRequest.update({
        where: { id: rentalRequestId },
        data: {
          poolStatus: reason,
          updatedAt: new Date()
        }
      });

      // Remove all matches for this request
      await prisma.landlordRequestMatch.deleteMany({
        where: { rentalRequestId: rentalRequestId }
      });

      console.log(`🗑️ Request ${rentalRequestId} removed from pool (${reason})`);

    } catch (error) {
      console.error('❌ Error removing request from pool:', error);
    }
  }

  /**
   * 🚀 SCALABILITY: Update pool analytics
   */
  async updatePoolAnalytics(location) {
    try {
      const [totalRequests, activeRequests, matchedRequests, expiredRequests] = await Promise.all([
        prisma.rentalRequest.count({ where: { location } }),
        prisma.rentalRequest.count({ where: { location, poolStatus: 'ACTIVE' } }),
        prisma.rentalRequest.count({ where: { location, poolStatus: 'MATCHED' } }),
        prisma.rentalRequest.count({ where: { location, poolStatus: 'EXPIRED' } })
      ]);

      const landlordCount = 0; // Skip for now

      await prisma.requestPoolAnalytics.create({
        data: {
          location,
          totalRequests,
          activeRequests,
          matchedRequests,
          expiredRequests,
          landlordCount,
          date: new Date()
        }
      });

    } catch (error) {
      console.error('❌ Error updating pool analytics:', error);
    }
  }

  /**
   * 🚀 SCALABILITY: Cleanup expired requests (cron job)
   */
  async cleanupExpiredRequests() {
    try {
      const expiredRequests = await prisma.rentalRequest.findMany({
        where: {
          poolStatus: 'ACTIVE',
          expiresAt: {
            lt: new Date()
          }
        },
        select: { id: true }
      });

      for (const request of expiredRequests) {
        await this.removeFromPool(request.id, 'EXPIRED');
      }

      console.log(`🧹 Cleaned up ${expiredRequests.length} expired requests`);

    } catch (error) {
      console.error('❌ Error cleaning up expired requests:', error);
    }
  }

  /**
   * 🚀 SCALABILITY: Get pool statistics
   */
  async getPoolStats() {
    try {
      const [totalActive, totalLandlords, recentMatches] = await Promise.all([
        prisma.rentalRequest.count({ where: { poolStatus: 'ACTIVE' } }),
        prisma.user.count({ where: { role: 'LANDLORD' } }),
        prisma.landlordRequestMatch.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        })
      ]);

      return {
        activeRequests: totalActive,
        availableLandlords: totalLandlords,
        recentMatches,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Error getting pool stats:', error);
      return null;
    }
  }
}

export default new RequestPoolService(); 