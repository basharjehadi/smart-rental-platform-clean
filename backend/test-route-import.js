import express from 'express';

const app = express();

// Test importing the route
console.log('🔍 Testing route import...');

try {
  const tenantDashboardRoutes = await import('./src/routes/tenantDashboardRoutes.js');
  console.log('✅ tenantDashboardRoutes imported successfully');
  console.log('Routes object:', tenantDashboardRoutes);
  console.log('Default export:', tenantDashboardRoutes.default);
  
  // Register the route
  app.use('/api/tenant-dashboard', tenantDashboardRoutes.default);
  console.log('✅ Route registered successfully');
  
  // Test route
  app.get('/test', (req, res) => {
    res.json({ message: 'Test route working' });
  });
  
  // Start server
  app.listen(3002, () => {
    console.log('🚀 Test server running on port 3002');
    console.log('✅ Server started successfully');
  });
  
} catch (error) {
  console.error('❌ Error importing route:', error);
  console.error('Error details:', error.message);
  console.error('Stack trace:', error.stack);
} 