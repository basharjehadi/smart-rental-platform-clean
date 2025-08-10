import { Router } from 'express';
import { 
  getSystemStatus, 
  getSystemConfig, 
  testSystemFunctionality 
} from '../controllers/systemController.js';

const router = Router();

// 🚀 SCALABILITY: System health and status endpoints
router.get('/status', getSystemStatus);
router.get('/config', getSystemConfig);
router.get('/test', testSystemFunctionality);

export default router;
