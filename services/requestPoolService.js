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
   * 🚀 SCALABILITY: Add rental request to pool with efficient matching
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

      // 🚀 SCALABILITY: Find matching landlords efficiently
      const matchingLandlords = await this.findMatchingLandlords(rentalRequest);
      
      // Create matches in batch
      if (matchingLandlords.length > 0) {
        await this.createMatches(rentalRequest.id, matchingLandlords);
      }

      // 🚀 SCALABILITY: Update analytics
      await this.updatePoolAnalytics(rentalRequest.location);

      // 🚀 SCALABILITY: Cache the request for quick access
      await this.cacheRequest(rentalRequest);

      console.log(`✅ Request ${rentalRequest.id} added to pool with ${matchingLandlords.length} matches`);
      return matchingLandlords.length;

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

      // 🚀 SCALABILITY: Optimized query with composite indexes
      const matchingLandlords = await prisma.user.findMany({
        where: {
          role: 'LANDLORD',
          availability: true,
          activeContracts: {
            lt: prisma.user.fields.totalCapacity
          },
          // 🚀 SCALABILITY: Location matching using landlord profiles
          landlordProfile: {
            preferredLocations: {
              has: rentalRequest.location
            },
            OR: [
              {
                maxBudget: {
                  gte: rentalRequest.budget
                }
              },
              {
                maxBudget: null
              }
            ],
            OR: [
              {
                minBudget: {
                  lte: rentalRequest.budget
                }
              },
              {
                minBudget: null
              }
            ]
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          activeContracts: true,
          totalCapacity: true,
          lastActiveAt: true,
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
          }
        },
        orderBy: [
          { lastActiveAt: 'desc' }, // Most active first
          { activeContracts: 'asc' } // Less busy landlords first
        ],
        take: 100 // Limit results for performance
      });

      // 🚀 SCALABILITY: Cache results for 5 minutes
      if (redisConnected && redis) {
        await redis.setEx(cacheKey, this.cacheExpiry, JSON.stringify(matchingLandlords));
      }

      console.log(`🔍 Found ${matchingLandlords.length} matching landlords for request ${rentalRequest.id}`);
      return matchingLandlords;

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
        matchScore: this.calculateMatchScore(landlord),
        matchReason: this.generateMatchReason(landlord)
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
   * 🚀 SCALABILITY: Calculate match score (0-100)
   */
  calculateMatchScore(landlord) {
    let score = 50; // Base score

    // Capacity factor (less busy = higher score)
    const capacityRatio = landlord.activeContracts / landlord.totalCapacity;
    score += (1 - capacityRatio) * 20;

    // Activity factor (more recent activity = higher score)
    const daysSinceActive = (Date.now() - new Date(landlord.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActive < 1) score += 15;
    else if (daysSinceActive < 7) score += 10;
    else if (daysSinceActive < 30) score += 5;

    // Performance factors
    if (landlord.landlordProfile?.acceptanceRate > 0.8) score += 10;
    if (landlord.landlordProfile?.averageResponseTime < 3600000) score += 5; // < 1 hour

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 🚀 SCALABILITY: Generate match reason for transparency
   */
  generateMatchReason(landlord) {
    const reasons = [];
    
    if (landlord.activeContracts < landlord.totalCapacity * 0.5) {
      reasons.push('Available capacity');
    }
    
    if (landlord.landlordProfile?.acceptanceRate > 0.8) {
      reasons.push('High acceptance rate');
    }
    
    if (landlord.landlordProfile?.averageResponseTime < 3600000) {
      reasons.push('Fast response time');
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
   * 🚀 SCALABILITY: Update landlord capacity after contract
   */
  async updateLandlordCapacity(landlordId, increment = true) {
    try {
      const updateData = {
        activeContracts: {
          increment: increment ? 1 : -1
        },
        lastActiveAt: new Date()
      };

      // Check if landlord should be marked as unavailable
      if (increment) {
        const landlord = await prisma.user.findUnique({
          where: { id: landlordId },
          select: { activeContracts: true, totalCapacity: true }
        });

        if (landlord && landlord.activeContracts + 1 >= landlord.totalCapacity) {
          updateData.availability = false;
        }
      } else {
        // If decreasing, always make available
        updateData.availability = true;
      }

      await prisma.user.update({
        where: { id: landlordId },
        data: updateData
      });

      // 🚀 SCALABILITY: Clear landlord-related caches
      await this.clearLandlordCache(landlordId);

      console.log(`📊 Updated landlord ${landlordId} capacity (${increment ? '+' : '-'}1)`);

    } catch (error) {
      console.error('❌ Error updating landlord capacity:', error);
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

      const landlordCount = await prisma.user.count({
        where: {
          role: 'LANDLORD',
          availability: true,
          landlordProfile: {
            preferredLocations: {
              has: location
            }
          }
        }
      });

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