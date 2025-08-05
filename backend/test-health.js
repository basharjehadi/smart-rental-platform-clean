import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

async function testHealth() {
  try {
    console.log('🔍 Testing server health...\n');

    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health response:', healthResponse.data);

    // Test if server is responding
    console.log('\n2. Testing server response...');
    const response = await axios.get(`${API_BASE_URL}/api/auth/login`);
    console.log('✅ Server is responding');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('Server is not running on port 3001');
    }
  }
}

testHealth(); 