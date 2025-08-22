// Test script to verify payment data consistency
// Run with: node test-payment-consistency.js

import { PrismaClient } from './backend/node_modules/.prisma/client/index.js';

const prisma = new PrismaClient();

async function testPaymentConsistency() {
  try {
    console.log('🔍 Testing Payment Data Consistency...\n');

    // Test 1: Get a tenant with payments
    console.log('📊 Test 1: Finding tenant with payments...');
    const tenantWithPayments = await prisma.rentPayment.findFirst({
      where: { status: 'SUCCEEDED' },
      include: { user: true }
    });

    if (!tenantWithPayments) {
      console.log('❌ No tenants with payments found. Please create some test data first.');
      return;
    }

    const tenantId = tenantWithPayments.userId;
    console.log(`✅ Found tenant: ${tenantWithPayments.user.name} (ID: ${tenantId})\n`);

    // Test 2: Get tenant's payment data (tenant view)
    console.log('📊 Test 2: Tenant Payment Data...');
    const tenantPayments = await prisma.payment.findMany({
      where: {
        OR: [
          { userId: tenantId, status: 'SUCCEEDED' },
          {
            rentalRequest: { tenantId: tenantId },
            status: 'SUCCEEDED'
          }
        ]
      }
    });

    const tenantRentPayments = await prisma.rentPayment.findMany({
      where: { userId: tenantId, status: 'SUCCEEDED' }
    });

    const tenantTotal = tenantPayments.reduce((sum, p) => sum + p.amount, 0) + 
                       tenantRentPayments.reduce((sum, p) => sum + p.amount, 0);

    console.log(`   General Payments: ${tenantPayments.length} (${tenantPayments.reduce((sum, p) => sum + p.amount, 0)} zł)`);
    console.log(`   Rent Payments: ${tenantRentPayments.length} (${tenantRentPayments.reduce((sum, p) => sum + p.amount, 0)} zł)`);
    console.log(`   Total Tenant View: ${tenantTotal} zł\n`);

    // Test 3: Get landlord's view of the same tenant
    console.log('📊 Test 3: Landlord View of Tenant...');
    const tenantOffer = await prisma.offer.findFirst({
      where: {
        rentalRequest: { tenantId: tenantId },
        status: 'PAID'
      },
      include: {
        landlord: true,
        rentalRequest: { include: { tenant: true } }
      }
    });

    if (!tenantOffer) {
      console.log('❌ No paid offer found for this tenant.');
      return;
    }

    const landlordId = tenantOffer.landlordId;
    console.log(`✅ Found landlord: ${tenantOffer.landlord.name} (ID: ${landlordId})\n`);

    // Test 4: Get landlord's payment data for this tenant
    console.log('📊 Test 4: Landlord Payment Data for Tenant...');
    const landlordGeneralPayments = await prisma.payment.findMany({
      where: {
        rentalRequest: {
          offers: {
            some: { landlordId: landlordId }
          }
        },
        status: 'SUCCEEDED'
      }
    });

    const landlordRentPayments = await prisma.rentPayment.findMany({
      where: {
        user: {
          rentalRequests: {
            some: {
              offers: {
                some: { landlordId: landlordId }
              }
            }
          }
        },
        status: 'SUCCEEDED'
      }
    });

    const landlordTotal = landlordGeneralPayments.reduce((sum, p) => sum + p.amount, 0) + 
                         landlordRentPayments.reduce((sum, p) => sum + p.amount, 0);

    console.log(`   General Payments: ${landlordGeneralPayments.length} (${landlordGeneralPayments.reduce((sum, p) => sum + p.amount, 0)} zł)`);
    console.log(`   Rent Payments: ${landlordRentPayments.length} (${landlordRentPayments.reduce((sum, p) => sum + p.amount, 0)} zł)`);
    console.log(`   Total Landlord View: ${landlordTotal} zł\n`);

    // Test 5: Consistency Check
    console.log('📊 Test 5: Consistency Check...');
    if (Math.abs(tenantTotal - landlordTotal) < 0.01) {
      console.log('✅ PASS: Payment totals are consistent between tenant and landlord views!');
    } else {
      console.log('❌ FAIL: Payment totals are inconsistent!');
      console.log(`   Tenant view: ${tenantTotal} zł`);
      console.log(`   Landlord view: ${landlordTotal} zł`);
      console.log(`   Difference: ${Math.abs(tenantTotal - landlordTotal)} zł`);
    }

    // Test 6: Payment Count Check
    console.log('\n📊 Test 6: Payment Count Check...');
    const tenantPaymentCount = tenantPayments.length + tenantRentPayments.length;
    const landlordPaymentCount = landlordGeneralPayments.length + landlordRentPayments.length;

    if (tenantPaymentCount === landlordPaymentCount) {
      console.log('✅ PASS: Payment counts are consistent!');
    } else {
      console.log('❌ FAIL: Payment counts are inconsistent!');
      console.log(`   Tenant view: ${tenantPaymentCount} payments`);
      console.log(`   Landlord view: ${landlordPaymentCount} payments`);
    }

    console.log('\n🔍 Detailed Payment Breakdown:');
    console.log('   Tenant View:');
    tenantPayments.forEach(p => console.log(`     - ${p.purpose}: ${p.amount} zł (${new Date(p.createdAt).toLocaleDateString()})`));
    tenantRentPayments.forEach(p => console.log(`     - Rent ${p.month}/${p.year}: ${p.amount} zł (${new Date(p.paidDate || p.createdAt).toLocaleDateString()})`));

    console.log('\n   Landlord View:');
    landlordGeneralPayments.forEach(p => console.log(`     - ${p.purpose}: ${p.amount} zł (${new Date(p.createdAt).toLocaleDateString()})`));
    landlordRentPayments.forEach(p => console.log(`     - Rent ${p.month}/${p.year}: ${p.amount} zł (${new Date(p.paidDate || p.createdAt).toLocaleDateString()})`));

  } catch (error) {
    console.error('❌ Error testing payment consistency:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPaymentConsistency();
