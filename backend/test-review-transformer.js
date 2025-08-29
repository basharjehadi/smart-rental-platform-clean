/**
 * 🧪 Test Review Transformer Utility
 * 
 * This script tests the review transformer utility to ensure
 * it correctly adds labels and metadata to reviews.
 */

import { transformReview, transformReviews, getReviewStageInfo } from './src/utils/reviewTransformer.js';

// Test data
const testReviews = [
  {
    id: 'review_1',
    reviewStage: 'MOVE_IN',
    status: 'PENDING',
    rating: 0,
    comment: '',
    isAnonymous: false,
    isDoubleBlind: true,
    leaseId: 'lease_1',
    reviewerId: 'user_1',
    targetTenantGroupId: 'group_1'
  },
  {
    id: 'review_2',
    reviewStage: 'END_OF_LEASE',
    status: 'PUBLISHED',
    rating: 5,
    comment: 'Great experience!',
    isAnonymous: false,
    isDoubleBlind: false,
    leaseId: 'lease_1',
    reviewerId: 'user_2',
    targetTenantGroupId: 'group_1'
  },
  {
    id: 'review_3',
    reviewStage: 'INITIAL',
    status: 'SUBMITTED',
    rating: 5,
    comment: 'Starting rating',
    isAnonymous: true,
    isDoubleBlind: true,
    leaseId: 'lease_1',
    reviewerId: 'user_3',
    targetTenantGroupId: 'group_1'
  }
];

function testTransformReview() {
  console.log('🧪 Testing transformReview function...\n');
  
  testReviews.forEach((review, index) => {
    console.log(`--- Test Review ${index + 1} ---`);
    console.log('Original:', JSON.stringify(review, null, 2));
    
    const transformed = transformReview(review);
    console.log('Transformed:', JSON.stringify(transformed, null, 2));
    
    // Verify labels are added
    if (transformed.labels && transformed.labels.length > 0) {
      console.log('✅ Labels added successfully');
      transformed.labels.forEach(label => console.log(`  - ${label}`));
    } else {
      console.log('❌ No labels found');
    }
    
    console.log('');
  });
}

function testTransformReviews() {
  console.log('🧪 Testing transformReviews function...\n');
  
  const transformed = transformReviews(testReviews);
  console.log(`Transformed ${transformed.length} reviews`);
  
  transformed.forEach((review, index) => {
    console.log(`Review ${index + 1} labels:`, review.labels);
  });
  
  console.log('');
}

function testGetReviewStageInfo() {
  console.log('🧪 Testing getReviewStageInfo function...\n');
  
  const stages = ['MOVE_IN', 'END_OF_LEASE', 'INITIAL', 'UNKNOWN'];
  
  stages.forEach(stage => {
    const info = getReviewStageInfo(stage);
    console.log(`Stage: ${stage}`);
    console.log(`  Name: ${info.name}`);
    console.log(`  Description: ${info.description}`);
    console.log(`  Label: ${info.label}`);
    console.log(`  Color: ${info.color}`);
    console.log(`  Weight: ${info.weight}`);
    console.log(`  Affects Score: ${info.affectsScore}`);
    console.log('');
  });
}

function testMoveInReviewExclusion() {
  console.log('🧪 Testing MOVE_IN review exclusion from aggregates...\n');
  
  const moveInReview = testReviews.find(r => r.reviewStage === 'MOVE_IN');
  const endOfLeaseReview = testReviews.find(r => r.reviewStage === 'END_OF_LEASE');
  
  if (moveInReview) {
    const transformed = transformReview(moveInReview);
    const hasNoScoreLabel = transformed.labels.some(label => 
      label.includes('no score impact') || label.includes('Move-in check')
    );
    
    if (hasNoScoreLabel) {
      console.log('✅ MOVE_IN review correctly labeled as "no score impact"');
    } else {
      console.log('❌ MOVE_IN review missing "no score impact" label');
    }
  }
  
  if (endOfLeaseReview) {
    const transformed = transformReview(endOfLeaseReview);
    const hasScoreLabel = transformed.labels.some(label => 
      label.includes('affects score') || label.includes('Lease end review')
    );
    
    if (hasScoreLabel) {
      console.log('✅ END_OF_LEASE review correctly labeled as "affects score"');
    } else {
      console.log('❌ END_OF_LEASE review missing "affects score" label');
    }
  }
  
  console.log('');
}

function runAllTests() {
  console.log('🚀 Starting Review Transformer Tests\n');
  console.log('=' .repeat(50));
  
  testTransformReview();
  testTransformReviews();
  testGetReviewStageInfo();
  testMoveInReviewExclusion();
  
  console.log('=' .repeat(50));
  console.log('✨ All tests completed!');
}

// Run tests
runAllTests();
