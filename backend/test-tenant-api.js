import fetch from 'node-fetch';

async function testTenantAPI() {
  try {
    console.log('🔍 Testing tenant API...');
    
    // First, let's check if the server is running
    const response = await fetch('http://localhost:5000/landlord/tenants', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // We'll need a real token
      }
    });
    
    console.log('Response status:', response.status);
    const data = await response.text();
    console.log('Response data:', data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testTenantAPI();
