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
      
      // Extract city from location (e.g., "Grunwald, Poznan" -> "Poznan")
      const extractedCity = rentalRequest.location ? 
        rentalRequest.location.split(',').pop()?.trim() || rentalRequest.location.trim() : 
        null;
      
      console.log(`   📍 Request Location: ${rentalRequest.location} (Extracted City: ${extractedCity})`);
      console.log(`   💰 Request Budget: ${rentalRequest.budgetFrom || rentalRequest.budget}-${rentalRequest.budgetTo || rentalRequest.budget} PLN`);
      console.log(`   🏠 Request Bedrooms: ${rentalRequest.bedrooms}`);
      console.log(`   🏠 Request Property Type: ${rentalRequest.propertyType}`);
      console.log(`   🛋️ Request Furnished: ${rentalRequest.furnished}`);
      console.log(`   🚗 Request Parking: ${rentalRequest.parking}`);
      console.log(`   🐾 Request Pets Allowed: ${rentalRequest.petsAllowed}`);
      console.log(`   📅 Request Move-in: ${rentalRequest.moveInDate}`);
      console.log(`   📅 Request Move-in Date Object: ${new Date(rentalRequest.moveInDate)}`);

      // Get all landlords who have properties that match the rental request criteria
      // Use more flexible matching to ensure landlords get notified
      const matchingLandlords = await prisma.user.findMany({
        where: {
          role: 'LANDLORD',
          properties: {
            some: {
              // Location matching (must match city)
              city: {
                equals: extractedCity,
                mode: 'insensitive'
              },
              // Budget matching (reasonable flexibility - allow landlords to see requests they can adjust to)
              monthlyRent: {
                lte: (rentalRequest.budgetTo || rentalRequest.budget) * 1.2 // Allow up to 20% above max budget
              },
              // Property type matching (if specified, but be flexible)
              ...(rentalRequest.propertyType && {
                propertyType: { 
                  contains: rentalRequest.propertyType,
                  mode: 'insensitive'
                }
              }),
              // Bedrooms matching (if specified, but be flexible)
              ...(rentalRequest.bedrooms && {
                bedrooms: {
                  gte: Math.max(1, rentalRequest.bedrooms - 1), // Allow 1 less bedroom
                  lte: rentalRequest.bedrooms + 1 // Allow 1 more bedroom
                }
              }),
              // Property is available (flexible with dates)
              availableFrom: {
                lte: new Date(new Date(rentalRequest.moveInDate).getTime() + 30 * 24 * 60 * 60 * 1000) // Allow 30 days flexibility
              }
            }
          }
        },
        include: {
          properties: {
            where: {
              // Location matching (must match city)
              city: {
                equals: extractedCity,
                mode: 'insensitive'
              },
              // Budget matching (reasonable flexibility)
              monthlyRent: {
                lte: (rentalRequest.budgetTo || rentalRequest.budget) * 1.2
              },
              // Bedrooms matching (flexible)
              ...(rentalRequest.bedrooms && {
                bedrooms: {
                  gte: Math.max(1, rentalRequest.bedrooms - 1),
                  lte: rentalRequest.bedrooms + 1
                }
              }),
              // Property is available (flexible)
              availableFrom: {
                lte: new Date(new Date(rentalRequest.moveInDate).getTime() + 30 * 24 * 60 * 60 * 1000)
              }
            },
            select: {
              id: true,
              name: true,
              city: true,
              address: true,
              monthlyRent: true,
              bedrooms: true,
              propertyType: true,
              furnished: true,
              parking: true,
              petsAllowed: true,
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
          console.log(`      🏢 Property: ${property.name} - ${property.city}, ${property.monthlyRent} PLN, ${property.propertyType}, ${property.bedrooms} bedrooms`);
        });
      });
      
      // Debug: Log matching criteria for clarity
      console.log(`📋 Matching Criteria:`);
      console.log(`   📍 Required City: ${extractedCity}`);
      console.log(`   💰 Budget Range: ${rentalRequest.budgetFrom || rentalRequest.budget * 0.8} - ${(rentalRequest.budgetTo || rentalRequest.budget) * 2.0} PLN`);
      console.log(`   🏠 Property Type: ${rentalRequest.propertyType || 'Any'}`);
      console.log(`   🛏️ Bedrooms: ${rentalRequest.bedrooms ? `${Math.max(1, rentalRequest.bedrooms - 1)}-${rentalRequest.bedrooms + 1}` : 'Any'}`);
      console.log(`   📅 Move-in Date: ${rentalRequest.moveInDate} (with 30 days flexibility)`);

      // If no matches found, let's check what properties exist
      if (matchingLandlords.length === 0) {
        console.log(`❌ NO MATCHES FOUND!`);
        console.log(`   The rental request does not match any landlord's properties.`);
        console.log(`   This means landlords will NOT see this request.`);
        console.log(`🔍 Checking all available properties to understand why...`);
        const allProperties = await prisma.property.findMany({
          where: { status: 'AVAILABLE' },
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
            monthlyRent: true,
            propertyType: true,
            bedrooms: true,
            furnished: true,
            parking: true,
            petsAllowed: true,
            availableFrom: true,
            landlordId: true
          }
        });
        
        console.log(`📊 Total available properties: ${allProperties.length}`);
        allProperties.forEach(property => {
          console.log(`   🏢 Property: ${property.name} - ${property.city}, ${property.monthlyRent} PLN, ${property.propertyType}, ${property.bedrooms} bedrooms, Available: ${property.availableFrom}`);
        console.log(`      🏠 Features: Furnished: ${property.furnished}, Parking: ${property.parking}, Pets: ${property.petsAllowed}`);
          
          // Check why this property doesn't match
          const locationMatch = property.city.toLowerCase().includes(rentalRequest.location.toLowerCase()) || 
                               property.address.toLowerCase().includes(rentalRequest.location.toLowerCase());
          const budgetMatch = property.monthlyRent >= (rentalRequest.budgetFrom || rentalRequest.budget * 0.8) && 
                             property.monthlyRent <= (rentalRequest.budgetTo || rentalRequest.budget * 1.2);
          const typeMatch = !rentalRequest.propertyType || property.propertyType.toLowerCase() === rentalRequest.propertyType.toLowerCase();
          const dateMatch = new Date(property.availableFrom) <= new Date(rentalRequest.moveInDate);
          const furnishedMatch = rentalRequest.furnished === undefined || property.furnished === rentalRequest.furnished;
          const parkingMatch = rentalRequest.parking === undefined || property.parking === rentalRequest.parking;
          const petsMatch = rentalRequest.petsAllowed === undefined || property.petsAllowed === rentalRequest.petsAllowed;
          
          console.log(`      🔍 Match Analysis:`);
          console.log(`         📍 Location: ${locationMatch ? '✅' : '❌'} (Property: ${property.city}, Request: ${rentalRequest.location})`);
          console.log(`         💰 Budget: ${budgetMatch ? '✅' : '❌'} (Property: ${property.monthlyRent}, Request: ${rentalRequest.budgetFrom}-${rentalRequest.budgetTo})`);
          console.log(`         🏠 Type: ${typeMatch ? '✅' : '❌'} (Property: ${property.propertyType}, Request: ${rentalRequest.propertyType})`);
          console.log(`         📅 Date: ${dateMatch ? '✅' : '❌'} (Property: ${property.availableFrom}, Request: ${rentalRequest.moveInDate})`);
          console.log(`         🛋️ Furnished: ${furnishedMatch ? '✅' : '❌'} (Property: ${property.furnished}, Request: ${rentalRequest.furnished})`);
          console.log(`         🚗 Parking: ${parkingMatch ? '✅' : '❌'} (Property: ${property.parking}, Request: ${rentalRequest.parking})`);
          console.log(`         🐾 Pets: ${petsMatch ? '✅' : '❌'} (Property: ${property.petsAllowed}, Request: ${rentalRequest.petsAllowed})`);
        });
      }

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
      console.log(`   ❌ Landlord ${landlord.id} has no properties`);
      return 0;
    }

    // Get the best matching property
    const bestProperty = landlord.properties[0]; // Already sorted by match criteria

    console.log(`   🧮 Scoring landlord ${landlord.id} with property ${bestProperty.name}:`);

    // 📍 Location match (40 points)
    const extractedCity = rentalRequest.location ? 
      rentalRequest.location.split(',').pop()?.trim() || rentalRequest.location.trim() : 
      null;
    const locationMatch = extractedCity && (
      bestProperty.city.toLowerCase().includes(extractedCity.toLowerCase()) ||
      extractedCity.toLowerCase().includes(bestProperty.city.toLowerCase()) ||
      bestProperty.address.toLowerCase().includes(extractedCity.toLowerCase())
    );
    if (locationMatch) {
      score += 40;
      console.log(`      ✅ Location match: +40 points (Property city: ${bestProperty.city}, Extracted city: ${extractedCity})`);
    } else {
      console.log(`      ❌ Location mismatch: Property city "${bestProperty.city}" vs extracted city "${extractedCity}"`);
    }

    // 💰 Budget match (30 points)
    const budgetRange = rentalRequest.budgetTo - rentalRequest.budgetFrom;
    const budgetTolerance = budgetRange * 0.1; // 10% tolerance
    const maxAllowedRent = rentalRequest.budgetTo * 1.2; // 20% above max budget
    
    if (bestProperty.monthlyRent >= (rentalRequest.budgetFrom - budgetTolerance) && 
        bestProperty.monthlyRent <= (rentalRequest.budgetTo + budgetTolerance)) {
      score += 30;
      console.log(`      ✅ Budget match with tolerance: +30 points (${bestProperty.monthlyRent} PLN in range ${rentalRequest.budgetFrom - budgetTolerance}-${rentalRequest.budgetTo + budgetTolerance})`);
    } else if (bestProperty.monthlyRent >= rentalRequest.budgetFrom && 
               bestProperty.monthlyRent <= rentalRequest.budgetTo) {
      score += 25; // Within exact range
      console.log(`      ✅ Budget exact match: +25 points (${bestProperty.monthlyRent} PLN in exact range ${rentalRequest.budgetFrom}-${rentalRequest.budgetTo})`);
    } else if (bestProperty.monthlyRent <= rentalRequest.budgetTo) {
      score += 15; // Within max budget
      console.log(`      ✅ Budget within max: +15 points (${bestProperty.monthlyRent} PLN <= ${rentalRequest.budgetTo})`);
    } else if (bestProperty.monthlyRent <= maxAllowedRent) {
      score += 5; // Within 20% flexibility (minimal points)
      console.log(`      ⚠️ Budget within flexibility: +5 points (${bestProperty.monthlyRent} PLN <= ${maxAllowedRent} PLN)`);
    } else {
      console.log(`      ❌ Budget mismatch: ${bestProperty.monthlyRent} PLN vs range ${rentalRequest.budgetFrom}-${rentalRequest.budgetTo} (max allowed: ${maxAllowedRent} PLN)`);
    }

    // 🏠 Bedrooms match (20 points)
    if (rentalRequest.bedrooms && bestProperty.bedrooms === rentalRequest.bedrooms) {
      score += 20;
      console.log(`      ✅ Bedrooms exact match: +20 points (${bestProperty.bedrooms} = ${rentalRequest.bedrooms})`);
    } else if (rentalRequest.bedrooms && Math.abs(bestProperty.bedrooms - rentalRequest.bedrooms) <= 1) {
      score += 10; // Close match
      console.log(`      ✅ Bedrooms close match: +10 points (${bestProperty.bedrooms} ≈ ${rentalRequest.bedrooms})`);
    } else if (rentalRequest.bedrooms) {
      console.log(`      ❌ Bedrooms mismatch: ${bestProperty.bedrooms} vs ${rentalRequest.bedrooms}`);
    }

    // 🏠 Property type match (15 points)
    if (rentalRequest.propertyType && bestProperty.propertyType && 
        bestProperty.propertyType.toLowerCase().includes(rentalRequest.propertyType.toLowerCase())) {
      score += 15;
      console.log(`      ✅ Property type match: +15 points (${bestProperty.propertyType} includes ${rentalRequest.propertyType})`);
    } else if (rentalRequest.propertyType) {
      console.log(`      ❌ Property type mismatch: ${bestProperty.propertyType} vs ${rentalRequest.propertyType}`);
    }

    // 🛋️ Furnished match (5 points)
    if (rentalRequest.furnished !== undefined && bestProperty.furnished === rentalRequest.furnished) {
      score += 5;
      console.log(`      ✅ Furnished match: +5 points (${bestProperty.furnished} = ${rentalRequest.furnished})`);
    } else if (rentalRequest.furnished !== undefined) {
      console.log(`      ❌ Furnished mismatch: ${bestProperty.furnished} vs ${rentalRequest.furnished}`);
    }

    // 🚗 Parking match (5 points)
    if (rentalRequest.parking !== undefined && bestProperty.parking === rentalRequest.parking) {
      score += 5;
      console.log(`      ✅ Parking match: +5 points (${bestProperty.parking} = ${rentalRequest.parking})`);
    } else if (rentalRequest.parking !== undefined) {
      console.log(`      ❌ Parking mismatch: ${bestProperty.parking} vs ${rentalRequest.parking}`);
    }

    // 🐾 Pets match (5 points)
    if (rentalRequest.petsAllowed !== undefined && bestProperty.petsAllowed === rentalRequest.petsAllowed) {
      score += 5;
      console.log(`      ✅ Pets match: +5 points (${bestProperty.petsAllowed} = ${rentalRequest.petsAllowed})`);
    } else if (rentalRequest.petsAllowed !== undefined) {
      console.log(`      ❌ Pets mismatch: ${bestProperty.petsAllowed} vs ${rentalRequest.petsAllowed}`);
    }

    // 📅 Availability match (10 points)
    const moveInDate = new Date(rentalRequest.moveInDate);
    const availableFrom = new Date(bestProperty.availableFrom);
    const daysDiff = Math.abs((moveInDate - availableFrom) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 7) {
      score += 10; // Available within a week
      console.log(`      ✅ Availability within week: +10 points (${daysDiff.toFixed(1)} days diff)`);
    } else if (daysDiff <= 30) {
      score += 5; // Available within a month
      console.log(`      ✅ Availability within month: +5 points (${daysDiff.toFixed(1)} days diff)`);
    } else {
      console.log(`      ❌ Availability mismatch: ${daysDiff.toFixed(1)} days diff`);
    }

    const finalScore = Math.min(100, Math.max(0, score));
    console.log(`      🎯 Final score: ${finalScore}/100`);
    
    return finalScore;
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
    const extractedCity = rentalRequest.location ? 
      rentalRequest.location.split(',').pop()?.trim() || rentalRequest.location.trim() : 
      null;
    if (extractedCity && (
      bestProperty.city.toLowerCase().includes(extractedCity.toLowerCase()) ||
      extractedCity.toLowerCase().includes(bestProperty.city.toLowerCase()) ||
      bestProperty.address.toLowerCase().includes(extractedCity.toLowerCase())
    )) {
      reasons.push('Location match');
    }

    // Budget reasons
    if (bestProperty.monthlyRent >= rentalRequest.budgetFrom && 
        bestProperty.monthlyRent <= rentalRequest.budgetTo) {
      reasons.push('Budget match');
    } else if (bestProperty.monthlyRent <= rentalRequest.budgetTo) {
      reasons.push('Within budget');
    } else if (bestProperty.monthlyRent <= (rentalRequest.budgetTo * 1.2)) {
      reasons.push('Slightly above budget (negotiable)');
    }

    // Property type reasons
    if (rentalRequest.propertyType && bestProperty.propertyType && 
        bestProperty.propertyType.toLowerCase().includes(rentalRequest.propertyType.toLowerCase())) {
      reasons.push('Property type match');
    }

    // Bedrooms reasons
    if (rentalRequest.bedrooms && bestProperty.bedrooms === rentalRequest.bedrooms) {
      reasons.push('Bedrooms match');
    }

    // Property features reasons
    if (rentalRequest.furnished !== undefined && bestProperty.furnished === rentalRequest.furnished) {
      reasons.push(rentalRequest.furnished ? 'Furnished' : 'Unfurnished');
    }
    if (rentalRequest.parking !== undefined && bestProperty.parking === rentalRequest.parking) {
      reasons.push(rentalRequest.parking ? 'Parking available' : 'No parking');
    }
    if (rentalRequest.petsAllowed !== undefined && bestProperty.petsAllowed === rentalRequest.petsAllowed) {
      reasons.push(rentalRequest.petsAllowed ? 'Pets allowed' : 'No pets');
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
        data: matches
      });

      console.log(`✅ Created ${matches.length} matches for request ${rentalRequestId}`);
      
      // Debug: Log each match
      matches.forEach(match => {
        console.log(`   📍 Match: Landlord ${match.landlordId} -> Request ${match.rentalRequestId} (Score: ${match.matchScore})`);
      });

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
   * Get the best matching property for a landlord and rental request
   */
  async getBestMatchingProperty(landlordId, rentalRequest) {
    try {
      const properties = await prisma.property.findMany({
        where: {
          landlordId: landlordId,
          status: 'AVAILABLE',
          // Location matching (strict - must match city exactly)
          city: {
            equals: rentalRequest.city || rentalRequest.location.split(',')[1]?.trim() || rentalRequest.location.trim(),
            mode: 'insensitive'
          },
                        // Budget matching (flexible - allow landlords to see requests they can adjust to)
              monthlyRent: {
                lte: rentalRequest.budgetTo * 1.5 || rentalRequest.budget * 1.5
              },
              // Property type matching (strict - must match exactly)
              ...(rentalRequest.propertyType && {
                propertyType: {
                  equals: rentalRequest.propertyType,
                  mode: 'insensitive'
                }
              }),
          // Bedrooms matching (if specified)
          ...(rentalRequest.bedrooms && {
            bedrooms: rentalRequest.bedrooms
          }),
          // Property features matching (if specified)
          ...(rentalRequest.furnished !== undefined && {
            furnished: rentalRequest.furnished
          }),
          ...(rentalRequest.parking !== undefined && {
            parking: rentalRequest.parking
          }),
          ...(rentalRequest.petsAllowed !== undefined && {
            petsAllowed: rentalRequest.petsAllowed
          }),
          // Property is available
          availableFrom: {
            lte: new Date(rentalRequest.moveInDate)
          }
        },
        orderBy: [
          { monthlyRent: 'asc' }, // Prefer cheaper properties
          { availableFrom: 'asc' } // Prefer earlier availability
        ],
        take: 1
      });

      return properties[0] || null;
    } catch (error) {
      console.error('Error getting best matching property:', error);
      return null;
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

      // Get the best matching property for each request
      const requestsWithProperties = await Promise.all(requests.map(async (match) => {
        const bestProperty = await this.getBestMatchingProperty(landlordId, match.rentalRequest);
        return {
          ...match,
          rentalRequest: {
            ...match.rentalRequest,
            bestMatchingProperty: bestProperty
          }
        };
      }));

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
        requests: requestsWithProperties,
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
      // If location is undefined, use a default or skip analytics
      if (!location) {
        console.log('⚠️ Skipping pool analytics update - no location provided');
        return;
      }

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

      console.log(`📊 Updated pool analytics for location: ${location}`);

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