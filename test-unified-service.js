// Test script to verify unified payment service
import { getUnifiedPaymentData } from './backend/src/services/paymentService.js';

async function testUnifiedService() {
  try {
    console.log('🔍 Testing Unified Payment Service...\n');
    
    const tenantId = 'cmedxa7n40001exng9bo9orf5'; // Real tenant ID
    
    // Test 1: Tenant view (no landlordId)
    console.log('📊 Test 1: Tenant View (no landlordId)...');
    const tenantResult = await getUnifiedPaymentData(tenantId);
    console.log('✅ Tenant view result:');
    console.log('   Total Paid:', tenantResult.totalPaid);
    console.log('   Payments count:', tenantResult.payments.length);
    console.log('   General payments:', tenantResult.generalPaymentsCount);
    console.log('   Rent payments:', tenantResult.rentPaymentsCount);
    
    // Test 2: Landlord view (with landlordId)
    console.log('\n📊 Test 2: Landlord View (with landlordId)...');
    const landlordResult = await getUnifiedPaymentData(tenantId, 'cmedxa7n40001exng9bo9orf5');
    console.log('✅ Landlord view result:');
    console.log('   Total Paid:', landlordResult.totalPaid);
    console.log('   Payments count:', landlordResult.payments.length);
    console.log('   General payments:', landlordResult.generalPaymentsCount);
    console.log('   Rent payments:', landlordResult.rentPaymentsCount);
    
    // Test 3: Check if there's a real landlord ID
    console.log('\n📊 Test 3: Looking for real landlord ID...');
    if (tenantResult.generalPayments && tenantResult.generalPayments.length > 0) {
      const firstPayment = tenantResult.generalPayments[0];
      if (firstPayment.rentalRequest?.offers && firstPayment.rentalRequest.offers.length > 0) {
        const landlordId = firstPayment.rentalRequest.offers[0].landlordId;
        console.log('   Found landlord ID:', landlordId);
        
        // Test 4: Real landlord view
        console.log('\n📊 Test 4: Real Landlord View...');
        const realLandlordResult = await getUnifiedPaymentData(tenantId, landlordId);
        console.log('✅ Real landlord view result:');
        console.log('   Total Paid:', realLandlordResult.totalPaid);
        console.log('   Payments count:', realLandlordResult.payments.length);
        console.log('   General payments:', realLandlordResult.generalPaymentsCount);
        console.log('   Rent payments:', realLandlordResult.rentPaymentsCount);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing unified service:', error);
    console.error('Error stack:', error.stack);
  }
}

testUnifiedService();
