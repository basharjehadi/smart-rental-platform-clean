import express from 'express';
import { 
  checkContractEligibility, 
  generateContract, 
  saveSignature, 
  getContractStatus,
  generateAllMissingContracts,
  previewContract,
  signContract,
  downloadSignedContract,
  downloadGeneratedContract,
  getMyContracts,
  getLandlordContracts
} from '../controllers/contractController.js';
import verifyToken from '../middlewares/verifyToken.js';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const router = express.Router();

// Check if user is eligible to generate contract
router.get('/eligibility/:rentalRequestId', verifyToken, checkContractEligibility);

// Preview contract (before payment)
router.get('/preview/:offerId', verifyToken, previewContract);

// Sign contract (after payment)
router.post('/sign/:contractId', verifyToken, signContract);

// Download signed contract (after signing)
router.get('/download/:contractId', verifyToken, downloadSignedContract);

// Download generated contract (before signing)
router.get('/download-generated/:contractId', verifyToken, downloadGeneratedContract);

// Generate contract
router.post('/generate/:rentalRequestId', verifyToken, generateContract);

// Generate contract by offer ID
router.post('/generate-by-offer/:offerId', verifyToken, async (req, res) => {
  try {
    const { offerId } = req.params;
    const userId = req.user.id;

    console.log('🔍 Generating contract by offer ID:', offerId);

    // Find the offer with related data
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        landlord: true,
        rentalRequest: {
          include: {
            tenant: true
          }
        }
      }
    });

    if (!offer) {
      return res.status(404).json({ 
        success: false,
        error: 'Offer not found' 
      });
    }

    // Verify the user is authorized (either tenant or landlord)
    if (offer.rentalRequest.tenant.id !== userId && offer.landlord.id !== userId) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. You can only generate contracts for offers you are involved in.' 
      });
    }

    // Check if offer is paid
    if (offer.status !== 'PAID') {
      return res.status(400).json({ 
        success: false,
        error: 'Contract can only be generated for paid offers' 
      });
    }

    // Check if contract already exists
    const existingContract = await prisma.contract.findFirst({
      where: { rentalRequestId: offer.rentalRequestId }
    });

    if (existingContract) {
      console.log('✅ Contract already exists, returning existing contract');
      return res.json({
        success: true,
        contract: existingContract,
        message: 'Contract already exists'
      });
    }

    // Generate the contract using the existing generateContract function
    // We need to call it with the rental request ID
    const generateRequest = {
      params: { rentalRequestId: offer.rentalRequestId },
      user: { id: userId }
    };

    // Call the generateContract function
    const result = await generateContract(generateRequest, res);
    
    console.log('✅ Contract generated successfully by offer ID');
    return result;

  } catch (error) {
    console.error('❌ Error generating contract by offer ID:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate contract' 
    });
  }
});

// Get contracts by user role
router.get('/my-contracts', verifyToken, getMyContracts);
router.get('/landlord-contracts', verifyToken, getLandlordContracts);

// Get contract details by ID
router.get('/:contractId', verifyToken, async (req, res) => {
  try {
    const { contractId } = req.params;
    const userId = req.user.id;

    console.log('🔍 Fetching contract details for contract:', contractId);

    // Find the contract with related data
    const contract = await prisma.contract.findUnique({
      where: { id: parseInt(contractId) },
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
            offer: {
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
      return res.status(404).json({ 
        success: false,
        error: 'Contract not found' 
      });
    }

    // Verify the user is authorized (either tenant or landlord)
    const { tenant, offer } = contract.rentalRequest;
    if (tenant.id !== userId && offer.landlord.id !== userId) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. You can only view contracts you are involved in.' 
      });
    }

    console.log('✅ Contract details fetched successfully:', contract.contractNumber);

    res.json({
      success: true,
      contract: {
        id: contract.id,
        contractNumber: contract.contractNumber,
        status: contract.status,
        pdfUrl: contract.pdfUrl,
        signedAt: contract.signedAt,
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Error fetching contract details:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch contract details' 
    });
  }
});



// Save user signature
router.post('/signature', verifyToken, saveSignature);

// Get contract status
router.get('/status/:rentalRequestId', verifyToken, getContractStatus);

// Manual trigger to generate all missing contracts (for immediate fixes)
router.post('/generate-all-missing', verifyToken, generateAllMissingContracts);

export default router; 