import requestPoolService from './src/services/requestPoolService.js';

console.log('🔍 Checking available methods...');
console.log('Service type:', typeof requestPoolService);
console.log('Service constructor:', requestPoolService.constructor.name);

// Get all method names
const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(requestPoolService));
console.log('\n📋 Available methods:');
methodNames.forEach(method => {
  console.log(`  - ${method}`);
});

// Check specific methods
console.log('\n🔍 Checking specific methods:');
console.log('addToPool:', typeof requestPoolService.addToPool);
console.log('findMatchingOrganizationsByProperties:', typeof requestPoolService.findMatchingOrganizationsByProperties);
console.log('getRequestsForLandlordUser:', typeof requestPoolService.getRequestsForLandlordUser);
console.log('markAsViewedForOrg:', typeof requestPoolService.markAsViewedForOrg);

// Try to call a method
try {
  console.log('\n🧪 Testing method call...');
  const result = await requestPoolService.addToPool({ id: 'test' });
  console.log('✅ Method call successful');
} catch (error) {
  console.log('❌ Method call failed:', error.message);
}
