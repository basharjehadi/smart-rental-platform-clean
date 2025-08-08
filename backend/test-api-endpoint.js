import fetch from 'node-fetch';

async function testAPI() {
  try {
    console.log('🔍 Testing API endpoint...');
    
    // Test if server is running
    const response = await fetch('http://localhost:3001/api/landlord/tenants', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const data = await response.text();
    console.log('Response data:', data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI(); 