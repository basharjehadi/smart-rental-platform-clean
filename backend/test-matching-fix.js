import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMatchingFix() {
  try {
    console.log('🔍 Testing New Matching Logic...\n');

    // Get the rental request
    const rentalRequest = await prisma.rentalRequest.findFirst({
      where: { poolStatus: 'ACTIVE' }
    });

    if (!rentalRequest) {
      console.log('❌ No active rental request found');
      return;
    }

    console.log(`🏠 Rental Request: ${rentalRequest.title}`);
    console.log(`   📍 Location: "${rentalRequest.location}"`);
    console.log(`   💰 Budget: ${rentalRequest.budgetFrom}-${rentalRequest.budgetTo} PLN`);
    console.log(`   🏠 Type: ${rentalRequest.propertyType}`);
    console.log(`   📅 Move-in: ${rentalRequest.moveInDate}`);

    // Get the landlord's property
    const property = await prisma.property.findFirst({
      where: { status: 'AVAILABLE' }
    });

    if (!property) {
      console.log('❌ No available property found');
      return;
    }

    console.log(`\n🏢 Property: ${property.name}`);
    console.log(`   📍 City: "${property.city}"`);
    console.log(`   💰 Rent: ${property.monthlyRent} PLN`);
    console.log(`   🏠 Type: ${property.propertyType}`);
    console.log(`   📅 Available: ${property.availableFrom}`);

    // Test the new matching logic
    console.log(`\n🔍 Testing New Matching Logic:`);

    // Location matching
    const locationMatch = rentalRequest.location.toLowerCase().includes(property.city.toLowerCase());
    console.log(`   📍 Location: ${locationMatch ? '✅' : '❌'} ("${rentalRequest.location}" contains "${property.city}")`);

    // Budget matching
    const budgetMatch = rentalRequest.budgetFrom <= property.monthlyRent * 1.2 && 
                       rentalRequest.budgetTo >= property.monthlyRent * 0.8;
    console.log(`   💰 Budget: ${budgetMatch ? '✅' : '❌'} (Request: ${rentalRequest.budgetFrom}-${rentalRequest.budgetTo}, Property: ${property.monthlyRent})`);

    // Type matching
    const typeMatch = rentalRequest.propertyType.toLowerCase() === property.propertyType.toLowerCase();
    console.log(`   🏠 Type: ${typeMatch ? '✅' : '❌'} (Request: "${rentalRequest.propertyType}", Property: "${property.propertyType}")`);

    // Date matching
    const dateMatch = new Date(rentalRequest.moveInDate) >= new Date(property.availableFrom);
    console.log(`   📅 Date: ${dateMatch ? '✅' : '❌'} (Request: ${rentalRequest.moveInDate}, Property: ${property.availableFrom})`);

    const allMatch = locationMatch && budgetMatch && typeMatch && dateMatch;
    console.log(`\n🎯 Overall Match: ${allMatch ? '✅ YES!' : '❌ NO'}`);

    if (allMatch) {
      console.log(`\n✅ The rental request should now appear in the landlord dashboard!`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMatchingFix(); 