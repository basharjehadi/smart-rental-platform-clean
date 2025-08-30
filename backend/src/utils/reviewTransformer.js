/**
 * 🔄 Review Transformer Utility
 *
 * This utility transforms review data and adds appropriate labels
 * for different review stages and types.
 */

/**
 * Transform a single review with appropriate labels and metadata
 */
export function transformReview(review) {
  const transformed = {
    ...review,
    labels: [],
  };

  // Add stage-specific labels
  switch (review.reviewStage) {
    case 'MOVE_IN':
      transformed.labels.push('Move-in check (no score impact)');
      break;
    case 'END_OF_LEASE':
      transformed.labels.push('Lease end review (affects score)');
      break;
    case 'INITIAL':
      transformed.labels.push('Initial rating (minimal impact)');
      break;
  }

  // Add status-specific labels
  switch (review.status) {
    case 'PENDING':
      transformed.labels.push('Awaiting submission');
      break;
    case 'SUBMITTED':
      transformed.labels.push('Submitted for review');
      break;
    case 'PUBLISHED':
      transformed.labels.push('Publicly visible');
      break;
  }

  // Add special labels
  if (review.isAnonymous) {
    transformed.labels.push('Anonymous review');
  }

  if (review.isDoubleBlind) {
    transformed.labels.push('Double-blind review');
  }

  // Add reply information if exists
  if (review.reply) {
    transformed.hasReply = true;
    transformed.reply = {
      ...review.reply,
      labels: ['Review reply'],
    };
  } else {
    transformed.hasReply = false;
    transformed.reply = null;
  }

  return transformed;
}

/**
 * Transform an array of reviews
 */
export function transformReviews(reviews) {
  return reviews.map(transformReview);
}

/**
 * Get review stage information with labels
 */
export function getReviewStageInfo(stage) {
  switch (stage) {
    case 'MOVE_IN':
      return {
        name: 'Move-in Experience',
        description: 'Review after moving into the property',
        label: 'Move-in check (no score impact)',
        color: 'blue',
        weight: 0,
        affectsScore: false,
      };
    case 'END_OF_LEASE':
      return {
        name: 'Lease End',
        description: 'Final review after lease ends',
        label: 'Lease end review (affects score)',
        color: 'purple',
        weight: 0.4,
        affectsScore: true,
      };
    case 'INITIAL':
      return {
        name: 'Initial Rating',
        description: 'Starting rating for new users',
        label: 'Initial rating (minimal impact)',
        color: 'gray',
        weight: 0.1,
        affectsScore: true,
      };
    default:
      return {
        name: 'Unknown Stage',
        description: 'Unknown review stage',
        label: 'Unknown stage',
        color: 'gray',
        weight: 0,
        affectsScore: false,
      };
  }
}

export default {
  transformReview,
  transformReviews,
  getReviewStageInfo,
};
