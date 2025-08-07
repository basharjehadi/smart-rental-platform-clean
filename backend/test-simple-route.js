import express from 'express';
import { getTenantDashboardData } from './src/controllers/tenantDashboardController.js';

const app = express();
const PORT = 3002;

// Middleware
app.use(express.json());

// Test route without authentication
app.get('/test-dashboard', async (req, res) => {
  try {
    console.log('🔍 Test route called');
    
    // Mock request with user data
    const mockReq = {
      user: {
        id: 'cme02xa0n0000exg8cdequmk7'
      }
    };
    
    // Call the controller directly
    await getTenantDashboardData(mockReq, res);
    
  } catch (error) {
    console.error('❌ Test route error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`🔗 Test URL: http://localhost:${PORT}/test-dashboard`);
});

// Test the route
setTimeout(async () => {
  try {
    console.log('\n🔍 Testing the route...');
    const response = await fetch(`http://localhost:${PORT}/test-dashboard`);
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Route works!');
      console.log('Data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Route failed:', errorText);
    }
    
    // Stop the server
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}, 1000);
