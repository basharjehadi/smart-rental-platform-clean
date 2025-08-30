import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMatchingData() {
  try {
    console.log('🔍 Checking matching data discrepancy...\n');

    // Get the rental request
    const rentalRequest = await prisma.rentalRequest.findFirst({
      include: {
        tenant: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!rentalRequest) {
      console.log('❌ No rental request found');
      return;
    }

    console.log('📋 Rental Request Details:');
    console.log(`   ID: ${rentalRequest.id}`);
    console.log(
      `   Tenant: ${rentalRequest.tenant.name} (${rentalRequest.tenant.email})`
    );
    console.log(`   Budget From: ${rentalRequest.budgetFrom} PLN`);
    console.log(`   Budget To: ${rentalRequest.budgetTo} PLN`);
    console.log(`   Budget (legacy): ${rentalRequest.budget} PLN`);
    console.log(`   Location: ${rentalRequest.location}`);
    console.log(`   Property Type: ${rentalRequest.propertyType}`);
    console.log(`   Bedrooms: ${rentalRequest.bedrooms}`);
    console.log(`   Move-in Date: ${rentalRequest.moveInDate}`);
    console.log('');

    // Get the landlord's property
    const property = await prisma.property.findFirst({
      where: {
        landlordId: 'cme4x3r180001exy8spbxmarn',
      },
    });

    if (!property) {
      console.log('❌ No property found for landlord');
      return;
    }

    console.log('🏠 Property Details:');
    console.log(`   ID: ${property.id}`);
    console.log(`   Name: ${property.name}`);
    console.log(`   Monthly Rent: ${property.monthlyRent} PLN`);
    console.log(`   City: ${property.city}`);
    console.log(`   Address: ${property.address}`);
    console.log(`   Property Type: ${property.propertyType}`);
    console.log(`   Bedrooms: ${property.bedrooms}`);
    console.log(`   Available From: ${property.availableFrom}`);
    console.log('');

    // Check the matching logic
    console.log('🧮 Matching Logic Analysis:');

    const budgetTo = rentalRequest.budgetTo || rentalRequest.budget;
    const budgetFrom = rentalRequest.budgetFrom || rentalRequest.budget;

    console.log(`   Tenant's budget range: ${budgetFrom} - ${budgetTo} PLN`);
    console.log(`   Property rent: ${property.monthlyRent} PLN`);
    console.log(`   Budget flexibility (2x): ${budgetTo * 2} PLN`);

    // Check if property would match with current logic
    const wouldMatch = property.monthlyRent <= budgetTo * 2.0;
    console.log(
      `   Would match with current logic: ${wouldMatch ? '✅ YES' : '❌ NO'}`
    );

    if (wouldMatch) {
      console.log(
        `   Reason: Property rent (${property.monthlyRent}) <= 2x max budget (${budgetTo * 2})`
      );
    }

    // Check the match score calculation
    console.log('\n📊 Match Score Analysis:');

    // Simulate the scoring logic
    let score = 50; // Base score

    // Location match (40 points)
    const extractedCity = rentalRequest.location
      ? rentalRequest.location.split(',').pop()?.trim() ||
        rentalRequest.location.trim()
      : null;

    if (
      extractedCity &&
      property.city.toLowerCase().includes(extractedCity.toLowerCase())
    ) {
      score += 40;
      console.log(`   ✅ Location match: +40 points`);
    } else {
      console.log(
        `   ❌ Location mismatch: Property city "${property.city}" vs extracted "${extractedCity}"`
      );
    }

    // Budget match (30 points)
    const budgetRange = budgetTo - budgetFrom;
    const budgetTolerance = budgetRange * 0.1;

    if (
      property.monthlyRent >= budgetFrom - budgetTolerance &&
      property.monthlyRent <= budgetTo + budgetTolerance
    ) {
      score += 30;
      console.log(`   ✅ Budget match with tolerance: +30 points`);
    } else if (
      property.monthlyRent >= budgetFrom &&
      property.monthlyRent <= budgetTo
    ) {
      score += 25;
      console.log(`   ✅ Budget exact match: +25 points`);
    } else if (property.monthlyRent <= budgetTo) {
      score += 15;
      console.log(`   ✅ Budget within max: +15 points`);
    } else {
      console.log(
        `   ❌ Budget mismatch: Property ${property.monthlyRent} PLN vs range ${budgetFrom}-${budgetTo} PLN`
      );
    }

    // Bedrooms match (20 points)
    if (
      rentalRequest.bedrooms &&
      property.bedrooms === rentalRequest.bedrooms
    ) {
      score += 20;
      console.log(`   ✅ Bedrooms exact match: +20 points`);
    } else if (
      rentalRequest.bedrooms &&
      Math.abs(property.bedrooms - rentalRequest.bedrooms) <= 1
    ) {
      score += 10;
      console.log(`   ✅ Bedrooms close match: +10 points`);
    } else if (rentalRequest.bedrooms) {
      console.log(
        `   ❌ Bedrooms mismatch: Property ${property.bedrooms} vs request ${rentalRequest.bedrooms}`
      );
    }

    // Property type match (15 points)
    if (
      rentalRequest.propertyType &&
      property.propertyType &&
      property.propertyType
        .toLowerCase()
        .includes(rentalRequest.propertyType.toLowerCase())
    ) {
      score += 15;
      console.log(`   ✅ Property type match: +15 points`);
    } else if (rentalRequest.propertyType) {
      console.log(
        `   ❌ Property type mismatch: Property "${property.propertyType}" vs request "${rentalRequest.propertyType}"`
      );
    }

    // Availability match (10 points)
    const moveInDate = new Date(rentalRequest.moveInDate);
    const availableFrom = new Date(property.availableFrom);
    const daysDiff = Math.abs(
      (moveInDate - availableFrom) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff <= 7) {
      score += 10;
      console.log(`   ✅ Availability within week: +10 points`);
    } else if (daysDiff <= 30) {
      score += 5;
      console.log(`   ✅ Availability within month: +5 points`);
    } else {
      console.log(
        `   ❌ Availability mismatch: ${daysDiff.toFixed(1)} days diff`
      );
    }

    const finalScore = Math.min(100, Math.max(0, score));
    console.log(`\n🎯 Final Match Score: ${finalScore}/100`);

    // Check what would make this an "exact match"
    if (finalScore >= 90) {
      console.log('🏆 This would be considered an "exact match" (score >= 90)');
    } else if (finalScore >= 70) {
      console.log('✅ This would be considered a "good match" (score >= 70)');
    } else if (finalScore >= 50) {
      console.log('⚠️ This would be considered a "basic match" (score >= 50)');
    } else {
      console.log('❌ This would not match (score < 50)');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMatchingData();
