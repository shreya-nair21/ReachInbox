import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis';
import { prisma } from '../config/prisma';

export const EMAIL_QUEUE_NAME = 'email-dispatch-queue';

export interface EmailJobData {
  emailId: string;
  userId: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledAt: string;
  customHourlyLimit?: number;
  batchId?: string | null;
}

export class QueueService {
  public queue: Queue<EmailJobData>;

  constructor() {
    this.queue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
      connection: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          age: 3600 * 24, // Keep completed jobs for 24h for Bull Board visibility
          count: 5000,
        },
        removeOnFail: {
          age: 3600 * 72, // Keep failed jobs for 72h
          count: 5000,
        },
      },
    });

    console.log(`📋 BullMQ Queue initialized: [${EMAIL_QUEUE_NAME}]`);
  }

  /**
   * Adds an email job to the queue with a delayed run time.
   * Uses emailId as BullMQ jobId to guarantee strict idempotency.
   */
  public async scheduleJob(data: EmailJobData, delayMs: number) {
    const job = await this.queue.add('send-email', data, {
      jobId: data.emailId, // Idempotency key
      delay: Math.max(0, delayMs),
    });

    return job;
  }

  /**
   * Cancels a scheduled job if it hasn't started yet
   */
  public async cancelJob(emailId: string): Promise<boolean> {
    const job = await this.queue.getJob(emailId);
    if (job) {
      const state = await job.getState();
      if (state === 'delayed' || state === 'waiting') {
        await job.remove();
        return true;
      }
    }
    return false;
  }

  /**
   * Reconciles scheduled emails from MySQL on server startup to guarantee
   * zero lost jobs across server/worker restarts.
   */
  public async reconcilePendingJobs(): Promise<number> {
    try {
      const pendingEmails = await prisma.emailSchedule.findMany({
        where: {
          status: { in: ['SCHEDULED', 'RESCHEDULED'] },
          scheduledAt: { gte: new Date(Date.now() - 1000 * 60 * 60) }, // Look back up to 1 hour
        },
      });

      let reEnqueuedCount = 0;
      for (const email of pendingEmails) {
        const existingJob = await this.queue.getJob(email.id);
        if (!existingJob) {
          const delayMs = Math.max(0, email.scheduledAt.getTime() - Date.now());
          await this.scheduleJob(
            {
              emailId: email.id,
              userId: email.userId,
              senderEmail: email.senderEmail,
              recipientEmail: email.recipientEmail,
              subject: email.subject,
              body: email.body,
              scheduledAt: email.scheduledAt.toISOString(),
              batchId: email.batchId,
            },
            delayMs
          );
          reEnqueuedCount++;
        }
      }

      if (reEnqueuedCount > 0) {
        console.log(`🔄 Reconciled & restored ${reEnqueuedCount} scheduled emails on startup.`);
      }

      return reEnqueuedCount;
    } catch (err: any) {
      console.error('⚠️ Job reconciliation error:', err.message);
      return 0;
    }
  }

  public async getQueueMetrics() {
    const counts = await this.queue.getJobCounts(
      'waiting',
      'active',
      'delayed',
      'completed',
      'failed'
    );
    return counts;
  }
}

export const queueService = new QueueService();
