import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';
import { 
  generateContractHTML, 
  generateContractPDF, 
  saveContractPDF,
  generateContractDataForAPI 
} from '../utils/contractGenerator.js';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Generate contract number
const generateContractNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SR-${year}${month}-${random}`;
};

// Enhanced payment verification function
const verifyPaymentStatus = async (rentalRequestId) => {
  try {
    console.log('🔍 Verifying payment status for rental request:', rentalRequestId);

    // Find PAID offer for this rental request (some mock flows store payments by offerId only)
    const paidOffer = await prisma.offer.findFirst({
      where: { rentalRequestId: parseInt(rentalRequestId), status: 'PAID' },
      select: { id: true }
    });

    // Get all successful payments linked to this request OR its paid offer
    const payments = await prisma.payment.findMany({
      where: {
        status: 'SUCCEEDED',
        OR: [
          { rentalRequestId: parseInt(rentalRequestId) },
          ...(paidOffer ? [{ offerId: paidOffer.id }] : [])
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('📊 Payment analysis:', {
      totalPayments: payments.length,
      paymentDetails: payments.map(p => ({
        id: p.id,
        purpose: p.purpose,
        amount: p.amount,
        createdAt: p.createdAt
      }))
    });

    // Check for combined payment (DEPOSIT_AND_FIRST_MONTH)
    const hasCombinedPayment = payments.some(payment => 
      payment.purpose === 'DEPOSIT_AND_FIRST_MONTH'
    );

    // Check for separate payments (backward compatibility)
    const hasDepositPayment = payments.some(payment => 
      payment.purpose === 'DEPOSIT'
    );
    const hasFirstMonthPayment = payments.some(payment => 
      payment.purpose === 'RENT'
    );

    // Verify payment completion
    // Treat PAID offer as completion in mock/dev flows where the Payment row may not be written yet
    const paymentComplete = (!!paidOffer) || hasCombinedPayment || (hasDepositPayment && hasFirstMonthPayment);

    console.log('✅ Payment verification result:', {
      hasCombinedPayment,
      hasDepositPayment,
      hasFirstMonthPayment,
      paymentComplete
    });

    return {
      paymentComplete,
      payments,
      hasCombinedPayment,
      hasDepositPayment,
      hasFirstMonthPayment
    };
  } catch (error) {
    console.error('❌ Error verifying payment status:', error);
    throw error;
  }
};

export const checkContractEligibility = async (req, res) => {
  try {
    const { rentalRequestId } = req.params;
    const userId = req.user.id;

    console.log('🔍 Checking contract eligibility for rental request:', rentalRequestId);

    // Find the rental request and related offer
    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: parseInt(rentalRequestId) },
      include: {
        offer: {
          include: {
            rentPayments: {
              where: {
                status: 'SUCCEEDED'
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
      return res.status(404).json({ error: 'Rental request not found' });
    }

    // Check if user is authorized
    if (rentalRequest.tenantId !== userId && rentalRequest.offer?.landlordId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to view this contract' });
    }

    // Check if offer exists and is paid
    if (!rentalRequest.offer || rentalRequest.offer.status !== 'PAID') {
      return res.status(400).json({ 
        error: 'No paid offer found for this rental request',
        canGenerate: false,
        reason: 'Offer not paid'
      });
    }

    // Verify payment status
    const paymentStatus = await verifyPaymentStatus(rentalRequestId);
    
    if (!paymentStatus.paymentComplete) {
      return res.status(400).json({
        error: 'Payment not completed',
        canGenerate: false,
        reason: 'Deposit and first month rent payment required',
        paymentStatus: paymentStatus
      });
    }

    // Check if contract already exists
    if (rentalRequest.contract) {
      return res.status(200).json({
        canGenerate: false,
        reason: 'Contract already exists',
        contractId: rentalRequest.contract.id,
        contractNumber: rentalRequest.contract.contractNumber,
        signedAt: rentalRequest.contract.signedAt,
        contractStatus: rentalRequest.contract.status
      });
    }

    // All checks passed - contract can be generated
    return res.status(200).json({
      canGenerate: true,
      reason: 'Payment completed and contract ready for generation',
      paymentStatus: paymentStatus
    });

  } catch (error) {
    console.error('❌ Error checking contract eligibility:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const generateContract = async (req, res) => {
  try {
    const { rentalRequestId } = req.params;
    const userId = req.user.id;

    console.log('🔧 Manual contract generation requested for rental request:', rentalRequestId);

    // Find the rental request with all necessary data
    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: parseInt(rentalRequestId) },
      include: {
        tenantGroup: {
          include: {
            members: {
              where: { isPrimary: true },
              include: {
                user: {
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
                    signatureBase64: true,
                    street: true,
                    city: true,
                    zipCode: true,
                    country: true,
                    citizenship: true,
                    dateOfBirth: true,
                    profession: true
                  }
                }
              }
            }
          }
        },
        offers: {
          where: {
            status: 'PAID'
          },
          include: {
            landlord: {
              select: {
                id: true,
                name: true,
                email: true,
                firstName: true,
                lastName: true,
                pesel: true,
                dowodOsobistyNumber: true,
                phoneNumber: true,
                address: true,
                street: true,
                city: true,
                zipCode: true,
                country: true,
                citizenship: true,
                dateOfBirth: true,
                profession: true,
                signatureBase64: true
              }
            }
          }
        },
        contract: true
      }
    });

    if (!rentalRequest) {
      return res.status(404).json({ error: 'Rental request not found' });
    }

    // Check if user is authorized (either tenant or landlord)
    const isTenant = rentalRequest.tenantId === userId;
    const isLandlord = rentalRequest.offers[0]?.landlordId === userId;
    
    if (!isTenant && !isLandlord) {
      return res.status(403).json({ 
        error: 'Unauthorized to generate contract for this rental request',
        details: {
          userId,
          tenantId: rentalRequest.tenantId,
          landlordId: rentalRequest.offers[0]?.landlordId,
          isTenant,
          isLandlord
        }
      });
    }

    // Check if offer exists and is paid
    if (!rentalRequest.offers || rentalRequest.offers.length === 0) {
      return res.status(400).json({ 
        error: 'Cannot generate contract - no paid offer found',
        reason: 'Offer must be paid before contract generation'
      });
    }

    // Verify payment status before generating contract
    const paymentStatus = await verifyPaymentStatus(rentalRequestId);
    
    if (!paymentStatus.paymentComplete) {
      return res.status(400).json({
        error: 'Cannot generate contract - payment not completed',
        reason: 'Deposit and first month rent payment required before contract generation',
        paymentStatus: paymentStatus
      });
    }

    // Check if contract already exists
    if (rentalRequest.contract) {
      return res.status(400).json({
        error: 'Contract already exists',
        contractId: rentalRequest.contract.id,
        contractNumber: rentalRequest.contract.contractNumber
      });
    }

    console.log('✅ All checks passed, generating contract...');

    // Generate contract using the existing function
    const contract = await generateContractForRentalRequest(rentalRequestId);

    res.json({
      success: true,
      message: 'Contract generated successfully',
      contract: {
        id: contract.id,
        contractNumber: contract.contractNumber,
        status: contract.status,
        pdfUrl: contract.pdfUrl
      }
    });

  } catch (error) {
    console.error('❌ Error generating contract:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      rentalRequestId,
      userId
    });
    res.status(500).json({ 
      error: 'Failed to generate contract',
      message: error.message 
    });
  }
};

export const saveSignature = async (req, res) => {
  try {
    const { signatureBase64 } = req.body;
    const userId = req.user.id;

    if (!signatureBase64) {
      return res.status(400).json({ error: 'Signature data is required' });
    }

    // Update user's signature
    await prisma.user.update({
      where: { id: userId },
      data: { signatureBase64 }
    });

    res.json({ message: 'Signature saved successfully' });
  } catch (error) {
    console.error('Error saving signature:', error);
    res.status(500).json({ error: 'Failed to save signature' });
  }
};

export const getContractStatus = async (req, res) => {
  try {
    const { rentalRequestId } = req.params;
    const userId = req.user.id;

    const contract = await prisma.contract.findUnique({
      where: { rentalRequestId: parseInt(rentalRequestId) },
      include: {
        rentalRequest: {
          include: {
            tenant: true,
            offers: {
              where: { status: 'PAID' },
              include: { landlord: true }
            }
          }
        }
      }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check authorization
    const { tenant, offers } = contract.rentalRequest;
    const paidOffer = offers?.[0];
    if (tenant.id !== userId && paidOffer?.landlord.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({
      contractNumber: contract.contractNumber,
      status: contract.status,
      generatedAt: contract.generatedAt,
      signedAt: contract.signedAt,
      tenantSignedAt: contract.tenantSignedAt,
      landlordSignedAt: contract.landlordSignedAt,
      canSign: contract.status === 'GENERATED',
      isTenant: tenant.id === userId,
      isLandlord: paidOffer?.landlord.id === userId
    });

  } catch (error) {
    console.error('Error getting contract status:', error);
    res.status(500).json({ error: 'Failed to get contract status' });
  }
};

// Internal function to generate contract for a rental request (used by payment controller)
export const generateContractForRentalRequest = async (rentalRequestId) => {
  try {
    console.log('🔧 Generating contract for rental request:', rentalRequestId);

    // Verify payment status first
    const paymentStatus = await verifyPaymentStatus(rentalRequestId);
    
    if (!paymentStatus.paymentComplete) {
      throw new Error('Cannot generate contract - payment not completed. Deposit and first month rent payment required.');
    }

    // Find the rental request with all necessary data
    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: parseInt(rentalRequestId) },
      include: {
        tenantGroup: {
          include: {
            members: {
              where: { isPrimary: true },
              include: {
                user: {
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
                    signatureBase64: true,
                    street: true,
                    city: true,
                    zipCode: true,
                    country: true,
                    citizenship: true,
                    dateOfBirth: true,
                    profession: true
                  }
                }
              }
            }
          }
        },
        offers: {
          where: {
            status: 'PAID'
          },
          include: {
            landlord: {
              select: {
                id: true,
                name: true,
                email: true,
                firstName: true,
                lastName: true,
                pesel: true,
                dowodOsobistyNumber: true,
                phoneNumber: true,
                address: true,
                street: true,
                city: true,
                zipCode: true,
                country: true,
                citizenship: true,
                dateOfBirth: true,
                profession: true,
                signatureBase64: true
              }
            }
          }
        },
        contract: true
      }
    });

    if (!rentalRequest) {
      throw new Error('Rental request not found');
    }

    if (!rentalRequest.offers || rentalRequest.offers.length === 0) {
      throw new Error('No paid offer found for this rental request');
    }

    const paidOffer = rentalRequest.offers[0]; // Get the first paid offer

    // Check if contract already exists
    if (rentalRequest.contract) {
      console.log('Contract already exists, skipping generation');
      return rentalRequest.contract;
    }

    // Generate contract number
    const contractNumber = generateContractNumber();
    console.log(`📄 Generated contract number: ${contractNumber}`);

    // Calculate lease dates
    const leaseStartDate = new Date(paidOffer.availableFrom);
    const leaseEndDate = new Date(leaseStartDate);
    leaseEndDate.setMonth(leaseEndDate.getMonth() + paidOffer.leaseDuration);

    // Enhanced contract data with full identity details
    const contractData = {
      contractNumber,
      agreementDate: new Date(),
      landlord: {
        name: paidOffer.landlord.name,
        firstName: paidOffer.landlord.firstName || 'Landlord',
        lastName: paidOffer.landlord.lastName || 'Name',
        email: paidOffer.landlord.email,
        dowodOsobistyNumber: paidOffer.landlord.dowodOsobistyNumber || 'N/A',
        phoneNumber: paidOffer.landlord.phoneNumber || 'N/A',
        address: paidOffer.landlord.address || 'N/A',
        signature: paidOffer.landlord.signatureBase64 || null
      },
      tenant: {
        name: rentalRequest.tenantGroup.members.find(m => m.isPrimary)?.user.name || 'Tenant',
        firstName: rentalRequest.tenantGroup.members.find(m => m.isPrimary)?.user.firstName || 'Tenant',
        lastName: rentalRequest.tenantGroup.members.find(m => m.isPrimary)?.user.lastName || 'Name',
        email: rentalRequest.tenantGroup.members.find(m => m.isPrimary)?.user.email || 'N/A',
        pesel: rentalRequest.tenantGroup.members.find(m => m.isPrimary)?.user.pesel || 'N/A',
        passportNumber: rentalRequest.tenantGroup.members.find(m => m.isPrimary)?.user.passportNumber || 'N/A',
        kartaPobytuNumber: rentalRequest.tenantGroup.members.find(m => m.isPrimary)?.user.kartaPobytuNumber || 'N/A',
        phoneNumber: rentalRequest.tenantGroup.members.find(m => m.isPrimary)?.user.phoneNumber || 'N/A',
        signature: rentalRequest.tenantGroup.members.find(m => m.isPrimary)?.user.signatureBase64 || null
      },
      propertyAddress: paidOffer.propertyAddress || rentalRequest.location,
      leaseStartDate,
      leaseEndDate,
      rentAmount: paidOffer.rentAmount,
      depositAmount: paidOffer.depositAmount || 0,
      leaseDuration: paidOffer.leaseDuration,
      // Include house rules data
      houseRules: {
        rulesText: paidOffer.rulesText || null,
        rulesPdf: paidOffer.rulesPdf || null
      }
    };

    console.log('📄 Contract data prepared with identity details:', {
      contractNumber,
      landlordName: `${contractData.landlord.firstName} ${contractData.landlord.lastName}`,
      tenantName: `${contractData.tenant.firstName} ${contractData.tenant.lastName}`,
      landlordId: contractData.landlord.dowodOsobistyNumber,
      tenantPesel: contractData.tenant.pesel,
      propertyAddress: contractData.propertyAddress
    });

    // Prepare offer data for the new contract generator
    const offerForContract = {
      ...paidOffer,
      rentalRequest: {
        tenant: rentalRequest.tenantGroup.members.find(m => m.isPrimary)?.user
      },
      property: {
        address: paidOffer.propertyAddress || rentalRequest.location
      },
      leaseStartDate: leaseStartDate,
      leaseEndDate: leaseEndDate,
      rentAmount: paidOffer.rentAmount,
      depositAmount: paidOffer.depositAmount || 0
    };

    // Generate and save PDF using the new server-side approach
    const pdfResult = await saveContractPDF(offerForContract, rentalRequest.tenantGroup.members.find(m => m.isPrimary)?.user, contractNumber);
    console.log('📄 PDF generated and saved:', {
      filename: pdfResult.filename,
      originalSize: `${(pdfResult.originalSize / 1024 / 1024).toFixed(2)} MB`,
      compressedSize: `${(pdfResult.compressedSize / 1024 / 1024).toFixed(2)} MB`,
      compressionRatio: `${pdfResult.compressionRatio}%`
    });

    // Create contract record in database (schema supports SIGNED/COMPLETED/EXPIRED)
    const contract = await prisma.contract.create({
      data: {
        rentalRequestId: parseInt(rentalRequestId),
        contractNumber,
        pdfUrl: pdfResult.url,
        status: 'SIGNED',
        signedAt: new Date()
      }
    });

    console.log('✅ Contract saved to database:', {
      contractId: contract.id,
      contractNumber,
      pdfUrl: contract.pdfUrl
    });

    return contract;

  } catch (error) {
    console.error('❌ Error generating contract for rental request:', error);
    throw error;
  }
};

const generatePDF = async (html) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}; 

// SCHEDULED CONTRACT GENERATION - Runs every 5 minutes to ensure all paid offers have contracts
export const scheduledContractGeneration = async () => {
  try {
    console.log('🕐 SCHEDULED CONTRACT GENERATION: DISABLED - Contracts now only generated after payment');
    
    // DISABLED: Automatic contract generation has been removed
    // Contracts are now only generated after successful payment via Stripe webhook
    // This ensures contracts are only created when payment is actually completed
    
    console.log('✅ SCHEDULED CONTRACT GENERATION: No action taken (disabled)');
  } catch (error) {
    console.error('❌ Error in scheduled contract generation:', error);
  }
};

// Start the scheduler when the server starts
let contractScheduler;

export const startContractScheduler = () => {
  console.log('🕐 Contract generation scheduler: DISABLED');
  console.log('📋 Contracts will only be generated after successful payment');
  
  // DISABLED: No automatic scheduling
  // Contracts are now only generated via:
  // 1. Stripe webhook after successful payment
  // 2. Manual generation via API endpoint
  
  console.log('✅ Contract generation scheduler: Manual only (no automatic generation)');
};

export const stopContractScheduler = () => {
  if (contractScheduler) {
    clearInterval(contractScheduler);
    console.log('🛑 Contract generation scheduler stopped');
  }
  console.log('ℹ️ Contract generation scheduler was already disabled');
}; 

// Manual trigger to generate contracts for all paid offers (for immediate fixes)
export const generateAllMissingContracts = async (req, res) => {
  try {
    console.log('🔧 MANUAL TRIGGER: Generating contracts for all paid offers...');
    
    // Find all rental requests with PAID offers
    const rentalRequests = await prisma.rentalRequest.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        offer: {
          where: {
            status: 'PAID'
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

    const results = [];
    let contractsGenerated = 0;
    let paymentsCreated = 0;

    for (const request of rentalRequests) {
      if (!request.offer) continue;

      const result = {
        rentalRequestId: request.id,
        title: request.title,
        offerStatus: request.offer.status,
        hasPayments: request.payments.length > 0,
        hasContract: !!request.contract,
        actions: []
      };

      // Create payment if missing
      if (request.payments.length === 0) {
        const expectedAmount = (request.offer.rentAmount || 0) + (request.offer.depositAmount || 0);
        
        try {
          const payment = await prisma.payment.create({
            data: {
              amount: expectedAmount,
              status: 'SUCCEEDED',
              purpose: 'DEPOSIT_AND_FIRST_MONTH',
              userId: request.tenantId,
              rentalRequestId: request.id,
              stripePaymentIntentId: `manual_fix_${Date.now()}_${request.id}`
            }
          });
          
          result.actions.push(`Payment created: ${payment.id}`);
          paymentsCreated++;
        } catch (error) {
          result.actions.push(`Payment creation failed: ${error.message}`);
        }
      }

      // Generate contract if missing
      if (!request.contract) {
        try {
          await generateContractForRentalRequest(request.id);
          result.actions.push('Contract generated successfully');
          contractsGenerated++;
        } catch (error) {
          result.actions.push(`Contract generation failed: ${error.message}`);
        }
      } else {
        result.actions.push('Contract already exists');
      }

      results.push(result);
    }

    console.log(`✅ Manual trigger completed:`);
    console.log(`   Payments created: ${paymentsCreated}`);
    console.log(`   Contracts generated: ${contractsGenerated}`);
    console.log(`   Total rental requests processed: ${results.length}`);

    res.status(200).json({
      success: true,
      message: 'Contract generation completed',
      summary: {
        paymentsCreated,
        contractsGenerated,
        totalProcessed: results.length
      },
      details: results
    });

  } catch (error) {
    console.error('❌ Error in manual contract generation:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating contracts',
      error: error.message
    });
  }
}; 

// COMPREHENSIVE CONTRACT MONITORING SYSTEM
export const monitorContractStatus = async () => {
  try {
    console.log('🔍 CONTRACT MONITORING: DISABLED - No automatic contract generation');
    
    // DISABLED: Automatic contract monitoring and generation has been removed
    // Contracts are now only generated after successful payment via Stripe webhook
    // This ensures contracts are only created when payment is actually completed
    
    console.log('✅ CONTRACT MONITORING: No action taken (disabled)');
  } catch (error) {
    console.error('❌ Error in contract monitoring:', error);
  }
};

// Enhanced scheduler that runs monitoring every minute
let contractMonitor;

export const startContractMonitoring = () => {
  console.log('🔍 Contract monitoring: DISABLED');
  console.log('📋 No automatic contract generation or monitoring');
  
  // DISABLED: No automatic monitoring
  // Contracts are now only generated via:
  // 1. Stripe webhook after successful payment
  // 2. Manual generation via API endpoint
  
  console.log('✅ Contract monitoring: Manual only (no automatic monitoring)');
};

export const stopContractMonitoring = () => {
  console.log('🛑 Contract monitoring: Already disabled');
  console.log('ℹ️ No monitoring was running');
}; 

export const previewContract = async (req, res) => {
  try {
    const { offerId } = req.params;
    const userId = req.user.id;

    console.log('🔍 Generating contract preview for offer:', offerId);

    // Find the offer and related data
    const offer = await prisma.offer.findUnique({
      where: { id: parseInt(offerId) },
      include: {
        rentalRequest: {
          include: {
            tenantGroup: {
              include: {
                members: {
                  where: { isPrimary: true },
                  include: {
                    user: {
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
                        signatureBase64: true,
                        street: true,
                        city: true,
                        zipCode: true,
                        country: true,
                        citizenship: true,
                        dateOfBirth: true,
                        profession: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            pesel: true,
            dowodOsobistyNumber: true,
            phoneNumber: true,
            address: true,
            street: true,
            city: true,
            zipCode: true,
            country: true,
            citizenship: true,
            dateOfBirth: true,
            profession: true,
            signatureBase64: true
          }
        }
      }
    });

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Get the primary tenant from the tenant group
    const primaryMember = offer.rentalRequest.tenantGroup?.members?.[0];
    const tenant = primaryMember?.user;

    // Verify the tenant is requesting their own offer
    if (tenant.id !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only preview contracts for your own offers.' });
    }

    // Generate contract number for preview
    const contractNumber = generateContractNumber();
    console.log(`📄 Generated preview contract number: ${contractNumber}`);

    // Calculate lease dates
    const leaseStartDate = new Date(offer.availableFrom);
    const leaseEndDate = new Date(leaseStartDate);
    leaseEndDate.setMonth(leaseEndDate.getMonth() + offer.leaseDuration);

    // Prepare contract data for preview
    const contractData = {
      contractNumber,
      agreementDate: new Date(),
      landlord: {
        name: offer.landlord.name,
        firstName: offer.landlord.firstName || 'Landlord',
        lastName: offer.landlord.lastName || 'Name',
        email: offer.landlord.email,
        dowodOsobistyNumber: offer.landlord.dowodOsobistyNumber || 'N/A',
        phoneNumber: offer.landlord.phoneNumber || 'N/A',
        address: offer.landlord.address || 'N/A',
        signature: null // No signature in preview
      },
      tenant: {
        name: offer.rentalRequest.tenantGroup.members.find(m => m.isPrimary)?.user.name || 'Tenant',
        firstName: offer.rentalRequest.tenantGroup.members.find(m => m.isPrimary)?.user.firstName || 'Tenant',
        lastName: offer.rentalRequest.tenantGroup.members.find(m => m.isPrimary)?.user.lastName || 'Name',
        email: offer.rentalRequest.tenantGroup.members.find(m => m.isPrimary)?.user.email || 'N/A',
        pesel: offer.rentalRequest.tenantGroup.members.find(m => m.isPrimary)?.user.pesel || 'N/A',
        passportNumber: offer.rentalRequest.tenantGroup.members.find(m => m.isPrimary)?.user.passportNumber || 'N/A',
        kartaPobytuNumber: offer.rentalRequest.tenantGroup.members.find(m => m.isPrimary)?.user.kartaPobytuNumber || 'N/A',
        phoneNumber: offer.rentalRequest.tenantGroup.members.find(m => m.isPrimary)?.user.phoneNumber || 'N/A',
        signature: null // No signature in preview
      },
      propertyAddress: offer.propertyAddress || offer.rentalRequest.location,
      leaseStartDate,
      leaseEndDate,
      rentAmount: offer.rentAmount,
      depositAmount: offer.depositAmount || 0,
      leaseDuration: offer.leaseDuration,
      // Include house rules data
      houseRules: {
        rulesText: offer.rulesText || null,
        rulesPdf: offer.rulesPdf || null
      }
    };

    console.log('📄 Contract preview data prepared:', {
      contractNumber,
      landlordName: `${contractData.landlord.firstName} ${contractData.landlord.lastName}`,
      tenantName: `${contractData.tenant.firstName} ${contractData.tenant.lastName}`,
      hasRulesText: !!contractData.houseRules.rulesText,
      hasRulesPdf: !!contractData.houseRules.rulesPdf
    });

    // Generate HTML content
    const htmlContent = generateBilingualContractHTML(contractData);
    console.log('📄 Contract preview HTML generated');

    // Return the HTML content
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);

  } catch (error) {
    console.error('❌ Error generating contract preview:', error);
    res.status(500).json({ error: 'Failed to generate contract preview' });
  }
}; 

export const signContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const userId = req.user.id;

    console.log('✍️ Contract signing requested for contract:', contractId);

    // Find the contract with related data
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        rentalRequest: {
          include: {
            tenantGroup: {
              include: {
                members: {
                  where: { isPrimary: true },
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true
                      }
                    }
                  }
                }
              }
            },
            offer: {
              include: {
                landlord: true
              }
            }
          }
        }
      }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Get the primary tenant from the tenant group
    const primaryMember = contract.rentalRequest.tenantGroup?.members?.[0];
    const tenant = primaryMember?.user;

    // Verify the tenant is signing their own contract
    if (tenant.id !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only sign your own contracts.' });
    }

    // Check if contract is generated and paid
    if (contract.status !== 'GENERATED') {
      return res.status(400).json({ error: 'Contract must be generated before signing' });
    }

    // Check if contract is already signed
    if (contract.signedAt) {
      return res.status(400).json({ error: 'Contract is already signed' });
    }

    // Verify payment status
    const payment = await prisma.payment.findFirst({
      where: {
        rentalRequestId: contract.rentalRequestId,
        status: 'SUCCEEDED',
        purpose: 'DEPOSIT_AND_FIRST_MONTH'
      }
    });

    if (!payment) {
      return res.status(400).json({ error: 'Payment must be completed before signing contract' });
    }

    // Sign the contract
    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        signedAt: new Date(),
        status: 'TENANT_SIGNED'
      }
    });

    console.log('✅ Contract signed successfully:', {
      contractId,
      signedAt: updatedContract.signedAt,
      tenantName: contract.rentalRequest.tenantGroup.members.find(m => m.isPrimary)?.user.name
    });

    res.json({
      success: true,
      message: 'Contract signed successfully',
      signedAt: updatedContract.signedAt,
      contractStatus: updatedContract.status
    });

  } catch (error) {
    console.error('❌ Error signing contract:', error);
    res.status(500).json({ error: 'Failed to sign contract' });
  }
}; 

// 🚀 SCALABILITY: Get tenant's contracts
export const getMyContracts = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const contracts = await prisma.contract.findMany({
      where: {
        rentalRequest: {
          tenantId: userId
        },
        // Hide expired/terminated contracts from standard "my contracts" list
        NOT: {
          status: { in: ['EXPIRED', 'TERMINATED'] }
        }
      },
      include: {
        rentalRequest: {
          include: {
            offer: {
              include: {
                landlord: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      message: 'Contracts retrieved successfully',
      contracts: contracts
    });
  } catch (error) {
    console.error('Get my contracts error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// 🚀 SCALABILITY: Get landlord's contracts
export const getLandlordContracts = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const contracts = await prisma.contract.findMany({
      where: {
        rentalRequest: {
          offers: {
            some: {
              landlordId: userId
            }
          }
        },
        // Hide expired contracts from standard list (only EXPIRED is defined in enum)
        NOT: {
          status: { in: ['EXPIRED'] }
        }
      },
              include: {
          rentalRequest: {
            include: {
              tenant: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              offers: {
                include: {
                  landlord: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              }
            }
          }
        },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      message: 'Contracts retrieved successfully',
      contracts: contracts
    });
  } catch (error) {
    console.error('Get landlord contracts error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

export const downloadGeneratedContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const userId = req.user.id;

    console.log('📥 Download generated contract requested for contract:', contractId);

    // Find the contract with related data
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        rentalRequest: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true
              }
            },
            offers: {
              where: { status: 'PAID' },
              include: {
                landlord: {
                  select: {
                    id: true,
                    name: true,
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // If contract is expired/terminated, block download
    if (contract.status === 'EXPIRED' || contract.status === 'TERMINATED') {
      return res.status(410).json({ error: 'Contract is no longer available (cancelled/expired)' });
    }

    // Verify the user is authorized (either tenant or landlord)
    const { tenant, offers } = contract.rentalRequest;
    const paidOffer = offers?.[0];
    if (tenant.id !== userId && paidOffer?.landlord.id !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only download contracts you are involved in.' });
    }

    // Check if contract PDF exists
    if (!contract.pdfUrl) {
      return res.status(404).json({ error: 'Contract PDF not found' });
    }

    // Construct file path
    const filePath = path.join(process.cwd(), contract.pdfUrl);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('❌ Contract PDF file not found:', filePath);
      return res.status(404).json({ error: 'Contract PDF file not found' });
    }

    // Generate filename with contract number and creation date
    const creationDate = new Date(contract.createdAt).toISOString().split('T')[0];
    const filename = `rental-contract-${contract.contractNumber}-${creationDate}.pdf`;

    console.log('✅ Downloading generated contract:', {
      contractId,
      contractNumber: contract.contractNumber,
      createdAt: contract.createdAt,
      userRole: tenant.id === userId ? 'tenant' : 'landlord',
      filename
    });

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', fs.statSync(filePath).size);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('❌ Error downloading generated contract:', error);
    res.status(500).json({ error: 'Failed to download generated contract' });
  }
};

export const downloadSignedContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const userId = req.user.id;

    console.log('📥 Download signed contract requested for contract:', contractId);

    // Find the contract with related data
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        rentalRequest: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true
              }
            },
            offers: {
              where: { status: 'PAID' },
              include: {
                landlord: {
                  select: {
                    id: true,
                    name: true,
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // If contract is expired/terminated, block download
    if (contract.status === 'EXPIRED' || contract.status === 'TERMINATED') {
      return res.status(410).json({ error: 'Contract is no longer available (cancelled/expired)' });
    }

    // Check if contract is signed
    if (!contract.signedAt) {
      return res.status(400).json({ error: 'Contract is not signed yet' });
    }

    // Verify the user is authorized (either tenant or landlord)
    const { tenant, offers } = contract.rentalRequest;
    const paidOffer = offers?.[0];
    if (tenant.id !== userId && paidOffer?.landlord.id !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only download contracts you are involved in.' });
    }

    // Check if contract PDF exists
    if (!contract.pdfUrl) {
      return res.status(404).json({ error: 'Contract PDF not found' });
    }

    // Construct file path
    const filePath = path.join(process.cwd(), contract.pdfUrl);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('❌ Contract PDF file not found:', filePath);
      return res.status(404).json({ error: 'Contract PDF file not found' });
    }

    // Generate filename with contract number and signing date
    const signingDate = new Date(contract.signedAt).toISOString().split('T')[0];
    const filename = `signed-rental-contract-${contract.contractNumber}-${signingDate}.pdf`;

    console.log('✅ Downloading signed contract:', {
      contractId,
      contractNumber: contract.contractNumber,
      signedAt: contract.signedAt,
      userRole: tenant.id === userId ? 'tenant' : 'landlord',
      filename
    });

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', fs.statSync(filePath).size);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('❌ Error downloading signed contract:', error);
    res.status(500).json({ error: 'Failed to download signed contract' });
  }
}; 