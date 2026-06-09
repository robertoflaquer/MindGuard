import { Router } from 'express';
import riskController from '../controllers/riskController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/levels', riskController.getRiskLevels);

router.get('/job/:jobId', riskController.getJobStatus);

router.get('/current', riskController.getCurrentRisk);

router.get('/breakdown', riskController.getBreakdown);

router.get('/trend', riskController.getTrend);

router.get('/history', riskController.getHistory);

router.post('/assess', riskController.triggerAssessment);

export default router;