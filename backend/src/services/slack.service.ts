import axios from 'axios';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';

export interface RateLimitAlertPayload {
  userId: string;
  senderEmail: string;
  limit: number;
  currentCount: number;
  nextWindowTime: Date;
  delayedJobsCount?: number;
}

export class SlackService {
  /**
   * Generates the Slack OAuth v2 authorize URL
   */
  public getAuthorizationUrl(userId: string): string {
    const scopes = encodeURIComponent('incoming-webhook,chat:write');
    const redirectUri = encodeURIComponent(ENV.SLACK_REDIRECT_URI);
    return `https://slack.com/oauth/v2/authorize?client_id=${ENV.SLACK_CLIENT_ID}&scope=${scopes}&redirect_uri=${redirectUri}&state=${userId}`;
  }

  /**
   * Exchanges temporary OAuth authorization code for access token / webhook
   */
  public async handleOAuthCallback(code: string, userId: string) {
    const response = await axios.post(
      'https://slack.com/api/oauth.v2.access',
      new URLSearchParams({
        client_id: ENV.SLACK_CLIENT_ID,
        client_secret: ENV.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: ENV.SLACK_REDIRECT_URI,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const data = response.data;
    if (!data.ok) {
      throw new Error(`Slack OAuth exchange failed: ${data.error || 'Unknown error'}`);
    }

    const incomingWebhookUrl = data.incoming_webhook?.url || null;
    const channel = data.incoming_webhook?.channel || null;
    const teamName = data.team?.name || null;
    const teamId = data.team?.id || null;
    const accessToken = data.access_token || null;

    return await prisma.slackIntegration.upsert({
      where: { userId },
      update: {
        teamId,
        teamName,
        accessToken,
        incomingWebhookUrl,
        channel,
      },
      create: {
        userId,
        teamId,
        teamName,
        accessToken,
        incomingWebhookUrl,
        channel,
      },
    });
  }

  /**
   * Allows saving an Incoming Webhook directly (for easy evaluation and testing)
   */
  public async setManualWebhook(userId: string, webhookUrl: string, channelName?: string) {
    return await prisma.slackIntegration.upsert({
      where: { userId },
      update: {
        incomingWebhookUrl: webhookUrl,
        channel: channelName || '#general',
        teamName: 'Custom Webhook',
      },
      create: {
        userId,
        incomingWebhookUrl: webhookUrl,
        channel: channelName || '#general',
        teamName: 'Custom Webhook',
      },
    });
  }

  /**
   * Disconnects Slack for a user
   */
  public async disconnect(userId: string) {
    const integration = await prisma.slackIntegration.findUnique({ where: { userId } });
    if (integration) {
      await prisma.slackIntegration.delete({ where: { userId } });
    }
  }

  /**
   * Returns integration status for a user
   */
  public async getIntegrationStatus(userId: string) {
    const integration = await prisma.slackIntegration.findUnique({
      where: { userId },
      select: {
        id: true,
        teamName: true,
        channel: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      connected: !!integration,
      integration,
    };
  }

  /**
   * Sends a live alert message to the user's connected Slack
   * Handles non-connected state gracefully without throwing or crashing.
   */
  public async sendRateLimitAlert(payload: RateLimitAlertPayload): Promise<boolean> {
    const integration = await prisma.slackIntegration.findUnique({
      where: { userId: payload.userId },
    });

    if (!integration || !integration.incomingWebhookUrl) {
      console.log(
        `ℹ️ Slack not connected for user [${payload.userId}]. Rate limit alert skipped gracefully.`
      );
      return false;
    }

    const formattedNextTime = payload.nextWindowTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });

    const message = {
      text: `⚠️ *ReachInbox Rate Limit Alert*: Sender \`${payload.senderEmail}\` reached hourly sending limit.`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '⚠️ ReachInbox Sending Limit Exceeded',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Sender account *${payload.senderEmail}* has reached its maximum hourly threshold.\nTo protect sender reputation and prevent ISP throttling, further emails have been automatically delayed.`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Sender Account:*\n\`${payload.senderEmail}\``,
            },
            {
              type: 'mrkdwn',
              text: `*Hourly Limit:*\n${payload.limit} emails / hr`,
            },
            {
              type: 'mrkdwn',
              text: `*Current Window Usage:*\n${payload.currentCount} / ${payload.limit}`,
            },
            {
              type: 'mrkdwn',
              text: `*Next Sending Window:*\n${formattedNextTime}`,
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '🛡️ *Policy*: Jobs were NOT dropped. They have been preserved in BullMQ and rescheduled to the next window.',
            },
          ],
        },
      ],
    };

    try {
      await axios.post(integration.incomingWebhookUrl, message, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 8000,
      });
      console.log(`📢 Live Slack notification dispatched to ${integration.channel || 'webhook'}!`);
      return true;
    } catch (err: any) {
      console.error('❌ Failed to post Slack message:', err.response?.data || err.message);
      return false;
    }
  }
}

export const slackService = new SlackService();
