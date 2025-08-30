const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateToOrganizationModel() {
  console.log(
    '🚀 Starting migration to Organization and TenantGroup models...'
  );

  try {
    // Step 1: Create organizations for existing landlords
    console.log(
      '\n📋 Step 1: Creating organizations for existing landlords...'
    );
    const landlords = await prisma.user.findMany({
      where: { role: 'LANDLORD' },
      select: { id: true, name: true, address: true, email: true },
    });

    console.log(`Found ${landlords.length} landlords to migrate`);

    for (const landlord of landlords) {
      const orgName = landlord.name || `Landlord ${landlord.id.slice(-6)}`;
      const orgAddress = landlord.address || 'Address not specified';

      const organization = await prisma.organization.create({
        data: {
          name: orgName,
          address: orgAddress,
          taxId: null,
          regNumber: null,
          signatureBase64: null,
        },
      });

      console.log(
        `✅ Created organization: ${organization.name} (${organization.id})`
      );

      // Add landlord as organization owner
      await prisma.organizationMember.create({
        data: {
          userId: landlord.id,
          organizationId: organization.id,
          role: 'OWNER',
        },
      });

      console.log(
        `✅ Added ${landlord.name || landlord.id} as OWNER of organization`
      );
    }

    // Step 2: Create tenant groups for existing tenants
    console.log('\n👥 Step 2: Creating tenant groups for existing tenants...');
    const tenants = await prisma.user.findMany({
      where: { role: 'TENANT' },
      select: { id: true, name: true, email: true },
    });

    console.log(`Found ${tenants.length} tenants to migrate`);

    for (const tenant of tenants) {
      const groupName = tenant.name || `Tenant Group ${tenant.id.slice(-6)}`;

      const tenantGroup = await prisma.tenantGroup.create({
        data: {
          name: groupName,
        },
      });

      console.log(
        `✅ Created tenant group: ${tenantGroup.name} (${tenantGroup.id})`
      );

      // Add tenant as primary member of the group
      await prisma.tenantGroupMember.create({
        data: {
          userId: tenant.id,
          tenantGroupId: tenantGroup.id,
          isPrimary: true,
        },
      });

      console.log(
        `✅ Added ${tenant.name || tenant.id} as PRIMARY member of tenant group`
      );
    }

    // Step 3: Update properties to reference organizations
    console.log(
      '\n🏠 Step 3: Updating properties to reference organizations...'
    );
    const properties = await prisma.property.findMany({
      select: { id: true, landlordId: true },
    });

    console.log(`Found ${properties.length} properties to migrate`);

    for (const property of properties) {
      if (property.landlordId) {
        // Find the organization for this landlord
        const orgMember = await prisma.organizationMember.findFirst({
          where: { userId: property.landlordId },
          include: { organization: true },
        });

        if (orgMember) {
          await prisma.property.update({
            where: { id: property.id },
            data: { organizationId: orgMember.organization.id },
          });

          console.log(
            `✅ Updated property ${property.id} to reference organization ${orgMember.organization.name}`
          );
        } else {
          console.log(
            `⚠️  No organization found for landlord ${property.landlordId}, property ${property.id} skipped`
          );
        }
      }
    }

    // Step 4: Update rental requests to reference tenant groups
    console.log(
      '\n📝 Step 4: Updating rental requests to reference tenant groups...'
    );
    const rentalRequests = await prisma.rentalRequest.findMany({
      select: { id: true, tenantId: true },
    });

    console.log(`Found ${rentalRequests.length} rental requests to migrate`);

    for (const request of rentalRequests) {
      if (request.tenantId) {
        // Find the tenant group for this tenant
        const groupMember = await prisma.tenantGroupMember.findFirst({
          where: { userId: request.tenantId },
          include: { tenantGroup: true },
        });

        if (groupMember) {
          await prisma.rentalRequest.update({
            where: { id: request.id },
            data: { tenantGroupId: groupMember.tenantGroup.id },
          });

          console.log(
            `✅ Updated rental request ${request.id} to reference tenant group ${groupMember.tenantGroup.name}`
          );
        } else {
          console.log(
            `⚠️  No tenant group found for tenant ${request.tenantId}, rental request ${request.id} skipped`
          );
        }
      }
    }

    // Step 5: Update offers to reference organizations and tenant groups
    console.log(
      '\n💼 Step 5: Updating offers to reference organizations and tenant groups...'
    );
    const offers = await prisma.offer.findMany({
      select: { id: true, landlordId: true, tenantId: true },
    });

    console.log(`Found ${offers.length} offers to migrate`);

    for (const offer of offers) {
      let updateData = {};

      // Update landlord reference to organization
      if (offer.landlordId) {
        const orgMember = await prisma.organizationMember.findFirst({
          where: { userId: offer.landlordId },
          include: { organization: true },
        });

        if (orgMember) {
          updateData.organizationId = orgMember.organization.id;
          console.log(
            `✅ Offer ${offer.id}: landlord ${offer.landlordId} → organization ${orgMember.organization.name}`
          );
        }
      }

      // Update tenant reference to tenant group
      if (offer.tenantId) {
        const groupMember = await prisma.tenantGroupMember.findFirst({
          where: { userId: offer.tenantId },
          include: { tenantGroup: true },
        });

        if (groupMember) {
          updateData.tenantGroupId = groupMember.tenantGroup.id;
          console.log(
            `✅ Offer ${offer.id}: tenant ${offer.tenantId} → tenant group ${groupMember.tenantGroup.name}`
          );
        }
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.offer.update({
          where: { id: offer.id },
          data: updateData,
        });
      }
    }

    // Step 6: Update leases to reference tenant groups
    console.log('\n📋 Step 6: Updating leases to reference tenant groups...');
    const leases = await prisma.lease.findMany({
      select: { id: true, tenantId: true },
    });

    console.log(`Found ${leases.length} leases to migrate`);

    for (const lease of leases) {
      if (lease.tenantId) {
        // Find the tenant group for this tenant
        const groupMember = await prisma.tenantGroupMember.findFirst({
          where: { userId: lease.tenantId },
          include: { tenantGroup: true },
        });

        if (groupMember) {
          await prisma.lease.update({
            where: { id: lease.id },
            data: { tenantGroupId: groupMember.tenantGroup.id },
          });

          console.log(
            `✅ Updated lease ${lease.id} to reference tenant group ${groupMember.tenantGroup.name}`
          );
        } else {
          console.log(
            `⚠️  No tenant group found for tenant ${lease.tenantId}, lease ${lease.id} skipped`
          );
        }
      }
    }

    // Step 7: Update payments to reference tenant groups
    console.log('\n💰 Step 7: Updating payments to reference tenant groups...');
    const payments = await prisma.payment.findMany({
      select: { id: true, userId: true },
    });

    console.log(`Found ${payments.length} payments to migrate`);

    for (const payment of payments) {
      if (payment.userId) {
        // Find the tenant group for this user
        const groupMember = await prisma.tenantGroupMember.findFirst({
          where: { userId: payment.userId },
          include: { tenantGroup: true },
        });

        if (groupMember) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              tenantGroupId: groupMember.tenantGroup.id,
              userId: payment.userId, // Keep the user reference for tracking who made the payment
            },
          });

          console.log(
            `✅ Updated payment ${payment.id} to reference tenant group ${groupMember.tenantGroup.name}`
          );
        } else {
          console.log(
            `⚠️  No tenant group found for user ${payment.userId}, payment ${payment.id} skipped`
          );
        }
      }
    }

    // Step 8: Update rent payments to reference tenant groups
    console.log(
      '\n🏠 Step 8: Updating rent payments to reference tenant groups...'
    );
    const rentPayments = await prisma.rentPayment.findMany({
      select: { id: true, userId: true },
    });

    console.log(`Found ${rentPayments.length} rent payments to migrate`);

    for (const rentPayment of rentPayments) {
      if (rentPayment.userId) {
        // Find the tenant group for this user
        const groupMember = await prisma.tenantGroupMember.findFirst({
          where: { userId: rentPayment.userId },
          include: { tenantGroup: true },
        });

        if (groupMember) {
          await prisma.rentPayment.update({
            where: { id: rentPayment.id },
            data: {
              tenantGroupId: groupMember.tenantGroup.id,
              userId: rentPayment.userId, // Keep the user reference for tracking who is responsible
            },
          });

          console.log(
            `✅ Updated rent payment ${rentPayment.id} to reference tenant group ${groupMember.tenantGroup.name}`
          );
        } else {
          console.log(
            `⚠️  No tenant group found for user ${rentPayment.userId}, rent payment ${rentPayment.id} skipped`
          );
        }
      }
    }

    // Step 9: Update reviews to reference tenant groups
    console.log('\n⭐ Step 9: Updating reviews to reference tenant groups...');
    const reviews = await prisma.review.findMany({
      select: { id: true, targetUserId: true },
    });

    console.log(`Found ${reviews.length} reviews to migrate`);

    for (const review of reviews) {
      if (review.targetUserId) {
        // Find the tenant group for this target user
        const groupMember = await prisma.tenantGroupMember.findFirst({
          where: { userId: review.targetUserId },
          include: { tenantGroup: true },
        });

        if (groupMember) {
          await prisma.review.update({
            where: { id: review.id },
            data: { targetTenantGroupId: groupMember.tenantGroup.id },
          });

          console.log(
            `✅ Updated review ${review.id} to reference tenant group ${groupMember.tenantGroup.name}`
          );
        } else {
          console.log(
            `⚠️  No tenant group found for target user ${review.targetUserId}, review ${review.id} skipped`
          );
        }
      }
    }

    // Step 10: Update landlord request matches to reference organizations
    console.log(
      '\n🔗 Step 10: Updating landlord request matches to reference organizations...'
    );
    const matches = await prisma.landlordRequestMatch.findMany({
      select: { id: true, landlordId: true },
    });

    console.log(`Found ${matches.length} landlord request matches to migrate`);

    for (const match of matches) {
      if (match.landlordId) {
        // Find the organization for this landlord
        const orgMember = await prisma.organizationMember.findFirst({
          where: { userId: match.landlordId },
          include: { organization: true },
        });

        if (orgMember) {
          await prisma.landlordRequestMatch.update({
            where: { id: match.id },
            data: { organizationId: orgMember.organization.id },
          });

          console.log(
            `✅ Updated match ${match.id} to reference organization ${orgMember.organization.name}`
          );
        } else {
          console.log(
            `⚠️  No organization found for landlord ${match.landlordId}, match ${match.id} skipped`
          );
        }
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Created ${landlords.length} organizations`);
    console.log(`- Created ${tenants.length} tenant groups`);
    console.log(`- Updated ${properties.length} properties`);
    console.log(`- Updated ${rentalRequests.length} rental requests`);
    console.log(`- Updated ${offers.length} offers`);
    console.log(`- Updated ${leases.length} leases`);
    console.log(`- Updated ${payments.length} payments`);
    console.log(`- Updated ${rentPayments.length} rent payments`);
    console.log(`- Updated ${reviews.length} reviews`);
    console.log(`- Updated ${matches.length} landlord request matches`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateToOrganizationModel()
  .then(() => {
    console.log('✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
