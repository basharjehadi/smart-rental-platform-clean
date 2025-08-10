import { prisma } from '../utils/prisma.js';
import requestPoolService from '../services/requestPoolService.js';
import propertyAvailabilityService from '../services/propertyAvailabilityService.js';

// 🚀 SCALABILITY: System health check and status endpoint
export const getSystemStatus = async (req, res) => {
  try {
    console.log('🔍 Performing comprehensive system health check...');
    
    const status = {
      timestamp: new Date().toISOString(),
      system: 'Smart Rental System',
      version: '2.0.0',
      status: 'OPERATIONAL',
      checks: {}
    };

    // Database connectivity check
    try {
      await prisma.$queryRaw`SELECT 1`;
      status.checks.database = { status: 'HEALTHY', message: 'Database connection successful' };
    } catch (error) {
      status.checks.database = { status: 'UNHEALTHY', message: 'Database connection failed', error: error.message };
      status.status = 'DEGRADED';
    }

    // Request pool status
    try {
      const poolStats = await requestPoolService.getPoolStats();
      status.checks.requestPool = { 
        status: 'HEALTHY', 
        message: 'Request pool operational',
        stats: poolStats
      };
    } catch (error) {
      status.checks.requestPool = { status: 'UNHEALTHY', message: 'Request pool error', error: error.message };
      status.status = 'DEGRADED';
    }

    // Property availability service
    try {
      const availabilitySummary = await propertyAvailabilityService.getAvailabilitySummary();
      status.checks.propertyAvailability = { 
        status: 'HEALTHY', 
        message: 'Property availability service operational',
        summary: availabilitySummary
      };
    } catch (error) {
      status.checks.propertyAvailability = { status: 'UNHEALTHY', message: 'Property availability service error', error: error.message };
      status.status = 'DEGRADED';
    }

    // Active rental requests count
    try {
      const activeRequestsCount = await prisma.rentalRequest.count({
        where: { poolStatus: 'ACTIVE' }
      });
      status.checks.activeRequests = { 
        status: 'HEALTHY', 
        message: 'Active requests count retrieved',
        count: activeRequestsCount
      };
    } catch (error) {
      status.checks.activeRequests = { status: 'UNHEALTHY', message: 'Active requests count error', error: error.message };
      status.status = 'DEGRADED';
    }

    // Available properties count
    try {
      const availablePropertiesCount = await prisma.property.count({
        where: { 
          status: 'AVAILABLE',
          availability: true
        }
      });
      status.checks.availableProperties = { 
        status: 'HEALTHY', 
        message: 'Available properties count retrieved',
        count: availablePropertiesCount
      };
    } catch (error) {
      status.checks.availableProperties = { status: 'UNHEALTHY', message: 'Available properties count error', error: error.message };
      status.status = 'DEGRADED';
    }

    // Pending offers count
    try {
      const pendingOffersCount = await prisma.offer.count({
        where: { status: 'PENDING' }
      });
      status.checks.pendingOffers = { 
        status: 'HEALTHY', 
        message: 'Pending offers count retrieved',
        count: pendingOffersCount
      };
    } catch (error) {
      status.checks.pendingOffers = { status: 'UNHEALTHY', message: 'Pending offers count error', error: error.message };
      status.status = 'DEGRADED';
    }

    // Landlord-request matches count
    try {
      const activeMatchesCount = await prisma.landlordRequestMatch.count({
        where: { status: 'ACTIVE' }
      });
      status.checks.activeMatches = { 
        status: 'HEALTHY', 
        message: 'Active matches count retrieved',
        count: activeMatchesCount
      };
    } catch (error) {
      status.checks.activeMatches = { status: 'UNHEALTHY', message: 'Active matches count error', error: error.message };
      status.status = 'DEGRADED';
    }

    // System performance metrics
    try {
      const performanceMetrics = await getPerformanceMetrics();
      status.checks.performance = { 
        status: 'HEALTHY', 
        message: 'Performance metrics retrieved',
        metrics: performanceMetrics
      };
    } catch (error) {
      status.checks.performance = { status: 'UNHEALTHY', message: 'Performance metrics error', error: error.message };
      status.status = 'DEGRADED';
    }

    // Overall system assessment
    const unhealthyChecks = Object.values(status.checks).filter(check => check.status === 'UNHEALTHY').length;
    if (unhealthyChecks === 0) {
      status.status = 'OPERATIONAL';
      status.message = 'All systems operational';
    } else if (unhealthyChecks <= 2) {
      status.status = 'DEGRADED';
      status.message = `${unhealthyChecks} system(s) experiencing issues`;
    } else {
      status.status = 'CRITICAL';
      status.message = 'Multiple systems experiencing critical issues';
    }

    console.log(`✅ System status check completed: ${status.status}`);
    res.json(status);

  } catch (error) {
    console.error('❌ System status check failed:', error);
    res.status(500).json({
      timestamp: new Date().toISOString(),
      system: 'Smart Rental System',
      status: 'ERROR',
      message: 'System status check failed',
      error: error.message
    });
  }
};

