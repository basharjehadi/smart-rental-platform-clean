import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseStructure() {
  console.log('🔍 Checking Database Structure');
  console.log('==============================');
  
  try {
    // Check if we can query the rental_requests table
    const rentalRequests = await prisma.rentalRequest.findMany({
      take: 1
    });
    
    console.log(`✅ Can query rental_requests table`);
    console.log(`📝 Found ${rentalRequests.length} rental requests`);
    
    if (rentalRequests.length > 0) {
      const request = rentalRequests[0];
      console.log('📝 Sample rental request:');
      console.log(`   ID: ${request.id}`);
      console.log(`   Title: ${request.title}`);
      console.log(`   Budget: ${request.budget}`);
      console.log(`   Budget From: ${request.budgetFrom}`);
      console.log(`   Budget To: ${request.budgetTo}`);
      console.log(`   Budget From Type: ${typeof request.budgetFrom}`);
      console.log(`   Budget To Type: ${typeof request.budgetTo}`);
    }
    
    // Try to create a rental request with budget fields
    console.log('\n🧪 Testing rental request creation...');
    const testRequest = await prisma.rentalRequest.create({
      data: {
        title: 'Test Budget Fields',
        description: 'Testing if budgetFrom and budgetTo work',
        location: 'Test Location',
        moveInDate: new Date('2025-09-01'),
        budget: 2500,
        budgetFrom: 2000,
        budgetTo: 3000,
        bedrooms: 2,
        tenantId: 'test-tenant-id'
      }
    });
    
    console.log('✅ Test rental request created successfully');
    console.log(`   ID: ${testRequest.id}`);
    console.log(`   Budget From: ${testRequest.budgetFrom}`);
    console.log(`   Budget To: ${testRequest.budgetTo}`);
    
    if (testRequest.budgetFrom === 2000 && testRequest.budgetTo === 3000) {
      console.log('🎉 SUCCESS: Budget fields are working correctly!');
    } else {
      console.log('❌ FAILED: Budget fields are not working correctly');
      console.log(`   Expected: budgetFrom=2000, budgetTo=3000`);
      console.log(`   Actual: budgetFrom=${testRequest.budgetFrom}, budgetTo=${testRequest.budgetTo}`);
    }
    
    // Clean up test data
    await prisma.rentalRequest.delete({
      where: { id: testRequest.id }
    });
    console.log('🧹 Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Error checking database structure:', error);
    console.error('Error details:', error.message);
    
    if (error.message.includes('budgetFrom') || error.message.includes('budgetTo')) {
      console.log('🔍 This suggests the budgetFrom/budgetTo columns do not exist in the database');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStructure(); 