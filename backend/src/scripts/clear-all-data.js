import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllData() {
  try {
    console.log('🗑️  Starting to clear all data except users...');

    // Clear in order to respect foreign key constraints

    // 1. Clear notifications
    console.log('🔔 Clearing notifications...');
    const deletedNotifications = await prisma.notification.deleteMany({});
    console.log(`   Deleted ${deletedNotifications.count} notifications`);

    // 2. Clear payments first (they reference offers)
    console.log('💳 Clearing payments...');
    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`   Deleted ${deletedPayments.count} payments`);

    // 3. Clear rent payments
    console.log('💰 Clearing rent payments...');
    const deletedRentPayments = await prisma.rentPayment.deleteMany({});
    console.log(`   Deleted ${deletedRentPayments.count} rent payments`);

    // 4. Clear contracts
    console.log('📄 Clearing contracts...');
    const deletedContracts = await prisma.contract.deleteMany({});
    console.log(`   Deleted ${deletedContracts.count} contracts`);

    // 5. Clear contract signatures
    console.log('✍️  Clearing contract signatures...');
    const deletedSignatures = await prisma.contractSignature.deleteMany({});
    console.log(`   Deleted ${deletedSignatures.count} contract signatures`);

    // 6. Clear offers
    console.log('📋 Clearing offers...');
    const deletedOffers = await prisma.offer.deleteMany({});
    console.log(`   Deleted ${deletedOffers.count} offers`);

    // 7. Clear landlord request matches
    console.log('🔗 Clearing landlord request matches...');
    const deletedMatches = await prisma.landlordRequestMatch.deleteMany({});
    console.log(`   Deleted ${deletedMatches.count} matches`);

    // 8. Clear rental requests
    console.log('🏠 Clearing rental requests...');
    const deletedRentalRequests = await prisma.rentalRequest.deleteMany({});
    console.log(`   Deleted ${deletedRentalRequests.count} rental requests`);

    // 9. Clear properties
    console.log('🏘️  Clearing properties...');
    const deletedProperties = await prisma.property.deleteMany({});
    console.log(`   Deleted ${deletedProperties.count} properties`);

    // 10. Clear landlord profiles
    console.log('👨‍💼 Clearing landlord profiles...');
    const deletedLandlordProfiles = await prisma.landlordProfile.deleteMany({});
    console.log(
      `   Deleted ${deletedLandlordProfiles.count} landlord profiles`
    );

    // 11. Clear request pool analytics
    console.log('📊 Clearing request pool analytics...');
    const deletedAnalytics = await prisma.requestPoolAnalytics.deleteMany({});
    console.log(`   Deleted ${deletedAnalytics.count} analytics entries`);

    // 12. Clear reviews
    console.log('⭐ Clearing reviews...');
    const deletedReviews = await prisma.review.deleteMany({});
    console.log(`   Deleted ${deletedReviews.count} reviews`);

    // 13. Clear maintenance requests
    console.log('🔧 Clearing maintenance requests...');
    const deletedMaintenance = await prisma.maintenanceRequest.deleteMany({});
    console.log(`   Deleted ${deletedMaintenance.count} maintenance requests`);

    // 14. Clear conversations
    console.log('💬 Clearing conversations...');
    const deletedConversations = await prisma.conversation.deleteMany({});
    console.log(`   Deleted ${deletedConversations.count} conversations`);

    // 15. Clear messages
    console.log('📱 Clearing messages...');
    const deletedMessages = await prisma.message.deleteMany({});
    console.log(`   Deleted ${deletedMessages.count} messages`);

    // 16. Clear chat sessions
    console.log('💭 Clearing chat sessions...');
    const deletedChatSessions = await prisma.chatSession.deleteMany({});
    console.log(`   Deleted ${deletedChatSessions.count} chat sessions`);

    // 17. Clear chat messages
    console.log('💬 Clearing chat messages...');
    const deletedChatMessages = await prisma.chatMessage.deleteMany({});
    console.log(`   Deleted ${deletedChatMessages.count} chat messages`);

    // 18. Clear units
    console.log('🏢 Clearing units...');
    const deletedUnits = await prisma.unit.deleteMany({});
    console.log(`   Deleted ${deletedUnits.count} units`);

    // 19. Clear leases
    console.log('📋 Clearing leases...');
    const deletedLeases = await prisma.lease.deleteMany({});
    console.log(`   Deleted ${deletedLeases.count} leases`);

    console.log('\n✅ All data cleared successfully!');
    console.log('📊 Summary:');
    console.log(`   - Notifications: ${deletedNotifications.count}`);
    console.log(`   - Payments: ${deletedPayments.count}`);
    console.log(`   - Rent Payments: ${deletedRentPayments.count}`);
    console.log(`   - Contracts: ${deletedContracts.count}`);
    console.log(`   - Contract Signatures: ${deletedSignatures.count}`);
    console.log(`   - Offers: ${deletedOffers.count}`);
    console.log(`   - Landlord Request Matches: ${deletedMatches.count}`);
    console.log(`   - Rental Requests: ${deletedRentalRequests.count}`);
    console.log(`   - Properties: ${deletedProperties.count}`);
    console.log(`   - Landlord Profiles: ${deletedLandlordProfiles.count}`);
    console.log(`   - Request Pool Analytics: ${deletedAnalytics.count}`);
    console.log(`   - Reviews: ${deletedReviews.count}`);
    console.log(`   - Maintenance Requests: ${deletedMaintenance.count}`);
    console.log(`   - Conversations: ${deletedConversations.count}`);
    console.log(`   - Messages: ${deletedMessages.count}`);
    console.log(`   - Chat Sessions: ${deletedChatSessions.count}`);
    console.log(`   - Chat Messages: ${deletedChatMessages.count}`);
    console.log(`   - Units: ${deletedUnits.count}`);
    console.log(`   - Leases: ${deletedLeases.count}`);

    console.log('\n💡 Users and their basic profiles are preserved.');
    console.log('🔄 You can now test the complete system from scratch.');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllData();
