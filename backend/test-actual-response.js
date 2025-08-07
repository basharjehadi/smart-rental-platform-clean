import axios from 'axios';

async function testActualAPIResponse() {
  try {
    console.log('🔍 Testing actual API response...');
    
    // First, let's get a JWT token for a tenant
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'testtenant@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Got JWT token');
    
    // Now let's get the dashboard data to find the offer ID
    const dashboardResponse = await axios.get('http://localhost:3001/api/tenant-dashboard/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Dashboard response:', dashboardResponse.data);
    const offerId = dashboardResponse.data.offerId;
    
    if (!offerId) {
      console.log('❌ No offer ID found in dashboard');
      return;
    }
    
    console.log('Offer ID from dashboard:', offerId);
    
    // Now let's call the actual offer details endpoint
    const offerResponse = await axios.get(`http://localhost:3001/api/tenant/offer/${offerId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('\n🔍 ACTUAL API RESPONSE:');
    console.log('Response status:', offerResponse.status);
    console.log('Response data keys:', Object.keys(offerResponse.data));
    
    const offer = offerResponse.data.offer;
    console.log('\nOffer data:');
    console.log('Offer ID:', offer.id);
    console.log('Status:', offer.status);
    
    console.log('\n🔍 SIGNATURE DATA:');
    console.log('Tenant signature present:', !!offer.tenant?.signatureBase64);
    console.log('Landlord signature present:', !!offer.landlord?.signatureBase64);
    console.log('Tenant signature length:', offer.tenant?.signatureBase64?.length || 0);
    console.log('Landlord signature length:', offer.landlord?.signatureBase64?.length || 0);
    
    if (offer.tenant?.signatureBase64) {
      console.log('Tenant signature starts with:', offer.tenant.signatureBase64.substring(0, 50) + '...');
    }
    
    if (offer.landlord?.signatureBase64) {
      console.log('Landlord signature starts with:', offer.landlord.signatureBase64.substring(0, 50) + '...');
    }
    
    console.log('\nFull tenant object:', offer.tenant);
    console.log('Full landlord object:', offer.landlord);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testActualAPIResponse();
