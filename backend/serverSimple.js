import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import prisma from './src/utils/prisma.js';
import { errorHandler, notFoundHandler } from './src/middlewares/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3002', 'http://localhost:5173'],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static('uploads'));

// Basic health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', database: 'disconnected' });
  }
});

// Import and use routes
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import propertyRoutes from './src/routes/propertyRoutes.js';
import rentalRoutes from './src/routes/rentalRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import messagingRoutes from './src/routes/messaging.js';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', propertyRoutes);
app.use('/api', rentalRoutes);
app.use('/api', paymentRoutes);
app.use('/api/messaging', messagingRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
