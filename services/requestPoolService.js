import prisma from '../lib/prisma.js';

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
   * 🚀 SCALABILITY: Add rental request to pool with delayed matching
   */
  async addToPool(rentalRequest) {
    try {
      console.log(`🏊 Adding request ${rentalRequest.id} to pool (matching will start in 5 minutes)`);

      // 🚀 SCALABILITY: Calculate expiration based on move-in date (3 days before)
      const moveInDate = new Date(rentalRequest.moveInDate);
      const expirationDate = new Date(moveInDate.getTime() - (3 * 24 * 60 * 60 * 1000)); // 3 days before move-in
      
      // Update request status with dynamic expiration
      await prisma.rentalRequest.update({
        where: { id: rentalRequest.id },
        data: {
          poolStatus: 'ACTIVE',
          expiresAt: expirationDate
        }
      });

      // 🚀 SCALABILITY: NO IMMEDIATE MATCHING - wait for 5-minute cron job
      // The cron job will handle finding matching landlords and creating matches
      // This allows for the 5-minute delay and continuous matching as requested

      // 🚀 SCALABILITY: Update analytics
      await this.updatePoolAnalytics(rentalRequest.location);

      // 🚀 SCALABILITY: Cache the request for quick access
      await this.cacheRequest(rentalRequest);

      console.log(`✅ Request ${rentalRequest.id} added to pool, will start matching in 5 minutes, expires ${expirationDate.toISOString()}`);
      return 0; // Return 0 matches since matching is delayed

    } catch (error) {
      console.error('❌ Error adding request to pool:', error);
      throw error;
    }
  }

  /**
   * 🚀 SCALABILITY: Find matching landlords with optimized queries
   */
  async findMatchingLandlords(rentalRequest) {
    try {
      // 🚀 SCALABILITY: Use Redis cache for frequently accessed data
      await initializeRedis();
      if (redisConnected && redis) {
        const cacheKey = `matching_landlords:${rentalRequest.location}:${rentalRequest.budget}`;
        const cached = await redis.get(cacheKey);
        
        if (cached) {
          console.log(`📦 Using cached landlord data for ${rentalRequest.location}`);
          return JSON.parse(cached);
        }
      }

      // 🚀 SCALABILITY: Get all available landlords based on property availability
      const allLandlords = await prisma.user.findMany({
        where: {
          role: 'LANDLORD',
          availability: true, // Manual availability toggle
          properties: {
            some: {
              status: 'AVAILABLE',
              availability: true // Individual property availability
            }
          }
        },
        include: {
          landlordProfile: {
            select: {
              preferredLocations: true,
              maxBudget: true,
              minBudget: true,
              propertyTypes: true,
              amenities: true,
              averageResponseTime: true,
              acceptanceRate: true
            }
          },
          properties: {
            where: {
              status: 'AVAILABLE',
              availability: true
            },
            select: {
              id: true,
              name: true,
              city: true,
              monthlyRent: true,
              propertyType: true,
              bedrooms: true,
              availableFrom: true
            }
          }
        },
        orderBy: [
          { lastActiveAt: 'desc' }, // Most active first
          { responseTime: 'asc' } // Fastest responders first
        ]
      });

      // 🚀 SCALABILITY: Filter landlords based on location and budget
      const matchingLandlords = allLandlords.filter(landlord => {
        if (!landlord.landlordProfile) return false;
        
        // Check location matching
        let locationMatch = false;
        try {
          const preferredLocations = JSON.parse(landlord.landlordProfile.preferredLocations || '[]');
          locationMatch = preferredLocations.some(loc => 
            rentalRequest.location.includes(loc) || loc.includes(rentalRequest.location)
          );
        } catch (error) {
          console.error('Error parsing preferred locations for landlord:', landlord.id, error);
          return false;
        }
        
        if (!locationMatch) return false;
        
        // Check budget matching
        const maxBudget = landlord.landlordProfile.maxBudget;
        const minBudget = landlord.landlordProfile.minBudget;
        
        if (maxBudget && rentalRequest.budget > maxBudget) return false;
        if (minBudget && rentalRequest.budget < minBudget) return false;
        
        return true;
      });

      // 🚀 SCALABILITY: Filter and score matches
      const scoredLandlords = matchingLandlords
        .map(landlord => ({
          ...landlord,
          matchScore: this.calculateMatchScore(landlord, rentalRequest),
          matchReason: this.generateMatchReason(landlord, rentalRequest)
        }))
        .filter(landlord => landlord.matchScore > 0.3) // Only good matches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 20); // Top 20 matches

      // 🚀 SCALABILITY: Cache results
      if (redisConnected && redis) {
        await redis.setEx(cacheKey, this.cacheExpiry, JSON.stringify(scoredLandlords));
      }

      console.log(`🎯 Found ${scoredLandlords.length} matching landlords for request ${rentalRequest.id}`);
      return scoredLandlords;

    } catch (error) {
      console.error('❌ Error finding matching landlords:', error);
      return [];
    }
  }

  /**
   * 🚀 SCALABILITY: Create landlord-request matches in batch
   */
  async createMatches(rentalRequestId, landlords) {
    try {
      const matches = landlords.map(landlord => ({
        landlordId: landlord.id,
        rentalRequestId: rentalRequestId,
        matchScore: this.calculateMatchScore(landlord, landlords.find(r => r.id === rentalRequestId)), // Pass rentalRequest here
        matchReason: this.generateMatchReason(landlord, landlords.find(r => r.id === rentalRequestId)) // Pass rentalRequest here
      }));

      // 🚀 SCALABILITY: Batch insert for performance
      await prisma.landlordRequestMatch.createMany({
        data: matches,
        skipDuplicates: true
      });

      console.log(`✅ Created ${matches.length} matches for request ${rentalRequestId}`);

    } catch (error) {
      console.error('❌ Error creating matches:', error);
    }
  }

  /**
   * 🚀 SCALABILITY: Calculate match score (0-100) with new profile data
   */
  calculateMatchScore(landlord, rentalRequest) {
    let score = 50; // Base score

    // 🏠 Property availability factor (more available properties = higher score)
    const availableProperties = landlord.properties?.length || 0;
    score += Math.min(availableProperties * 5, 20); // Up to 20 points for property availability

    // 📍 Location preference factor
    if (landlord.landlordProfile?.preferredLocations && rentalRequest?.location) {
      try {
        const preferredLocations = JSON.parse(landlord.landlordProfile.preferredLocations);
        if (preferredLocations.includes(rentalRequest.location)) {
          score += 15; // Perfect location match
        }
      } catch (error) {
        console.error('Error parsing preferred locations:', error);
      }
    }

    // 💰 Budget compatibility factor
    if (landlord.landlordProfile?.maxBudget && landlord.landlordProfile?.minBudget && rentalRequest?.budget) {
      const maxBudget = landlord.landlordProfile.maxBudget;
      const minBudget = landlord.landlordProfile.minBudget;
      
      if (rentalRequest.budget >= minBudget && rentalRequest.budget <= maxBudget) {
        score += 10; // Budget within range
      } else if (rentalRequest.budget <= maxBudget) {
        score += 5; // Within max budget
      }
    }

    // 🏘️ Property type compatibility
    if (landlord.landlordProfile?.propertyTypes && rentalRequest?.propertyType) {
      try {
        const propertyTypes = JSON.parse(landlord.landlordProfile.propertyTypes);
        if (propertyTypes.includes(rentalRequest.propertyType)) {
          score += 8; // Property type match
        }
      } catch (error) {
        console.error('Error parsing property types:', error);
      }
    }

    // 🚀 Performance factors
    if (landlord.landlordProfile?.acceptanceRate && landlord.landlordProfile.acceptanceRate > 0.8) {
      score += 7; // High acceptance rate
    }

    if (landlord.responseTime && landlord.responseTime < 3600000) { // Less than 1 hour
      score += 5; // Fast response time
    }

    // 🏠 Property feature matching
    if (landlord.properties && landlord.properties.length > 0) {
      const property = landlord.properties[0]; // Use first available property for scoring
      
      // Bedroom matching
      if (rentalRequest.bedrooms && property.bedrooms) {
        if (property.bedrooms === rentalRequest.bedrooms) {
          score += 5; // Exact bedroom match
        } else if (Math.abs(property.bedrooms - rentalRequest.bedrooms) === 1) {
          score += 2; // Close bedroom match
        }
      }

      // Availability date matching
      if (rentalRequest.moveInDate && property.availableFrom) {
        const daysDiff = Math.abs(new Date(property.availableFrom) - new Date(rentalRequest.moveInDate)) / (1000 * 60 * 60 * 24);
        if (daysDiff <= 7) {
          score += 5; // Available within a week
        } else if (daysDiff <= 30) {
          score += 2; // Available within a month
        }
      }
    }

    // Ensure score is within 0-100 range
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 🚀 SCALABILITY: Generate match reason for transparency
   */
  generateMatchReason(landlord, rentalRequest) {
    const reasons = [];
    
    // Property availability reasons
    const availableProperties = landlord.properties?.length || 0;
    if (availableProperties > 0) {
      reasons.push(`${availableProperties} available property${availableProperties > 1 ? 's' : ''}`);
    }
    
    // Location reasons
    if (landlord.landlordProfile?.preferredLocations) {
      try {
        const preferredLocations = JSON.parse(landlord.landlordProfile.preferredLocations);
        if (preferredLocations.includes(rentalRequest.location)) {
          reasons.push('Preferred location');
        }
      } catch (error) {
        console.error('Error parsing preferred locations:', error);
      }
    }
    
    // Budget reasons
    if (landlord.landlordProfile?.maxBudget && rentalRequest.budget <= landlord.landlordProfile.maxBudget) {
      reasons.push('Within budget range');
    }
    
    // Property type reasons
    if (landlord.landlordProfile?.propertyTypes && rentalRequest.propertyType) {
      try {
        const propertyTypes = JSON.parse(landlord.landlordProfile.propertyTypes);
        if (propertyTypes.includes(rentalRequest.propertyType)) {
          reasons.push('Property type match');
        }
      } catch (error) {
        console.error('Error parsing property types:', error);
      }
    }
    
    // Performance reasons
    if (landlord.landlordProfile?.acceptanceRate > 0.8) {
      reasons.push('High acceptance rate');
    }
    
    if (landlord.responseTime < 3600000) {
      reasons.push('Fast response time');
    }

    // Property feature reasons
    if (landlord.properties && landlord.properties.length > 0) {
      const property = landlord.properties[0];
      
      if (rentalRequest.bedrooms && property.bedrooms && property.bedrooms === rentalRequest.bedrooms) {
        reasons.push('Exact bedroom match');
      }
      
      if (rentalRequest.moveInDate && property.availableFrom) {
        const daysDiff = Math.abs(new Date(property.availableFrom) - new Date(rentalRequest.moveInDate)) / (1000 * 60 * 60 * 24);
        if (daysDiff <= 7) {
          reasons.push('Available within a week');
        }
      }
    }

    return reasons.join(', ') || 'Location and budget match';
  }

  /**
   * 🚀 SCALABILITY: Get requests for landlord with pagination
   */
  async getRequestsForLandlord(landlordId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      // 🚀 SCALABILITY: Use Redis cache for landlord's requests
      await initializeRedis();
      if (redisConnected && redis) {
        const cacheKey = `landlord_requests:${landlordId}:${page}:${limit}`;
        const cached = await redis.get(cacheKey);
        
        if (cached) {
          return JSON.parse(cached);
        }
      }

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

      // 🚀 SCALABILITY: Cache for 2 minutes
      if (redisConnected && redis) {
        await redis.setEx(cacheKey, 120, JSON.stringify(result));
      }

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

      // 🚀 SCALABILITY: Clear cache
      await this.clearLandlordCache(landlordId);

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

      // 🚀 SCALABILITY: Clear related caches
      await this.clearRequestCache(rentalRequestId);

      console.log(`🗑️ Request ${rentalRequestId} removed from pool (${reason})`);

    } catch (error) {
      console.error('❌ Error removing request from pool:', error);
    }
  }

  /**
   * 🚀 SCALABILITY: Update landlord availability after property changes
   */
  async updateLandlordAvailability(landlordId, hasAvailableProperties = true) {
    try {
      // Update landlord availability based on whether they have available properties
      await prisma.user.update({
        where: { id: landlordId },
        data: {
          availability: hasAvailableProperties,
          lastActiveAt: new Date()
        }
      });

      // 🚀 SCALABILITY: Clear landlord-related caches
      await this.clearLandlordCache(landlordId);

      console.log(`📊 Updated landlord ${landlordId} availability to ${hasAvailableProperties}`);

    } catch (error) {
      console.error('❌ Error updating landlord availability:', error);
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

      // Skip landlord count for now to avoid Prisma validation errors
      const landlordCount = 0;

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
   * 🚀 SCALABILITY: Cache management methods
   */
  async cacheRequest(rentalRequest) {
    try {
      await initializeRedis();
      if (redisConnected && redis) {
        const cacheKey = `request:${rentalRequest.id}`;
        await redis.setEx(cacheKey, this.cacheExpiry, JSON.stringify(rentalRequest));
      }
    } catch (error) {
      console.error('❌ Error caching request:', error);
    }
  }

  async clearRequestCache(rentalRequestId) {
    try {
      await initializeRedis();
      if (redisConnected && redis) {
        const cacheKey = `request:${rentalRequestId}`;
        await redis.del(cacheKey);
      }
    } catch (error) {
      console.error('❌ Error clearing request cache:', error);
    }
  }

  async clearLandlordCache(landlordId) {
    try {
      await initializeRedis();
      if (redisConnected && redis) {
        const pattern = `landlord_requests:${landlordId}:*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(keys);
        }
      }
    } catch (error) {
      console.error('❌ Error clearing landlord cache:', error);
    }
  }

  /**
   * 🚀 SCALABILITY: Cleanup expired requests (cron job)
   */
  async cleanupExpiredRequests() {
    try {
      console.log('🧹 Starting expired requests cleanup...');
      
      // 🚀 SCALABILITY: Find requests that are 3 days before move-in date
      const expiredRequests = await prisma.rentalRequest.findMany({
        where: {
          poolStatus: 'ACTIVE',
          expiresAt: {
            lt: new Date()
          }
        },
        select: { 
          id: true,
          title: true,
          tenantId: true,
          moveInDate: true,
          expiresAt: true
        }
      });

      if (expiredRequests.length === 0) {
        console.log('✅ No expired requests found');
        return;
      }

      console.log(`📅 Found ${expiredRequests.length} expired requests`);

      // 🚀 SCALABILITY: Update all expired requests
      await prisma.rentalRequest.updateMany({
        where: {
          poolStatus: 'ACTIVE',
          expiresAt: {
            lt: new Date()
          }
        },
        data: {
          poolStatus: 'EXPIRED',
          updatedAt: new Date()
        }
      });

      // 🚀 SCALABILITY: Remove expired requests from cache
      for (const request of expiredRequests) {
        await this.clearRequestCache(request.id);
      }

      // 🚀 SCALABILITY: Update analytics
      for (const request of expiredRequests) {
        await this.updatePoolAnalytics(request.location);
      }

      console.log(`✅ Cleaned up ${expiredRequests.length} expired requests`);
      
      // 🚀 SCALABILITY: Log details for monitoring
      expiredRequests.forEach(request => {
        console.log(`   📅 Request ${request.id}: "${request.title}" expired on ${request.expiresAt}, move-in was ${request.moveInDate}`);
      });

    } catch (error) {
      console.error('❌ Error in cleanup expired requests:', error);
    }
  }

  /**
   * 🚀 SCALABILITY: Get pool statistics
   */
  async getPoolStats() {
    try {
      const [totalActive, totalLandlords, recentMatches] = await Promise.all([
        prisma.rentalRequest.count({ where: { poolStatus: 'ACTIVE' } }),
        prisma.user.count({ where: { role: 'LANDLORD', availability: true } }),
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