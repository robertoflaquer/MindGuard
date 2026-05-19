// routes/questionnaires.js
import { Router } from 'express';
import questionnaireController from '../controllers/questionnaireController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

router.get('/types',   questionnaireController.getTypes);
router.get('/due',     questionnaireController.getDue);
router.get('/history', questionnaireController.getHistory);
router.post('/submit', validate(schemas.questionnaireResponse), questionnaireController.submitResponse);

export default router;
