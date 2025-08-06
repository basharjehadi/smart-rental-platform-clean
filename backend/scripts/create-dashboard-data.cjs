const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createDashboardData() {
  try {
    console.log('Creating dashboard data...');

    // Find or create a landlord user
    let landlord = await prisma.user.findFirst({
      where: { role: 'LANDLORD' }
    });

    if (!landlord) {
      landlord = await prisma.user.create({
        data: {
          name: 'Piotr Kowalski',
          email: 'landlord@test.com',
          password: '$2b$10$example', // You should hash this properly
          role: 'LANDLORD',
          firstName: 'Piotr',
          lastName: 'Kowalski',
          phoneNumber: '+48123456789'
        }
      });
    }

    // Find or create tenant users
    const tenants = [];
    const tenantData = [
      { name: 'Anna Nowak', email: 'anna@test.com' },
      { name: 'Tomasz Wiśniewski', email: 'tomasz@test.com' },
      { name: 'Magdalena Dąbrowska', email: 'magdalena@test.com' }
    ];

    for (const tenantInfo of tenantData) {
      let tenant = await prisma.user.findFirst({
        where: { email: tenantInfo.email }
      });

      if (!tenant) {
        tenant = await prisma.user.create({
          data: {
            name: tenantInfo.name,
            email: tenantInfo.email,
            password: '$2b$10$example',
            role: 'TENANT',
            firstName: tenantInfo.name.split(' ')[0],
            lastName: tenantInfo.name.split(' ')[1],
            phoneNumber: '+48123456789'
          }
        });
      }
      tenants.push(tenant);
    }

    // Create properties
    const properties = [];
    const propertyData = [
      {
        name: 'Mokotów Residence',
        address: 'ul. Mokotowska 15',
        city: 'Warszawa',
        zipCode: '00-001',
        propertyType: 'apartment',
        bedrooms: 2,
        bathrooms: 1,
        size: 65,
        monthlyRent: 3500,
        depositAmount: 3500,
        status: 'RENTED'
      },
      {
        name: 'Śródmieście Apartments',
        address: 'ul. Marszałkowska 45',
        city: 'Warszawa',
        zipCode: '00-002',
        propertyType: 'apartment',
        bedrooms: 1,
        bathrooms: 1,
        size: 45,
        monthlyRent: 2800,
        depositAmount: 2800,
        status: 'RENTED'
      },
      {
        name: 'Praga Loft',
        address: 'ul. Targowa 12',
        city: 'Warszawa',
        zipCode: '00-003',
        propertyType: 'apartment',
        bedrooms: 3,
        bathrooms: 2,
        size: 85,
        monthlyRent: 4200,
        depositAmount: 4200,
        status: 'RENTED'
      },
      {
        name: 'Żoliborz Studios',
        address: 'ul. Słowackiego 8',
        city: 'Warszawa',
        zipCode: '00-004',
        propertyType: 'apartment',
        bedrooms: 1,
        bathrooms: 1,
        size: 35,
        monthlyRent: 2200,
        depositAmount: 2200,
        status: 'AVAILABLE'
      }
    ];

    for (const propertyInfo of propertyData) {
      let property = await prisma.property.findFirst({
        where: { 
          landlordId: landlord.id,
          name: propertyInfo.name 
        }
      });

      if (!property) {
        property = await prisma.property.create({
          data: {
            ...propertyInfo,
            landlordId: landlord.id,
            description: `Beautiful ${propertyInfo.propertyType} in ${propertyInfo.city}`,
            houseRules: 'No smoking, pets allowed with deposit',
            furnished: true,
            parking: true,
            petsAllowed: true,
            smokingAllowed: false
          }
        });
      }
      properties.push(property);
    }

    // Create units for each property
    const units = [];
    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      const unitData = {
        unitNumber: `${i + 1}01`,
        floor: i + 1,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.size,
        rentAmount: property.monthlyRent,
        status: property.status === 'RENTED' ? 'OCCUPIED' : 'AVAILABLE',
        propertyId: property.id
      };

      let unit = await prisma.unit.findFirst({
        where: { 
          propertyId: property.id,
          unitNumber: unitData.unitNumber 
        }
      });

      if (!unit) {
        unit = await prisma.unit.create({
          data: unitData
        });
      }
      units.push(unit);
    }

    // Create leases for rented properties
    const leases = [];
    for (let i = 0; i < 3; i++) { // First 3 properties are rented
      const unit = units[i];
      const tenant = tenants[i];
      
      const leaseData = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        rentAmount: unit.rentAmount,
        depositAmount: unit.rentAmount,
        status: 'ACTIVE',
        tenantId: tenant.id,
        unitId: unit.id
      };

      let lease = await prisma.lease.findFirst({
        where: { unitId: unit.id }
      });

      if (!lease) {
        lease = await prisma.lease.create({
          data: leaseData
        });
      }
      leases.push(lease);
    }

    // Create payments
    const payments = [];
    for (let i = 0; i < leases.length; i++) {
      const lease = leases[i];
      
      // Create payments for the last 6 months
      for (let month = 7; month <= 12; month++) {
        const paymentData = {
          amount: lease.rentAmount,
          currency: 'PLN',
          status: 'SUCCEEDED',
          purpose: 'RENT',
          gateway: 'STRIPE',
          userId: lease.tenantId,
          leaseId: lease.id,
          createdAt: new Date(`2024-${month.toString().padStart(2, '0')}-01`),
          paidAt: new Date(`2024-${month.toString().padStart(2, '0')}-01`)
        };

        let payment = await prisma.payment.findFirst({
          where: {
            leaseId: lease.id,
            createdAt: new Date(`2024-${month.toString().padStart(2, '0')}-01`)
          }
        });

        if (!payment) {
          payment = await prisma.payment.create({
            data: paymentData
          });
        }
        payments.push(payment);
      }
    }

    // Create reviews
    const reviews = [];
    const reviewData = [
      {
        rating: 5,
        comment: 'Excellent landlord! Very responsive to maintenance requests and professional communication.',
        tenantId: tenants[0].id,
        leaseId: leases[0].id
      },
      {
        rating: 4,
        comment: 'Great property management. Only minor delay with heating repair, but overall satisfied.',
        tenantId: tenants[1].id,
        leaseId: leases[1].id
      },
      {
        rating: 5,
        comment: 'Professional and fair landlord. Property is well-maintained and location is perfect.',
        tenantId: tenants[2].id,
        leaseId: leases[2].id
      }
    ];

    for (const reviewInfo of reviewData) {
      let review = await prisma.review.findFirst({
        where: {
          tenantId: reviewInfo.tenantId,
          leaseId: reviewInfo.leaseId
        }
      });

      if (!review) {
        review = await prisma.review.create({
          data: {
            ...reviewInfo,
            createdAt: new Date('2024-12-10')
          }
        });
      }
      reviews.push(review);
    }

    // Create maintenance requests
    const maintenanceRequests = [];
    const maintenanceData = [
      {
        title: 'Heating Issue',
        description: 'Radiator not working properly in living room',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        leaseId: leases[1].id
      },
      {
        title: 'Leaky Faucet',
        description: 'Kitchen faucet is dripping',
        priority: 'LOW',
        status: 'COMPLETED',
        leaseId: leases[0].id
      }
    ];

    for (const maintenanceInfo of maintenanceData) {
      let maintenance = await prisma.maintenanceRequest.findFirst({
        where: {
          leaseId: maintenanceInfo.leaseId,
          title: maintenanceInfo.title
        }
      });

      if (!maintenance) {
        maintenance = await prisma.maintenanceRequest.create({
          data: maintenanceInfo
        });
      }
      maintenanceRequests.push(maintenance);
    }

    console.log('Dashboard data created successfully!');
    console.log(`Created ${properties.length} properties`);
    console.log(`Created ${units.length} units`);
    console.log(`Created ${leases.length} leases`);
    console.log(`Created ${payments.length} payments`);
    console.log(`Created ${reviews.length} reviews`);
    console.log(`Created ${maintenanceRequests.length} maintenance requests`);

  } catch (error) {
    console.error('Error creating dashboard data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDashboardData(); 