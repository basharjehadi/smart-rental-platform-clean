import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const testLandlordProfile = async () => {
  try {
    console.log('🔍 Testing landlord profile...\n');
    
    // Login as landlord
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'landlord@test.com',
      password: 'landlord123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Landlord login successful');
    
    // Check landlord profile
    const profileResponse = await axios.get(`${API_BASE_URL}/landlord-profile/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Landlord profile:', profileResponse.data);
    
    // Check user data
    const userResponse = await axios.get(`${API_BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ User data:', {
      id: userResponse.data.id,
      role: userResponse.data.role,
      currentTenants: userResponse.data.currentTenants,
      maxTenants: userResponse.data.maxTenants,
      availability: userResponse.data.availability,
      autoAvailability: userResponse.data.autoAvailability
    });
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
};

testLandlordProfile(); 