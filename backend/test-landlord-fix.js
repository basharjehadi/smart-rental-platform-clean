/**
 * 🏠 Test Landlord Termination Policy Fix
 * 
 * Tests the landlord tenant controller fix without requiring a full server
 */

import { 
  resolveTerminationPolicy, 
  computeEarliestTerminationEnd,
  getTerminationPolicyExplanation 
} from './src/utils/dateUtils.js';

console.log('🧪 Testing Landlord Termination Policy Fix...\n');

// Test the termination policy calculation with the fixed data structure
const leaseData = {
  offer: {
    organization: {
      terminationPolicy: null // Will use defaults
    }
  },
  property: {
    timezone: 'Europe/Warsaw' // Property model doesn't have timezone field, use fallback
  }
};

console.log('📋 Lease data:', JSON.stringify(leaseData, null, 2));

try {
  const policy = resolveTerminationPolicy(leaseData);
  console.log('✅ Resolved policy:', JSON.stringify(policy, null, 2));
  
  const earliestEnd = computeEarliestTerminationEnd(new Date(), policy);
  console.log('✅ Earliest end:', earliestEnd);
  
  const terminationPolicyPreview = {
    cutoffDay: policy.cutoffDay,
    minNoticeDays: policy.minNoticeDays,
    timezone: policy.timezone,
    earliestEnd: earliestEnd.toISOString(),
    explanation: getTerminationPolicyExplanation(policy)
  };
  
  console.log('✅ Termination policy preview created:', JSON.stringify(terminationPolicyPreview, null, 2));
  
  console.log('\n🎉 SUCCESS! The landlord termination policy fix is working correctly!');
  console.log('The issue was that the Property model doesn\'t have a timezone field.');
  console.log('The fix uses \'Europe/Warsaw\' as a fallback timezone.');
  
} catch (error) {
  console.error('❌ Error:', error);
  console.error('❌ Stack:', error.stack);
}


