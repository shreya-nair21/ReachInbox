import { Router } from 'express';
import { emailController } from '../controllers/email.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/schedule', emailController.scheduleEmails.bind(emailController));
router.get('/scheduled', emailController.getScheduledEmails.bind(emailController));
router.get('/sent', emailController.getSentEmails.bind(emailController));
router.get('/search', emailController.searchEmails.bind(emailController));
router.post('/:id/cancel', emailController.cancelEmail.bind(emailController));
router.get('/stats', emailController.getStats.bind(emailController));

export default router;