// 🚀 SCALABILITY: Get detailed performance metrics
const getPerformanceMetrics = async () => {
  try {
    const metrics = {};

    // Request processing metrics
    const totalRequests = await prisma.rentalRequest.count();
    const activeRequests = await prisma.rentalRequest.count({ where: { poolStatus: 'ACTIVE' } });
    const expiredRequests = await prisma.rentalRequest.count({ where: { poolStatus: 'EXPIRED' } });
    const matchedRequests = await prisma.rentalRequest.count({ where: { poolStatus: 'MATCHED' } });

    metrics.requests = {
      total: totalRequests,
      active: activeRequests,
      expired: expiredRequests,
      matched: matchedRequests,
      successRate: totalRequests > 0 ? ((matchedRequests / totalRequests) * 100).toFixed(2) : 0
    };

    // Property utilization metrics
    const totalProperties = await prisma.property.count();
    const availableProperties = await prisma.property.count({ where: { availability: true } });
    const occupiedProperties = await prisma.property.count({ where: { availability: false } });

    metrics.properties = {
      total: totalProperties,
      available: availableProperties,
      occupied: occupiedProperties,
      utilizationRate: totalProperties > 0 ? ((occupiedProperties / totalProperties) * 100).toFixed(2) : 0
    };

    // Offer conversion metrics
    const totalOffers = await prisma.offer.count();
    const pendingOffers = await prisma.offer.count({ where: { status: 'PENDING' } });
    const acceptedOffers = await prisma.offer.count({ where: { status: 'ACCEPTED' } });
    const paidOffers = await prisma.offer.count({ where: { status: 'PAID' } });
    const rejectedOffers = await prisma.offer.count({ where: { status: 'REJECTED' } });

    metrics.offers = {
      total: totalOffers,
      pending: pendingOffers,
      accepted: acceptedOffers,
      paid: paidOffers,
      rejected: rejectedOffers,
      acceptanceRate: totalOffers > 0 ? ((acceptedOffers / totalOffers) * 100).toFixed(2) : 0,
      conversionRate: totalOffers > 0 ? ((paidOffers / totalOffers) * 100).toFixed(2) : 0
    };

    // Matching efficiency metrics
    const totalMatches = await prisma.landlordRequestMatch.count();
    const activeMatches = await prisma.landlordRequestMatch.count({ where: { status: 'ACTIVE' } });
    const respondedMatches = await prisma.landlordRequestMatch.count({ where: { isResponded: true } });

    metrics.matching = {
      total: totalMatches,
      active: activeMatches,
      responded: respondedMatches,
      responseRate: totalMatches > 0 ? ((respondedMatches / totalMatches) * 100).toFixed(2) : 0
    };

    // Recent activity (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentRequests = await prisma.rentalRequest.count({
      where: { createdAt: { gte: yesterday } }
    });
    
    const recentOffers = await prisma.offer.count({
      where: { createdAt: { gte: yesterday } }
    });

    metrics.recentActivity = {
      requestsLast24h: recentRequests,
      offersLast24h: recentOffers
    };

    return metrics;

  } catch (error) {
    console.error('❌ Error getting performance metrics:', error);
    throw error;
  }
};

