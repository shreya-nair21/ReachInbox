import { Request, Response } from 'express';
import { slackService } from '../services/slack.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { ENV } from '../config/env';

export class SlackController {
  /**
   * Get Slack OAuth Authorization URL
   */
  public async getAuthUrl(req: AuthenticatedRequest, res: Response) {
    try {
      const authUrl = slackService.getAuthorizationUrl(req.user!.id);
      return res.json({ success: true, data: { url: authUrl } });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * OAuth redirect callback from Slack
   */
  public async handleCallback(req: Request, res: Response) {
    try {
      const code = req.query.code as string;
      const stateUserId = req.query.state as string;

      if (!code || !stateUserId) {
        return res.redirect(`${ENV.CLIENT_URL}?slack_error=missing_code`);
      }

      await slackService.handleOAuthCallback(code, stateUserId);
      return res.redirect(`${ENV.CLIENT_URL}?slack_connected=true`);
    } catch (err: any) {
      console.error('Slack OAuth callback error:', err);
      return res.redirect(`${ENV.CLIENT_URL}?slack_error=${encodeURIComponent(err.message)}`);
    }
  }

  /**
   * Manual webhook setup (ideal for local development and rapid evaluation)
   */
  public async setManualWebhook(req: AuthenticatedRequest, res: Response) {
    try {
      const { webhookUrl, channel } = req.body;
      if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com/')) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid Slack Incoming Webhook URL (starts with https://hooks.slack.com/)',
        });
      }

      const integration = await slackService.setManualWebhook(req.user!.id, webhookUrl, channel);
      return res.json({
        success: true,
        message: 'Slack webhook connected successfully',
        data: integration,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get integration status
   */
  public async getStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const status = await slackService.getIntegrationStatus(req.user!.id);
      return res.json({ success: true, data: status });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Disconnect Slack
   */
  public async disconnect(req: AuthenticatedRequest, res: Response) {
    try {
      await slackService.disconnect(req.user!.id);
      return res.json({ success: true, message: 'Slack disconnected successfully' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Test live notification to Slack
   */
  public async testNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const nextWindow = new Date(Date.now() + 1000 * 60 * 45); // 45 min in future
      const delivered = await slackService.sendRateLimitAlert({
        userId: req.user!.id,
        senderEmail: 'test.outreach@reachinbox.ai',
        limit: 100,
        currentCount: 100,
        nextWindowTime: nextWindow,
      });

      if (!delivered) {
        return res.status(400).json({
          success: false,
          message: 'Slack is not connected yet. Connect Slack first to receive alerts.',
        });
      }

      return res.json({
        success: true,
        message: 'Live test alert sent to Slack successfully!',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const slackController = new SlackController();
