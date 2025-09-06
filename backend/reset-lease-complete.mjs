/**
 * Complete Lease Reset Script - FIXED VERSION
 * 
 * This script completely resets the lease lifecycle state to a fresh state
 * by deleting all renewal leases and restoring the original lease.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetLeaseComplete() {
  console.log('🔄 Complete Lease Lifecycle Reset - FIXED VERSION');
  console.log('================================================');
  
  try {
    const offerId = 'cmf6z2xlb000dexj067xb5096';
    console.log(`Looking for offer ID: ${offerId}`);
    
    // Get the offer data to know the original values
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        rentalRequest: {
          include: {
            leases: {
              orderBy: { createdAt: 'asc' } // Oldest first to find original
            }
          }
        }
      }
    });
    
    if (!offer) {
      console.log('❌ Offer not found');
      return;
    }
    
    console.log(`✅ Found offer: ${offer.id}`);
    console.log(`   Original Rent: ${offer.rentAmount}`);
    console.log(`   Original Duration: ${offer.leaseDuration} months`);
    console.log(`   Move In Date: ${offer.rentalRequest.moveInDate}`);
    
    // Find the original lease (should be the oldest one)
    const originalLease = offer.rentalRequest.leases[0];
    if (!originalLease) {
      console.log('❌ No original lease found');
      return;
    }
    
    console.log(`✅ Found original lease: ${originalLease.id}`);
    console.log(`   Original Status: ${originalLease.status}`);
    console.log(`   Original Start: ${originalLease.startDate}`);
    console.log(`   Original End: ${originalLease.endDate}`);
    console.log(`   Original Rent: ${originalLease.rentAmount}`);
    
    // Calculate original lease dates
    const moveInDate = new Date(offer.rentalRequest.moveInDate);
    const originalEndDate = new Date(moveInDate);
    originalEndDate.setMonth(originalEndDate.getMonth() + (offer.leaseDuration || 12));
    
    console.log(`   Calculated Original End: ${originalEndDate.toISOString()}`);
    
    // Step 1: Delete all renewal leases (keep only the original)
    console.log('\n🧹 Step 1: Deleting all renewal leases...');
    const renewalLeases = offer.rentalRequest.leases.slice(1); // Skip the first (original)
    console.log(`   Found ${renewalLeases.length} renewal leases to delete`);
    
    for (const lease of renewalLeases) {
      console.log(`   Deleting lease ${lease.id} (${lease.status})`);
      await prisma.lease.delete({ where: { id: lease.id } });
    }
    console.log('   ✅ All renewal leases deleted');
    
    // Step 2: Clear all renewal requests
    console.log('\n🧹 Step 2: Clearing renewal requests...');
    const deletedRenewals = await prisma.renewalRequest.deleteMany({
      where: { leaseId: originalLease.id }
    });
    console.log(`   ✅ Deleted ${deletedRenewals.count} renewal requests`);
    
    // Step 3: Reset the original lease to fresh state
    console.log('\n🔄 Step 3: Resetting original lease to fresh state...');
    await prisma.lease.update({
      where: { id: originalLease.id },
      data: {
        status: 'ACTIVE',
        startDate: moveInDate,
        endDate: originalEndDate,
        rentAmount: offer.rentAmount,
        renewalStatus: 'NONE',
        renewalDeclinedAt: null,
        renewalDeclinedByUserId: null,
        terminationNoticeDate: null,
        terminationEffectiveDate: null,
        terminationReason: null,
        terminationNoticeByUserId: null,
        updatedAt: new Date()
      }
    });
    console.log('   ✅ Original lease reset to fresh state');
    console.log(`   ✅ Start Date: ${moveInDate.toISOString()}`);
    console.log(`   ✅ End Date: ${originalEndDate.toISOString()}`);
    console.log(`   ✅ Rent Amount: ${offer.rentAmount}`);
    
    // Step 4: Verify the reset
    console.log('\n✅ Step 4: Verifying reset...');
    const updatedLease = await prisma.lease.findUnique({
      where: { id: originalLease.id }
    });
    
    console.log('\n📋 Final Lease State:');
    console.log(`   ID: ${updatedLease.id}`);
    console.log(`   Status: ${updatedLease.status}`);
    console.log(`   Start Date: ${updatedLease.startDate}`);
    console.log(`   End Date: ${updatedLease.endDate}`);
    console.log(`   Rent Amount: ${updatedLease.rentAmount}`);
    console.log(`   Renewal Status: ${updatedLease.renewalStatus}`);
    console.log(`   Termination Notice Date: ${updatedLease.terminationNoticeDate}`);
    
    // Check for any remaining renewal requests
    const remainingRenewals = await prisma.renewalRequest.findMany({
      where: { leaseId: originalLease.id }
    });
    
    console.log(`\n🔄 Remaining Renewal Requests: ${remainingRenewals.length}`);
    
    // Check for any remaining leases
    const remainingLeases = await prisma.lease.findMany({
      where: { offerId: offerId }
    });
    
    console.log(`\n🔄 Remaining Leases: ${remainingLeases.length}`);
    remainingLeases.forEach((lease, i) => {
      console.log(`   Lease ${i + 1}: ${lease.id} (${lease.status}) - ${lease.startDate} to ${lease.endDate}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 COMPLETE LEASE RESET SUCCESSFUL!');
    console.log('='.repeat(60));
    console.log('✅ All renewal leases deleted');
    console.log('✅ All renewal data cleared');
    console.log('✅ All termination data cleared');
    console.log('✅ Original lease restored with correct dates and rent');
    console.log('✅ System is ready for fresh testing');
    console.log('');
    console.log('📝 You can now test:');
    console.log('   1. Tenant dashboard should show original lease dates');
    console.log('   2. "Request Renewal" button should be visible');
    console.log('   3. Landlord "My Tenants" - "Propose Renewal" button should be visible');
    console.log('   4. Both sides - "End Lease" buttons should be visible');
    console.log('   5. No termination banners or progress bars should show');
    console.log('');
    console.log('🔄 Run this script again anytime to reset the state!');
    
  } catch (error) {
    console.error('\n❌ Reset failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

resetLeaseComplete().catch(console.error);
