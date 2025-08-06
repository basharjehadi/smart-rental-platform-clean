import axios from 'axios';

const debugPropertyCreation = async () => {
  try {
    console.log('🔍 Debugging property creation...');
    
    // Test with minimal required data
    const testData = new FormData();
    testData.append('name', 'Test Property');
    testData.append('address', '123 Test Street');
    testData.append('city', 'Warsaw');
    testData.append('zipCode', '00-001');
    testData.append('propertyType', 'apartment');
    testData.append('monthlyRent', '3000');
    testData.append('furnished', false);
    testData.append('parking', false);
    testData.append('petsAllowed', false);
    testData.append('smokingAllowed', false);
    testData.append('utilitiesIncluded', false);
    testData.append('description', 'Test property description');
    
    console.log('📝 Test data prepared');
    console.log('📤 Sending request to: http://localhost:3001/api/properties');
    
    // This will fail due to authentication, but we can see the response
    const response = await axios.post('http://localhost:3001/api/properties', testData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': 'Bearer test-token'
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Error occurred:');
    console.error('   Message:', error.message);
    console.error('   Status:', error.response?.status);
    console.error('   Status Text:', error.response?.statusText);
    console.error('   Data:', error.response?.data);
    console.error('   Headers:', error.response?.headers);
    
    if (error.response?.status === 401) {
      console.log('🔐 Authentication required - this is expected with test token');
    } else if (error.response?.status === 400) {
      console.log('📋 Validation error - check the error message above');
    } else if (error.response?.status === 500) {
      console.log('💥 Server error - check backend logs');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🔌 Connection refused - server not running');
    } else if (error.code === 'ENOTFOUND') {
      console.log('🌐 Host not found - check URL');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('⏰ Request timeout - server might be slow');
    }
  }
};

debugPropertyCreation(); 