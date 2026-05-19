// routes/appointments.js
import { Router } from 'express';
import appointmentController from '../controllers/appointmentController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import Joi from 'joi';

const router = Router();
router.use(authenticate);

const createSchema = Joi.object({
  specialistId: Joi.number().integer().required(),
  scheduledDate: Joi.string().isoDate().required(),
  scheduledTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  observations: Joi.string().max(1000).allow('', null).optional(),
  riskSnapshot: Joi.object().optional(),
});

router.get('/specialists', appointmentController.getSpecialists);
router.get('/slots', appointmentController.getSlots);
router.get('/', appointmentController.list);
router.post('/', validate(createSchema), appointmentController.create);
router.patch('/:id/cancel', appointmentController.cancel);

export default router;
