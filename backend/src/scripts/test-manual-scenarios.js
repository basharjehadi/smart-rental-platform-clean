import { PrismaClient } from '@prisma/client';
import requestPoolService from '../services/requestPoolService.js';

const prisma = new PrismaClient();

async function testManualScenarios() {
  try {
    console.log('🧪 Starting manual test scenarios...\n');

    // Step 1: Find or create an organization and user
    console.log('1️⃣ Finding/Creating organization and user...');
    let organization = await prisma.organization.findFirst({
      where: { isPersonal: true },
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'Test Personal Organization',
          isPersonal: true,
          address: 'Test Address, Poznań, Poland',
        },
      });
      console.log(`✅ Created organization: ${organization.id}`);
    } else {
      console.log(`✅ Using existing organization: ${organization.id}`);
    }

    // Create a user for the organization
    let user = await prisma.user.findFirst({
      where: { role: 'LANDLORD' },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: 'Test Landlord',
          email: 'test-landlord@example.com',
          password: 'hashedpassword123',
          role: 'LANDLORD',
          firstName: 'Test',
          lastName: 'Landlord',
        },
      });
      console.log(`✅ Created user: ${user.id}`);
    } else {
      console.log(`✅ Using existing user: ${user.id}`);
    }

    // Add user to organization
    await prisma.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organization.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        organizationId: organization.id,
        role: 'OWNER',
      },
    });
    console.log(`✅ Added user ${user.id} to organization ${organization.id}`);

    // Step 2: Create property
    console.log('\n2️⃣ Creating property...');
    const property = await prisma.property.create({
      data: {
        city: 'Poznań',
        status: 'AVAILABLE',
        availability: true,
        monthlyRent: 3000,
        organizationId: organization.id,
        name: 'Test Property Poznań',
        address: 'Test Street 123, Poznań',
        zipCode: '60-000',
        country: 'Poland',
        district: 'Centrum',
        propertyType: 'APARTMENT',
        bedrooms: 2,
        bathrooms: 1,
        furnished: false,
        parking: true,
        petsAllowed: false,
      },
    });
    console.log(`✅ Created property: ${property.id}`);

    // Step 3: Create rental request
    console.log('\n3️⃣ Creating rental request...');
    const moveInDate = new Date();
    moveInDate.setDate(moveInDate.getDate() + 2); // 2 days from now

    // First, find or create a tenant group
    let tenantGroup = await prisma.tenantGroup.findFirst();
    if (!tenantGroup) {
      tenantGroup = await prisma.tenantGroup.create({
        data: {
          name: 'Test Tenant Group',
        },
      });
      console.log(`✅ Created tenant group: ${tenantGroup.id}`);
    } else {
      console.log(`✅ Using existing tenant group: ${tenantGroup.id}`);
    }

    const rentalRequest = await prisma.rentalRequest.create({
      data: {
        title: 'Test Rental Request Poznań',
        description: 'Test rental request for manual testing',
        location: 'Poznań, Poland',
        moveInDate: moveInDate,
        budget: 3200,
        bedrooms: 2,
        bathrooms: 1,
        furnished: false,
        parking: true,
        petsAllowed: false,
        tenantGroupId: tenantGroup.id,
        poolStatus: 'ACTIVE',
      },
    });
    console.log(`✅ Created rental request: ${rentalRequest.id}`);

    // Step 4: Call addToPool and verify
    console.log('\n4️⃣ Calling addToPool...');
    const matchCount = await requestPoolService.addToPool(rentalRequest);
    console.log(`✅ addToPool returned: ${matchCount} matches`);

    // Verify expiresAt > now
    const updatedRequest = await prisma.rentalRequest.findUnique({
      where: { id: rentalRequest.id },
    });
    console.log(`📅 Request expiresAt: ${updatedRequest.expiresAt}`);
    console.log(`⏰ Current time: ${new Date()}`);
    console.log(`✅ expiresAt > now: ${updatedRequest.expiresAt > new Date()}`);

    // Verify matches created
    const matches = await prisma.landlordRequestMatch.findMany({
      where: { rentalRequestId: rentalRequest.id },
    });
    console.log(`🔗 Created ${matches.length} matches`);
    matches.forEach((match) => {
      console.log(
        `   - Match: ${match.id}, Organization: ${match.organizationId}, Score: ${match.matchScore}`
      );
    });

    // Step 5: Call getRequestsForLandlordUser
    console.log('\n5️⃣ Calling getRequestsForLandlordUser...');
    const landlordUserId = user.id; // Use the created user ID
    const requests = await requestPoolService.getRequestsForLandlordUser(
      landlordUserId,
      1,
      20
    );
    console.log(
      `✅ getRequestsForLandlordUser returned ${requests.requests.length} requests`
    );

    if (requests.requests.length > 0) {
      const request = requests.requests[0];
      console.log(`📋 Request details:`);
      console.log(`   - ID: ${request.rentalRequest.id}`);
      console.log(`   - Title: ${request.rentalRequest.title}`);
      console.log(
        `   - Tenant: ${request.rentalRequest.tenant?.name || 'No tenant'}`
      );

      // Verify no sensitive data
      const hasPhone = request.rentalRequest.tenant?.phoneNumber !== undefined;
      const hasEmail = request.rentalRequest.tenant?.email !== undefined;
      const hasDOB = request.rentalRequest.tenant?.dateOfBirth !== undefined;
      console.log(`   - Has phone: ${hasPhone}`);
      console.log(`   - Has email: ${hasEmail}`);
      console.log(`   - Has DOB: ${hasDOB}`);
      console.log(
        `✅ No sensitive data exposed: ${!hasPhone && !hasEmail && !hasDOB}`
      );
    }

    // Step 6: Call markAsViewedForOrg twice
    console.log('\n6️⃣ Calling markAsViewedForOrg twice...');

    // First call
    await requestPoolService.markAsViewedForOrg(
      organization.id,
      rentalRequest.id
    );
    console.log('✅ First markAsViewedForOrg call completed');

    // Check view count after first call
    const requestAfterFirst = await prisma.rentalRequest.findUnique({
      where: { id: rentalRequest.id },
    });
    console.log(
      `👁️ View count after first call: ${requestAfterFirst.viewCount || 0}`
    );

    // Second call
    await requestPoolService.markAsViewedForOrg(
      organization.id,
      rentalRequest.id
    );
    console.log('✅ Second markAsViewedForOrg call completed');

    // Check view count after second call
    const requestAfterSecond = await prisma.rentalRequest.findUnique({
      where: { id: rentalRequest.id },
    });
    console.log(
      `👁️ View count after second call: ${requestAfterSecond.viewCount || 0}`
    );

    // Verify view count only incremented once
    const viewCountIncrement =
      (requestAfterSecond.viewCount || 0) - (requestAfterFirst.viewCount || 0);
    console.log(
      `✅ View count increment: ${viewCountIncrement} (should be 0 for duplicate calls)`
    );

    console.log('\n🎉 All test scenarios completed successfully!');
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testManualScenarios();
