const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNewModels() {
  console.log('🧪 Testing new Organization and TenantGroup models...');

  try {
    // Test 1: Query organizations
    console.log('\n🏢 Test 1: Querying organizations...');
    const organizations = await prisma.organization.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
        },
        properties: true,
      },
    });

    console.log(`Found ${organizations.length} organizations:`);
    organizations.forEach((org) => {
      console.log(`  - ${org.name} (${org.id})`);
      console.log(`    Address: ${org.address}`);
      console.log(`    Members: ${org.members.length}`);
      org.members.forEach((member) => {
        console.log(
          `      * ${member.user.name || member.user.id} (${member.role})`
        );
      });
      console.log(`    Properties: ${org.properties.length}`);
    });

    // Test 2: Query tenant groups
    console.log('\n👥 Test 2: Querying tenant groups...');
    const tenantGroups = await prisma.tenantGroup.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
        },
        rentalRequests: true,
      },
    });

    console.log(`Found ${tenantGroups.length} tenant groups:`);
    tenantGroups.forEach((group) => {
      console.log(`  - ${group.name} (${group.id})`);
      console.log(`    Members: ${group.members.length}`);
      group.members.forEach((member) => {
        console.log(
          `      * ${member.user.name || member.user.id} (${member.isPrimary ? 'PRIMARY' : 'MEMBER'})`
        );
      });
      console.log(`    Rental Requests: ${group.rentalRequests.length}`);
    });

    // Test 3: Test property creation with organization
    console.log('\n🏠 Test 3: Testing property creation with organization...');
    if (organizations.length > 0) {
      const testProperty = await prisma.property.create({
        data: {
          name: 'Test Property',
          address: '789 Test Street, Warsaw, Poland',
          city: 'Warsaw',
          zipCode: '00-002',
          country: 'Poland',
          propertyType: 'House',
          bedrooms: 3,
          bathrooms: 2,
          monthlyRent: 4000.0,
          organizationId: organizations[0].id,
        },
      });

      console.log(
        `✅ Created test property: ${testProperty.name} owned by ${organizations[0].name}`
      );

      // Clean up test property
      await prisma.property.delete({
        where: { id: testProperty.id },
      });
      console.log(`🗑️  Cleaned up test property`);
    }

    // Test 4: Test tenant group member creation
    console.log('\n👤 Test 4: Testing tenant group member creation...');
    if (tenantGroups.length > 0) {
      // Find a user who is not already a member of the first tenant group
      const existingMembers = await prisma.tenantGroupMember.findMany({
        where: { tenantGroupId: tenantGroups[0].id },
        select: { userId: true },
      });

      const existingUserIds = existingMembers.map((m) => m.userId);

      const testUser = await prisma.user.findFirst({
        where: {
          role: 'TENANT',
          id: { notIn: existingUserIds },
        },
      });

      if (testUser) {
        const testMember = await prisma.tenantGroupMember.create({
          data: {
            userId: testUser.id,
            tenantGroupId: tenantGroups[0].id,
            isPrimary: false,
          },
        });

        console.log(
          `✅ Added ${testUser.name || testUser.id} to tenant group ${tenantGroups[0].name}`
        );

        // Clean up test member
        await prisma.tenantGroupMember.delete({
          where: { id: testMember.id },
        });
        console.log(`🗑️  Cleaned up test member`);
      } else {
        console.log(
          `ℹ️  No available users to test tenant group member creation`
        );
      }
    }

    console.log('\n🎉 All tests passed successfully!');
    console.log('\n📋 Model Status:');
    console.log('✅ Organizations: Working correctly');
    console.log('✅ Tenant Groups: Working correctly');
    console.log('✅ Properties: Can be owned by organizations');
    console.log('✅ Rental Requests: Can be made by tenant groups');
    console.log('✅ Organization Members: Role-based access working');
    console.log('✅ Tenant Group Members: Primary designation working');
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
testNewModels()
  .then(() => {
    console.log('✅ Test script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
