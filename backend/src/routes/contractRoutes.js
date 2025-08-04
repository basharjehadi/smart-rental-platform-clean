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

// Generate contract
router.post('/generate/:rentalRequestId', verifyToken, generateContract);

// Get contracts by user role
router.get('/my-contracts', verifyToken, getMyContracts);
router.get('/landlord-contracts', verifyToken, getLandlordContracts);

// Download contract PDF
router.get('/download/:rentalRequestId', verifyToken, async (req, res) => {
  try {
    const { rentalRequestId } = req.params;
    const userId = req.user.id;

    console.log('📥 Contract download requested for rental request:', rentalRequestId);

    // Find the contract
    const contract = await prisma.contract.findUnique({
      where: { rentalRequestId: parseInt(rentalRequestId) },
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

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check authorization
    const { tenant, offer } = contract.rentalRequest;
    if (tenant.id !== userId && offer.landlord.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to download this contract' });
    }

    // Check if contract is generated
    if (contract.status !== 'GENERATED') {
      return res.status(400).json({ error: 'Contract is not ready for download' });
    }

    // Construct file path
    const filePath = path.join(process.cwd(), contract.pdfUrl);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('❌ Contract PDF file not found:', filePath);
      return res.status(404).json({ error: 'Contract PDF file not found' });
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="rental-contract-${contract.contractNumber}.pdf"`);
    res.setHeader('Content-Length', fs.statSync(filePath).size);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    console.log('✅ Contract PDF downloaded successfully:', contract.contractNumber);

  } catch (error) {
    console.error('❌ Error downloading contract:', error);
    res.status(500).json({ error: 'Failed to download contract' });
  }
});

// Save user signature
router.post('/signature', verifyToken, saveSignature);

// Get contract status
router.get('/status/:rentalRequestId', verifyToken, getContractStatus);

// Manual trigger to generate all missing contracts (for immediate fixes)
router.post('/generate-all-missing', verifyToken, generateAllMissingContracts);

export default router; 