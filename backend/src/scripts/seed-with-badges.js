import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding with badges...');

  try {
    // Hash passwords
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create test users
    console.log('\n👥 Creating test users...');
    const users = [
      {
        name: 'John Tenant',
        email: 'tenant@test.com',
        password: hashedPassword,
        role: 'TENANT',
        firstName: 'John',
        lastName: 'Tenant',
        phoneNumber: '+48573997766',
        citizenship: 'Polish',
        pesel: '90010112345',
        street: 'Warszawska 123',
        city: 'Warszawa',
        zipCode: '00-001',
        country: 'Poland',
        profession: 'Software Developer',
        emailVerified: true,
        phoneVerified: true,
      },
      {
        name: 'Anna Landlord',
        email: 'landlord@test.com',
        password: hashedPassword,
        role: 'LANDLORD',
        firstName: 'Anna',
        lastName: 'Landlord',
        phoneNumber: '+48573997767',
        citizenship: 'Polish',
        pesel: '85020267890',
        street: 'Krakowska 456',
        city: 'Kraków',
        zipCode: '30-001',
        country: 'Poland',
        profession: 'Property Manager',
        emailVerified: true,
        phoneVerified: true,
      },
      {
        name: 'Maria Admin',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'ADMIN',
        firstName: 'Maria',
        lastName: 'Admin',
        phoneNumber: '+48573997768',
        citizenship: 'Polish',
        pesel: '80030311111',
        street: 'Gdańska 789',
        city: 'Gdańsk',
        zipCode: '80-001',
        country: 'Poland',
        profession: 'System Administrator',
        emailVerified: true,
        phoneVerified: true,
      },
    ];

    const createdUsers = [];
    for (const userData of users) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email },
        });

        if (existingUser) {
          console.log(`⚠️  User ${userData.email} already exists, skipping...`);
          createdUsers.push(existingUser);
          continue;
        }

        const user = await prisma.user.create({
          data: userData,
        });

        console.log(`✅ Created user: ${user.email} (${user.role})`);
        createdUsers.push(user);
      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }

    // Create organizations
    console.log('\n🏢 Creating organizations...');
    const organizations = [
      {
        name: 'Business Landlord',
        isPersonal: false,
        taxId: '1234567890',
        regNumber: 'REG123456',
        address: 'Krakowska 456, Kraków, 30-001, Poland',
      },
      {
        name: 'Personal Landlord',
        isPersonal: true,
        address: 'Gdańska 789, Gdańsk, 80-001, Poland',
      },
    ];

    const createdOrganizations = [];
    for (const orgData of organizations) {
      try {
        const existingOrg = await prisma.organization.findFirst({
          where: { name: orgData.name },
        });

        if (existingOrg) {
          console.log(`⚠️  Organization ${orgData.name} already exists, skipping...`);
          createdOrganizations.push(existingOrg);
          continue;
        }

        const org = await prisma.organization.create({
          data: orgData,
        });

        console.log(`✅ Created organization: ${org.name}`);
        createdOrganizations.push(org);
      } catch (error) {
        console.error(`❌ Error creating organization ${orgData.name}:`, error.message);
      }
    }

    // Create organization members
    console.log('\n👥 Creating organization members...');
    const landlordUser = createdUsers.find(u => u.role === 'LANDLORD');
    const businessOrg = createdOrganizations.find(o => o.name === 'Business Landlord');
    const personalOrg = createdOrganizations.find(o => o.name === 'Personal Landlord');

    if (landlordUser && businessOrg) {
      try {
        await prisma.organizationMember.create({
          data: {
            userId: landlordUser.id,
            organizationId: businessOrg.id,
            role: 'OWNER',
          },
        });
        console.log(`✅ Added ${landlordUser.email} as OWNER of ${businessOrg.name}`);
      } catch (error) {
        console.log(`⚠️  Organization member already exists or error: ${error.message}`);
      }
    }

    // Create properties
    console.log('\n🏠 Creating properties...');
    if (businessOrg) {
      try {
        const property = await prisma.property.create({
          data: {
            name: 'Modern Apartment in Poznan',
            address: 'Jarochowskiego 97/19, Łazarz, 60-129, Poznan',
            city: 'Poznan',
            district: 'Łazarz',
            zipCode: '60-129',
            country: 'Poland',
            propertyType: 'room',
            bedrooms: 1,
            bathrooms: 1,
            size: 19.0,
            monthlyRent: 1000,
            depositAmount: 1000,
            utilitiesIncluded: true,
            furnished: true,
            parking: true,
            petsAllowed: false,
            status: 'AVAILABLE',
            availability: true,
            organizationId: businessOrg.id,
            description: 'Cozy room in a modern apartment building',
            houseRules: 'No smoking, quiet hours 22:00-07:00',
            images: ['/uploads/properties/room1.jpg', '/uploads/properties/room2.jpg'],
          },
        });
        console.log(`✅ Created property: ${property.name}`);
      } catch (error) {
        console.log(`⚠️  Property already exists or error: ${error.message}`);
      }
    }

    // Create tenant groups
    console.log('\n👥 Creating tenant groups...');
    const tenantUser = createdUsers.find(u => u.role === 'TENANT');
    if (tenantUser) {
      try {
        const tenantGroup = await prisma.tenantGroup.create({
          data: {
            name: 'John Tenant Group',
          },
        });

        // Add tenant to group
        await prisma.tenantGroupMember.create({
          data: {
            userId: tenantUser.id,
            tenantGroupId: tenantGroup.id,
            role: 'PRIMARY',
            isPrimary: true,
          },
        });

        console.log(`✅ Created tenant group: ${tenantGroup.name}`);
      } catch (error) {
        console.log(`⚠️  Tenant group already exists or error: ${error.message}`);
      }
    }

    // Create badge definitions
    console.log('\n🏆 Creating badge definitions...');
    const badgeDefinitions = [
      {
        name: 'Perfect Payer',
        description: 'Awarded to tenants who maintain perfect payment records over a full year',
        icon: '💰',
        category: 'TENANT',
        criteria: '100% on-time payments for 12 consecutive months',
        color: 'gold',
      },
      {
        name: 'Accurate Host',
        description: 'Awarded to landlords whose properties consistently match their descriptions',
        icon: '🏠',
        category: 'HOST',
        criteria: '95%+ move-in "as described" accuracy',
        color: 'blue',
      },
      {
        name: 'Quick Responder',
        description: 'Awarded to landlords who respond quickly to tenant inquiries',
        icon: '⚡',
        category: 'HOST',
        criteria: 'Average first response time under 24 hours',
        color: 'green',
      },
      {
        name: 'Trusted Tenant',
        description: 'Awarded to tenants with excellent rental history',
        icon: '⭐',
        category: 'TENANT',
        criteria: '5+ positive reviews with 4.5+ average rating',
        color: 'silver',
      },
    ];

    const createdBadges = [];
    for (const badgeData of badgeDefinitions) {
      try {
        const existingBadge = await prisma.badge.findFirst({
          where: { name: badgeData.name },
        });

        if (existingBadge) {
          console.log(`⚠️  Badge ${badgeData.name} already exists, skipping...`);
          createdBadges.push(existingBadge);
          continue;
        }

        const badge = await prisma.badge.create({
          data: badgeData,
        });

        console.log(`✅ Created badge: ${badge.name} (${badge.icon})`);
        createdBadges.push(badge);
      } catch (error) {
        console.error(`❌ Error creating badge ${badgeData.name}:`, error.message);
      }
    }

    // Create user badges (award some badges to test users)
    console.log('\n🎖️  Awarding badges to test users...');
    const perfectPayerBadge = createdBadges.find(b => b.name === 'Perfect Payer');
    const accurateHostBadge = createdBadges.find(b => b.name === 'Accurate Host');
    const quickResponderBadge = createdBadges.find(b => b.name === 'Quick Responder');
    const trustedTenantBadge = createdBadges.find(b => b.name === 'Trusted Tenant');

    if (tenantUser && perfectPayerBadge) {
      try {
        await prisma.userBadge.create({
          data: {
            userId: tenantUser.id,
            badgeId: perfectPayerBadge.id,
            earnedAt: new Date(),
            metadata: JSON.stringify({
              percentage: 100,
              months: 12,
            }),
            isActive: true,
          },
        });
        console.log(`✅ Awarded ${perfectPayerBadge.name} to ${tenantUser.email}`);
      } catch (error) {
        console.log(`⚠️  User badge already exists or error: ${error.message}`);
      }
    }

    if (tenantUser && trustedTenantBadge) {
      try {
        await prisma.userBadge.create({
          data: {
            userId: tenantUser.id,
            badgeId: trustedTenantBadge.id,
            earnedAt: new Date(),
            metadata: JSON.stringify({
              reviews: 7,
              averageRating: 4.8,
            }),
            isActive: true,
          },
        });
        console.log(`✅ Awarded ${trustedTenantBadge.name} to ${tenantUser.email}`);
      } catch (error) {
        console.log(`⚠️  User badge already exists or error: ${error.message}`);
      }
    }

    if (landlordUser && accurateHostBadge) {
      try {
        await prisma.userBadge.create({
          data: {
            userId: landlordUser.id,
            badgeId: accurateHostBadge.id,
            earnedAt: new Date(),
            metadata: JSON.stringify({
              percentage: 97,
              properties: 3,
            }),
            isActive: true,
          },
        });
        console.log(`✅ Awarded ${accurateHostBadge.name} to ${landlordUser.email}`);
      } catch (error) {
        console.log(`⚠️  User badge already exists or error: ${error.message}`);
      }
    }

    if (landlordUser && quickResponderBadge) {
      try {
        await prisma.userBadge.create({
          data: {
            userId: landlordUser.id,
            badgeId: quickResponderBadge.id,
            earnedAt: new Date(),
            metadata: JSON.stringify({
              avgResponseTime: 18,
              inquiries: 25,
            }),
            isActive: true,
          },
        });
        console.log(`✅ Awarded ${quickResponderBadge.name} to ${landlordUser.email}`);
      } catch (error) {
        console.log(`⚠️  User badge already exists or error: ${error.message}`);
      }
    }

    console.log('\n🎉 Comprehensive database seeding completed!');
    console.log('\n📋 Test User Credentials:');
    console.log('========================');
    console.log('👤 Tenant (John Tenant):');
    console.log('   Email: tenant@test.com');
    console.log('   Password: password123');
    console.log('   Role: TENANT');
    console.log('   Badges: Perfect Payer, Trusted Tenant');
    console.log('');
    console.log('🏠 Landlord (Anna Landlord):');
    console.log('   Email: landlord@test.com');
    console.log('   Password: password123');
    console.log('   Role: LANDLORD');
    console.log('   Badges: Accurate Host, Quick Responder');
    console.log('');
    console.log('👨‍💼 Admin (Maria Admin):');
    console.log('   Email: admin@test.com');
    console.log('   Password: password123');
    console.log('   Role: ADMIN');
    console.log('');
    console.log('🔗 Frontend URL: http://localhost:3002/');
    console.log('🔗 Backend URL: http://localhost:3001/');
    console.log('');
    console.log('🏆 Badge System Ready:');
    console.log('   - Visit tenant profile to see Perfect Payer and Trusted Tenant badges');
    console.log('   - Visit landlord profile to see Accurate Host and Quick Responder badges');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
