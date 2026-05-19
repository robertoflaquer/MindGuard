// routes/signals.js
import { Router } from 'express';
import signalController from '../controllers/signalController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';

const router = Router();

// All routes are protected
router.use(authenticate);

// GET /api/signals/types
router.get('/types', signalController.getTypes);

// GET /api/signals/recent
router.get('/recent', signalController.getRecent);

// GET /api/signals/stats
router.get('/stats', signalController.getStats);

// POST /api/signals/batch
router.post('/batch', validate(schemas.signalBatch), signalController.ingestBatch);

// POST /api/signals/simulate — simula leitura de wearable
router.post('/simulate', signalController.simulateWearable);

export default router;
