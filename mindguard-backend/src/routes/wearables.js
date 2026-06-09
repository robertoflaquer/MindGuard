import { Router } from 'express';
import multer from 'multer';
import wearableController from '../controllers/wearableController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
// Store file in memory (max 50MB — Apple Health exports can be large)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.use(authenticate);
router.post('/apple-health/import', upload.single('file'), wearableController.importAppleHealth);

export default router;
