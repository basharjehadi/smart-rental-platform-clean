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
import landlordTenantRoutes from './landlordTenantRoutes.js';
import messagingRoutes from './messaging.js';
import notificationRoutes from './notifications.js';
import systemRoutes from './systemRoutes.js';
import supportRoutes from './supportRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import moveInVerificationRoutes from './moveInVerificationRoutes.js';
import moveInIssueRoutes from './moveInIssueRoutes.js';
import leaseRoutes from './leaseRoutes.js';
import renewalRoutes from './renewalRoutes.js';
import organizationRoutes from './organizationRoutes.js';
import tenantGroupRoutes from './tenantGroupRoutes.js';

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
router.use('/payments', paymentRoutes);

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

// Landlord tenant management routes
router.use('/landlord', landlordTenantRoutes);

// Organization management routes
router.use('/organizations', organizationRoutes);

// Tenant group management routes
router.use('/tenant-groups', tenantGroupRoutes);

// Messaging routes
router.use('/messaging', messagingRoutes);

// Notification routes
router.use('/notifications', notificationRoutes);

// System status and health routes
router.use('/system', systemRoutes);

// Support routes
router.use('/support', supportRoutes);

// Review routes
router.use('/reviews', reviewRoutes);

// Move-in verification routes
router.use('/move-in', moveInVerificationRoutes);

// Move-in issue routes
router.use('/move-in-issues', moveInIssueRoutes);

// Lease lifecycle routes
router.use('/leases', leaseRoutes);

// Renewal routes
router.use('/', renewalRoutes);

export default router;
