import { prisma } from '../utils/prisma.js';
import { getUserTrustLevel } from './trustLevels.js';

// ────────────────────────────────────────────────────────────
// Helpers: tolerant text + safe parsing + int coercion
// FORCE MODULE RELOAD - Updated: 2025-08-28
// ────────────────────────────────────────────────────────────
// 
// NEW SCORING FORMULA (2025-08-28):
// +0.30*trustLevelWeight(user) +0.20*avgRating(user) -0.30*disputePenalty(user) +0.10*recencyBoost(lastReviewDate) -0.20*misrepresentationFlag(property)
// 
// TrustLevelWeight: {New:0, Reliable:0.3, Trusted:0.6, Excellent:1}
// AvgRating: Normalized average rating from 1-5 to 0-1 scale
// DisputePenalty: Based on user suspension status and future dispute system
// RecencyBoost: Based on last activity (1 day=1.0, 7 days=0.8, 30 days=0.5, 90 days=0.2)
// MisrepresentationFlag: Based on new users with perfect ratings and future verification system
// ────────────────────────────────────────────────────────────
const normalizeASCII = (value) => {
  if (!value) return '';
  try { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  catch { return value; }
};
const parseMoney = (v) => {
  if (v == null) return null;
  let s = String(v).trim();
  if (!s) return null;
  // remove currency and spaces
  s = s.replace(/[^\d.,\-]/g, '');

  // If both separators present, assume EU: dot = thousand, comma = decimal
  const hasDot = s.includes('.');
  const hasComma = s.includes(',');
  if (hasDot && hasComma) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (hasComma && !hasDot) {
    // comma-only -> treat as decimal
    s = s.replace(',', '.');
  } else {
    // dot-only or numbers only: already fine
  }

  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
};
const asInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function extractLikelyCity(location) {
  if (!location) return null;
  const parts = String(location).split(',').map(s => s.trim()).filter(Boolean);
  return parts[0] || String(location).trim();
}

// Export helper trustLevelWeight mapping
export const trustLevelWeight = {
  New: 0,
  Reliable: 0.3,
  Trusted: 0.6,
  Excellent: 1
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
   * 🚀 SCALABILITY: Add rental request to pool with immediate matching
   */
  async addToPool(rentalRequest) {
    try {
      console.log(`🏊 Adding request ${rentalRequest.id} to pool with immediate matching`);

      // 🚀 SCALABILITY: Calculate expiration with grace period and move-in consideration
      const now = new Date();
      const moveIn = new Date(rentalRequest.moveInDate);
      const moveInValid = moveIn && !Number.isNaN(moveIn.getTime());
      const graceMs = 24 * 60 * 60 * 1000; // 24h grace
      const defaultTtlMs = 14 * 24 * 60 * 60 * 1000; // 14 days
      const expirationDate = moveInValid
        ? new Date(Math.max(moveIn.getTime() - 3 * 864e5, now.getTime() + graceMs))
        : new Date(now.getTime() + defaultTtlMs);
      
      // Update request status with dynamic expiration
      await prisma.rentalRequest.update({
        where: { id: rentalRequest.id },
        data: {
          poolStatus: 'ACTIVE',
          expiresAt: expirationDate
        }
      });

      // 🚀 SCALABILITY: Update analytics
      await this.updatePoolAnalytics(rentalRequest.location);

      // 🚀 SCALABILITY: Cache the request for quick access
      await this.cacheRequest(rentalRequest);

      // 🚀 SCALABILITY: IMMEDIATE MATCHING - create matches right away for better UX
      // Find matching organizations and create matches immediately
      const matchingOrganizations = await this.findMatchingOrganizationsByProperties(rentalRequest);
      
      if (matchingOrganizations.length > 0) {
        // Create matches for all matching organizations
        await this.createMatches(rentalRequest.id, matchingOrganizations, rentalRequest);
        console.log(`✅ ${matchingOrganizations.length} matches for request ${rentalRequest.id}; expires ${expirationDate.toISOString()}`);
        return matchingOrganizations.length;
      } else {
        console.log(`⚠️ No matches for request ${rentalRequest.id}; expires ${expirationDate.toISOString()}`);
        return 0;
      }

    } catch (error) {
      console.error('❌ Error adding request to pool:', error);
      throw error;
    }
  }

  /**
   * 🚀 Property-centric candidate discovery with tolerant location & parsed budgets
   */
  async findMatchingOrganizationsByProperties(rentalRequest) {
    try {
      this.logInfo('matching.start', { requestId: rentalRequest.id });

      // ── Location tokens (tolerant)
      const rawLocation = rentalRequest.location || '';
      const cityToken = extractLikelyCity(rawLocation);
      const cityTokenNorm = cityToken ? normalizeASCII(cityToken) : '';

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
        ...((cityToken || (cityTokenNorm && cityTokenNorm !== cityToken))
            ? { OR: [
                cityToken ? { city: { contains: cityToken, mode: 'insensitive' } } : undefined,
                (cityTokenNorm && cityTokenNorm !== cityToken) ? { city: { contains: cityTokenNorm, mode: 'insensitive' } } : undefined
              ].filter(Boolean) }
            : {}),
        monthlyRent: {
          lte: maxBudget != null ? Math.round(maxBudget * 1.2) : 9999999,
          ...(minBudget != null ? { gte: minBudget } : {})
        },
        // Soft-match propertyType and bedrooms in scoring only; don't exclude at query time
        ...(hasMoveIn ? { OR: [ { availableFrom: { lte: availableCutoff } }, { availableFrom: null } ] } : {})
      };

      const select = {
        id: true, organizationId: true, monthlyRent: true, propertyType: true, bedrooms: true,
        city: true, address: true, availableFrom: true, furnished: true, parking: true, petsAllowed: true,
        organization: { select: { id: true, name: true, isPersonal: true } }
      };

      let props = await prisma.property.findMany({
        where,
        select,
        take: 200
      });

      if (!props || props.length === 0) {
        this.logWarn('matching.relax_filters', { requestId: rentalRequest.id });
        const relaxedWhere = {
          status: 'AVAILABLE',
          availability: true,
          ...((cityToken || (cityTokenNorm && cityTokenNorm !== cityToken))
              ? { OR: [
                  cityToken ? { city: { contains: cityToken, mode: 'insensitive' } } : undefined,
                  (cityTokenNorm && cityTokenNorm !== cityToken) ? { city: { contains: cityTokenNorm, mode: 'insensitive' } } : undefined
                ].filter(Boolean) }
              : {}),
          monthlyRent: { lte: maxBudget != null ? Math.round(maxBudget * 2.0) : 9999999, ...(minBudget != null ? { gte: minBudget } : {}) },
          ...(hasMoveIn ? { OR: [ { availableFrom: { lte: availableCutoff } }, { availableFrom: null } ] } : {})
        };
        props = await prisma.property.findMany({ 
          where: relaxedWhere, 
          select, 
          take: 200 
        });
      }

      // Group by organization and carry a bounded property set
      const byOrg = new Map();
      for (const p of props) {
        const orgId = p.organizationId;
        if (!byOrg.has(orgId)) byOrg.set(orgId, { id: orgId, organization: p.organization, properties: [] });
        const bucket = byOrg.get(orgId);
        if (!bucket.properties.some(x => x.id === p.id)) bucket.properties.push(p);
        if (bucket.properties.length > 20) bucket.properties.length = 20;
      }
      const orgCandidates = Array.from(byOrg.values());
      this.logInfo('matching.candidates', { count: orgCandidates.length });

      if (orgCandidates.length === 0) return [];

      // Score
      const scored = await Promise.all(orgCandidates.map(async (org) => {
        const best = this.findBestMatchingProperty(org.properties, rentalRequest);
        const matchScore = await this.calculateWeightedScore(org, rentalRequest, best);
        const matchReason = this.generateMatchReason(best, rentalRequest, org);
        return { ...org, matchScore, matchReason };
      }));
      scored.sort((a,b) => b.matchScore - a.matchScore);

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
      console.error('❌ Error finding matching organizations:', error);
      return [];
    }
  }

  // Weighted score on best property with new scoring formula
  async calculateWeightedScore(organization, rentalRequest, property) {
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
      const ad = Math.abs(Math.ceil((avail - moveIn) / 86400000)); // days difference
      if (ad === 0) tim = 10;
      else if (ad <= 7)  tim = 8;
      else if (ad <= 30) tim = 5;
      else if (ad <= 90) tim = 3;
    }

    // NEW SCORING FORMULA: +0.30*trustLevelWeight +0.20*avgRating -0.30*disputePenalty +0.10*recencyBoost -0.20*misrepresentationFlag
    try {
      // Get organization members to calculate trust levels and ratings
      const orgMembers = await prisma.organizationMember.findMany({
        where: { organizationId: organization.id },
        include: {
          user: {
            select: {
              id: true,
              averageRating: true,
              totalReviews: true,
              lastActiveAt: true,
              isSuspended: true
            }
          }
        }
      });

      if (orgMembers.length > 0) {
        let totalTrustLevelWeight = 0;
        let totalRating = 0;
        let totalReviews = 0;
        let totalDisputePenalty = 0;
        let totalRecencyBoost = 0;
        let totalMisrepresentationFlag = 0;

        for (const member of orgMembers) {
          const user = member.user;
          if (!user) continue;

          // Trust Level Weight using trustLevels service
          try {
            const trustResult = await getUserTrustLevel(user.id);
            const memberTrustWeight = trustLevelWeight[trustResult.level] || 0;
            totalTrustLevelWeight += memberTrustWeight;
          } catch (error) {
            console.warn(`Failed to get trust level for user ${user.id}:`, error);
            totalTrustLevelWeight += 0; // Default to New level
          }

          // Average Rating (1-5 scale, normalize to 0-1)
          if (user.averageRating && user.totalReviews >= 3) {
            totalRating += (user.averageRating - 1) / 4; // Convert 1-5 to 0-1 scale
            totalReviews += user.totalReviews;
          }

          // Dispute Penalty (placeholder - would need dispute system)
          // For now, use suspension status as proxy
          if (user.isSuspended) {
            totalDisputePenalty += 0.5; // High penalty for suspended users
          }

          // Recency Boost (based on last activity)
          if (user.lastActiveAt) {
            const daysSinceActive = Math.ceil((Date.now() - user.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceActive <= 1) totalRecencyBoost += 1.0;
            else if (daysSinceActive <= 7) totalRecencyBoost += 0.8;
            else if (daysSinceActive <= 30) totalRecencyBoost += 0.5;
            else if (daysSinceActive <= 90) totalRecencyBoost += 0.2;
          }

          // Misrepresentation Flag (placeholder - would need verification system)
          // For now, use basic heuristics
          if (user.totalReviews === 0 && user.averageRating === 5.0) {
            totalMisrepresentationFlag += 0.3; // New user with perfect rating
          }
        }

        // Calculate averages and apply new formula
        const memberCount = orgMembers.length;
        const avgTrustLevelWeight = totalTrustLevelWeight / memberCount;
        const avgRating = totalReviews > 0 ? totalRating / memberCount : 0;
        const avgDisputePenalty = totalDisputePenalty / memberCount;
        const avgRecencyBoost = totalRecencyBoost / memberCount;
        const avgMisrepresentationFlag = totalMisrepresentationFlag / memberCount;

        // NEW FORMULA: +0.30*trustLevelWeight +0.20*avgRating -0.30*disputePenalty +0.10*recencyBoost -0.20*misrepresentationFlag
        const newScore = 
          (0.30 * avgTrustLevelWeight) +
          (0.20 * avgRating) -
          (0.30 * avgDisputePenalty) +
          (0.10 * avgRecencyBoost) -
          (0.20 * avgMisrepresentationFlag);

        // Convert to 0-5 scale and add to performance score
        perf = Math.max(0, Math.min(5, newScore * 5));
      }

    } catch (error) {
      console.error('Error calculating new performance score:', error);
      // Fallback to basic scoring
      if (organization.organization?.isPersonal) perf += 2;
    }

    // Weighted sum (clip 0..100)
    const sum =
      (loc/40)*W.location +
      (bud/25)*W.budget +
      (feat/20)*W.features +
      (tim/10)*W.timing +
      (perf/5 )*W.performance;
    return Math.min(100, Math.max(0, Math.round(sum)));
  }

  generateMatchReason(bestProperty, rentalRequest, organization) {
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
    if (organization.organization?.isPersonal) reasons.push('Personal organization');
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
   * 🚀 SCALABILITY: Create organization-request matches in batch
   */
  async createMatches(rentalRequestId, organizations, rentalRequest) {
    try {
      // Anchor each match to a specific best property (guaranteed if available)
      const matches = [];
      for (const org of organizations) {
        const best = this.findBestMatchingProperty(org.properties, rentalRequest);

        if (!best) { 
          // Skip creating a match when no property qualifies
          continue; 
        }

        matches.push({
          organizationId: org.id,
          rentalRequestId,
          propertyId: best?.id || null,
          matchScore: org.matchScore,
          matchReason: org.matchReason,
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

      // Create notifications for organizations about new rental requests
      try {
        const { createManyRentalRequestNotifications } = await import('../services/notificationService.js');
        await createManyRentalRequestNotifications(matches.map(m => ({
          organizationId: m.organizationId,
          rentalRequestId,
          title: rentalRequest.title,
          tenantName: rentalRequest.tenant?.name || 'A tenant'
        })));
        
        console.log(`🔔 Created bulk notifications for ${matches.length} organizations about new rental request`);
      } catch (notificationError) {
        console.error('❌ Error creating notifications:', notificationError);
        // Don't fail the main operation if notifications fail
      }

    } catch (error) {
      console.error('❌ Error creating matches:', error);
    }
  }



  /**
   * 🚀 SCALABILITY: Get requests for landlord user with pagination
   */
  async getRequestsForLandlordUser(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      // Step 1: Find orgIds the user belongs to
      const orgs = await prisma.organizationMember.findMany({ 
        where: { userId }, 
        select: { organizationId: true }
      });
      const orgIds = orgs.map(o => o.organizationId);

      if (orgIds.length === 0) {
        return {
          requests: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0
          }
        };
      }

      // Step 2: Query LandlordRequestMatch with specified conditions
      const requests = await prisma.landlordRequestMatch.findMany({
        where: {
          organizationId: { in: orgIds },
          status: 'ACTIVE',
          isResponded: false,
          rentalRequest: {
            poolStatus: 'ACTIVE',
            expiresAt: { gt: new Date() }
          }
        },
        include: {
          // Step 3: Include property (basic fields)
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              monthlyRent: true,
              propertyType: true,
              bedrooms: true,
              furnished: true,
              parking: true,
              petsAllowed: true,
              availableFrom: true
            }
          },
          // Include rentalRequest -> tenantGroup -> members -> user (specific fields only)
          rentalRequest: {
            include: {
              tenantGroup: {
                include: {
                  members: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          name: true,
                          profileImage: true,
                          averageRating: true,
                          totalReviews: true,
                          rank: true
                        }
                      }
                    }
                  }
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

      // Get total count for pagination
      const total = await prisma.landlordRequestMatch.count({
        where: {
          organizationId: { in: orgIds },
          status: 'ACTIVE',
          isResponded: false,
          rentalRequest: {
            poolStatus: 'ACTIVE',
            expiresAt: { gt: new Date() }
          }
        }
      });

      // Step 4: Map primary tenant like before
      const mappedRequests = requests.map(match => {
        // Get the primary tenant from the tenant group
        const primaryMember = match.rentalRequest.tenantGroup?.members?.[0];
        const tenant = primaryMember?.user;

        return {
          ...match,
          rentalRequest: {
            ...match.rentalRequest,
            tenant: tenant // Map the primary tenant group member's user as the tenant
          }
        };
      });

      // Return { requests, pagination }
      const result = {
        requests: mappedRequests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

      return result;

    } catch (error) {
      console.error('❌ Error getting requests for landlord user:', error);
      throw error;
    }
  }



  /**
   * 🚀 SCALABILITY: Mark request as viewed by organization
   */
  async markAsViewedForOrg(organizationId, rentalRequestId) {
    const updated = await prisma.landlordRequestMatch.updateMany({
      where: { organizationId, rentalRequestId, isViewed: false },
      data: { isViewed: true }
    });
    if (updated.count > 0) {
      await prisma.rentalRequest.update({
        where: { id: rentalRequestId },
        data: { viewCount: { increment: updated.count } }
      });
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
  async updateUserAvailability(userId, hasAvailableProperties = true) {
    try {
      // Update landlord availability based on whether they have available properties
      await prisma.user.update({
        where: { id: userId },
        data: {
          availability: hasAvailableProperties,
          lastActiveAt: new Date()
        }
      });

      console.log(`📊 Updated user ${userId} availability to ${hasAvailableProperties}`);

    } catch (error) {
      console.error('❌ Error updating user availability:', error);
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

      // Compute day bucket
      const day = new Date(); 
      day.setUTCHours(0, 0, 0, 0);

      // Use upsert with dateBucket (schema now requires it)
      await prisma.requestPoolAnalytics.upsert({
        where: { location_dateBucket: { location, dateBucket: day } },
        update: { totalRequests, activeRequests, matchedRequests, expiredRequests },
        create: { location, dateBucket: day, totalRequests, activeRequests, matchedRequests, expiredRequests }
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

  async clearOrganizationCache(organizationId) {
    try {
      // Redis disabled for development - will be enabled in production
      console.log('📝 Redis disabled for development');
      return;
    } catch (error) {
      console.error('❌ Error clearing organization cache:', error);
    }
  }

  /**
   * 🚀 SCALABILITY: Cleanup expired requests
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
      const uniqueLocations = Array.from(new Set(expiredRequests.map(r => r.location).filter(Boolean)));
      for (const loc of uniqueLocations) {
        await this.updatePoolAnalytics(loc);
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
      const [totalActive, orgsWithAvailProps, recentMatches] = await Promise.all([
        prisma.rentalRequest.count({ where: { poolStatus: 'ACTIVE' } }),
        prisma.property.groupBy({
          by: ['organizationId'],
          where: { status: 'AVAILABLE', availability: true },
          _count: { _all: true }
        }),
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
        availableOrganizations: orgsWithAvailProps.length,
        recentMatches,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Error getting pool stats:', error);
      return null;
    }
  }

  /**
   * Reverse matching: when a new/updated property goes live,
   * find ACTIVE + non-expired rental requests that could match,
   * and create anchored matches (propertyId).
   */
  async matchRequestsForNewProperty(propertyId) {
    // Load property with org
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true, organizationId: true, city: true, address: true, monthlyRent: true,
        propertyType: true, bedrooms: true, furnished: true, parking: true, petsAllowed: true,
        availableFrom: true, status: true, availability: true,
        organization: { select: { id: true, name: true, isPersonal: true } }
      }
    });
    if (!property || property.status !== 'AVAILABLE' || property.availability !== true) return;

    const now = new Date();

    // Build tolerant city token
    const cityToken = (property.city || '').trim();
    const cityTokenNorm = cityToken ? cityToken.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';

    // Find candidate requests
    const requests = await prisma.rentalRequest.findMany({
      where: {
        poolStatus: 'ACTIVE',
        expiresAt: { gt: now },
        // 🚀 PERFORMANCE: Time window for high-volume systems (>100k requests)
        createdAt: { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }, // last 60 days
        OR: [
          { location: { contains: cityToken, mode: 'insensitive' } },
          cityTokenNorm && cityTokenNorm !== cityToken
            ? { location: { contains: cityTokenNorm, mode: 'insensitive' } }
            : undefined
        ].filter(Boolean),
        // Budget window (reuse tolerant logic)
        OR: [
          { budgetTo: { gte: property.monthlyRent } }, // within max
          { budget:  { gte: property.monthlyRent } },  // single budget field
        ]
      },
      take: 200, // safety bound
      orderBy: { createdAt: 'desc' }
    });

    if (!requests.length) return;

    // Score each request vs this single property, reuse existing scoring pieces
    const orgWrapper = { id: property.organizationId, organization: property.organization };
    const matches = [];
    for (const req of requests) {
      const score = await this.calculateWeightedScore(orgWrapper, req, property);
      // Respect your thresholding (use normal, or relax if no budgets present)
      let threshold = this.matchingConfig.thresholds.normal;
      const hasBudget = req.budgetTo != null || req.budget != null || req.budgetFrom != null;
      if (!hasBudget) threshold = Math.min(threshold, 30);
      if (score < threshold) continue;

      const reason = this.generateMatchReason(property, req, orgWrapper);

      matches.push({
        organizationId: property.organizationId,
        rentalRequestId: req.id,
        propertyId: property.id,
        matchScore: score,
        matchReason: reason,
        status: 'ACTIVE',
        isViewed: false,
        isResponded: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    if (!matches.length) return;

    // Idempotent insert (unique on org+request+property)
    await prisma.landlordRequestMatch.createMany({ data: matches, skipDuplicates: true });

    // Notify org members in bulk (same helper you already use)
    try {
      const { createManyRentalRequestNotifications } = await import('../services/notificationService.js');
      await createManyRentalRequestNotifications(
        matches.map(m => ({
          organizationId: m.organizationId,
          rentalRequestId: m.rentalRequestId,
          title: 'New tenant request matches your newly listed property',
          tenantName: 'Tenant' // you can enrich by loading tenantGroup if needed
        }))
      );
      console.log(`🔔 Reverse-matched ${matches.length} request(s) for property ${property.id}`);
    } catch (e) {
      console.error('❌ Reverse-match notifications failed:', e);
    }
  }
}

export default new RequestPoolService();
