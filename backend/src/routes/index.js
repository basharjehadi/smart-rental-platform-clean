import { Router } from 'express';
import pingRoutes from './ping.js';
import authRoutes from './authRoutes.js';
import socialAuthRoutes from './socialAuthRoutes.js';
import userRoutes from './userRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import propertyUploadRoutes from './propertyUploadRoutes.js';
import rentalRoutes from './rentalRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import contractRoutes from './contractRoutes.js';
import adminRoutes from './adminRoutes.js';
import landlordProfileRoutes from './landlordProfileRoutes.js';
import propertyRoutes from './propertyRoutes.js';
import tenantDashboardRoutes from './tenantDashboardRoutes.js';
import landlordDashboardRoutes from './landlordDashboardRoutes.js';

const router = Router();

// Health and ping routes
router.use('/', pingRoutes);

// Authentication routes
router.use('/auth', authRoutes);
router.use('/auth', socialAuthRoutes);

// User management routes
router.use('/users', userRoutes);

// File upload routes
router.use('/upload', uploadRoutes);
router.use('/property-upload', propertyUploadRoutes);

// Property management routes
router.use('/properties', propertyRoutes);

// Rental management routes
router.use('/', rentalRoutes);

// Payment routes
router.use('/', paymentRoutes);

// Contract routes
router.use('/contracts', contractRoutes);

// Admin routes
router.use('/admin', adminRoutes);

// Landlord profile routes
router.use('/landlord-profile', landlordProfileRoutes);

// Tenant dashboard routes
router.use('/tenant-dashboard', tenantDashboardRoutes);

// Landlord dashboard routes
router.use('/landlord', landlordDashboardRoutes);

export default router; 