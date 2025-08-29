/**
 * 🧪 Test Script for Moderation Service Integration
 * 
 * Tests the integration between the moderation service and review controller
 * to ensure content filtering works correctly in the review workflow.
 */

import { moderateReviewText } from './src/services/moderation.js';

// Mock review controller functions to test moderation integration
class MockReviewController {
  constructor() {
    this.reviews = new Map();
    this.nextId = 1;
  }

  // Simulate createReview with moderation
  async createReview(reviewData) {
    const { comment, ...otherData } = reviewData;
    
    // Apply moderation (same logic as in the actual controller)
    const moderationResult = moderateReviewText(comment);
    
    if (!moderationResult.ok) {
      // Create blocked review
      const blockedReview = {
        id: `review_${this.nextId++}`,
        rating: 0,
        comment: moderationResult.redactedText,
        status: 'BLOCKED',
        redactedText: moderationResult.redactedText,
        violatesPolicy: true,
        ...otherData
      };
      
      this.reviews.set(blockedReview.id, blockedReview);
      
      // Simulate Trust & Safety enqueue
      console.log('🚨 Content blocked - enqueued for T&S review:', {
        reviewId: blockedReview.id,
        reasons: moderationResult.reasons
      });
      
      return {
        success: false,
        error: 'Content blocked',
        message: 'Your review contains content that violates our community guidelines',
        reasons: moderationResult.reasons,
        reviewId: blockedReview.id
      };
    }
    
    // Create normal review
    const review = {
      id: `review_${this.nextId++}`,
      comment,
      status: 'PENDING',
      ...otherData
    };
    
    this.reviews.set(review.id, review);
    
    return {
      success: true,
      message: 'Review created successfully',
      data: review
    };
  }

  // Simulate submitReview with moderation
  async submitReview(reviewId, text) {
    const review = this.reviews.get(reviewId);
    if (!review) {
      return { success: false, error: 'Review not found' };
    }
    
    // Apply moderation to submitted text
    const moderationResult = moderateReviewText(text);
    
    if (!moderationResult.ok) {
      // Update review to blocked status
      review.comment = moderationResult.redactedText;
      review.status = 'BLOCKED';
      review.redactedText = moderationResult.redactedText;
      review.violatesPolicy = true;
      
      // Simulate Trust & Safety enqueue
      console.log('🚨 Submission blocked - enqueued for T&S review:', {
        reviewId: review.id,
        reasons: moderationResult.reasons
      });
      
      return {
        success: false,
        error: 'Content blocked',
        message: 'Your review text contains content that violates our community guidelines',
        reasons: moderationResult.reasons,
        reviewId: review.id
      };
    }
    
    // Update review normally
    review.comment = text;
    review.status = 'SUBMITTED';
    review.submittedAt = new Date();
    
    return {
      success: true,
      message: 'Review submitted successfully',
      data: review
    };
  }

  // Simulate editReviewText with moderation
  async editReviewText(reviewId, text) {
    const review = this.reviews.get(reviewId);
    if (!review) {
      return { success: false, error: 'Review not found' };
    }
    
    // Apply moderation to edited text
    const moderationResult = moderateReviewText(text);
    
    if (!moderationResult.ok) {
      // Update review to blocked status
      review.comment = moderationResult.redactedText;
      review.status = 'BLOCKED';
      review.redactedText = moderationResult.redactedText;
      review.violatesPolicy = true;
      
      // Simulate Trust & Safety enqueue
      console.log('🚨 Edit blocked - enqueued for T&S review:', {
        reviewId: review.id,
        reasons: moderationResult.reasons
      });
      
      return {
        success: false,
        error: 'Content blocked',
        message: 'Your edited review text contains content that violates our community guidelines',
        reasons: moderationResult.reasons,
        reviewId: review.id
      };
    }
    
    // Update review normally
    review.comment = text;
    review.updatedAt = new Date();
    
    return {
      success: true,
      message: 'Review text updated successfully',
      data: review
    };
  }

  // Get review by ID
  getReview(reviewId) {
    return this.reviews.get(reviewId);
  }

  // Get all reviews
  getAllReviews() {
    return Array.from(this.reviews.values());
  }
}

