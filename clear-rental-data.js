const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearRentalData() {
  try {
    console.log('🗑️  Starting to clear rental data...');
    
    // Clear in order to respect foreign key constraints
    
    // 1. Clear payments first (they reference offers)
    console.log('💳 Clearing payments...');
    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`   Deleted ${deletedPayments.count} payments`);
    
    // 2. Clear rent payments
    console.log('💰 Clearing rent payments...');
    const deletedRentPayments = await prisma.rentPayment.deleteMany({});
    console.log(`   Deleted ${deletedRentPayments.count} rent payments`);
    
    // 3. Clear contracts
    console.log('📄 Clearing contracts...');
    const deletedContracts = await prisma.contract.deleteMany({});
    console.log(`   Deleted ${deletedContracts.count} contracts`);
    
    // 4. Clear rental requests
    console.log('🏠 Clearing rental requests...');
    const deletedRentalRequests = await prisma.rentalRequest.deleteMany({});
    console.log(`   Deleted ${deletedRentalRequests.count} rental requests`);
    
    // 5. Clear offers
    console.log('📋 Clearing offers...');
    const deletedOffers = await prisma.offer.deleteMany({});
    console.log(`   Deleted ${deletedOffers.count} offers`);
    
    // 6. Clear properties
    console.log('🏘️  Clearing properties...');
    const deletedProperties = await prisma.property.deleteMany({});
    console.log(`   Deleted ${deletedProperties.count} properties`);
    
    // 7. Clear landlord profiles
    console.log('👨‍💼 Clearing landlord profiles...');
    const deletedLandlordProfiles = await prisma.landlordProfile.deleteMany({});
    console.log(`   Deleted ${deletedLandlordProfiles.count} landlord profiles`);
    
    // 8. Clear request pool entries
    console.log('🏊 Clearing request pool...');
    const deletedRequestPool = await prisma.requestPool.deleteMany({});
    console.log(`   Deleted ${deletedRequestPool.count} request pool entries`);
    
    console.log('\n✅ All rental data cleared successfully!');
    console.log('📊 Summary:');
    console.log(`   - Payments: ${deletedPayments.count}`);
    console.log(`   - Rent Payments: ${deletedRentPayments.count}`);
    console.log(`   - Contracts: ${deletedContracts.count}`);
    console.log(`   - Rental Requests: ${deletedRentalRequests.count}`);
    console.log(`   - Offers: ${deletedOffers.count}`);
    console.log(`   - Properties: ${deletedProperties.count}`);
    console.log(`   - Landlord Profiles: ${deletedLandlordProfiles.count}`);
    console.log(`   - Request Pool: ${deletedRequestPool.count}`);
    
    console.log('\n💡 Users and their basic profiles are preserved.');
    console.log('🔄 You can now test the complete rental flow from scratch.');
    
  } catch (error) {
    console.error('❌ Error clearing rental data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearRentalData();

