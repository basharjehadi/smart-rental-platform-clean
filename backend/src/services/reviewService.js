import { prisma } from '../utils/prisma.js';
import rankService from './rankService.js';

class ReviewService {
  /**
   * 🏆 3-STAGE REVIEW SYSTEM
   * Stage 1: After tenant pays for property
   * Stage 2: After tenant moves in
   * Stage 3: After lease term ends
   */

  /**
   * Initialize user with automatic 5-star rating
   */
  async initializeUserRating(userId) {
    try {
      console.log(`⭐ Initializing 5-star rating for new user: ${userId}`);
      
      // Create initial review with 5-star rating (self-review)
      const initialReview = await prisma.review.create({
        data: {
          rating: 5,
          comment: 'New user - Initial rating',
          isAnonymous: false,
          reviewerId: userId,
          targetTenantGroupId: null,
          leaseId: null, // No lease yet
          reviewStage: 'INITIAL',
          isSystemGenerated: true
        }
      });

      console.log(`✅ Initial 5-star rating created for user ${userId}`);
      return initialReview;
    } catch (error) {
      console.error(`❌ Error initializing user rating:`, error);
      throw error;
    }
  }

  /**
   * Create review at specific stage
   */
  async createStageReview(data) {
    try {
      const { reviewerId, targetTenantGroupId, leaseId, rating, comment, stage, isAnonymous = false, revieweeId } = data;
      
      console.log(`📝 Creating ${stage} review from ${reviewerId} to ${revieweeId || targetTenantGroupId}, lease ${leaseId}`);
      
      // Validate stage
      const validStages = ['MOVE_IN', 'END_OF_LEASE'];
      if (!validStages.includes(stage)) {
        throw new Error(`Invalid review stage: ${stage}`);
      }

      // Use revieweeId if provided, otherwise fall back to targetTenantGroupId
      const finalRevieweeId = revieweeId || targetTenantGroupId;

      // Check if review already exists for this stage (using the new unique constraint)
      const existingReview = await prisma.review.findFirst({
        where: {
          leaseId,
          reviewerId,
          revieweeId: finalRevieweeId,
          reviewStage: stage
        }
      });

      if (existingReview) {
        throw new Error(`Review already exists for stage ${stage}`);
      }

      // Create the review
      const review = await prisma.review.create({
        data: {
          rating,
          comment,
          isAnonymous,
          reviewerId,
          targetTenantGroupId,
          revieweeId: finalRevieweeId,
          leaseId,
          reviewStage: stage,
          isSystemGenerated: false
        }
      });

      console.log(`✅ ${stage} review created successfully`);
      return review;
    } catch (error) {
      console.error(`❌ Error creating stage review:`, error);
      throw error;
    }
  }

  /**
   * Update user's average rating based on all reviews
   */
  async updateUserAverageRating(userId) {
    try {
      console.log(`🔄 Updating average rating for user: ${userId}`);
      
      // Get all reviews received by the user
      const reviews = await prisma.review.findMany({
        where: { reviewerId: userId },
        select: { rating: true, reviewStage: true, isSystemGenerated: true }
      });

      if (reviews.length === 0) {
        console.log(`⚠️ No reviews found for user ${userId}`);
        return;
      }

      // Calculate weighted average based on review stage
      let totalWeightedRating = 0;
      let totalWeight = 0;

      reviews.forEach(review => {
        let weight = 1;
        
        // Weight reviews by stage importance
        switch (review.reviewStage) {
          case 'INITIAL':
            weight = 0.1; // Initial 5-star has minimal weight
            break;
          case 'MOVE_IN':
            weight = 0.6; // Move-in stage review (most important)
            break;
          case 'END_OF_LEASE':
            weight = 0.3; // Final stage review
            break;
        }

        // Reduce weight for system-generated reviews
        if (review.isSystemGenerated) {
          weight *= 0.1;
        }

        totalWeightedRating += review.rating * weight;
        totalWeight += weight;
      });

      const averageRating = totalWeight > 0 ? totalWeightedRating / totalWeight : 0;
      const roundedRating = Math.round(averageRating * 10) / 10; // Round to 1 decimal

             // Update user's average rating
       await prisma.user.update({
         where: { id: userId },
         data: { 
           averageRating: roundedRating,
           totalReviews: reviews.length
         }
       });

       // Calculate and update user rank
       await rankService.calculateUserRank(userId);

       console.log(`✅ User ${userId} average rating updated to ${roundedRating} (${reviews.length} reviews)`);
       return roundedRating;
    } catch (error) {
      console.error(`❌ Error updating user average rating:`, error);
      throw error;
    }
  }

