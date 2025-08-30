/**
 * 🧪 Test Script for Moderation Service
 *
 * Tests the moderateReviewText function with various inputs
 * to ensure proper content filtering and blocking.
 */

import {
  moderateReviewText,
  enqueueTrustAndSafetyReview,
} from '../services/moderation.js';

// Test cases for content moderation
const testCases = [
  // Clean content (should pass)
  {
    name: 'Clean content',
    text: 'Great experience with this property. Everything was perfect!',
    expectedOk: true,
    expectedReasons: [],
  },

  // Email addresses (should be blocked)
  {
    name: 'Contains email address',
    text: 'Contact me at john.doe@example.com for more details',
    expectedOk: false,
    expectedReasons: ['Email addresses are not allowed'],
  },

  // Phone numbers (should be blocked)
  {
    name: 'Contains phone number',
    text: 'Call me at (555) 123-4567 or 555-987-6543',
    expectedOk: false,
    expectedReasons: ['Phone numbers are not allowed'],
  },

  // URLs/links (should be blocked)
  {
    name: 'Contains URLs',
    text: 'Check out my website at https://example.com or www.test.org',
    expectedOk: false,
    expectedReasons: ['Links and URLs are not allowed'],
  },

  // Profanity (should be blocked)
  {
    name: 'Contains profanity',
    text: 'This place is really bad, I hate it so much',
    expectedOk: false,
    expectedReasons: ['Profanity or inappropriate language detected'],
  },

  // Hate speech (should be blocked)
  {
    name: 'Contains hate speech',
    text: 'I hate all people from that background, they should be eliminated',
    expectedOk: false,
    expectedReasons: [
      'Profanity or inappropriate language detected',
      'Hate speech or violent content detected',
    ],
  },

  // Multiple violations (should be blocked)
  {
    name: 'Multiple violations',
    text: 'Contact me at test@email.com or call (555) 123-4567. This place sucks!',
    expectedOk: false,
    expectedReasons: [
      'Email addresses are not allowed',
      'Phone numbers are not allowed',
    ],
  },

  // Edge case: text with dots that might look like URLs
  {
    name: 'Text with dots but no URLs',
    text: 'The property is located at 123 Main St. It has 3 bedrooms.',
    expectedOk: true,
    expectedReasons: [],
  },
];

function testModerationService() {
  console.log('🧪 Testing Moderation Service...\n');

  let passedTests = 0;
  let totalTests = testCases.length;

  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log(`Input: "${testCase.text}"`);

    try {
      const result = moderateReviewText(testCase.text);

      // Check if moderation result matches expectations
      const okMatches = result.ok === testCase.expectedOk;
      const reasonsMatch =
        JSON.stringify(result.reasons.sort()) ===
        JSON.stringify(testCase.expectedReasons.sort());

      if (okMatches && reasonsMatch) {
        console.log('✅ PASSED');
        passedTests++;
      } else {
        console.log('❌ FAILED');
        console.log(
          `  Expected: ok=${testCase.expectedOk}, reasons=${JSON.stringify(testCase.expectedReasons)}`
        );
        console.log(
          `  Got: ok=${result.ok}, reasons=${JSON.stringify(result.reasons)}`
        );
      }

      console.log(`  Result: ${result.ok ? 'ACCEPTED' : 'BLOCKED'}`);
      if (result.reasons.length > 0) {
        console.log(`  Reasons: ${result.reasons.join(', ')}`);
      }
      if (result.redactedText !== testCase.text) {
        console.log(`  Redacted: "${result.redactedText}"`);
      }
    } catch (error) {
      console.log('❌ ERROR:', error.message);
    }

    console.log(''); // Empty line for readability
  });

  // Summary
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log(
      '🎉 All tests passed! Moderation service is working correctly.'
    );
  } else {
    console.log('⚠️ Some tests failed. Please review the implementation.');
  }
}

async function testTrustAndSafetyEnqueue() {
  console.log('\n🔒 Testing Trust & Safety Enqueue...\n');

  try {
    const testReviewId = 'test_review_123';
    const originalText = 'This is a test review with inappropriate content';
    const redactedText = 'This is a test review with [CONTENT_REMOVED]';
    const reasons = ['Test reason 1', 'Test reason 2'];

    console.log('Testing enqueueTrustAndSafetyReview function...');
    await enqueueTrustAndSafetyReview(
      testReviewId,
      originalText,
      redactedText,
      reasons
    );
    console.log('✅ Trust & Safety enqueue test completed');
  } catch (error) {
    console.log('❌ Trust & Safety enqueue test failed:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  testModerationService();
  await testTrustAndSafetyEnqueue();
}

// Execute tests
runAllTests().catch(console.error);
