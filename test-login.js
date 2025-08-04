import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const testLogin = async () => {
  try {
    console.log('🔐 Testing login...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'landlord@test.com',
      password: 'password123'
    });

    console.log('✅ Login response:', response.data);
    
    if (response.data.success) {
      console.log('✅ Login successful!');
      console.log('Token:', response.data.token);
    } else {
      console.log('❌ Login failed:', response.data.error);
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
  }
};

testLogin(); 