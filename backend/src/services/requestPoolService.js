import { prisma } from '../utils/prisma.js';

// ────────────────────────────────────────────────────────────
// Helpers: tolerant text + safe parsing + int coercion
// ────────────────────────────────────────────────────────────
const normalizeASCII = (value) => {
  if (!value) return '';
  try { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  catch { return value; }
};
const parseMoney = (v) => {
  if (v == null) return null;
  const s = String(v).trim(); if (!s) return null;
  const n = parseFloat(s.replace(/[^\d,.\-]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const asInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

class RequestPoolService {
  constructor() {
    this.cacheExpiry = 300; // 5 minutes
    this.batchSize = 50; // Process requests in batches
    // Scoring + thresholds
    this.matchingConfig = {
      weights: { location: 40, budget: 25, features: 20, timing: 10, performance: 5 },
      thresholds: { highDemand: 30, lowDemand: 60, urgent: 20, normal: 40 },
    };
  }

  // Structured logging (compact)
  logInfo(event, payload = {}) { console.log(JSON.stringify({ level: 'info', event, ...payload })); }
  logWarn(event, payload = {}) { console.warn(JSON.stringify({ level: 'warn', event, ...payload })); }
  logErr (event, payload = {}) { console.error(JSON.stringify({ level: 'error', event, ...payload })); }

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
   * 🚀 Property-centric candidate discovery with tolerant location & parsed budgets
   */
  async findMatchingLandlordsByProperties(rentalRequest) {
    try {
      this.logInfo('matching.start', { requestId: rentalRequest.id });

      // ── Location tokens (tolerant)
      const rawLocation = rentalRequest.location || '';
      const cityToken = rawLocation.split(',').pop()?.trim() || rawLocation;
      const cityTokenNorm = normalizeASCII(cityToken);
      const tokens = rawLocation.split(',').map(t => t.trim()).filter(Boolean);
      const normTokens = tokens.map(normalizeASCII).filter(Boolean);
      const tokenSet = Array.from(new Set([...tokens, ...normTokens]));

      // ── Budgets (parsed)
      const maxBudget = parseMoney(rentalRequest.budgetTo ?? rentalRequest.budget);
      const minBudget = parseMoney(rentalRequest.budgetFrom);
      this.logInfo('matching.budget_parsed', { requestId: rentalRequest.id, minBudget, maxBudget });

      // ── Bedrooms (coerced)
      const reqBeds = asInt(rentalRequest.bedrooms);

      // ── Availability flexibility (urgency-aware lite)
      const moveIn = rentalRequest.moveInDate ? new Date(rentalRequest.moveInDate) : null;
      const hasMoveIn = moveIn && !Number.isNaN(moveIn.getTime());
      const baseFlexDays = 30; // simple version
      const availableCutoff = hasMoveIn ? new Date(moveIn.getTime() + baseFlexDays * 86400000) : null;

      // ── Property-centric fetch
      const where = {
        status: 'AVAILABLE',
        availability: true,
        ...((cityToken || tokenSet.length > 0) ? {
          OR: [
            cityToken ? { city: { contains: cityToken, mode: 'insensitive' } } : undefined,
            cityTokenNorm && cityTokenNorm !== cityToken ? { city: { contains: cityTokenNorm, mode: 'insensitive' } } : undefined,
            tokenSet.length > 0 ? { city: { in: tokenSet } } : undefined
          ].filter(Boolean)
        } : {}),
        monthlyRent: {
          lte: maxBudget != null ? Math.round(maxBudget * 1.2) : 9999999,
          ...(minBudget != null ? { gte: minBudget } : {})
        },
        ...(rentalRequest.propertyType ? { propertyType: { contains: rentalRequest.propertyType, mode: 'insensitive' } } : {}),
        ...(reqBeds != null ? { bedrooms: { gte: Math.max(1, reqBeds - 1), lte: reqBeds + 1 } } : {}),
        ...(hasMoveIn ? { availableFrom: { lte: availableCutoff } } : {})
      };

      let props = await prisma.property.findMany({
        where,
        select: {
          id: true, landlordId: true, monthlyRent: true, propertyType: true, bedrooms: true,
          city: true, address: true, availableFrom: true, furnished: true, parking: true, petsAllowed: true,
          landlord: {
            select: {
              id: true, availability: true,
              landlordProfile: { select: { acceptanceRate: true, averageResponseTime: true } },
            }
          }
        },
        take: 200
      });

      if (!props || props.length === 0) {
        this.logWarn('matching.relax_filters', { requestId: rentalRequest.id });
        const relaxedWhere = {
          status: 'AVAILABLE',
          availability: true,
          ...((cityToken || tokenSet.length > 0) ? {
            OR: [
              cityToken ? { city: { contains: cityToken, mode: 'insensitive' } } : undefined,
              cityTokenNorm && cityTokenNorm !== cityToken ? { city: { contains: cityTokenNorm, mode: 'insensitive' } } : undefined,
            ].filter(Boolean)
          } : {}),
          monthlyRent: { lte: maxBudget != null ? Math.round(maxBudget * 2.0) : 9999999, ...(minBudget != null ? { gte: minBudget } : {}) },
          ...(hasMoveIn ? { availableFrom: { lte: availableCutoff } } : {})
        };
        props = await prisma.property.findMany({ where: relaxedWhere, select: whereSelect(), take: 200 });
      }

      // Group by landlord and carry a bounded property set
      const map = new Map();
      for (const p of props) {
        const L = p.landlord;
        if (!L || L.availability === false) continue;
        if (!map.has(L.id)) map.set(L.id, { id: L.id, landlordProfile: L.landlordProfile, properties: [] });
        const entry = map.get(L.id);
        if (!entry.properties.some(x => x.id === p.id)) entry.properties.push(stripLandlord(p));
        if (entry.properties.length > 20) entry.properties.length = 20;
      }
      const potentialLandlords = Array.from(map.values());
      this.logInfo('matching.candidates', { count: potentialLandlords.length });

      if (potentialLandlords.length === 0) return [];

      // Score
      const scored = potentialLandlords.map(l => {
        const best = this.findBestMatchingProperty(l.properties, rentalRequest);
        const matchScore = this.calculateWeightedScore(l, rentalRequest, best);
        const matchReason = this.generateMatchReason(best, rentalRequest, l.landlordProfile);
        return { ...l, matchScore, matchReason };
      }).sort((a,b) => b.matchScore - a.matchScore);

      // Thresholding (dynamic-lite)
      let threshold = this.matchingConfig.thresholds.normal;
      if (maxBudget == null && minBudget == null) threshold = Math.min(threshold, 30);
      let filtered = scored.filter(x => x.matchScore >= threshold);
      if (filtered.length === 0 && scored.length > 0) {
        this.logWarn('matching.fallback_due_to_no_results', { threshold, scored: scored.length });
        filtered = scored.slice(0, Math.min(3, scored.length));
      }

      this.logInfo('matching.filtered', { before: scored.length, after: filtered.length, threshold });
      return filtered.slice(0, 20);

    } catch (error) {
      console.error('❌ Error finding matching landlords:', error);
      return [];
    }
  }

  // Weighted score on best property
  calculateWeightedScore(landlord, rentalRequest, property) {
    if (!property) return 0;
    const W = this.matchingConfig.weights;
    let loc = 0, bud = 0, feat = 0, tim = 0, perf = 0;

    // Location (tokens, tolerant)
    const reqLoc = normalizeASCII(String(rentalRequest.location || '').toLowerCase());
    const tokens = new Set(reqLoc.split(/[,\s]+/).filter(Boolean));
    const cityNorm = normalizeASCII(String(property.city || '').toLowerCase());
    const addrNorm = normalizeASCII(String(property.address || '').toLowerCase());
    if (cityNorm && (reqLoc.includes(cityNorm) || tokens.has(cityNorm))) loc += 30;
    if ([...tokens].some(t => t && addrNorm.includes(t))) loc += 10;
    if (loc > 40) loc = 40;

    // Budget
    const maxBudget = parseMoney(rentalRequest.budgetTo ?? rentalRequest.budget);
    const minBudget = parseMoney(rentalRequest.budgetFrom);
    const rent = Number(property.monthlyRent);
    if (Number.isFinite(rent)) {
      if (maxBudget != null) {
        const inRange = (minBudget == null || rent >= minBudget) && rent <= maxBudget;
        if (inRange) bud = 25;
        else if (rent <= maxBudget) bud = 20;
        else if (rent <= maxBudget * 1.1) bud = 15;
        else if (rent <= maxBudget * 1.2) bud = 10;
      } else {
        bud = 10; // partial credit if no max provided
      }
    }

    // Features
    if (rentalRequest.propertyType && property.propertyType &&
        property.propertyType.toLowerCase().includes(String(rentalRequest.propertyType).toLowerCase())) feat += 8;
    const reqBeds = asInt(rentalRequest.bedrooms);
    if (reqBeds != null && property.bedrooms != null) {
      if (property.bedrooms === reqBeds) feat += 6;
      else if (Math.abs(property.bedrooms - reqBeds) === 1) feat += 3;
    }
    if (rentalRequest.furnished !== undefined && property.furnished === rentalRequest.furnished) feat += 2;
    if (rentalRequest.parking   !== undefined && property.parking   === rentalRequest.parking)   feat += 2;
    if (rentalRequest.petsAllowed!==undefined && property.petsAllowed===rentalRequest.petsAllowed) feat += 2;
    if (feat > 20) feat = 20;

    // Timing
    const moveIn = rentalRequest.moveInDate ? new Date(rentalRequest.moveInDate) : null;
    if (moveIn && !Number.isNaN(moveIn.getTime()) && property.availableFrom) {
      const avail = new Date(property.availableFrom);
      const daysDiff = Math.ceil((moveIn - avail) / 86400000);
      if (daysDiff === 0) tim = 10;
      else if (daysDiff > 0 && daysDiff <= 7)  tim = 8;
      else if (daysDiff > 0 && daysDiff <= 30) tim = 5;
      else if (daysDiff > 0 && daysDiff <= 90) tim = 3;
    }

    // Performance (acceptance rate + response)
    const prof = landlord.landlordProfile || {};
    if (prof.acceptanceRate > 0.8) perf += 3;
    else if (prof.acceptanceRate > 0.6) perf += 2;
    const rt = prof.averageResponseTime;
    if (rt && rt < 3600000) perf += 2; else if (rt && rt < 86400000) perf += 1;
    if (perf > 5) perf = 5;

    // Weighted sum (clip 0..100)
    const sum =
      (loc/40)*W.location +
      (bud/25)*W.budget +
      (feat/20)*W.features +
      (tim/10)*W.timing +
      (perf/5 )*W.performance;
    return Math.min(100, Math.max(0, Math.round(sum)));
  }

  generateMatchReason(bestProperty, rentalRequest, landlordProfile) {
    if (!bestProperty) return 'Property criteria match';
    const reasons = [];
    const reqLoc = normalizeASCII(String(rentalRequest.location || '').toLowerCase());
    const cityNorm = normalizeASCII(String(bestProperty.city || '').toLowerCase());
    if (cityNorm && reqLoc.includes(cityNorm)) reasons.push('Perfect location match');
    const maxBudget = parseMoney(rentalRequest.budgetTo ?? rentalRequest.budget);
    const minBudget = parseMoney(rentalRequest.budgetFrom);
    const rent = Number(bestProperty.monthlyRent);
    if (Number.isFinite(rent)) {
      if (maxBudget != null && (minBudget == null || rent >= minBudget) && rent <= maxBudget) reasons.push('Within budget range');
      else if (maxBudget != null && rent <= maxBudget * 1.1) reasons.push('Slightly above budget (negotiable)');
      else if (minBudget != null && rent < minBudget) reasons.push('Below your stated range');
    }
    if (rentalRequest.propertyType && bestProperty.propertyType &&
        bestProperty.propertyType.toLowerCase().includes(String(rentalRequest.propertyType).toLowerCase())) reasons.push('Property type match');
    const reqBeds = asInt(rentalRequest.bedrooms);
    if (reqBeds != null && bestProperty.bedrooms === reqBeds) reasons.push('Bedrooms match');
    if (landlordProfile?.acceptanceRate > 0.8) reasons.push('High success rate');
    return reasons.join(', ') || 'Property criteria match';
  }

  // Pick best property by sub-score
  findBestMatchingProperty(properties, rentalRequest) {
    if (!Array.isArray(properties) || properties.length === 0) return null;
    const scored = properties.map(p => {
      let s = 0;
      const reqLoc = normalizeASCII(String(rentalRequest.location || '').toLowerCase());
      const cityNorm = normalizeASCII(String(p.city || '').toLowerCase());
      if (cityNorm && reqLoc.includes(cityNorm)) s += 30;
      const maxBudget = parseMoney(rentalRequest.budgetTo ?? rentalRequest.budget);
      const minBudget = parseMoney(rentalRequest.budgetFrom);
      if (p.monthlyRent != null) {
        const rent = Number(p.monthlyRent);
        if (maxBudget != null) {
          if ((minBudget == null || rent >= minBudget) && rent <= maxBudget) s += 25;
          else if (rent <= maxBudget) s += 20;
        } else s += 10;
      }
      if (rentalRequest.propertyType && p.propertyType &&
          p.propertyType.toLowerCase().includes(String(rentalRequest.propertyType).toLowerCase())) s += 20;
      const reqBeds = asInt(rentalRequest.bedrooms);
      if (reqBeds != null && p.bedrooms === reqBeds) s += 15;
      return { p, s };
    }).sort((a,b) => b.s - a.s);
    return scored[0]?.p || null;
  }

  /**
   * 🚀 SCALABILITY: Create landlord-request matches in batch
   */
  async createMatches(rentalRequestId, landlords, rentalRequest) {
    try {
      // Anchor each match to a specific best property (guaranteed if available)
      const matches = [];
      for (const landlord of landlords) {
        const best = this.findBestMatchingProperty(landlord.properties, rentalRequest);
        const bestPropertyId = best?.id || null;

        matches.push({
          landlordId: landlord.id,
          rentalRequestId: rentalRequestId,
          propertyId: bestPropertyId,
          matchScore: landlord.matchScore,
          matchReason: landlord.matchReason,
          status: 'ACTIVE',
          isViewed: false,
          isResponded: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // 🚀 SCALABILITY: Batch insert for performance
      await prisma.landlordRequestMatch.createMany({
        data: matches,
        skipDuplicates: true
      });

      console.log(`✅ Created ${matches.length} matches for request ${rentalRequestId}`);

      // Create notifications for landlords about new rental requests
      try {
        const { NotificationService } = await import('../services/notificationService.js');
        
        for (const match of matches) {
          await NotificationService.createRentalRequestNotification(
            match.landlordId,
            rentalRequestId,
            rentalRequest.title,
            rentalRequest.tenant?.name || 'A tenant'
          );
        }
        
        console.log(`🔔 Created notifications for ${matches.length} landlords about new rental request`);
      } catch (notificationError) {
        console.error('❌ Error creating notifications:', notificationError);
        // Don't fail the main operation if notifications fail
      }

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
      // Redis disabled for development - will be enabled in production
      console.log('📝 Redis disabled for development');
      return;
    } catch (error) {
      console.error('❌ Error caching request:', error);
    }
  }

  async clearRequestCache(rentalRequestId) {
    try {
      // Redis disabled for development - will be enabled in production
      console.log('📝 Redis disabled for development');
      return;
    } catch (error) {
      console.error('❌ Error clearing request cache:', error);
    }
  }

  async clearLandlordCache(landlordId) {
    try {
      // Redis disabled for development - will be enabled in production
      console.log('📝 Redis disabled for development');
      return;
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
          expiresAt: true,
          location: true
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

// helpers outside the class
function whereSelect() {
  return {
    id: true, landlordId: true, monthlyRent: true, propertyType: true, bedrooms: true,
    city: true, address: true, availableFrom: true, furnished: true, parking: true, petsAllowed: true,
    landlord: { select: { id: true, availability: true, landlordProfile: { select: { acceptanceRate: true, averageResponseTime: true } } } }
  };
}

function stripLandlord(property) {
  const { landlord, ...rest } = property;
  return rest;
}

export default new RequestPoolService();
