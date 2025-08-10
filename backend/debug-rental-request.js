import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugRentalRequest() {
  try {
    console.log('🔍 Debugging rental request data...\n');

    // Get the rental request with all fields
    const rentalRequest = await prisma.rentalRequest.findFirst({
      include: {
        tenant: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!rentalRequest) {
      console.log('❌ No rental request found');
      return;
    }

    console.log('📝 Rental Request Data:');
    console.log(`  - ID: ${rentalRequest.id}`);
    console.log(`  - Title: "${rentalRequest.title}"`);
    console.log(`  - Description: "${rentalRequest.description}"`);
    console.log(`  - Location: ${rentalRequest.location}`);
    console.log(`  - Move-in Date: ${rentalRequest.moveInDate}`);
    console.log(`  - Budget: ${rentalRequest.budget} PLN`);
    console.log(`  - Budget From: ${rentalRequest.budgetFrom || 'NULL'}`);
    console.log(`  - Budget To: ${rentalRequest.budgetTo || 'NULL'}`);
    console.log(`  - Property Type: ${rentalRequest.propertyType || 'NULL'}`);
    console.log(`  - District: ${rentalRequest.district || 'NULL'}`);
    console.log(`  - Bedrooms: ${rentalRequest.bedrooms || 'NULL'}`);
    console.log(`  - Bathrooms: ${rentalRequest.bathrooms || 'NULL'}`);
    console.log(`  - Furnished: ${rentalRequest.furnished}`);
    console.log(`  - Parking: ${rentalRequest.parking || 'NULL'}`);
    console.log(`  - Pets Allowed: ${rentalRequest.petsAllowed || 'NULL'}`);
    console.log(`  - Status: ${rentalRequest.status}`);
    console.log(`  - Pool Status: ${rentalRequest.poolStatus}`);
    console.log(`  - Tenant: ${rentalRequest.tenant.name} (${rentalRequest.tenant.email})`);
    console.log(`  - Created At: ${rentalRequest.createdAt}`);
    console.log(`  - Updated At: ${rentalRequest.updatedAt}`);

    // Test the city extraction logic
    console.log('\n🔍 Testing City Extraction:');
    const location = rentalRequest.location;
    const extractedCity = location ? 
      location.split(',').pop()?.trim() || location.trim() : 
      null;
    
    console.log(`  - Original Location: "${location}"`);
    console.log(`  - Extracted City: "${extractedCity}"`);
    console.log(`  - Location Type: ${typeof location}`);
    console.log(`  - Location Length: ${location ? location.length : 'N/A'}`);

    // Test the budget logic
    console.log('\n💰 Testing Budget Logic:');
    const budget = rentalRequest.budget;
    const budgetFrom = rentalRequest.budgetFrom;
    const budgetTo = rentalRequest.budgetTo;
    const maxBudget = (budgetTo || budget) * 1.5;
    
    console.log(`  - Budget: ${budget} PLN`);
    console.log(`  - Budget From: ${budgetFrom || 'NULL'}`);
    console.log(`  - Budget To: ${budgetTo || 'NULL'}`);
    console.log(`  - Max Budget (1.5x): ${maxBudget} PLN`);
    console.log(`  - Budget Type: ${typeof budget}`);
    console.log(`  - Budget From Type: ${typeof budgetFrom}`);
    console.log(`  - Budget To Type: ${typeof budgetTo}`);

    // Test the move-in date logic
    console.log('\n📅 Testing Move-in Date Logic:');
    const moveInDate = rentalRequest.moveInDate;
    const moveInDateObj = new Date(moveInDate);
    
    console.log(`  - Move-in Date: ${moveInDate}`);
    console.log(`  - Move-in Date Object: ${moveInDateObj}`);
    console.log(`  - Is Valid Date: ${!isNaN(moveInDateObj.getTime())}`);
    console.log(`  - Move-in Date Type: ${typeof moveInDate}`);

    // Test the property type logic
    console.log('\n🏠 Testing Property Type Logic:');
    const propertyType = rentalRequest.propertyType;
    
    console.log(`  - Property Type: ${propertyType || 'NULL'}`);
    console.log(`  - Property Type Type: ${typeof propertyType}`);
    console.log(`  - Property Type Truthy: ${!!propertyType}`);

    // Test the bedrooms logic
    console.log('\n🛏️ Testing Bedrooms Logic:');
    const bedrooms = rentalRequest.bedrooms;
    
    console.log(`  - Bedrooms: ${bedrooms || 'NULL'}`);
    console.log(`  - Bedrooms Type: ${typeof bedrooms}`);
    console.log(`  - Bedrooms Truthy: ${!!bedrooms}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRentalRequest();

