import { Router } from 'express';
import { slackController } from '../controllers/slack.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Public callback from Slack OAuth
router.get('/callback', slackController.handleCallback.bind(slackController));

// Authenticated Slack actions
router.get('/auth-url', requireAuth, slackController.getAuthUrl.bind(slackController));
router.get('/status', requireAuth, slackController.getStatus.bind(slackController));
router.post('/webhook', requireAuth, slackController.setManualWebhook.bind(slackController));
router.post('/disconnect', requireAuth, slackController.disconnect.bind(slackController));
router.post('/test', requireAuth, slackController.testNotification.bind(slackController));

export default router;
