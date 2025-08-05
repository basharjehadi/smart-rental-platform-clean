import express from 'express';
import axios from 'axios';

const app = express();

// Test route registration
app.use('/api/tenant-dashboard', (req, res, next) => {
  console.log('✅ tenant-dashboard route hit:', req.path);
  next();
});

app.use('/api/auth', (req, res, next) => {
  console.log('✅ auth route hit:', req.path);
  next();
});

// Test the actual route
app.get('/api/tenant-dashboard/dashboard', (req, res) => {
  console.log('✅ dashboard endpoint hit');
  res.json({ message: 'Dashboard endpoint working' });
});

app.get('/api/auth/login', (req, res) => {
  console.log('✅ login endpoint hit');
  res.json({ message: 'Login endpoint working' });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ 404 for:', req.originalUrl);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

app.listen(3002, () => {
  console.log('🚀 Test server running on port 3002');
  console.log('Testing routes...');
  
  // Test the routes
  const testRoutes = async () => {
    try {
      console.log('\n1. Testing auth route...');
      await axios.get('http://localhost:3002/api/auth/login');
      
      console.log('\n2. Testing dashboard route...');
      await axios.get('http://localhost:3002/api/tenant-dashboard/dashboard');
      
    } catch (error) {
      console.error('❌ Test failed:', error.response?.data || error.message);
    } finally {
      process.exit(0);
    }
  };
  
  testRoutes();
}); 