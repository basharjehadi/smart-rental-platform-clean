/**
 * Clear Renewal Request Script
 * 
 * This script clears the pending renewal request that's showing in the UI
 */

import { prisma } from './src/utils/prisma.js';

async function clearRenewalRequest() {
  console.log('🧹 Clearing Pending Renewal Request');
  console.log('===================================');
  
  try {
    // Find the lease by offer ID
    const offerId = 'cmf5ygkwe000jexb8lekup0qr';
    console.log(`🔍 Looking for lease with offer ID: ${offerId}`);
    
    const lease = await prisma.lease.findFirst({
      where: { offerId: offerId }
    });
    
    if (!lease) {
      throw new Error('Lease not found');
    }
    
    console.log(`✅ Found lease: ${lease.id}`);
    console.log(`   Current Status: ${lease.status}`);
    console.log(`   Renewal Status: ${lease.renewalStatus}`);
    
    // Clear renewal requests for this lease
    console.log('\n🧹 Clearing renewal requests...');
    const deletedRenewals = await prisma.renewalRequest.deleteMany({
      where: { leaseId: lease.id }
    });
    
    console.log(`✅ Deleted ${deletedRenewals.count} renewal requests`);
    
    // Reset lease renewal status
    console.log('\n🔄 Resetting lease renewal status...');
    await prisma.lease.update({
      where: { id: lease.id },
      data: { 
        renewalStatus: 'NONE',
        renewalDeclinedAt: null,
        renewalDeclinedByUserId: null
      }
    });
    
    console.log('✅ Lease renewal status reset to NONE');
    
    // Also clear termination notice data if present
    console.log('\n🧹 Clearing termination notice data...');
    await prisma.lease.update({
      where: { id: lease.id },
      data: {
        terminationNoticeDate: null,
        terminationEffectiveDate: null,
        terminationReason: null,
        terminationNoticeByUserId: null
      }
    });
    
    console.log('✅ Termination notice data cleared');
    
    // Verify the reset
    const updatedLease = await prisma.lease.findUnique({
      where: { id: lease.id }
    });
    
    console.log('\n✅ Verification:');
    console.log(`   Lease Status: ${updatedLease.status}`);
    console.log(`   Renewal Status: ${updatedLease.renewalStatus}`);
    
    console.log('\n🎉 RENEWAL REQUEST CLEARED!');
    console.log('The "Renewal requested by tenant (pending)" should now be gone from the UI.');
    console.log('Refresh the landlord "My Tenants" page to see the change.');
    
  } catch (error) {
    console.error('\n❌ Clear failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the clear
clearRenewalRequest().catch(console.error);
