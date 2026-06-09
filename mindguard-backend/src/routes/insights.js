import { Router } from 'express';
import insightsController from '../controllers/insightsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', insightsController.getInsights);

export default router;
