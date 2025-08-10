import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cron from 'node-cron';
import session from 'express-session';
import passport from './config/passport.js';
import pingRoutes from './routes/ping.js';
import authRoutes from './routes/authRoutes.js';
import socialAuthRoutes from './routes/socialAuthRoutes.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import propertyUploadRoutes from './routes/propertyUploadRoutes.js';
import rentalRoutes from './routes/rentalRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import contractRoutes from './routes/contractRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import landlordProfileRoutes from './routes/landlordProfileRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import prisma from './lib/prisma.js';
import { dailyRentCheck } from './controllers/cronController.js';
import { startContractMonitoring, stopContractMonitoring } from './controllers/contractController.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

// Load environment variables
dotenv.config();

// Debug environment variables
console.log('Environment variables loaded:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Session middleware (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads) with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static('uploads'));

// Serve profile images specifically
app.use('/uploads/profile_images', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static('uploads/profile_images'));

// Serve property images specifically
app.use('/uploads/property_images', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static('uploads/property_images'));

// Serve property videos specifically
app.use('/uploads/property_videos', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static('uploads/property_videos'));

// Serve identity documents specifically
app.use('/uploads/identity_documents', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static('uploads/identity_documents'));

// Serve rules files specifically
app.use('/uploads/rules', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static('uploads/rules'));

// Serve contract PDFs specifically
app.use('/uploads/contracts', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static('uploads/contracts'));

// Special handling for Stripe webhooks (raw body)
app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }));

// Routes
app.use('/api', pingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', socialAuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/property-upload', propertyUploadRoutes);
app.use('/api', rentalRoutes);
app.use('/api', paymentRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/landlord-profile', landlordProfileRoutes);
app.use('/api', propertyRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Initialize cron jobs
const initializeCronJobs = () => {
  // Daily rent check - runs at 9:00 AM every day
  cron.schedule('0 9 * * *', async () => {
    console.log('🕐 Running daily rent check cron job...');
    await dailyRentCheck();
  }, {
    scheduled: true,
    timezone: "Europe/Warsaw"
  });

  // 🚀 SCALABILITY: Continuous request matching - runs every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('🔄 Running continuous request matching cron job...');
    try {
      const { continuousRequestMatching } = await import('./controllers/cronController.js');
      await continuousRequestMatching();
      console.log('✅ Continuous request matching completed');
    } catch (error) {
      console.error('❌ Continuous request matching failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "Europe/Warsaw"
  });

  console.log('⏰ Cron jobs initialized:');
  console.log('   Daily rent check: 9:00 AM (Europe/Warsaw)');
  console.log('   Continuous request matching: Every 5 minutes');
};

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Initialize cron jobs
    initializeCronJobs();

    // Start contract generation scheduler
    startContractMonitoring();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`🔐 Social Auth URLs:`);
      console.log(`   Google: http://localhost:${PORT}/api/auth/google`);
      console.log(`   Facebook: http://localhost:${PORT}/api/auth/facebook`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  stopContractMonitoring();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  stopContractMonitoring();
  await prisma.$disconnect();
  process.exit(0);
});

startServer(); 