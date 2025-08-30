/**
 * Database configuration
 */
export const databaseConfig = {
  url: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10,
  },
  logging: process.env.NODE_ENV === 'development',
};

/**
 * Redis configuration
 */
export const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
};
