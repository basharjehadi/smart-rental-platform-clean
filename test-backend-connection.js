import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

async function testBackendConnection() {
  console.log('🔍 Testing backend connection...');
  
  try {
    // Test basic connection
    console.log('📡 Testing basic connection...');
    const response = await axios.get(`http://localhost:3001/health`, { timeout: 5000 });
    console.log('✅ Backend is running');
    console.log('Response:', response.data);
    
    // Test auth endpoint
    console.log('\n🔐 Testing auth endpoint...');
    const authResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    }, { timeout: 5000 });
    console.log('✅ Auth endpoint is working');
    
  } catch (error) {
    console.error('❌ Backend connection failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Backend is not running. Please start it with: cd backend && npm start');
    } else if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testBackendConnection(); 