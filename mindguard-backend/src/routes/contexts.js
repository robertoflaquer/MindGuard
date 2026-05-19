// routes/contexts.js
import { Router } from 'express';
import contextController from '../controllers/contextController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';

const router = Router();

router.use(authenticate);

// GET /api/contexts/types
router.get('/types', contextController.getContextTypes);

// GET /api/contexts/active
router.get('/active', contextController.getActiveContexts);

// POST /api/contexts
router.post('/', validate(schemas.userContext), contextController.addContext);

// PATCH /api/contexts/:id/close
router.patch('/:id/close', contextController.closeContext);

export default router;
