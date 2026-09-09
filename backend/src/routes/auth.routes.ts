import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/google', authController.googleLogin.bind(authController));
router.post('/demo', authController.demoLogin.bind(authController));
router.get('/me', requireAuth, authController.getMe.bind(authController));

export default router;
