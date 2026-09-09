import { Router } from 'express';
import authRoutes from './auth.routes';
import emailRoutes from './email.routes';
import slackRoutes from './slack.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/emails', emailRoutes);
router.use('/slack', slackRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ReachInbox Full-Stack Email Job Scheduler',
  });
});

export default router;
