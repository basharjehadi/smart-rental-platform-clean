import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

async function testDashboardData() {
  try {
    console.log('🔍 Testing dashboard data...\n');

    // Step 1: Login to get token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'tenant@test.com',
      password: 'password123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Step 2: Get dashboard data
    console.log('\n2. Fetching dashboard data...');
    const dashboardResponse = await axios.get(`${API_BASE_URL}/tenant-dashboard/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = dashboardResponse.data;
    console.log('✅ Dashboard data received');
    
    // Step 3: Analyze the data
    console.log('\n3. Analyzing dashboard data:');
    console.log('Has active lease:', data.hasActiveLease);
    
    if (data.hasActiveLease) {
      console.log('\nProperty Details:');
      console.log('- Address:', data.property?.address);
      console.log('- Rooms:', data.property?.rooms);
      console.log('- Bathrooms:', data.property?.bathrooms);
      console.log('- Area:', data.property?.area);
      console.log('- Lease Term:', data.property?.leaseTerm);
      console.log('- Amenities:', data.property?.amenities);
      
      console.log('\nLandlord Details:');
      console.log('- Name:', data.landlord?.name);
      console.log('- Company:', data.landlord?.company);
      console.log('- Email:', data.landlord?.email);
      console.log('- Phone:', data.landlord?.phone);
      console.log('- Address:', data.landlord?.address);
      
      console.log('\nLease Details:');
      console.log('- Start Date:', data.lease?.startDate);
      console.log('- End Date:', data.lease?.endDate);
      console.log('- Monthly Rent:', data.lease?.monthlyRent);
      console.log('- Security Deposit:', data.lease?.securityDeposit);
    } else {
      console.log('\nNo active lease found - showing empty state');
    }
    
    console.log('\nPayment History:');
    console.log('- Number of payments:', data.payments?.length);
    if (data.payments?.length > 0) {
      data.payments.forEach((payment, index) => {
        console.log(`  ${index + 1}. ${payment.month} - ${payment.amount} - ${payment.status}`);
      });
    }
    
    console.log('\nAccount Status:');
    console.log('- Payment History:', data.accountStatus?.paymentHistory);
    console.log('- Lease Compliance:', data.accountStatus?.leaseCompliance);
    console.log('- Communication:', data.accountStatus?.communication);
    
    console.log('\nUpcoming Actions:');
    data.upcomingActions?.forEach((action, index) => {
      console.log(`  ${index + 1}. ${action}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testDashboardData(); 