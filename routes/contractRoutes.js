import express from 'express';
import { generateContract, checkContractEligibility } from '../controllers/contractController.js';
import verifyToken from '../middlewares/verifyToken.js';

const router = express.Router();

// Check if contract can be generated (after payment)
router.get('/:rentalRequestId/eligibility', verifyToken, checkContractEligibility);

// Generate and download contract PDF
router.get('/:rentalRequestId', verifyToken, generateContract);

export default router; 