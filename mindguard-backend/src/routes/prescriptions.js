// routes/prescriptions.js
import { Router } from 'express';
import prescriptionController from '../controllers/prescriptionController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', prescriptionController.list);
router.get('/:id', prescriptionController.getById);
router.post('/', prescriptionController.create);

export default router;
