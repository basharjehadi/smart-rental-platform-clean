import { prisma } from '../utils/prisma.js';

// ────────────────────────────────────────────────────────────
// Helpers: tolerant text + safe parsing + int coercion
// FORCE MODULE RELOAD - Updated: 2025-08-28
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

function extractLikelyCity(location) {
  if (!location) return null;
  const parts = String(location).split(',').map(s => s.trim()).filter(Boolean);
  return parts[0] || String(location).trim();
}

function stripOrganization(property) {
  const { organization, ...stripped } = property;
  return stripped;
}

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
      const graceMs = 24 * 60 * 60 * 1000; // 24h grace
      const expirationDate = new Date(
        Math.max(moveIn.getTime() - 3 * 864e5, now.getTime() + graceMs)
      );
      
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
        console.log(`✅ Created ${matchingOrganizations.length} immediate matches for request ${rentalRequest.id}`);
        console.log(`✅ Request ${rentalRequest.id} added to pool with immediate matching, expires ${expirationDate.toISOString()}`);
        return matchingOrganizations.length;
      } else {
        console.log(`⚠️ No matching organizations found for request ${rentalRequest.id}`);
        console.log(`✅ Request ${rentalRequest.id} added to pool with immediate matching, expires ${expirationDate.toISOString()}`);
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
          ...((cityToken || tokenSet.length > 0) ? {
            OR: [
              cityToken ? { city: { contains: cityToken, mode: 'insensitive' } } : undefined,
              cityTokenNorm && cityTokenNorm !== cityToken ? { city: { contains: cityTokenNorm, mode: 'insensitive' } } : undefined,
            ].filter(Boolean)
          } : {}),
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
      const scored = orgCandidates.map(org => {
        const best = this.findBestMatchingProperty(org.properties, rentalRequest);
        const matchScore = this.calculateWeightedScore(org, rentalRequest, best);
        const matchReason = this.generateMatchReason(best, rentalRequest, org);
        return { ...org, matchScore, matchReason };
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
      console.error('❌ Error finding matching organizations:', error);
      return [];
    }
  }

  // Weighted score on best property
  calculateWeightedScore(organization, rentalRequest, property) {
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

    // Performance (organization-based scoring)
    if (organization.organization?.isPersonal) perf += 2; // Personal organizations get bonus
    // Note: Could add more organization-based scoring here in the future
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
   * 🚀 SCALABILITY: Get requests for landlord with pagination
   */
  async getRequestsForLandlord(landlordId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const requests = await prisma.landlordRequestMatch.findMany({
        where: {
          landlordId: landlordId,
          status: 'ACTIVE',              // only active matches
          isResponded: false,            // exclude offered/declined
          isViewed: false,               // pending = unseen (kept as before)
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
              tenantGroup: {
                include: {
                  members: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          name: true,
                          email: true,
                          firstName: true,
                          lastName: true,
                          profileImage: true,
                          phoneNumber: true,
                          profession: true,
                          dateOfBirth: true,
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
          },
          // Include anchored property details for this match so UI can show matched property
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
          status: 'ACTIVE',
          isResponded: false,
          isViewed: false,
          rentalRequest: {
            poolStatus: 'ACTIVE',
            expiresAt: {
              gt: new Date()
            }
          }
        }
      });

      // Map the tenant data from tenant group to match the expected format
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
      console.error('❌ Error getting requests for landlord:', error);
      throw error;
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

      // Compute day bucket
      const day = new Date(); 
      day.setUTCHours(0, 0, 0, 0);

      // Try upsert first; if it throws (before migration), fall back to create()
      try {
        await prisma.requestPoolAnalytics.upsert({
          where: { location_dateBucket: { location, dateBucket: day } },
          update: { totalRequests, activeRequests, matchedRequests, expiredRequests },
          create: { location, dateBucket: day, totalRequests, activeRequests, matchedRequests, expiredRequests }
        });
      } catch (upsertError) {
        // Fallback to create() if upsert fails (before migration)
        await prisma.requestPoolAnalytics.create({ 
          data: { 
            location, 
            date: new Date(), 
            totalRequests, 
            activeRequests, 
            matchedRequests, 
            expiredRequests,
            landlordCount
          } 
        });
      }

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
