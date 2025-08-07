import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndFixMatches() {
  try {
    console.log('🔍 Checking Existing Matches and Fixing...\n');

    // Check existing matches
    const existingMatches = await prisma.landlordRequestMatch.findMany({
      include: {
        rentalRequest: true,
        landlord: {
          select: { id: true, email: true }
        }
      }
    });

    console.log(`📊 Existing Matches: ${existingMatches.length}`);
    existingMatches.forEach(match => {
      console.log(`   👤 Landlord: ${match.landlord.email} -> Request: ${match.rentalRequest.title}`);
    });

    // Get the rental request that should match
    const rentalRequest = await prisma.rentalRequest.findFirst({
      where: { poolStatus: 'ACTIVE' },
      include: {
        tenant: {
          select: { id: true, email: true }
        }
      }
    });

    if (!rentalRequest) {
      console.log('❌ No active rental request found');
      return;
    }

    console.log(`\n🏠 Found Rental Request: ${rentalRequest.title}`);
    console.log(`   📍 Location: ${rentalRequest.location}`);
    console.log(`   👤 Tenant: ${rentalRequest.tenant.email}`);

    // Get the landlord's property
    const landlordProperty = await prisma.property.findFirst({
      where: { status: 'AVAILABLE' },
      include: {
        landlord: {
          select: { id: true, email: true }
        }
      }
    });

    if (!landlordProperty) {
      console.log('❌ No available property found');
      return;
    }

    console.log(`\n🏢 Found Property: ${landlordProperty.name}`);
    console.log(`   📍 City: ${landlordProperty.city}`);
    console.log(`   👤 Landlord: ${landlordProperty.landlord.email}`);

    // Check if match should exist
    const locationMatch = landlordProperty.city.toLowerCase().includes(rentalRequest.location.split(',')[1]?.trim().toLowerCase() || rentalRequest.location.toLowerCase());
    const budgetMatch = landlordProperty.monthlyRent >= (rentalRequest.budgetFrom || rentalRequest.budget * 0.8) && 
                       landlordProperty.monthlyRent <= (rentalRequest.budgetTo || rentalRequest.budget * 1.2);
    const typeMatch = !rentalRequest.propertyType || 
                     landlordProperty.propertyType.toLowerCase() === rentalRequest.propertyType.toLowerCase();
    const dateMatch = new Date(landlordProperty.availableFrom) <= new Date(rentalRequest.moveInDate);
    const bedroomsMatch = !rentalRequest.bedrooms || landlordProperty.bedrooms === rentalRequest.bedrooms;

    console.log(`\n🔍 Match Analysis:`);
    console.log(`   📍 Location: ${locationMatch ? '✅' : '❌'} (Property: "${landlordProperty.city}", Request: "${rentalRequest.location}")`);
    console.log(`   💰 Budget: ${budgetMatch ? '✅' : '❌'} (Property: ${landlordProperty.monthlyRent}, Request: ${rentalRequest.budgetFrom}-${rentalRequest.budgetTo})`);
    console.log(`   🏠 Type: ${typeMatch ? '✅' : '❌'} (Property: "${landlordProperty.propertyType}", Request: "${rentalRequest.propertyType}")`);
    console.log(`   📅 Date: ${dateMatch ? '✅' : '❌'} (Property: ${landlordProperty.availableFrom}, Request: ${rentalRequest.moveInDate})`);
    console.log(`   🛏️ Bedrooms: ${bedroomsMatch ? '✅' : '❌'} (Property: ${landlordProperty.bedrooms}, Request: ${rentalRequest.bedrooms})`);

    const shouldMatch = locationMatch && budgetMatch && typeMatch && dateMatch && bedroomsMatch;
    console.log(`\n🎯 Should Match: ${shouldMatch ? 'YES!' : 'NO'}`);

    if (shouldMatch) {
      // Check if match already exists
      const existingMatch = await prisma.landlordRequestMatch.findFirst({
        where: {
          landlordId: landlordProperty.landlordId,
          rentalRequestId: rentalRequest.id
        }
      });

      if (existingMatch) {
        console.log(`\n✅ Match already exists in database`);
      } else {
        console.log(`\n❌ Match should exist but doesn't. Creating it now...`);
        
        // Create the match
        const newMatch = await prisma.landlordRequestMatch.create({
          data: {
            landlordId: landlordProperty.landlordId,
            rentalRequestId: rentalRequest.id,
            matchScore: 0.8, // High score since all criteria match
            matchReason: `Perfect match: ${landlordProperty.propertyType} in ${landlordProperty.city} within budget range`
          }
        });

        console.log(`✅ Created match: ${newMatch.id}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixMatches(); 