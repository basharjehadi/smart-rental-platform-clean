import dotenv from 'dotenv';
import cron from 'node-cron';
import { createServer } from 'http';
import app from './app.js';
import { prisma } from './utils/prisma.js';
import { dailyRentCheck } from './controllers/cronController.js';
import { startContractMonitoring, stopContractMonitoring } from './controllers/contractController.js';
import { logger } from './utils/logger.js';
import { initializeSocket } from './socket/socketServer.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;

// Debug environment variables
logger.info('Environment variables loaded:', {
  JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET'
});

// Initialize cron jobs
const initializeCronJobs = () => {
  // Daily rent check - runs at 9:00 AM every day
  cron.schedule('0 9 * * *', async () => {
    logger.info('🕐 Running daily rent check cron job...');
    try {
      await dailyRentCheck();
      logger.info('✅ Daily rent check completed successfully');
    } catch (error) {
      logger.error('❌ Daily rent check failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "Europe/Warsaw"
  });

  logger.info('⏰ Cron jobs initialized:');
  logger.info('   Daily rent check: 9:00 AM (Europe/Warsaw)');
};

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // Initialize cron jobs
    initializeCronJobs();

    // Start contract generation scheduler
    startContractMonitoring();

    // Create HTTP server
    const server = createServer(app);

    // Initialize Socket.io
    const io = initializeSocket(server);
    logger.info('🔌 Socket.io initialized');

    // Connect Socket.io to notification service
    const { setSocketIO } = await import('./services/notificationService.js');
    setSocketIO(io);
    logger.info('🔔 Socket.io connected to notification service');

    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      logger.info(`🔐 Social Auth URLs:`);
      logger.info(`   Google: http://localhost:${PORT}/api/auth/google`);
      logger.info(`   Facebook: http://localhost:${PORT}/api/auth/facebook`);
      logger.info(`💬 WebSocket server ready for real-time messaging`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`\n🛑 Received ${signal}. Shutting down server...`);
  
  try {
    stopContractMonitoring();
    await prisma.$disconnect();
    logger.info('✅ Server shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle different shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer(); 