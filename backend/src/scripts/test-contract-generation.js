import { PrismaClient } from '@prisma/client';
import { generateContractForRentalRequest } from '../controllers/contractController.js';

const prisma = new PrismaClient();

async function testContractGeneration() {
  try {
    console.log('🧪 Testing contract generation...');

    const rentalRequestId = 1; // Your rental request ID

    console.log(`🔧 Testing contract generation for rental request: ${rentalRequestId}`);

    // Test the contract generation function directly
    const contract = await generateContractForRentalRequest(rentalRequestId);

    console.log('✅ Contract generated successfully!');
    console.log('📄 Contract Details:');
    console.log(`  ID: ${contract.id}`);
    console.log(`  Contract Number: ${contract.contractNumber}`);
    console.log(`  Status: ${contract.status}`);
    console.log(`  PDF URL: ${contract.pdfUrl}`);
    console.log(`  Created At: ${contract.createdAt}`);

  } catch (error) {
    console.error('❌ Contract generation failed:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check if it's a specific type of error
    if (error.message.includes('PDF')) {
      console.error('🔍 This appears to be a PDF generation error');
    } else if (error.message.includes('database')) {
      console.error('🔍 This appears to be a database error');
    } else if (error.message.includes('permission')) {
      console.error('🔍 This appears to be a permission error');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testContractGeneration();
