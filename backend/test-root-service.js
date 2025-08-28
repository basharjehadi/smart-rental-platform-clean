import requestPoolService from '../services/requestPoolService.js';

console.log('🔍 Checking available methods in root service...');
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
console.log('createMatches:', typeof requestPoolService.createMatches);
console.log('findBestMatchingProperty:', typeof requestPoolService.findBestMatchingProperty);

// Try to call a method
try {
  console.log('\n🧪 Testing method call...');
  const result = await requestPoolService.addToPool({ 
    id: 'test',
    moveInDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
  });
  console.log('✅ Method call successful');
} catch (error) {
  console.log('❌ Method call failed:', error.message);
}