  /**
   * Get user's review summary
   */
  async getUserReviewSummary(userId) {
    try {
      const reviews = await prisma.review.findMany({
        where: {
          OR: [
            { reviewerId: userId },
            { targetTenantGroup: { members: { some: { userId } } } }
          ]
        },
        include: {
          lease: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      const summary = {
        totalReviews: reviews.length,
        averageRating: 0,
        reviewStages: {
          initial: 0,
          moveIn: 0,
          endOfLease: 0
        },
        recentReviews: [],
        stageProgress: {
          moveInCompleted: false,
          endOfLeaseCompleted: false
        }
      };

      if (reviews.length > 0) {
        // Calculate stage counts
        reviews.forEach(review => {
          switch (review.reviewStage) {
            case 'INITIAL':
              summary.reviewStages.initial++;
              break;
            case 'MOVE_IN':
              summary.reviewStages.moveIn++;
              summary.stageProgress.moveInCompleted = true;
              break;
            case 'END_OF_LEASE':
              summary.reviewStages.endOfLease++;
              summary.stageProgress.endOfLeaseCompleted = true;
              break;
          }
        });

        // Get recent reviews (last 3)
        summary.recentReviews = reviews
          .filter(r => !r.isSystemGenerated)
          .slice(-3)
          .map(r => ({
            rating: r.rating,
            comment: r.comment,
            stage: r.reviewStage,
            createdAt: r.createdAt
          }));

        // Get average rating from user table
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { averageRating: true }
        });
        summary.averageRating = user?.averageRating || 0;
      }

      return summary;
    } catch (error) {
      console.error(`❌ Error getting user review summary:`, error);
      throw error;
    }
  }

  /**
   * Trigger review creation based on lease events
   */
  async triggerReviewByEvent(eventType, leaseId, tenantId) {
    try {
      console.log(`🎯 Triggering review for event: ${eventType}, lease: ${leaseId}`);
      
      let stage;
      switch (eventType) {
        case 'MOVE_IN':
          stage = 'MOVE_IN';
          break;
        case 'END_OF_LEASE':
          stage = 'END_OF_LEASE';
          break;
        default:
          throw new Error(`Unknown event type: ${eventType}`);
      }

      // Check if review already exists for this stage
      const existingReview = await prisma.review.findFirst({
        where: {
          targetTenantGroupId: tenantId,
          leaseId,
          reviewStage: stage
        }
      });

      if (existingReview) {
        console.log(`⚠️ Review already exists for stage ${stage}`);
        return existingReview;
      }

      // Create placeholder review that tenant can update
      const review = await prisma.review.create({
        data: {
          rating: 0, // Placeholder - tenant will update
          comment: `Review opportunity for ${stage.toLowerCase().replace('_', ' ')}`,
          isAnonymous: false,
          reviewerId: tenantId,
          targetTenantGroupId: tenantId, // Self-review initially
          leaseId,
          reviewStage: stage,
          isSystemGenerated: true
        }
      });

      console.log(`✅ Review opportunity created for stage ${stage}`);
      return review;
    } catch (error) {
      console.error(`❌ Error triggering review by event:`, error);
      throw error;
    }
  }

  /**
   * Get pending reviews for a user (bidirectional)
   */
  async getPendingReviews(userId) {
    try {
      console.log(`🔍 Fetching pending reviews for user: ${userId}`);
      
      // Get user's role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const isLandlord = user.role === 'LANDLORD';
      
      // Get pending reviews based on user role
      if (isLandlord) {
        // Landlord needs to review tenants
        return await this.getLandlordPendingReviews(userId);
      } else {
        // Tenant needs to review landlords
        return await this.getTenantPendingReviews(userId);
      }
    } catch (error) {
      console.error(`❌ Error getting pending reviews:`, error);
      throw error;
    }
  }

  /**
   * Get pending reviews for landlord to review tenants
   */
  async getLandlordPendingReviews(landlordId) {
    try {
      // For now, return demo pending reviews since we don't have active leases yet
      // In a real scenario, this would check actual lease data
      return [
        {
          id: 'demo_movein_1',
          leaseId: 'demo_lease_1',
          reviewStage: 'MOVE_IN',
          status: 'PENDING',
          description: 'Review tenant after move-in',
          tenant: { id: 'demo_tenant_1', name: 'Demo Tenant', email: 'demo@tenant.com' },
          property: { id: 'demo_property_1', name: 'Demo Property', address: '123 Demo St' },
          tenantId: 'demo_tenant_1',
          landlordId: landlordId,
          isAnonymous: false,
          isDoubleBlind: true
        }
      ];
    } catch (error) {
      console.error(`❌ Error getting landlord pending reviews:`, error);
      throw error;
    }
  }

  /**
   * Get pending reviews for tenant to review landlord
   */
  async getTenantPendingReviews(tenantId) {
    try {
      // For now, return demo pending reviews since we don't have active leases yet
      // In a real scenario, this would check actual lease data
      return [
        {
          id: 'demo_movein_1',
          leaseId: 'demo_lease_1',
          reviewStage: 'MOVE_IN',
          status: 'PENDING',
          description: 'Review landlord after move-in',
          landlord: { id: 'demo_landlord_1', name: 'Demo Landlord', email: 'demo@landlord.com' },
          property: { id: 'demo_property_1', name: 'Demo Property', address: '123 Demo St' },
          tenantId: tenantId,
          landlordId: 'demo_landlord_1',
          isAnonymous: false,
          isDoubleBlind: true
        }
      ];
    } catch (error) {
      console.error(`❌ Error getting tenant pending reviews:`, error);
      throw error;
    }
  }
}

export default new ReviewService();
