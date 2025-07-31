import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const checkContracts = async () => {
  try {
    console.log('🔍 Checking current contract and payment status...\n');

    // Check all rental requests
    const rentalRequests = await prisma.rentalRequest.findMany({
      include: {
        tenant: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        offer: {
          include: {
            landlord: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        payments: {
          where: {
            status: 'SUCCEEDED'
          }
        },
        contract: true
      }
    });

    console.log(`📊 Found ${rentalRequests.length} rental requests total\n`);

    rentalRequests.forEach((request, index) => {
      console.log(`${index + 1}. Rental Request ID: ${request.id}`);
      console.log(`   Title: ${request.title}`);
      console.log(`   Status: ${request.status}`);
      console.log(`   Tenant: ${request.tenant?.firstName} ${request.tenant?.lastName}`);
      console.log(`   Offer Status: ${request.offer?.status || 'No offer'}`);
      console.log(`   Landlord: ${request.offer?.landlord?.firstName} ${request.offer?.landlord?.lastName}`);
      console.log(`   Payments: ${request.payments.length} successful payments`);
      request.payments.forEach(payment => {
        console.log(`     - ${payment.purpose}: ${payment.amount} PLN (${payment.status})`);
      });
      console.log(`   Contract: ${request.contract ? `Yes (${request.contract.contractNumber})` : 'No'}`);
      console.log('');
    });

    // Check contracts specifically
    const contracts = await prisma.contract.findMany({
      include: {
        rentalRequest: {
          include: {
            tenant: true,
            offer: {
              include: {
                landlord: true
              }
            }
          }
        }
      }
    });

    console.log(`📄 Found ${contracts.length} contracts total\n`);

    contracts.forEach((contract, index) => {
      console.log(`${index + 1}. Contract ID: ${contract.id}`);
      console.log(`   Contract Number: ${contract.contractNumber}`);
      console.log(`   Status: ${contract.status}`);
      console.log(`   PDF URL: ${contract.pdfUrl}`);
      console.log(`   Rental Request: ${contract.rentalRequest.title}`);
      console.log(`   Tenant: ${contract.rentalRequest.tenant.firstName} ${contract.rentalRequest.tenant.lastName}`);
      console.log(`   Landlord: ${contract.rentalRequest.offer.landlord.firstName} ${contract.rentalRequest.offer.landlord.lastName}`);
      console.log(`   Generated: ${contract.generatedAt}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error checking contracts:', error);
  } finally {
    await prisma.$disconnect();
  }
};

checkContracts(); 