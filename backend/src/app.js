import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from './config/passport.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import routes from './routes/index.js';
import { setupStaticFiles } from './utils/staticFiles.js';

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Special handling for Stripe webhooks (raw body)
app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }));

// Setup static file serving
setupStaticFiles(app);

// API Routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const { prisma } = await import('./utils/prisma.js');
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      version: process.env.npm_package_version || '1.0.0'
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

// Global error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app; 