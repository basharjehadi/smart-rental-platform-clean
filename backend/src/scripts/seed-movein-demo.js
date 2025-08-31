import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper to compute deadline based on move-in date (+24h)
const computeVerificationDeadline = (moveInDate) => {
  const base = moveInDate ? new Date(moveInDate) : new Date();
  return new Date(base.getTime() + 24*60*60*1000);
};

async function main() {
  console.log('🌱 Starting move-in demo seeding...');

  try {
    // Hash passwords
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create tenant user
    console.log('👤 Creating tenant user...');
    const tenant = await prisma.user.upsert({
      where: { email: 'movein-tenant@demo.com' },
      update: {},
      create: {
        name: 'Move-In Demo Tenant',
        email: 'movein-tenant@demo.com',
        password: hashedPassword,
        role: 'TENANT',
        firstName: 'Demo',
        lastName: 'Tenant',
        phoneNumber: '+48573997770',
        citizenship: 'Polish',
        pesel: '90010112346',
        street: 'Demo Street 123',
        city: 'Warszawa',
        zipCode: '00-001',
        country: 'Poland',
        profession: 'Software Developer',
        emailVerified: true,
        phoneVerified: true,
      },
    });
    console.log(`✅ Created tenant: ${tenant.email}`);

    // Create landlord user
    console.log('🏠 Creating landlord user...');
    const landlord = await prisma.user.upsert({
      where: { email: 'movein-landlord@demo.com' },
      update: {},
      create: {
        name: 'Move-In Demo Landlord',
        email: 'movein-landlord@demo.com',
        password: hashedPassword,
        role: 'LANDLORD',
        firstName: 'Demo',
        lastName: 'Landlord',
        phoneNumber: '+48573997771',
        citizenship: 'Polish',
        pesel: '85020267891',
        street: 'Demo Street 456',
        city: 'Warszawa',
        zipCode: '00-001',
        country: 'Poland',
        profession: 'Property Manager',
        emailVerified: true,
        phoneVerified: true,
      },
    });
    console.log(`✅ Created landlord: ${landlord.email}`);

    // Create organization for landlord
    console.log('🏢 Creating organization...');
    let organization = await prisma.organization.findFirst({
      where: { name: 'Move-In Demo Properties' },
    });
    
    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'Move-In Demo Properties',
          taxId: 'DEMO123456',
          regNumber: 'DEMO789',
          address: 'Demo Business Address 789, Warszawa, Poland',
          isPersonal: false,
        },
      });
      console.log(`✅ Created organization: ${organization.name}`);
    } else {
      console.log(`✅ Found existing organization: ${organization.name}`);
    }

    // Add landlord as organization owner
    console.log('👑 Adding landlord as organization owner...');
    await prisma.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId: landlord.id,
          organizationId: organization.id,
        },
      },
      update: { role: 'OWNER' },
      create: {
        userId: landlord.id,
        organizationId: organization.id,
        role: 'OWNER',
      },
    });
    console.log('✅ Added landlord as organization owner');

    // Create property
    console.log('🏘️ Creating property...');
    let property = await prisma.property.findFirst({
      where: { name: 'Move-In Demo Apartment' },
    });
    
    if (!property) {
      property = await prisma.property.create({
        data: {
          name: 'Move-In Demo Apartment',
          address: 'Demo Property Street 123',
          city: 'Warszawa',
          district: 'Mokotów',
          zipCode: '00-001',
          country: 'Poland',
          propertyType: 'Apartment',
          bedrooms: 2,
          bathrooms: 1,
          size: 65.0,
          floor: 3,
          totalFloors: 8,
          monthlyRent: 3500.0,
          depositAmount: 3500.0,
          utilitiesIncluded: true,
          availableFrom: new Date(),
          furnished: true,
          parking: true,
          petsAllowed: false,
          smokingAllowed: false,
          status: 'AVAILABLE',
          maxTenants: 2,
          description: 'Beautiful demo apartment for move-in testing',
          organizationId: organization.id,
        },
      });
      console.log(`✅ Created property: ${property.name}`);
    } else {
      console.log(`✅ Found existing property: ${property.name}`);
    }

    // Create unit for the property
    console.log('🏠 Creating unit...');
    let unit = await prisma.unit.findFirst({
      where: { 
        propertyId: property.id,
        unitNumber: '3A'
      },
    });
    
    if (!unit) {
      unit = await prisma.unit.create({
        data: {
          unitNumber: '3A',
          floor: 3,
          bedrooms: 2,
          bathrooms: 1,
          area: 65.0,
          rentAmount: 3500.0,
          status: 'AVAILABLE',
          propertyId: property.id,
        },
      });
      console.log(`✅ Created unit: ${unit.unitNumber}`);
    } else {
      console.log(`✅ Found existing unit: ${unit.unitNumber}`);
    }

    // Create tenant group
    console.log('👥 Creating tenant group...');
    let tenantGroup = await prisma.tenantGroup.findFirst({
      where: { name: 'Move-In Demo Group' },
    });
    
    if (!tenantGroup) {
      tenantGroup = await prisma.tenantGroup.create({
        data: {
          name: 'Move-In Demo Group',
        },
      });
      console.log(`✅ Created tenant group: ${tenantGroup.name}`);
    } else {
      console.log(`✅ Found existing tenant group: ${tenantGroup.name}`);
    }

    // Add tenant to tenant group
    console.log('➕ Adding tenant to group...');
    await prisma.tenantGroupMember.upsert({
      where: {
        userId_tenantGroupId: {
          userId: tenant.id,
          tenantGroupId: tenantGroup.id,
        },
      },
      update: { isPrimary: true },
      create: {
        userId: tenant.id,
        tenantGroupId: tenantGroup.id,
        isPrimary: true,
      },
    });
    console.log('✅ Added tenant to group as primary');

    // Create rental request (required for offer)
    console.log('📝 Creating rental request...');
    let rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: 999999 },
    });
    
    if (!rentalRequest) {
      rentalRequest = await prisma.rentalRequest.create({
        data: {
          id: 999999,
          title: 'Move-In Demo Request',
          description: 'Demo rental request for move-in testing',
          location: 'Warszawa, Mokotów',
          moveInDate: new Date(),
          budget: 4000.0,
          propertyType: 'Apartment',
          district: 'Mokotów',
          bedrooms: 2,
          bathrooms: 1,
          furnished: true,
          status: 'ACTIVE',
          tenantGroupId: tenantGroup.id,
        },
      });
      console.log(`✅ Created rental request: ${rentalRequest.id}`);
    } else {
      console.log(`✅ Found existing rental request: ${rentalRequest.id}`);
    }

    // Create offer with move-in verification
    console.log('💼 Creating PAID offer with move-in verification...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0); // 10:00 AM local time

    let offer = await prisma.offer.findFirst({
      where: { 
        rentalRequestId: rentalRequest.id,
        tenantGroupId: tenantGroup.id,
      },
    });
    
    if (!offer) {
      offer = await prisma.offer.create({
        data: {
          rentAmount: 3500.0,
          depositAmount: 3500.0,
          leaseDuration: 12,
          description: 'Demo offer for move-in testing',
          utilitiesIncluded: true,
          availableFrom: tomorrow,
          status: 'ACCEPTED',
          isPaid: true,
          paymentDate: new Date(),
          leaseStartDate: tomorrow,
          moveInVerificationStatus: 'PENDING',
          moveInVerificationDeadline: computeVerificationDeadline(tomorrow),
          rentalRequestId: rentalRequest.id,
          propertyId: property.id,
          organizationId: organization.id,
          tenantGroupId: tenantGroup.id,
        },
      });
      console.log(`✅ Created offer: ${offer.id}`);
    } else {
      console.log(`✅ Found existing offer: ${offer.id}`);
    }

    // Create lease linked to the offer
    console.log('📋 Creating lease...');
    const leaseEndDate = new Date(tomorrow);
    leaseEndDate.setMonth(leaseEndDate.getMonth() + 12);

    let lease = await prisma.lease.findFirst({
      where: { unitId: unit.id },
    });
    
    if (!lease) {
      lease = await prisma.lease.create({
        data: {
          startDate: tomorrow,
          endDate: leaseEndDate,
          rentAmount: 3500.0,
          depositAmount: 3500.0,
          status: 'ACTIVE',
          unitId: unit.id,
          offerId: offer.id,
          propertyId: property.id,
          organizationId: organization.id,
          tenantGroupId: tenantGroup.id,
        },
      });
      console.log(`✅ Created lease: ${lease.id}`);
    } else {
      console.log(`✅ Found existing lease: ${lease.id}`);
    }

    // Update unit status to OCCUPIED
    console.log('🔄 Updating unit status...');
    await prisma.unit.update({
      where: { id: unit.id },
      data: { status: 'OCCUPIED' },
    });
    console.log('✅ Updated unit status to OCCUPIED');

    // Update property status to RENTED
    console.log('🔄 Updating property status...');
    await prisma.property.update({
      where: { id: property.id },
      data: { 
        status: 'RENTED',
        currentTenants: 2,
        availability: false
      },
    });
    console.log('✅ Updated property status to RENTED');

    console.log('\n🎉 Move-in demo seeding completed successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('==================');
    console.log('👤 Tenant:');
    console.log(`   Email: ${tenant.email}`);
    console.log('   Password: password123');
    console.log(`   User ID: ${tenant.id}`);
    console.log('');
    console.log('🏠 Landlord:');
    console.log(`   Email: ${landlord.email}`);
    console.log('   Password: password123');
    console.log(`   User ID: ${landlord.id}`);
    console.log('');
    console.log('🔑 Test Data:');
    console.log(`   Offer ID: ${offer.id}`);
    console.log(`   Lease ID: ${lease.id}`);
    console.log(`   Property ID: ${property.id}`);
    console.log(`   Organization ID: ${organization.id}`);
    console.log(`   Tenant Group ID: ${tenantGroup.id}`);
    console.log('');
    console.log('🌐 Test URLs:');
    console.log(`   Move-In Center: /move-in?offerId=${offer.id}`);
    console.log(`   Frontend: http://localhost:3002/move-in?offerId=${offer.id}`);
    console.log(`   Backend API: http://localhost:3001/api/move-in/offers/${offer.id}/status`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
