import { prisma } from '../utils/prisma.js';

class RankService {
  /**
   * 🏆 USER RANKING SYSTEM
   * Ranks users based on reviews, experience, and activity
   */

  /**
   * Calculate and update user rank
   */
  async calculateUserRank(userId) {
    try {
      console.log(`🏆 Calculating rank for user: ${userId}`);

      // Get user data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          reviewsReceived: {
            select: {
              rating: true,
              reviewStage: true,
              isSystemGenerated: true,
              createdAt: true,
            },
          },
          properties: {
            select: {
              id: true,
              createdAt: true,
            },
          },
          leases: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              status: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Ensure user has a rank field (default to NEW_USER if not set)
      if (!user.rank) {
        await prisma.user.update({
          where: { id: userId },
          data: { rank: 'NEW_USER' },
        });
        user.rank = 'NEW_USER';
      }

      // Calculate rank points
      const rankPoints = await this.calculateRankPoints(user);

      // Determine new rank
      const newRank = this.determineRank(
        user.role,
        rankPoints,
        user.totalReviews || 1
      );

      // Update user rank if changed
      if (newRank !== user.rank) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            rank: newRank,
            rankPoints,
            rankUpdatedAt: new Date(),
          },
        });

        console.log(
          `✅ User ${userId} rank updated from ${user.rank} to ${newRank}`
        );
      }

      return {
        currentRank: newRank,
        rankPoints,
        previousRank: user.rank,
        rankChanged: newRank !== user.rank,
      };
    } catch (error) {
      console.error(`❌ Error calculating user rank:`, error);
      // Return default rank instead of throwing error
      return {
        currentRank: 'NEW_USER',
        rankPoints: 0,
        previousRank: 'NEW_USER',
        rankChanged: false,
      };
    }
  }

  /**
   * Calculate rank points based on various factors
   */
  async calculateRankPoints(user) {
    let points = 0;

    try {
      // Base points for account age (days since creation)
      const accountAgeDays = Math.floor(
        (new Date() - user.createdAt) / (1000 * 60 * 60 * 24)
      );
      points += Math.min(accountAgeDays * 0.5, 100); // Max 100 points for account age

      // Points for reviews received
      const realReviews =
        user.reviewsReceived?.filter((r) => !r.isSystemGenerated) || [];
      points += realReviews.length * 10; // 10 points per real review

      // Points for review ratings
      const averageRating = user.averageRating || 5.0;
      points += Math.floor(averageRating * 5); // 5 points per rating star

      // Points for review stages completed
      const reviewStages = new Set(realReviews.map((r) => r.reviewStage));
      points += reviewStages.size * 15; // 15 points per unique review stage

      // Role-specific points
      if (user.role === 'LANDLORD') {
        // Points for properties managed
        points += (user.properties?.length || 0) * 20; // 20 points per property

        // Points for successful leases
        const activeLeases =
          user.leases?.filter((l) => l.status === 'ACTIVE') || [];
        points += activeLeases.length * 25; // 25 points per active lease

        // Points for completed leases
        const completedLeases =
          user.leases?.filter(
            (l) => l.status === 'EXPIRED' || l.status === 'TERMINATED'
          ) || [];
        points += completedLeases.length * 30; // 30 points per completed lease
      } else {
        // Points for completed leases (tenant)
        const completedLeases =
          user.leases?.filter(
            (l) => l.status === 'EXPIRED' || l.status === 'TERMINATED'
          ) || [];
        points += completedLeases.length * 35; // 35 points per completed lease
      }

      // Bonus points for high activity
      if (user.lastActiveAt) {
        const daysSinceLastActive = Math.floor(
          (new Date() - user.lastActiveAt) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceLastActive <= 7) {
          points += 20; // Active in last week
        } else if (daysSinceLastActive <= 30) {
          points += 10; // Active in last month
        }
      }

      console.log(`🏆 Calculated ${points} points for user ${user.id}`);
      return Math.max(0, Math.floor(points));
    } catch (error) {
      console.error(
        `❌ Error calculating rank points for user ${user.id}:`,
        error
      );
      return 0; // Return 0 points if calculation fails
    }
  }

  /**
   * Determine user rank based on role, points, and reviews
   */
  determineRank(role, points, totalReviews) {
    if (role === 'LANDLORD') {
      return this.determineLandlordRank(points, totalReviews);
    } else {
      return this.determineTenantRank(points, totalReviews);
    }
  }

  /**
   * Determine landlord rank
   */
  determineLandlordRank(points, totalReviews) {
    if (totalReviews < 3) return 'NEW_USER';

    if (points >= 500) return 'DIAMOND_LANDLORD';
    if (points >= 300) return 'PLATINUM_LANDLORD';
    if (points >= 200) return 'GOLD_LANDLORD';
    if (points >= 100) return 'SILVER_LANDLORD';
    if (points >= 50) return 'BRONZE_LANDLORD';

    return 'NEW_USER';
  }

  /**
   * Determine tenant rank
   */
  determineTenantRank(points, totalReviews) {
    if (totalReviews < 3) return 'NEW_USER';

    if (points >= 400) return 'PLATINUM_TENANT';
    if (points >= 250) return 'GOLD_TENANT';
    if (points >= 150) return 'SILVER_TENANT';
    if (points >= 75) return 'BRONZE_TENANT';

    return 'NEW_USER';
  }

  /**
   * Get rank information for display
   */
  getRankInfo(rank) {
    const rankInfo = {
      NEW_USER: {
        name: 'New User',
        description: 'Just getting started',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        icon: '⭐',
        requirements: 'Complete your first review to earn a rank',
      },
      BRONZE_TENANT: {
        name: 'Bronze Tenant',
        description: 'Building rental experience',
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        icon: '🥉',
        requirements: '75+ points and 3+ reviews',
      },
      SILVER_TENANT: {
        name: 'Silver Tenant',
        description: 'Reliable tenant with good history',
        color: 'text-gray-400',
        bgColor: 'bg-gray-200',
        icon: '🥈',
        requirements: '150+ points and 3+ reviews',
      },
      GOLD_TENANT: {
        name: 'Gold Tenant',
        description: 'Excellent tenant with proven track record',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-100',
        icon: '🥇',
        requirements: '250+ points and 3+ reviews',
      },
      PLATINUM_TENANT: {
        name: 'Platinum Tenant',
        description: 'Elite tenant with outstanding reputation',
        color: 'text-blue-500',
        bgColor: 'bg-blue-100',
        icon: '💎',
        requirements: '400+ points and 3+ reviews',
      },
      BRONZE_LANDLORD: {
        name: 'Bronze Landlord',
        description: 'New landlord building portfolio',
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        icon: '🥉',
        requirements: '50+ points and 3+ reviews',
      },
      SILVER_LANDLORD: {
        name: 'Silver Landlord',
        description: 'Established landlord with good properties',
        color: 'text-gray-400',
        bgColor: 'bg-gray-200',
        icon: '🥈',
        requirements: '100+ points and 3+ reviews',
      },
      GOLD_LANDLORD: {
        name: 'Gold Landlord',
        description: 'Successful landlord with excellent properties',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-100',
        icon: '🥇',
        requirements: '200+ points and 3+ reviews',
      },
      PLATINUM_LANDLORD: {
        name: 'Platinum Landlord',
        description: 'Premium landlord with luxury properties',
        color: 'text-blue-500',
        bgColor: 'bg-blue-100',
        icon: '💎',
        requirements: '300+ points and 3+ reviews',
      },
      DIAMOND_LANDLORD: {
        name: 'Diamond Landlord',
        description: 'Elite landlord with exceptional portfolio',
        color: 'text-purple-500',
        bgColor: 'bg-purple-100',
        icon: '💎',
        requirements: '500+ points and 3+ reviews',
      },
    };

    return rankInfo[rank] || rankInfo.NEW_USER;
  }

  /**
   * Get next rank requirements
   */
  getNextRankRequirements(currentRank, role) {
    const rankInfo = this.getRankInfo(currentRank);

    if (currentRank === 'NEW_USER') {
      return {
        nextRank: role === 'LANDLORD' ? 'BRONZE_LANDLORD' : 'BRONZE_TENANT',
        pointsNeeded: role === 'LANDLORD' ? 50 : 75,
        reviewsNeeded: 3,
        description: `Complete 3 reviews and earn ${role === 'LANDLORD' ? 50 : 75} points to reach the next rank`,
      };
    }

    const rankOrder =
      role === 'LANDLORD'
        ? [
            'NEW_USER',
            'BRONZE_LANDLORD',
            'SILVER_LANDLORD',
            'GOLD_LANDLORD',
            'PLATINUM_LANDLORD',
            'DIAMOND_LANDLORD',
          ]
        : [
            'NEW_USER',
            'BRONZE_TENANT',
            'SILVER_TENANT',
            'GOLD_TENANT',
            'PLATINUM_TENANT',
          ];

    const currentIndex = rankOrder.indexOf(currentRank);
    if (currentIndex === -1 || currentIndex === rankOrder.length - 1) {
      return null; // Already at max rank
    }

    const nextRank = rankOrder[currentIndex + 1];
    const nextRankInfo = this.getRankInfo(nextRank);

    return {
      nextRank,
      pointsNeeded: this.getPointsForRank(nextRank, role),
      reviewsNeeded: 3,
      description: `Earn ${this.getPointsForRank(nextRank, role)} points to reach ${nextRankInfo.name}`,
    };
  }

  /**
   * Get points required for a specific rank
   */
  getPointsForRank(rank, role) {
    if (role === 'LANDLORD') {
      switch (rank) {
        case 'BRONZE_LANDLORD':
          return 50;
        case 'SILVER_LANDLORD':
          return 100;
        case 'GOLD_LANDLORD':
          return 200;
        case 'PLATINUM_LANDLORD':
          return 300;
        case 'DIAMOND_LANDLORD':
          return 500;
        default:
          return 0;
      }
    } else {
      switch (rank) {
        case 'BRONZE_TENANT':
          return 75;
        case 'SILVER_TENANT':
          return 150;
        case 'GOLD_TENANT':
          return 250;
        case 'PLATINUM_TENANT':
          return 400;
        default:
          return 0;
      }
    }
  }
}

export default new RankService();
