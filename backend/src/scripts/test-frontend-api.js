import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFrontendAPI() {
  try {
    console.log('🧪 Testing frontend API endpoints...');

    const rentalRequestId = 1;
    const offerId = 'cmeymqn78000aex1wrc0h8qy8';

    console.log(`🔍 Testing with rental request ID: ${rentalRequestId}`);
    console.log(`🔍 Testing with offer ID: ${offerId}`);

    // Test 1: Check if contract exists
    console.log('\n📋 Test 1: Check if contract exists');
    console.log('=====================================');
    
    const existingContract = await prisma.contract.findFirst({
      where: { rentalRequestId: rentalRequestId },
    });

    if (existingContract) {
      console.log('✅ Contract found:');
      console.log(`  ID: ${existingContract.id}`);
      console.log(`  Contract Number: ${existingContract.contractNumber}`);
      console.log(`  Status: ${existingContract.status}`);
      console.log(`  PDF URL: ${existingContract.pdfUrl}`);
      console.log(`  Created At: ${existingContract.createdAt}`);
    } else {
      console.log('❌ No contract found');
    }

    // Test 2: Check the offer data
    console.log('\n📋 Test 2: Check offer data');
    console.log('=============================');
    
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      select: {
        id: true,
        status: true,
        availableFrom: true,
        rentalRequestId: true,
      },
    });

    if (offer) {
      console.log('✅ Offer found:');
      console.log(`  ID: ${offer.id}`);
      console.log(`  Status: ${offer.status}`);
      console.log(`  Available From: ${offer.availableFrom}`);
      console.log(`  Rental Request ID: ${offer.rentalRequestId}`);
    } else {
      console.log('❌ Offer not found');
    }

    // Test 3: Simulate the frontend API response
    console.log('\n📋 Test 3: Simulate frontend API response');
    console.log('==========================================');
    
    if (existingContract) {
      const response = {
        success: true,
        message: 'Contract generated successfully',
        contract: {
          id: existingContract.id,
          contractNumber: existingContract.contractNumber,
          status: existingContract.status,
          pdfUrl: existingContract.pdfUrl,
        },
      };

      console.log('✅ API Response:');
      console.log(JSON.stringify(response, null, 2));

      // Test if the frontend logic would work
      if (response?.success && response?.contract?.pdfUrl) {
        console.log('✅ Frontend logic would succeed');
        console.log(`✅ Would open: http://localhost:3001${response.contract.pdfUrl}`);
      } else {
        console.log('❌ Frontend logic would fail');
      }
    }

  } catch (error) {
    console.error('❌ Error testing frontend API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testFrontendAPI();
