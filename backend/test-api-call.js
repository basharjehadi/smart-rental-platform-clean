import axios from 'axios';

async function testApiCall() {
  try {
    console.log('🔍 Testing API call...');
    
    const offerId = 'cme0hgi6u0001exk0233lhcpo';
    const url = `http://localhost:3001/api/tenant/offer/${offerId}`;
    
    console.log('🔗 Calling URL:', url);
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('✅ API call successful');
    console.log('📋 Response data:', response.data);
    
  } catch (error) {
    console.error('❌ API call failed');
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    console.error('Error message:', error.message);
  }
}

testApiCall();
