/**
 * 🛡️ Content Moderation Service
 *
 * This service handles content moderation for review text,
 * ensuring compliance with platform guidelines.
 */

/**
 * Moderate review text content
 * - Strips emails, phone numbers, and links
 * - Blocks profanity and hate speech
 * - Returns moderation result with redacted text
 */
export function moderateReviewText(text) {
  const reasons = [];
  let redactedText = text;

  // Strip emails
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  if (emailRegex.test(redactedText)) {
    redactedText = redactedText.replace(emailRegex, '[EMAIL_REMOVED]');
    reasons.push('Email addresses are not allowed');
  }

  // Strip phone numbers (various formats)
  const phoneRegex =
    /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  if (phoneRegex.test(redactedText)) {
    redactedText = redactedText.replace(phoneRegex, '[PHONE_REMOVED]');
    reasons.push('Phone numbers are not allowed');
  }

  // Strip URLs/links
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([^\s]+\.[a-z]{2,})/gi;
  if (urlRegex.test(redactedText)) {
    redactedText = redactedText.replace(urlRegex, '[LINK_REMOVED]');
    reasons.push('Links and URLs are not allowed');
  }

  // Check for profanity (basic list - can be expanded)
  const profanityWords = [
    // Common profanity
    'fuck',
    'shit',
    'bitch',
    'ass',
    'damn',
    'hell',
    // Hate speech indicators
    'hate',
    'kill',
    'death',
    'murder',
    'suicide',
    // Discriminatory terms
    'racist',
    'sexist',
    'homophobic',
    'transphobic',
  ];

  const hasProfanity = profanityWords.some((word) =>
    new RegExp(`\\b${word}\\b`, 'i').test(redactedText)
  );

  if (hasProfanity) {
    reasons.push('Profanity or inappropriate language detected');
  }

  // Check for hate speech patterns
  const hatePatterns = [
    /\b(kill|death|murder|suicide)\s+(yourself|himself|herself|themselves)\b/i,
    /\b(hate|despise|loathe)\s+(all|every)\s+(black|white|asian|hispanic|jewish|muslim|christian|gay|lesbian|trans)\w*\b/i,
    /\b(should\s+be\s+(killed|eliminated|exterminated))\b/i,
  ];

  const hasHateSpeech = hatePatterns.some((pattern) =>
    pattern.test(redactedText)
  );

  if (hasHateSpeech) {
    reasons.push('Hate speech or violent content detected');
  }

  // Determine if content is acceptable
  const ok = reasons.length === 0;

  return {
    ok,
    redactedText,
    reasons,
  };
}

/**
 * Enqueue content for Trust & Safety review
 * This would typically integrate with a T&S queue system
 */
export async function enqueueTrustAndSafetyReview(
  reviewId,
  originalText,
  redactedText,
  reasons
) {
  // TODO: Integrate with actual T&S queue system
  console.log('🚨 Enqueuing review for Trust & Safety review:', {
    reviewId,
    originalText: originalText.substring(0, 100) + '...',
    redactedText: redactedText.substring(0, 100) + '...',
    reasons,
    timestamp: new Date().toISOString(),
  });

  // In a real implementation, this would:
  // 1. Add to T&S review queue
  // 2. Notify T&S team
  // 3. Track review status
  // 4. Allow manual review and approval/rejection
}

export default {
  moderateReviewText,
  enqueueTrustAndSafetyReview,
};
