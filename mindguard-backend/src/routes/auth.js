// routes/auth.js
import { Router } from 'express';
import authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';

const router = Router();

// POST /api/auth/register
router.post('/register', validate(schemas.register), authController.register);

// POST /api/auth/login
router.post('/login', validate(schemas.login), authController.login);

// GET /api/auth/profile (protected)
router.get('/profile', authenticate, authController.getProfile);

export default router;
