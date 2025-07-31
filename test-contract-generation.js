import { PrismaClient } from '@prisma/client';
import { generateContractForRentalRequest } from './controllers/contractController.js';

const prisma = new PrismaClient();

// Test contract generation flow
const testContractGeneration = async () => {
  try {
    console.log('🧪 Testing Contract Generation Flow...\n');

    // 1. Find a rental request with a paid offer
    console.log('1️⃣ Finding rental request with paid offer...');
    const rentalRequest = await prisma.rentalRequest.findFirst({
      where: {
        status: 'ACTIVE',
        offer: {
          status: 'PAID'
        }
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            pesel: true,
            passportNumber: true,
            kartaPobytuNumber: true,
            phoneNumber: true,
            signatureBase64: true
          }
        },
        offer: {
          include: {
            landlord: {
              select: {
                id: true,
                name: true,
                email: true,
                firstName: true,
                lastName: true,
                dowodOsobistyNumber: true,
                phoneNumber: true,
                address: true,
                signatureBase64: true
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

    if (!rentalRequest) {
      console.log('❌ No rental request with paid offer found');
      console.log('💡 Create a rental request, accept an offer, and make payment first');
      return;
    }

    console.log('✅ Found rental request:', {
      id: rentalRequest.id,
      title: rentalRequest.title,
      tenant: `${rentalRequest.tenant.firstName} ${rentalRequest.tenant.lastName}`,
      landlord: `${rentalRequest.offer.landlord.firstName} ${rentalRequest.offer.landlord.lastName}`,
      offerStatus: rentalRequest.offer.status,
      payments: rentalRequest.payments.length,
      hasContract: !!rentalRequest.contract
    });

    // 2. Check payment status
    console.log('\n2️⃣ Checking payment status...');
    const payments = rentalRequest.payments;
    const hasCombinedPayment = payments.some(p => p.purpose === 'DEPOSIT_AND_FIRST_MONTH');
    const hasDepositPayment = payments.some(p => p.purpose === 'DEPOSIT');
    const hasFirstMonthPayment = payments.some(p => p.purpose === 'RENT');
    
    console.log('Payment analysis:', {
      totalPayments: payments.length,
      hasCombinedPayment,
      hasDepositPayment,
      hasFirstMonthPayment,
      paymentComplete: hasCombinedPayment || (hasDepositPayment && hasFirstMonthPayment)
    });

    if (!hasCombinedPayment && !(hasDepositPayment && hasFirstMonthPayment)) {
      console.log('❌ Payment not complete - need DEPOSIT_AND_FIRST_MONTH or both DEPOSIT + RENT');
      return;
    }

    // 3. Check if contract already exists
    if (rentalRequest.contract) {
      console.log('\n3️⃣ Contract already exists:', {
        contractId: rentalRequest.contract.id,
        contractNumber: rentalRequest.contract.contractNumber,
        status: rentalRequest.contract.status,
        pdfUrl: rentalRequest.contract.pdfUrl
      });
      
      console.log('✅ Contract generation test completed - contract already exists');
      return;
    }

    // 4. Generate contract
    console.log('\n4️⃣ Generating contract...');
    const contract = await generateContractForRentalRequest(rentalRequest.id);
    
    console.log('✅ Contract generated successfully:', {
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      status: contract.status,
      pdfUrl: contract.pdfUrl
    });

    // 5. Verify contract details
    console.log('\n5️⃣ Verifying contract details...');
    const contractWithDetails = await prisma.contract.findUnique({
      where: { id: contract.id },
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

    console.log('Contract verification:', {
      contractNumber: contractWithDetails.contractNumber,
      tenantName: `${contractWithDetails.rentalRequest.tenant.firstName} ${contractWithDetails.rentalRequest.tenant.lastName}`,
      tenantPesel: contractWithDetails.rentalRequest.tenant.pesel,
      tenantPassport: contractWithDetails.rentalRequest.tenant.passportNumber,
      tenantKartaPobytu: contractWithDetails.rentalRequest.tenant.kartaPobytuNumber,
      tenantPhone: contractWithDetails.rentalRequest.tenant.phoneNumber,
      landlordName: `${contractWithDetails.rentalRequest.offer.landlord.firstName} ${contractWithDetails.rentalRequest.offer.landlord.lastName}`,
      landlordDowod: contractWithDetails.rentalRequest.offer.landlord.dowodOsobistyNumber,
      landlordPhone: contractWithDetails.rentalRequest.offer.landlord.phoneNumber,
      landlordAddress: contractWithDetails.rentalRequest.offer.landlord.address,
      rentAmount: contractWithDetails.rentAmount,
      depositAmount: contractWithDetails.depositAmount,
      leaseStartDate: contractWithDetails.leaseStartDate,
      leaseEndDate: contractWithDetails.leaseEndDate
    });

    console.log('\n🎉 Contract generation test completed successfully!');
    console.log('📄 Contract PDF available at:', contract.pdfUrl);
    console.log('🔗 Download URL:', `http://localhost:3001/api/contracts/download/${rentalRequest.id}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
};

// Run the test
testContractGeneration(); 