/**
 * Reset Lease Status Script - Database Direct
 * 
 * This script directly resets the database to bring back the lease status
 * to the current working state for testing.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetLeaseStatus() {
  console.log('🔄 Resetting Lease Status via Database');
  console.log('=====================================');
  
  try {
    // Find the lease by offer ID
    const offerId = 'cmf5ygkwe000jexb8lekup0qr';
    console.log(`🔍 Looking for lease with offer ID: ${offerId}`);
    
    const lease = await prisma.lease.findFirst({
      where: { offerId: offerId },
      include: {
        offer: true,
        property: true,
        tenantGroup: {
          include: {
            members: {
              where: { isPrimary: true },
              include: { user: true }
            }
          }
        }
      }
    });
    
    if (!lease) {
      throw new Error('Lease not found');
    }
    
    console.log('✅ Found lease:');
    console.log(`   Lease ID: ${lease.id}`);
    console.log(`   Current Status: ${lease.status}`);
    console.log(`   Property: ${lease.property.name}`);
    console.log(`   Tenant: ${lease.tenantGroup.members[0]?.user.name || 'Unknown'}`);
    
    // Reset lease status to ACTIVE
    console.log('\n🔄 Resetting lease status to ACTIVE...');
    await prisma.lease.update({
      where: { id: lease.id },
      data: { 
        status: 'ACTIVE',
        renewalStatus: 'NONE',
        renewalDeclinedAt: null,
        renewalDeclinedByUserId: null,
        terminationEffectiveDate: null,
        terminationNoticeByUserId: null,
        terminationNoticeDate: null,
        terminationReason: null
      }
    });
    console.log('✅ Lease status reset to ACTIVE');
    
    // Clear any renewal requests
    console.log('\n🧹 Clearing renewal requests...');
    const renewalRequests = await prisma.renewalRequest.findMany({
      where: { leaseId: lease.id }
    });
    
    if (renewalRequests.length > 0) {
      console.log(`   Found ${renewalRequests.length} renewal requests to delete`);
      await prisma.renewalRequest.deleteMany({
        where: { leaseId: lease.id }
      });
      console.log('✅ Renewal requests deleted');
    } else {
      console.log('   No renewal requests found');
    }
    
    // Clear any termination requests
    console.log('\n🧹 Clearing termination requests...');
    const terminationRequests = await prisma.terminationRequest.findMany({
      where: { leaseId: lease.id }
    });
    
    if (terminationRequests.length > 0) {
      console.log(`   Found ${terminationRequests.length} termination requests to delete`);
      await prisma.terminationRequest.deleteMany({
        where: { leaseId: lease.id }
      });
      console.log('✅ Termination requests deleted');
    } else {
      console.log('   No termination requests found');
    }
    
    // Ensure offer status is PAID
    console.log('\n🔄 Ensuring offer status is PAID...');
    await prisma.offer.update({
      where: { id: lease.offerId },
      data: { status: 'PAID' }
    });
    console.log('✅ Offer status set to PAID');
    
    // Ensure property status is RENTED
    console.log('\n🔄 Ensuring property status is RENTED...');
    await prisma.property.update({
      where: { id: lease.propertyId },
      data: { status: 'RENTED' }
    });
    console.log('✅ Property status set to RENTED');
    
    // Verify the reset
    console.log('\n✅ Verifying reset...');
    const updatedLease = await prisma.lease.findUnique({
      where: { id: lease.id },
      include: {
        offer: true,
        property: true,
        renewalRequests: true,
        terminationRequests: true
      }
    });
    
    console.log('✅ Reset verification:');
    console.log(`   Lease Status: ${updatedLease.status}`);
    console.log(`   Renewal Status: ${updatedLease.renewalStatus}`);
    console.log(`   Offer Status: ${updatedLease.offer.status}`);
    console.log(`   Property Status: ${updatedLease.property.status}`);
    console.log(`   Renewal Requests: ${updatedLease.renewalRequests.length}`);
    console.log(`   Termination Requests: ${updatedLease.terminationRequests.length}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 LEASE STATUS RESET COMPLETE!');
    console.log('='.repeat(60));
    console.log('✅ Lease is now ACTIVE and ready for testing');
    console.log('✅ All renewal requests cleared');
    console.log('✅ All termination requests cleared');
    console.log('✅ Offer status is PAID');
    console.log('✅ Property status is RENTED');
    console.log('');
    console.log('📝 You can now test:');
    console.log('   1. Go to tenant dashboard - click "Request Renewal"');
    console.log('   2. Go to landlord "My Tenants" - click "Propose Renewal"');
    console.log('   3. Test renewal workflow (request → proposal → acceptance)');
    console.log('   4. Test termination workflow (both tenant and landlord)');
    console.log('   5. Test termination policy calculations');
    console.log('');
    console.log('🔄 Run this script again anytime to reset the state!');
    
  } catch (error) {
    console.error('\n❌ Reset failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset
resetLeaseStatus().catch(console.error);


