import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

async function testNotificationEndpoints() {
  try {
    console.log('🧪 Testing Notification API endpoints directly...\n');

    // First, let's test if the server is running
    console.log('1️⃣ Testing server health...');
    try {
      const healthResponse = await axios.get('http://localhost:3001/health');
      console.log('   ✅ Server is running:', healthResponse.status);
    } catch (error) {
      console.log('   ❌ Server health check failed:', error.message);
      return;
    }

    // Test 2: Test unread counts endpoint
    console.log('\n2️⃣ Testing /notifications/unread-counts endpoint...');
    try {
      const countsResponse = await axios.get(`${API_BASE}/notifications/unread-counts`);
      console.log('   ✅ Unread counts endpoint works:', countsResponse.status);
      console.log('   📊 Response data:', countsResponse.data);
    } catch (error) {
      console.log('   ❌ Unread counts endpoint failed:', error.response?.status, error.response?.data);
    }

    // Test 3: Test all notifications endpoint
    console.log('\n3️⃣ Testing /notifications endpoint...');
    try {
      const notificationsResponse = await axios.get(`${API_BASE}/notifications`);
      console.log('   ✅ Notifications endpoint works:', notificationsResponse.status);
      console.log('   📊 Response data:', notificationsResponse.data);
    } catch (error) {
      console.log('   ❌ Notifications endpoint failed:', error.response?.status, error.response?.data);
    }

    // Test 4: Test with a mock token (to simulate frontend call)
    console.log('\n4️⃣ Testing with mock authentication...');
    try {
      const mockToken = 'mock-token-for-testing';
      const authResponse = await axios.get(`${API_BASE}/notifications/unread-counts`, {
        headers: {
          'Authorization': `Bearer ${mockToken}`
        }
      });
      console.log('   ✅ Endpoint works with mock token:', authResponse.status);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ✅ Endpoint correctly rejects invalid token (401)');
      } else {
        console.log('   ❌ Unexpected error with mock token:', error.response?.status, error.response?.data);
      }
    }

    console.log('\n🎯 API Test Summary:');
    console.log('   - If endpoints return 401, that\'s expected (no valid token)');
    console.log('   - If endpoints return 500, there\'s a server error');
    console.log('   - If endpoints return 200, the API is working correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNotificationEndpoints();

