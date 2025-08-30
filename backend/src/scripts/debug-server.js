import express from 'express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('🔍 Testing route imports...');

try {
  console.log('1. Testing authRoutes import...');
  const authRoutes = await import('./src/routes/authRoutes.js');
  console.log('✅ authRoutes imported successfully');

  console.log('2. Testing tenantDashboardRoutes import...');
  const tenantDashboardRoutes = await import(
    './src/routes/tenantDashboardRoutes.js'
  );
  console.log('✅ tenantDashboardRoutes imported successfully');

  console.log('3. Registering routes...');
  app.use('/api/auth', authRoutes.default);
  app.use('/api/tenant-dashboard', tenantDashboardRoutes.default);
  console.log('✅ Routes registered successfully');

  // Test route
  app.get('/test', (req, res) => {
    res.json({ message: 'Test route working' });
  });

  console.log('4. Starting server...');
  app.listen(PORT, () => {
    console.log(`🚀 Debug server running on port ${PORT}`);
    console.log('✅ Server started successfully');
  });
} catch (error) {
  console.error('❌ Error during startup:', error);
  console.error('Error details:', error.message);
  console.error('Stack trace:', error.stack);
}