// Test scenarios
const testScenarios = [
  {
    name: 'Create Review - Clean Content',
    action: 'create',
    data: {
      comment: 'Great property, very clean and well-maintained!',
      rating: 5,
      reviewStage: 'MOVE_IN'
    },
    expectedSuccess: true
  },
  {
    name: 'Create Review - Contains Email',
    action: 'create',
    data: {
      comment: 'Contact me at test@example.com for more details',
      rating: 4,
      reviewStage: 'END_OF_LEASE'
    },
    expectedSuccess: false,
    expectedReasons: ['Email addresses are not allowed']
  },
  {
    name: 'Create Review - Contains Phone',
    action: 'create',
    data: {
      comment: 'Call me at (555) 123-4567 to discuss',
      rating: 3,
      reviewStage: 'MOVE_IN'
    },
    expectedSuccess: false,
    expectedReasons: ['Phone numbers are not allowed']
  },
  {
    name: 'Create Review - Contains Profanity',
    action: 'create',
    data: {
      comment: 'This place is really bad, I hate it so much',
      rating: 1,
      reviewStage: 'END_OF_LEASE'
    },
    expectedSuccess: false,
    expectedReasons: ['Profanity or inappropriate language detected']
  },
  {
    name: 'Submit Review - Clean Text',
    action: 'submit',
    reviewId: 'review_1',
    text: 'Updated review with clean content',
    expectedSuccess: true
  },
  {
    name: 'Submit Review - Contains URL',
    action: 'submit',
    reviewId: 'review_1',
    text: 'Check out my website at https://example.com',
    expectedSuccess: false,
    expectedReasons: ['Links and URLs are not allowed']
  },
  {
    name: 'Edit Review - Clean Text',
    action: 'edit',
    reviewId: 'review_1',
    text: 'Final clean version of the review',
    expectedSuccess: true
  },
  {
    name: 'Edit Review - Multiple Violations',
    action: 'edit',
    reviewId: 'review_1',
    text: 'Email me at test@email.com or call (555) 123-4567. This sucks!',
    expectedSuccess: false,
    expectedReasons: [
      'Email addresses are not allowed',
      'Phone numbers are not allowed'
    ]
  }
];

async function testModerationIntegration() {
  console.log('🧪 Testing Moderation Service Integration...\n');
  
  const controller = new MockReviewController();
  let passedTests = 0;
  let totalTests = testScenarios.length;
  
  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    console.log(`Test ${i + 1}: ${scenario.name}`);
    
    try {
      let result;
      
      switch (scenario.action) {
        case 'create':
          result = await controller.createReview(scenario.data);
          break;
        case 'submit':
          result = await controller.submitReview(scenario.reviewId, scenario.text);
          break;
        case 'edit':
          result = await controller.editReviewText(scenario.reviewId, scenario.text);
          break;
      }
      
      // Check if result matches expectations
      const successMatches = result.success === scenario.expectedSuccess;
      let reasonsMatch = true;
      
      if (scenario.expectedReasons) {
        const actualReasons = result.reasons || [];
        reasonsMatch = JSON.stringify(actualReasons.sort()) === JSON.stringify(scenario.expectedReasons.sort());
      }
      
      if (successMatches && reasonsMatch) {
        console.log('✅ PASSED');
        passedTests++;
      } else {
        console.log('❌ FAILED');
        console.log(`  Expected: success=${scenario.expectedSuccess}, reasons=${JSON.stringify(scenario.expectedReasons || [])}`);
        console.log(`  Got: success=${result.success}, reasons=${JSON.stringify(result.reasons || [])}`);
      }
      
      // Show result details
      if (result.success) {
        console.log(`  Result: ${result.message}`);
        if (result.data) {
          console.log(`  Review ID: ${result.data.id}, Status: ${result.data.status}`);
        }
      } else {
        console.log(`  Error: ${result.error}`);
        console.log(`  Message: ${result.message}`);
        if (result.reasons) {
          console.log(`  Reasons: ${result.reasons.join(', ')}`);
        }
      }
      
    } catch (error) {
      console.log('❌ ERROR:', error.message);
    }
    
    console.log(''); // Empty line for readability
  }
  
  // Show final review states
  console.log('📊 Final Review States:');
  const allReviews = controller.getAllReviews();
  allReviews.forEach(review => {
    console.log(`  Review ${review.id}: Status=${review.status}, ViolatesPolicy=${review.violatesPolicy}`);
    if (review.redactedText) {
      console.log(`    Redacted: "${review.redactedText}"`);
    }
  });
  
  // Summary
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Moderation integration is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please review the implementation.');
  }
}

// Run the integration tests
testModerationIntegration().catch(console.error);
