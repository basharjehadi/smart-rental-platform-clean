import fetch from 'node-fetch';

async function testServerHealth() {
  try {
    console.log('🔍 Testing server health...');
    
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:3001/health');
    console.log('Health endpoint status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health data:', healthData);
    } else {
      console.log('Health endpoint failed');
    }
    
    // Test a simple GET request to the tenant dashboard
    const dashboardResponse = await fetch('http://localhost:3001/api/tenant-dashboard/dashboard');
    console.log('Dashboard endpoint status:', dashboardResponse.status);
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('Dashboard data:', dashboardData);
    } else {
      const errorText = await dashboardResponse.text();
      console.log('Dashboard error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testServerHealth();
