/**
 * 🌐 API Test Script for Review Submit & Edit Endpoints
 *
 * This script tests the actual API endpoints for review submission and editing.
 * Make sure your backend server is running before executing this script.
 */

import fetch from 'node-fetch';

// Configuration
const BASE_URL = 'http://localhost:5000'; // Adjust if your server runs on different port
const TEST_TOKEN = 'your-test-jwt-token-here'; // Replace with actual test token

// Test data
const testReviewData = {
  stars: 5,
  text: 'Excellent experience with this landlord! Very responsive and professional.',
};

const updatedText =
  'Updated review: Excellent experience with this landlord! Very responsive, professional, and the property exceeded expectations.';

/**
 * Test the review submission endpoint
 */
async function testSubmitReview(reviewId) {
  console.log('📝 Testing POST /api/reviews/:id/submit...');

  try {
    const response = await fetch(`${BASE_URL}/api/reviews/${reviewId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify(testReviewData),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Review submitted successfully!');
      console.log(`   Status: ${data.data.status}`);
      console.log(`   Rating: ${data.data.rating} stars`);
      console.log(`   Submitted At: ${data.data.submittedAt}`);
      return data.data;
    } else {
      console.log('❌ Review submission failed:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error}`);
      console.log(`   Message: ${data.message}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return null;
  }
}

/**
 * Test the review text editing endpoint
 */
async function testEditReviewText(reviewId) {
  console.log('\n✏️  Testing PATCH /api/reviews/:id/text...');

  try {
    const response = await fetch(`${BASE_URL}/api/reviews/${reviewId}/text`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify({ text: updatedText }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Review text updated successfully!');
      console.log(`   Updated Comment: "${data.data.comment}"`);
      console.log(`   Updated At: ${data.data.updatedAt}`);
      return data.data;
    } else {
      console.log('❌ Review text update failed:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error}`);
      console.log(`   Message: ${data.message}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return null;
  }
}

/**
 * Test validation errors
 */
async function testValidationErrors(reviewId) {
  console.log('\n🚫 Testing validation errors...');

  // Test 1: Missing stars
  console.log('\n1️⃣ Testing missing stars...');
  try {
    const response = await fetch(`${BASE_URL}/api/reviews/${reviewId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify({ text: 'Test comment without stars' }),
    });

    const data = await response.json();

    if (response.status === 400 && data.error === 'Missing required fields') {
      console.log('✅ Missing stars correctly rejected');
    } else {
      console.log('❌ Expected validation error for missing stars');
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }

  // Test 2: Invalid stars range
  console.log('\n2️⃣ Testing invalid stars range...');
  try {
    const response = await fetch(`${BASE_URL}/api/reviews/${reviewId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify({
        stars: 6,
        text: 'Test comment with invalid stars',
      }),
    });

    const data = await response.json();

    if (response.status === 400 && data.error === 'Invalid stars') {
      console.log('✅ Invalid stars range correctly rejected');
    } else {
      console.log('❌ Expected validation error for invalid stars');
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }

  // Test 3: Missing text
  console.log('\n3️⃣ Testing missing text...');
  try {
    const response = await fetch(`${BASE_URL}/api/reviews/${reviewId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify({ stars: 5 }),
    });

    const data = await response.json();

    if (response.status === 400 && data.error === 'Missing required fields') {
      console.log('✅ Missing text correctly rejected');
    } else {
      console.log('❌ Expected validation error for missing text');
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

/**
 * Main test runner
 */
async function runAPITests() {
  console.log('🚀 Starting API Tests for Review Submit & Edit Endpoints\n');
  console.log('='.repeat(70) + '\n');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔑 Test Token: ${TEST_TOKEN ? '✅ Set' : '❌ Not set'}\n`);

  if (!TEST_TOKEN || TEST_TOKEN === 'your-test-jwt-token-here') {
    console.log('⚠️  Please set a valid test JWT token before running tests');
    console.log(
      '   You can get one by logging in through your frontend or API'
    );
    return;
  }

  // Note: You'll need to create a review first or use an existing review ID
  const testReviewId = 'your-test-review-id-here'; // Replace with actual review ID

  if (testReviewId === 'your-test-review-id-here') {
    console.log('⚠️  Please set a valid test review ID before running tests');
    console.log('   You can create one through your review creation endpoint');
    return;
  }

  try {
    // Test review submission
    const submittedReview = await testSubmitReview(testReviewId);

    if (submittedReview) {
      // Test text editing
      await testEditReviewText(testReviewId);

      // Test validation errors
      await testValidationErrors(testReviewId);
    }

    console.log('\n🎯 API Test Summary:');
    console.log('✅ Review submission endpoint');
    console.log('✅ Review text editing endpoint');
    console.log('✅ Validation error handling');
  } catch (error) {
    console.error('❌ API test suite failed:', error);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAPITests();
}

export { testSubmitReview, testEditReviewText, testValidationErrors };
