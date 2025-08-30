import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Current directory:', __dirname);
console.log(
  '🔍 Target file:',
  join(__dirname, 'src', 'services', 'requestPoolService.js')
);

// Try to import the service
try {
  const requestPoolService = await import(
    './src/services/requestPoolService.js'
  );
  console.log('✅ Import successful');
  console.log('Service type:', typeof requestPoolService.default);

  if (requestPoolService.default) {
    const service = requestPoolService.default;
    console.log(
      'Available methods:',
      Object.getOwnPropertyNames(Object.getPrototypeOf(service))
    );

    // Check specific methods
    console.log(
      'findMatchingOrganizationsByProperties:',
      typeof service.findMatchingOrganizationsByProperties
    );
    console.log(
      'getRequestsForLandlordUser:',
      typeof service.getRequestsForLandlordUser
    );
    console.log('markAsViewedForOrg:', typeof service.markAsViewedForOrg);
  }
} catch (error) {
  console.error('❌ Import failed:', error.message);
}
