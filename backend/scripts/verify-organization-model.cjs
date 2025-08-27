const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyOrganizationModel() {
  console.log('🔍 Verifying Organization and TenantGroup models...');
  
  try {
    // Check current state
    const organizations = await prisma.organization.findMany();
    const tenantGroups = await prisma.tenantGroup.findMany();
    const properties = await prisma.property.findMany();
    const rentalRequests = await prisma.rentalRequest.findMany();
    const offers = await prisma.offer.findMany();
    const leases = await prisma.lease.findMany();
    const payments = await prisma.payment.findMany();
    const rentPayments = await prisma.rentPayment.findMany();
    const reviews = await prisma.review.findMany();
    const matches = await prisma.landlordRequestMatch.findMany();
    
    console.log('\n📊 Current Database State:');
    console.log(`- Organizations: ${organizations.length}`);
    console.log(`- Tenant Groups: ${tenantGroups.length}`);
    console.log(`- Properties: ${properties.length}`);
    console.log(`- Rental Requests: ${rentalRequests.length}`);
    console.log(`- Offers: ${offers.length}`);
    console.log(`- Leases: ${leases.length}`);
    console.log(`- Payments: ${payments.length}`);
    console.log(`- Rent Payments: ${rentPayments.length}`);
    console.log(`- Reviews: ${reviews.length}`);
    console.log(`- Landlord Request Matches: ${matches.length}`);
    
    // If we have no organizations, create some sample data
    if (organizations.length === 0) {
      console.log('\n🏢 Creating sample organizations...');
      
      const sampleOrg = await prisma.organization.create({
        data: {
          name: 'Sample Property Management',
          address: '123 Main Street, Warsaw, Poland',
          taxId: '1234567890',
          regNumber: 'REG123456'
        }
      });
      
      console.log(`✅ Created sample organization: ${sampleOrg.name}`);
      
      // Create a sample user as organization owner
      const sampleUser = await prisma.user.findFirst({
        where: { role: 'LANDLORD' }
      });
      
      if (sampleUser) {
        await prisma.organizationMember.create({
          data: {
            userId: sampleUser.id,
            organizationId: sampleOrg.id,
            role: 'OWNER'
          }
        });
        console.log(`✅ Added ${sampleUser.name || sampleUser.id} as organization owner`);
      }
    }
    
    // If we have no tenant groups, create some sample data
    if (tenantGroups.length === 0) {
      console.log('\n👥 Creating sample tenant groups...');
      
      const sampleTenantGroup = await prisma.tenantGroup.create({
        data: {
          name: 'Sample Tenant Group'
        }
      });
      
      console.log(`✅ Created sample tenant group: ${sampleTenantGroup.name}`);
      
      // Create a sample user as tenant group member
      const sampleTenant = await prisma.user.findFirst({
        where: { role: 'TENANT' }
      });
      
      if (sampleTenant) {
        await prisma.tenantGroupMember.create({
          data: {
            userId: sampleTenant.id,
            tenantGroupId: sampleTenantGroup.id,
            isPrimary: true
          }
        });
        console.log(`✅ Added ${sampleTenant.name || sampleTenant.id} as primary tenant group member`);
      }
    }
    
    // Check if we need to create sample properties
    if (properties.length === 0 && organizations.length > 0) {
      console.log('\n🏠 Creating sample properties...');
      
      const org = organizations[0];
      const sampleProperty = await prisma.property.create({
        data: {
          name: 'Sample Apartment',
          address: '456 Oak Street, Warsaw, Poland',
          city: 'Warsaw',
          zipCode: '00-001',
          country: 'Poland',
          propertyType: 'Apartment',
          bedrooms: 2,
          bathrooms: 1,
          monthlyRent: 2500.00,
          organizationId: org.id
        }
      });
      
      console.log(`✅ Created sample property: ${sampleProperty.name}`);
    }
    
    // Check if we need to create sample rental requests
    if (rentalRequests.length === 0 && tenantGroups.length > 0) {
      console.log('\n📝 Creating sample rental requests...');
      
      const tenantGroup = tenantGroups[0];
      const sampleRequest = await prisma.rentalRequest.create({
        data: {
          title: 'Looking for 2-bedroom apartment',
          description: 'Seeking a comfortable 2-bedroom apartment in Warsaw',
          location: 'Warsaw, Poland',
          moveInDate: new Date('2025-09-01'),
          budget: 3000.00,
          tenantGroupId: tenantGroup.id
        }
      });
      
      console.log(`✅ Created sample rental request: ${sampleRequest.title}`);
    }
    
    console.log('\n🎉 Verification completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. The database schema has been successfully updated');
    console.log('2. Sample data has been created if needed');
    console.log('3. You can now use the new Organization and TenantGroup models');
    console.log('4. Update your application code to work with the new schema');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyOrganizationModel()
  .then(() => {
    console.log('✅ Verification script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification script failed:', error);
    process.exit(1);
  });