// 🚀 SCALABILITY: Get system configuration and settings
export const getSystemConfig = async (req, res) => {
  try {
    const config = {
      system: {
        name: 'Smart Rental System',
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        timezone: 'Europe/Warsaw'
      },
      features: {
        requestPool: {
          enabled: true,
          delayBeforeMatching: '5 minutes',
          continuousMatching: 'Every 5 minutes',
          expirationBuffer: '3 days before move-in date'
        },
        propertyAvailability: {
          enabled: true,
          automaticOnListing: true,
          automaticOnBooking: true
        },
        matching: {
          enabled: true,
          scoringAlgorithm: 'Multi-factor weighted scoring',
          criteria: ['Budget', 'Location', 'Property Type', 'Features', 'Dates']
        },
        offers: {
          enabled: true,
          multiplePerProperty: true,
          firstToPayWins: true
        },
        notifications: {
          enabled: true,
          expirationWarnings: true,
          rejectionNotifications: true
        }
      },
      limits: {
        maxRequestsPerTenant: 'Unlimited',
        maxOffersPerRequest: 'Unlimited',
        maxPropertiesPerLandlord: 'Unlimited',
        requestExpiration: 'Dynamic (move-in date - 3 days)'
      },
      cronJobs: {
        continuousRequestMatching: '*/5 * * * *',
        dailyCleanup: '0 2 * * *',
        dailyRentCheck: '0 9 * * *',
        weeklyAnalytics: '0 3 * * 0',
        monthlyCleanup: '0 1 1 * *'
      }
    };

    res.json(config);

  } catch (error) {
    console.error('❌ Error getting system config:', error);
    res.status(500).json({
      error: 'Failed to retrieve system configuration',
      message: error.message
    });
  }
};

// 🚀 SCALABILITY: Test system functionality
export const testSystemFunctionality = async (req, res) => {
  try {
    console.log('🧪 Testing system functionality...');
    
    const tests = {};

    // Test 1: Database operations
    try {
      const testUser = await prisma.user.findFirst({ select: { id: true } });
      tests.database = { status: 'PASSED', message: 'Database operations working' };
    } catch (error) {
      tests.database = { status: 'FAILED', message: 'Database operations failed', error: error.message };
    }

    // Test 2: Request pool service
    try {
      const poolStats = await requestPoolService.getPoolStats();
      tests.requestPool = { status: 'PASSED', message: 'Request pool service working', stats: poolStats };
    } catch (error) {
      tests.requestPool = { status: 'FAILED', message: 'Request pool service failed', error: error.message };
    }

    // Test 3: Property availability service
    try {
      const availabilitySummary = await propertyAvailabilityService.getAvailabilitySummary();
      tests.propertyAvailability = { status: 'PASSED', message: 'Property availability service working', summary: availabilitySummary };
    } catch (error) {
      tests.propertyAvailability = { status: 'FAILED', message: 'Property availability service failed', error: error.message };
    }

    // Test 4: Prisma schema validation
    try {
      await prisma.$queryRaw`SELECT 1 FROM "User" LIMIT 1`;
      await prisma.$queryRaw`SELECT 1 FROM "Property" LIMIT 1`;
      await prisma.$queryRaw`SELECT 1 FROM "RentalRequest" LIMIT 1`;
      await prisma.$queryRaw`SELECT 1 FROM "Offer" LIMIT 1`;
      await prisma.$queryRaw`SELECT 1 FROM "LandlordRequestMatch" LIMIT 1`;
      tests.schema = { status: 'PASSED', message: 'Database schema validation passed' };
    } catch (error) {
      tests.schema = { status: 'FAILED', message: 'Database schema validation failed', error: error.message };
    }

    // Overall test result
    const passedTests = Object.values(tests).filter(test => test.status === 'PASSED').length;
    const totalTests = Object.keys(tests).length;
    const allPassed = passedTests === totalTests;

    const result = {
      timestamp: new Date().toISOString(),
      system: 'Smart Rental System',
      testResult: allPassed ? 'ALL_TESTS_PASSED' : 'SOME_TESTS_FAILED',
      summary: `${passedTests}/${totalTests} tests passed`,
      tests,
      recommendations: allPassed ? [] : [
        'Check database connectivity',
        'Verify service configurations',
        'Review error logs for specific failures'
      ]
    };

    console.log(`✅ System functionality test completed: ${result.testResult}`);
    res.json(result);

  } catch (error) {
    console.error('❌ System functionality test failed:', error);
    res.status(500).json({
      timestamp: new Date().toISOString(),
      system: 'Smart Rental System',
      testResult: 'TEST_FAILED',
      error: 'System functionality test failed',
      message: error.message
    });
  }
};
