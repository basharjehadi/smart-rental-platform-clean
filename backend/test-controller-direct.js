import { getTenantDashboardData } from './src/controllers/tenantDashboardController.js';

async function testControllerDirect() {
  try {
    console.log('🔍 Testing controller directly...');
    
    // Mock request and response objects
    const mockReq = {
      user: {
        id: 'cme02xa0n0000exg8cdequmk7'
      }
    };
    
    const mockRes = {
      json: (data) => {
        console.log('✅ Controller response:', JSON.stringify(data, null, 2));
      },
      status: (code) => {
        console.log('📊 Response status:', code);
        return {
          json: (data) => {
            console.log('❌ Error response:', JSON.stringify(data, null, 2));
          }
        };
      }
    };
    
    // Call the controller directly
    await getTenantDashboardData(mockReq, mockRes);
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error stack:', error.stack);
  }
}

testControllerDirect();
