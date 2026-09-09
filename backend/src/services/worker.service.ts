import { Worker, Job } from 'bullmq';
import { redisConfig } from '../config/redis';
import { ENV } from '../config/env';
import { prisma } from '../config/prisma';
import { EMAIL_QUEUE_NAME, EmailJobData, queueService } from './queue.service';
import { emailService } from './email.service';
import { rateLimitService } from './ratelimit.service';
import { slackService } from './slack.service';
import { elasticsearchService } from './elasticsearch.service';

export class WorkerService {
  private worker: Worker<EmailJobData>;

  constructor() {
    console.log(
      `⚙️ Starting BullMQ Worker: Concurrency = ${ENV.WORKER_CONCURRENCY}, Cooldown = ${ENV.MIN_DELAY_BETWEEN_EMAILS}ms, Max/Hr/Sender = ${ENV.MAX_EMAILS_PER_HOUR_PER_SENDER}`
    );

    this.worker = new Worker<EmailJobData>(
      EMAIL_QUEUE_NAME,
      async (job: Job<EmailJobData>) => {
        return await this.processEmailJob(job);
      },
      {
        connection: redisConfig,
        concurrency: ENV.WORKER_CONCURRENCY,
        lockDuration: 60000,
      }
    );

    this.worker.on('completed', (job: Job<EmailJobData>, result: any) => {
      console.log(`✅ Job [${job.id}] completed successfully:`, result);
    });

    this.worker.on('failed', (job: Job<EmailJobData> | undefined, err: Error) => {
      console.error(`❌ Job [${job?.id}] failed:`, err.message);
    });
  }

  private async processEmailJob(job: Job<EmailJobData>) {
    const { emailId, userId, senderEmail, recipientEmail, subject, body, customHourlyLimit } =
      job.data;

    console.log(`🚀 [Worker] Processing email job [${emailId}] to <${recipientEmail}> from <${senderEmail}>`);

    // 1. Double check DB record to enforce idempotency & prevent duplicate sends
    const emailRecord = await prisma.emailSchedule.findUnique({
      where: { id: emailId },
    });

    if (!emailRecord) {
      console.warn(`⚠️ Email record [${emailId}] not found in database. Skipping.`);
      return { status: 'skipped', reason: 'record_not_found' };
    }

    if (emailRecord.status === 'SENT') {
      console.log(`ℹ️ Email [${emailId}] is already SENT. Skipping (idempotency maintained).`);
      return { status: 'skipped', reason: 'already_sent' };
    }

    // 2. Check Hourly Rate Limit (Redis-backed counter across all workers)
    const rateCheck = await rateLimitService.checkAndIncrement(senderEmail, customHourlyLimit);

    if (!rateCheck.allowed) {
      console.warn(
        `🛑 [Rate Limit Exceeded] Sender <${senderEmail}> hit limit of ${rateCheck.limit}/hr in window [${rateCheck.windowKey}]. Rescheduling in ${Math.round(
          rateCheck.nextWindowDelayMs / 1000
        )}s.`
      );

      const nextWindowTime = new Date(Date.now() + rateCheck.nextWindowDelayMs);

      // Trigger Slack notification if this is the first rate limit hit for this sender in this hour
      if (rateCheck.shouldNotifySlack) {
        await slackService.sendRateLimitAlert({
          userId,
          senderEmail,
          limit: rateCheck.limit,
          currentCount: rateCheck.currentCount,
          nextWindowTime,
        });
      }

      // Update record in MySQL to RESCHEDULED
      await prisma.emailSchedule.update({
        where: { id: emailId },
        data: {
          status: 'RESCHEDULED',
          rateLimitRescheduleCount: { increment: 1 },
          scheduledAt: nextWindowTime,
        },
      });

      // Reschedule in BullMQ with the delay until the next hour window (+ jitter)
      // DO NOT drop or fail jobs!
      const rescheduleJobId = `${emailId}-reschedule-${Date.now()}`;
      await queueService.queue.add(
        'send-email',
        {
          ...job.data,
          scheduledAt: nextWindowTime.toISOString(),
        },
        {
          jobId: rescheduleJobId,
          delay: rateCheck.nextWindowDelayMs,
        }
      );

      return {
        status: 'rescheduled',
        reason: 'rate_limit_exceeded',
        nextWindowTime: nextWindowTime.toISOString(),
        delayMs: rateCheck.nextWindowDelayMs,
      };
    }

    // 3. Mark as PROCESSING in MySQL
    await prisma.emailSchedule.update({
      where: { id: emailId },
      data: { status: 'PROCESSING' },
    });

    // 4. Minimum Delay Between Individual Emails (to mimic provider throttling)
    if (ENV.MIN_DELAY_BETWEEN_EMAILS > 0) {
      await new Promise((resolve) => setTimeout(resolve, ENV.MIN_DELAY_BETWEEN_EMAILS));
    }

    // 5. Send via Ethereal SMTP
    try {
      const sendResult = await emailService.sendEmail({
        from: senderEmail,
        to: recipientEmail,
        subject,
        body,
      });

      console.log(`📨 Email [${emailId}] delivered! Ethereal Preview: ${sendResult.etherealPreviewUrl}`);

      // 6. Update MySQL record to SENT
      const sentTime = new Date();
      const updated = await prisma.emailSchedule.update({
        where: { id: emailId },
        data: {
          status: 'SENT',
          sentAt: sentTime,
          etherealPreviewUrl: sendResult.etherealPreviewUrl,
          errorMessage: null,
        },
      });

      // 7. Index into Elasticsearch
      await elasticsearchService.indexEmail({
        id: updated.id,
        userId: updated.userId,
        senderEmail: updated.senderEmail,
        recipientEmail: updated.recipientEmail,
        subject: updated.subject,
        body: updated.body,
        status: 'SENT',
        scheduledAt: updated.scheduledAt.toISOString(),
        sentAt: sentTime.toISOString(),
        etherealPreviewUrl: sendResult.etherealPreviewUrl,
        createdAt: updated.createdAt.toISOString(),
      });

      return {
        status: 'sent',
        messageId: sendResult.messageId,
        previewUrl: sendResult.etherealPreviewUrl,
      };
    } catch (err: any) {
      console.error(`💥 Failed to send email [${emailId}]:`, err.message);

      await prisma.emailSchedule.update({
        where: { id: emailId },
        data: {
          status: 'FAILED',
          errorMessage: err.message,
        },
      });

      throw err; // Allow BullMQ retry strategy to execute
    }
  }

  public async close(): Promise<void> {
    await this.worker.close();
  }
}

export const workerService = new WorkerService();
