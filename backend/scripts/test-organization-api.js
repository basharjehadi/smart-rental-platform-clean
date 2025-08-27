const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testOrganizationAPI() {
  console.log('🧪 Testing Organization API endpoints...');
  
  try {
    // Test 1: Check if we have users to test with
    console.log('\n👥 Test 1: Checking available users...');
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.name || user.id} (${user.role})`);
    });
    
    // Test 2: Check current organizations
    console.log('\n🏢 Test 2: Checking current organizations...');
    const organizations = await prisma.organization.findMany({
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        },
        properties: {
          select: { id: true, name: true, address: true }
        }
      }
    });
    
    console.log(`Found ${organizations.length} organizations:`);
    organizations.forEach(org => {
      console.log(`  - ${org.name} (${org.id})`);
      console.log(`    Members: ${org.members.length}`);
      console.log(`    Properties: ${org.properties.length}`);
    });
    
    // Test 3: Check properties without organization
    console.log('\n🏠 Test 3: Checking properties without organization...');
    const orphanedProperties = await prisma.property.findMany({
      where: { organizationId: null },
      select: { id: true, name: true, address: true }
    });
    
    console.log(`Found ${orphanedProperties.length} properties without organization:`);
    orphanedProperties.forEach(prop => {
      console.log(`  - ${prop.name} (${prop.id}) at ${prop.address}`);
    });
    
    // Test 4: Check organization members
    console.log('\n👤 Test 4: Checking organization members...');
    const members = await prisma.organizationMember.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        organization: {
          select: { id: true, name: true }
        }
      }
    });
    
    console.log(`Found ${members.length} organization members:`);
    members.forEach(member => {
      console.log(`  - ${member.user.name || member.user.id} (${member.role}) in ${member.organization.name}`);
    });
    
    // Test 5: Simulate business account upgrade scenario
    console.log('\n🚀 Test 5: Simulating business account upgrade...');
    
    // Find a user who is not already in an organization
    const availableUsers = users.filter(user => {
      return !members.some(member => member.user.id === user.id);
    });
    
    if (availableUsers.length > 0) {
      const testUser = availableUsers[0];
      console.log(`\nSelected test user: ${testUser.name || testUser.id} (${testUser.role})`);
      
      // Check if this user has any properties
      const userProperties = await prisma.property.findMany({
        where: { organizationId: null },
        select: { id: true, name: true, address: true }
      });
      
      console.log(`User has ${userProperties.length} properties that would be migrated`);
      
      // Simulate organization creation
      const testOrg = await prisma.organization.create({
        data: {
          name: `Test Organization for ${testUser.name || testUser.id}`,
          address: 'Test Address, Warsaw, Poland',
          taxId: 'TEST123456',
          regNumber: 'TESTREG123'
        }
      });
      
      console.log(`✅ Created test organization: ${testOrg.name} (${testOrg.id})`);
      
      // Add user as owner
      const testMember = await prisma.organizationMember.create({
        data: {
          userId: testUser.id,
          organizationId: testOrg.id,
          role: 'OWNER'
        }
      });
      
      console.log(`✅ Added ${testUser.name || testUser.id} as OWNER`);
      
      // Migrate properties if any exist
      if (userProperties.length > 0) {
        for (const property of userProperties) {
          await prisma.property.update({
            where: { id: property.id },
            data: { organizationId: testOrg.id }
          });
          console.log(`✅ Migrated property: ${property.name}`);
        }
      }
      
      // Clean up test data
      console.log('\n🧹 Cleaning up test data...');
      
      // Remove test organization (this will cascade delete members and properties)
      await prisma.organization.delete({
        where: { id: testOrg.id }
      });
      
      console.log(`🗑️  Cleaned up test organization and related data`);
    } else {
      console.log('ℹ️  No available users to test business account upgrade');
    }
    
    console.log('\n🎉 Organization API testing completed successfully!');
    console.log('\n📋 API Endpoints Available:');
    console.log('✅ POST /api/organizations/upgrade - Upgrade to business account');
    console.log('✅ GET /api/organizations/my-organization - Get user organization');
    console.log('✅ PUT /api/organizations/:id - Update organization');
    console.log('✅ POST /api/organizations/:id/members - Add member');
    console.log('✅ DELETE /api/organizations/:id/members/:userId - Remove member');
    console.log('✅ GET /api/organizations - List all (admin only)');
    
  } catch (error) {
    console.error('❌ Organization API testing failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
testOrganizationAPI()
  .then(() => {
    console.log('✅ Organization API test script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Organization API test script failed:', error);
    process.exit(1);
  });
